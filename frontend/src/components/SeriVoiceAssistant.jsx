import { useEffect, useRef, useState } from "react";
import "./SeriVoiceAssistant.css";
import { getLanguageCode, getTranslations } from "../services/i18n";
import { sendVoiceCommand, playTtsAudio, stopTtsAudio } from "../services/api";

function SeriVoiceAssistant({
  language = "English",
  onClose,
  onCommand,
}) {
  const [state, setState] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  
  const recognitionRef = useRef(null);
  const latestTranscriptRef = useRef("");
  
  const languageCode = getLanguageCode(language);
  const t = getTranslations(language);

  const processTranscript = async (forcedText) => {
    const textToProcess =
      forcedText ||
      latestTranscriptRef.current.trim() ||
      (language === "Telugu"
        ? "స్క్రీన్ వివరించండి"
        : language === "Hindi"
          ? "स्क्रीन समझाओ"
          : "What is on my screen?");
          
    setTranscript(textToProcess);
    setState("processing");

    try {
      const backendResult = await sendVoiceCommand(textToProcess, language);
      const spokenReply =
        backendResult?.speak_response ||
        backendResult?.reply ||
        (language === "Telugu"
          ? "నమస్కారం! నేను SERIని. మీ స్క్రీన్‌ను అర్థం చేసుకోవడానికి స్క్రీన్‌షాట్‌ను అప్‌లోడ్ చేయండి."
          : language === "Hindi"
            ? "नमस्ते! मैं SERI हूँ। अपनी स्क्रीन समझने के लिए स्क्रीनशॉट अपलोड करें।"
            : "Hello! I am SERI. Please upload your screenshot and I will explain what it means.");

      setResponseMessage(spokenReply);
      setState("speaking");

      playTtsAudio(spokenReply, language, {
        onStart: () => {
          setState("speaking");
        },
        onEnd: () => {
          setState("idle");
        },
        onError: () => {
          setState("idle");
        }
      });

      if (onCommand) {
        onCommand(textToProcess, backendResult);
      }
    } catch (err) {
      console.error("Voice processing error:", err);
      setState("idle");
    }
  };

  const startListening = () => {
    stopTtsAudio();
    setTranscript("");
    setResponseMessage("");
    latestTranscriptRef.current = "";

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setState("listening");
      setTimeout(() => {
        processTranscript();
      }, 1200);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = languageCode;
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setState("listening");
      };

      recognition.onresult = (event) => {
        let currentText = "";
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        latestTranscriptRef.current = currentText.trim();
        setTranscript(currentText.trim());
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "no-speech" || event.error === "audio-capture") {
          processTranscript();
          return;
        }
        setState("idle");
      };

      recognition.onend = () => {
        if (recognitionRef.current) {
          recognitionRef.current = null;
          processTranscript();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Could not start recognition:", err);
      setState("idle");
      processTranscript();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Stop recognition error:", e);
      }
      recognitionRef.current = null;
    }
    processTranscript();
  };

  useEffect(() => {
    return () => {
      stopTtsAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const getStatusText = () => {
    switch (state) {
      case "listening":
        return t.listening || "Listening...";
      case "processing":
        return t.analyzing || "Understanding...";
      case "speaking":
        return "SERI is speaking";
      default:
        return t.talkToSeri || "Tap SERI to talk";
    }
  };

  const getDescription = () => {
    switch (state) {
      case "listening":
        return t.speakNaturally || "Tell SERI what you want to know.";
      case "processing":
        return "SERI is preparing your response...";
      case "speaking":
        return responseMessage;
      default:
        return `${t.assistant || "Voice Assistant"} · ${language}`;
    }
  };

  return (
    <div className="seri-voice-overlay">
      <div className="seri-voice-backdrop" onClick={onClose} />

      <section className="seri-voice-panel">
        <button
          className="seri-voice-close"
          onClick={onClose}
          aria-label="Close SERI"
        >
          ×
        </button>

        <div className={`seri-voice-orb seri-voice-${state}`}>
          <div className="seri-voice-orb-glow" />
          <div className="seri-voice-orb-ring ring-one" />
          <div className="seri-voice-orb-ring ring-two" />

          <button
            className="seri-voice-orb-button"
            onClick={
              state === "idle"
                ? startListening
                : state === "listening"
                  ? stopListening
                  : undefined
            }
            disabled={state === "processing"}
            aria-label="Activate SERI"
          >
            <span>✦</span>
          </button>

          {state === "speaking" && (
            <div className="seri-voice-wave">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          )}
        </div>

        <div className="seri-voice-content">
          <span className="seri-voice-label">
            SERI
          </span>

          <h2>{getStatusText()}</h2>

          <p>{getDescription()}</p>

          {transcript && (
            <div className="seri-voice-transcript">
              <span className="transcript-label">
                YOU SAID
              </span>

              <strong>
                “{transcript}”
              </strong>
            </div>
          )}

          {responseMessage && state !== "listening" && (
            <div className="seri-voice-response-box" style={{ marginTop: "16px", padding: "12px 16px", background: "rgba(59, 130, 246, 0.08)", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>
                SERI'S REPLY
              </span>
              <p style={{ margin: 0, fontSize: "15px", color: "var(--seri-text, #1e293b)", lineHeight: "1.5" }}>
                {responseMessage}
              </p>
            </div>
          )}
        </div>

        {state === "idle" && (
          <button
            className="seri-voice-main-button"
            onClick={startListening}
          >
            <span>🎙️</span>
            Start speaking
          </button>
        )}

        {state === "listening" && (
          <button
            className="seri-voice-main-button listening-button"
            onClick={stopListening}
          >
            <span>■</span>
            Done speaking
          </button>
        )}

        {state === "processing" && (
          <div className="seri-processing">
            <span />
            <span />
            <span />
          </div>
        )}

        {state === "speaking" && (
          <button
            className="seri-voice-main-button"
            onClick={startListening}
          >
            <span>🎙️</span>
            Start speaking
          </button>
        )}

        <div className="seri-voice-privacy">
          🔒 SERI only listens when you activate it.
        </div>
      </section>
    </div>
  );
}

export default SeriVoiceAssistant;