import { useEffect, useRef, useState } from "react";
import "./SeriOverlay.css";

import {
  getTranslations,
  getLanguageCode,
} from "../services/i18n";
import {
  sendVoiceCommand,
  playTtsAudio,
  stopTtsAudio,
} from "../services/api";

function SeriOverlay({
  language,
  onAnalyze,
}) {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [seriReply, setSeriReply] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [speechFinished, setSpeechFinished] = useState(false);
  const [isSpeakingReply, setIsSpeakingReply] = useState(false);

  const recognitionRef = useRef(null);
  const latestTranscriptRef = useRef("");
  const openingTimerRef = useRef(null);

  const t = getTranslations(language);
  const languageCode = getLanguageCode(language);

  useEffect(() => {
    return () => {
      stopTtsAudio();
      if (openingTimerRef.current) {
        clearTimeout(openingTimerRef.current);
        openingTimerRef.current = null;
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (error) {
          console.log("Recognition cleanup:", error);
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const processAndReply = async (text) => {
    const textToProcess = text || (language === "Telugu" ? "స్క్రీన్ వివరించండి" : language === "Hindi" ? "स्क्रीन समझाओ" : "What is on my screen?");
    setSpokenText(textToProcess);
    setSpeechFinished(true);

    try {
      const result = await sendVoiceCommand(textToProcess, language);
      const reply =
        result?.speak_response ||
        result?.reply ||
        (language === "Telugu"
          ? "నమస్కారం! నేను SERIని. మీ స్క్రీన్‌ను అర్థం చేసుకోవడానికి స్క్రీన్‌షాట్‌ను అప్‌లోడ్ చేయండి."
          : language === "Hindi"
            ? "नमस्ते! मैं SERI हूँ। अपनी स्क्रीन समझने के लिए स्क्रीनशॉट अपलोड करें।"
            : "I am SERI. Please upload your screenshot and I will explain what is on your screen.");

      setSeriReply(reply);
      setIsSpeakingReply(true);

      playTtsAudio(reply, language, {
        onStart: () => setIsSpeakingReply(true),
        onEnd: () => setIsSpeakingReply(false),
        onError: () => setIsSpeakingReply(false),
      });
    } catch (err) {
      console.error("SERI voice replay error:", err);
      setIsSpeakingReply(false);
    }
  };

  const createRecognition = () => {
    stopTtsAudio();
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setListening(false);
      processAndReply("");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = languageCode;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setVoiceError("");
      setSpeechFinished(false);
      setSeriReply("");
      setIsSpeakingReply(false);
      latestTranscriptRef.current = "";
    };

    recognition.onresult = (event) => {
      let fullText = "";
      for (let i = 0; i < event.results.length; i++) {
        fullText += event.results[i][0].transcript;
      }
      latestTranscriptRef.current = fullText.trim();
      setSpokenText(fullText.trim());
    };

    recognition.onerror = (event) => {
      console.log("SERI Speech Error:", event.error);
      setListening(false);

      if (event.error === "no-speech" || event.error === "audio-capture") {
        processAndReply(latestTranscriptRef.current);
        return;
      }
      if (event.error === "not-allowed") {
        setVoiceError("Microphone access was blocked. Allow microphone access in Chrome.");
        return;
      }
      setVoiceError("Voice error occurred. You can tap below to try again.");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);

      const capturedText = latestTranscriptRef.current;
      processAndReply(capturedText);
    };

    return recognition;
  };

  const startListening = () => {
    if (listening) return;

    stopTtsAudio();
    setVoiceError("");
    setSpokenText("");
    setSeriReply("");
    setSpeechFinished(false);
    setIsSpeakingReply(false);
    latestTranscriptRef.current = "";

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.log("Recognition start error:", error);
      recognitionRef.current = null;
      setListening(false);
      processAndReply("");
    }
  };

  const stopListening = () => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch (error) {
        console.log("Stop recognition error:", error);
      }
    }
    recognitionRef.current = null;
    setListening(false);
  };

  const handleRetryVoice = () => {
    stopTtsAudio();
    setVoiceError("");
    setSpokenText("");
    setSeriReply("");
    setSpeechFinished(false);
    setIsSpeakingReply(false);
    latestTranscriptRef.current = "";

    setTimeout(() => {
      startListening();
    }, 150);
  };

  const handleSeriIconClick = () => {
    if (open) return;

    setOpen(true);
    setVoiceError("");
    setSpokenText("");
    setSeriReply("");
    setSpeechFinished(false);
    setIsSpeakingReply(false);
    latestTranscriptRef.current = "";

    openingTimerRef.current = setTimeout(() => {
      openingTimerRef.current = null;
      startListening();
    }, 400);
  };

  const handleClose = () => {
    stopTtsAudio();
    if (openingTimerRef.current) {
      clearTimeout(openingTimerRef.current);
      openingTimerRef.current = null;
    }
    stopListening();
    setOpen(false);
    setSpokenText("");
    setSeriReply("");
    setSpeechFinished(false);
    setVoiceError("");
    setIsSpeakingReply(false);
    latestTranscriptRef.current = "";
  };

  return (
    <>
      {/* FLOATING SERI BUTTON */}
      <button
        type="button"
        className={`
          seri-voice-orb
          ${open ? "orb-open" : ""}
          ${listening || isSpeakingReply ? "orb-listening" : ""}
        `}
        onClick={handleSeriIconClick}
        aria-label="Open SERI voice assistant"
      >
        <span className="orb-ring ring-one" />
        <span className="orb-ring ring-two" />
        <span className="orb-ring ring-three" />

        <span className="orb-glow" />

        <span className="orb-core">
          {listening ? (
            <span className="orb-microphone">🎙</span>
          ) : isSpeakingReply ? (
            <span className="orb-microphone">🔊</span>
          ) : (
            <span className="orb-sparkle">✦</span>
          )}
        </span>
      </button>

      {/* SERI VOICE PANEL */}
      {open && (
        <div className="seri-voice-panel">
          {/* HEADER */}
          <div className="voice-panel-header">
            <div className="voice-brand">
              <div className="mini-seri-orb">✦</div>
              <div>
                <strong>SERI</strong>
                <span>{t.assistant || "Voice Assistant"}</span>
              </div>
            </div>

            <button
              type="button"
              className="voice-close"
              onClick={handleClose}
              aria-label="Close SERI"
            >
              ×
            </button>
          </div>

          {/* ASSISTANT VISUAL */}
          <div className="voice-assistant">
            <div
              className={`
                assistant-orb
                ${listening || isSpeakingReply ? "assistant-listening" : ""}
              `}
            >
              <span className="assistant-ring ring-a" />
              <span className="assistant-ring ring-b" />
              <span className="assistant-ring ring-c" />

              <div className="assistant-core">
                {listening ? (
                  <span className="big-mic">🎙</span>
                ) : isSpeakingReply ? (
                  <span className="big-mic">🔊</span>
                ) : (
                  <span>✦</span>
                )}
              </div>
            </div>

            <div className="voice-state">
              {listening ? (
                <>
                  <strong>{t.listening || "Listening..."}</strong>
                  <span>{t.speakNaturally || "Speak naturally"}</span>
                </>
              ) : isSpeakingReply ? (
                <>
                  <strong>SERI is speaking...</strong>
                  <span>Playing audio reply in {language}</span>
                </>
              ) : speechFinished ? (
                <>
                  <strong>Voice responded</strong>
                  <span>SERI has replied to your request</span>
                </>
              ) : voiceError ? (
                <>
                  <strong>Voice unavailable</strong>
                  <span>You can tap below to start speaking.</span>
                </>
              ) : (
                <>
                  <strong>{t.seriReady || "SERI is ready"}</strong>
                  <span>Starting voice assistant...</span>
                </>
              )}
            </div>
          </div>

          {/* VOICE VISUALIZER */}
          <div
            className={`
              voice-visualizer
              ${listening || isSpeakingReply ? "visualizer-active" : ""}
            `}
          >
            {Array.from({ length: 15 }).map((_, index) => (
              <span
                key={index}
                style={{
                  animationDelay: `${index * 0.07}s`,
                }}
              />
            ))}
          </div>

          {/* ERROR */}
          {voiceError && (
            <div className="voice-error">
              <span>⚠️</span>
              <span>{voiceError}</span>
            </div>
          )}

          {/* VOICE RECOVERY ACTIONS */}
          {!listening && !speechFinished && voiceError && (
            <div className="voice-recovery-actions">
              <button
                type="button"
                className="voice-start-button"
                onClick={handleRetryVoice}
              >
                🎙 Start speaking
              </button>
            </div>
          )}

          {/* START SPEAKING */}
          {!listening && !speechFinished && !voiceError && (
            <button
              type="button"
              className="voice-start-button"
              onClick={startListening}
            >
              🎙 Start speaking
            </button>
          )}

          {/* STOP SPEAKING */}
          {listening && (
            <button
              type="button"
              className="voice-stop-button"
              onClick={stopListening}
            >
              ■ Done speaking
            </button>
          )}

          {/* RECOGNIZED SPEECH */}
          {spokenText && (
            <div className="spoken-text">
              <span className="spoken-label">YOU SAID</span>
              <p>"{spokenText}"</p>
            </div>
          )}

          {/* SERI'S REPLAY BOX */}
          {seriReply && (
            <div className="spoken-text" style={{ borderColor: "#3b82f6", background: "rgba(59, 130, 246, 0.06)" }}>
              <span className="spoken-label" style={{ color: "#2563eb" }}>
                SERI'S ANSWER
              </span>
              <p style={{ color: "var(--seri-text, #1e293b)", fontWeight: "500" }}>
                {seriReply}
              </p>
            </div>
          )}

          {/* VOICE ACTIONS AFTER SPEAKING */}
          {speechFinished && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
              <button
                type="button"
                className="voice-start-button"
                onClick={startListening}
              >
                🎙 Start speaking
              </button>
            </div>
          )}

          {/* PRIVACY */}
          <div className="voice-privacy">
            <span>🔒</span>
            <span>
              {t.privacy || "You stay in control. SERI only understands what you choose to share."}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

export default SeriOverlay;