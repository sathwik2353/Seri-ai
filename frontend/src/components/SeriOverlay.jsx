import { useEffect, useRef, useState } from "react";
import "./SeriOverlay.css";

import {
  getTranslations,
  getLanguageCode,
} from "../services/i18n";

function SeriOverlay({
  language,
  onAnalyze,
}) {
  // =====================================================
  // STATE
  // =====================================================

  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [speechFinished, setSpeechFinished] = useState(false);

  // =====================================================
  // REFS
  // =====================================================

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const openingTimerRef = useRef(null);

  // =====================================================
  // TRANSLATIONS
  // =====================================================

  const t = getTranslations(language);
  const languageCode = getLanguageCode(language);

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
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

  // =====================================================
  // CREATE SPEECH RECOGNITION
  // =====================================================

  const createRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    // ---------------------------------------------------
    // BROWSER SUPPORT
    // ---------------------------------------------------

    if (!SpeechRecognition) {
      setVoiceError(
        "Voice recognition is not supported in this browser. Please use Google Chrome."
      );

      setListening(false);

      return null;
    }

    const recognition = new SpeechRecognition();

    // ---------------------------------------------------
    // SPEECH SETTINGS
    // ---------------------------------------------------

    recognition.lang = languageCode;

    // false allows the browser to end the session naturally.
    recognition.continuous = false;

    // Show partial speech while the user is speaking.
    recognition.interimResults = true;

    recognition.maxAlternatives = 1;

    // ===================================================
    // ON START
    // ===================================================

    recognition.onstart = () => {
      setListening(true);
      setVoiceError("");
      setSpeechFinished(false);
    };

    // ===================================================
    // ON RESULT
    // ===================================================

    recognition.onresult = (event) => {
      let interimText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const transcript =
          event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscriptRef.current +=
            " " + transcript;
        } else {
          interimText +=
            " " + transcript;
        }
      }

      const fullText = (
        finalTranscriptRef.current +
        " " +
        interimText
      ).trim();

      setSpokenText(fullText);
    };

    // ===================================================
    // ON ERROR
    // ===================================================

    recognition.onerror = (event) => {
      console.log(
        "SERI Speech Error:",
        event.error
      );

      setListening(false);

      // -------------------------------------------------
      // MICROPHONE PERMISSION
      // -------------------------------------------------

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setVoiceError(
          "Microphone access was blocked. Allow microphone access in Chrome and try again."
        );

        return;
      }

      // -------------------------------------------------
      // MICROPHONE NOT FOUND
      // -------------------------------------------------

      if (event.error === "audio-capture") {
        setVoiceError(
          "Microphone could not be detected. Check your microphone and try again."
        );

        return;
      }

      // -------------------------------------------------
      // INTERNET / SPEECH SERVICE
      // -------------------------------------------------

      if (event.error === "network") {
        setVoiceError(
          "Voice recognition needs an internet connection in this browser."
        );

        return;
      }

      // -------------------------------------------------
      // NO SPEECH
      // -------------------------------------------------

      if (event.error === "no-speech") {
        setVoiceError(
          "No speech detected. Tap try again and speak normally."
        );

        return;
      }

      // -------------------------------------------------
      // USER ABORTED
      // -------------------------------------------------

      if (event.error === "aborted") {
        setListening(false);
        return;
      }

      // -------------------------------------------------
      // UNKNOWN ERROR
      // -------------------------------------------------

      setVoiceError(
        "Something went wrong with voice recognition. Please try again."
      );
    };

    // ===================================================
    // ON END
    // ===================================================

    recognition.onend = () => {
      console.log(
        "SERI voice recognition ended."
      );

      recognitionRef.current = null;

      setListening(false);

      const finalText =
        finalTranscriptRef.current.trim();

      if (finalText) {
        setSpokenText(finalText);
        setSpeechFinished(true);
      }
    };

    return recognition;
  };

  // =====================================================
  // START LISTENING
  // =====================================================

  const startListening = () => {
    // Don't start twice.
    if (listening) {
      return;
    }

    setVoiceError("");
    setSpokenText("");
    setSpeechFinished(false);

    finalTranscriptRef.current = "";

    const recognition =
      createRecognition();

    if (!recognition) {
      return;
    }

    recognitionRef.current =
      recognition;

    try {
      recognition.start();
    } catch (error) {
      console.log(
        "Recognition start error:",
        error
      );

      recognitionRef.current = null;

      setListening(false);

      setVoiceError(
        "Voice recognition could not start. Please try again."
      );
    }
  };

  // =====================================================
  // STOP LISTENING
  // =====================================================

  const stopListening = () => {
    const recognition =
      recognitionRef.current;

    if (recognition) {
      try {
        recognition.stop();
      } catch (error) {
        console.log(
          "Stop recognition error:",
          error
        );
      }
    }

    recognitionRef.current = null;

    setListening(false);
  };

  // =====================================================
  // RETRY VOICE
  // =====================================================

  const handleRetryVoice = () => {
    setVoiceError("");
    setSpokenText("");
    setSpeechFinished(false);

    finalTranscriptRef.current = "";

    setTimeout(() => {
      startListening();
    }, 150);
  };

  // =====================================================
  // OPEN SERI
  // =====================================================

  const handleSeriIconClick = () => {
    // If already open, don't close it.
    if (open) {
      return;
    }

    setOpen(true);

    setVoiceError("");
    setSpokenText("");
    setSpeechFinished(false);

    finalTranscriptRef.current = "";

    /*
      Give the panel a small amount of time
      to render before requesting microphone access.
    */

    openingTimerRef.current =
      setTimeout(() => {
        openingTimerRef.current = null;
        startListening();
      }, 500);
  };

  // =====================================================
  // CLOSE SERI
  // =====================================================

  const handleClose = () => {
    if (openingTimerRef.current) {
      clearTimeout(
        openingTimerRef.current
      );

      openingTimerRef.current = null;
    }

    stopListening();

    setOpen(false);

    setSpokenText("");
    setSpeechFinished(false);
    setVoiceError("");

    finalTranscriptRef.current = "";
  };

  // =====================================================
  // UNDERSTAND SCREEN
  // =====================================================

  const handleUnderstandScreen = () => {
    if (openingTimerRef.current) {
      clearTimeout(
        openingTimerRef.current
      );

      openingTimerRef.current = null;
    }

    stopListening();

    setOpen(false);

    onAnalyze();
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      {/* =================================================
          FLOATING SERI BUTTON
      ================================================= */}

      <button
        type="button"
        className={`
          seri-voice-orb
          ${open ? "orb-open" : ""}
          ${listening ? "orb-listening" : ""}
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
            <span className="orb-microphone">
              🎙
            </span>
          ) : (
            <span className="orb-sparkle">
              ✦
            </span>
          )}
        </span>
      </button>


      {/* =================================================
          SERI VOICE PANEL
      ================================================= */}

      {open && (
        <div className="seri-voice-panel">

          {/* =============================================
              HEADER
          ============================================= */}

          <div className="voice-panel-header">

            <div className="voice-brand">

              <div className="mini-seri-orb">
                ✦
              </div>

              <div>
                <strong>
                  SERI
                </strong>

                <span>
                  {t.assistant || "Voice Assistant"}
                </span>
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


          {/* =============================================
              ASSISTANT VISUAL
          ============================================= */}

          <div className="voice-assistant">

            <div
              className={`
                assistant-orb
                ${listening ? "assistant-listening" : ""}
              `}
            >

              <span className="assistant-ring ring-a" />
              <span className="assistant-ring ring-b" />
              <span className="assistant-ring ring-c" />

              <div className="assistant-core">

                {listening ? (
                  <span className="big-mic">
                    🎙
                  </span>
                ) : (
                  <span>
                    ✦
                  </span>
                )}

              </div>

            </div>


            <div className="voice-state">

              {listening ? (
                <>
                  <strong>
                    {t.listening || "Listening..."}
                  </strong>

                  <span>
                    {t.speakNaturally ||
                      "Speak naturally"}
                  </span>
                </>
              ) : speechFinished ? (
                <>
                  <strong>
                    Voice recognized
                  </strong>

                  <span>
                    Your request has been understood
                  </span>
                </>
              ) : voiceError ? (
                <>
                  <strong>
                    Voice unavailable
                  </strong>

                  <span>
                    You can retry or continue without voice.
                  </span>
                </>
              ) : (
                <>
                  <strong>
                    {t.seriReady || "SERI is ready"}
                  </strong>

                  <span>
                    Starting voice assistant...
                  </span>
                </>
              )}

            </div>

          </div>


          {/* =============================================
              VOICE VISUALIZER
          ============================================= */}

          <div
            className={`
              voice-visualizer
              ${listening ? "visualizer-active" : ""}
            `}
          >
            {Array.from({ length: 15 }).map(
              (_, index) => (
                <span
                  key={index}
                  style={{
                    animationDelay:
                      `${index * 0.07}s`,
                  }}
                />
              )
            )}
          </div>


          {/* =============================================
              ERROR
          ============================================= */}

          {voiceError && (
            <div className="voice-error">

              <span>
                ⚠️
              </span>

              <span>
                {voiceError}
              </span>

            </div>
          )}


          {/* =============================================
              VOICE ACTIONS
          ============================================= */}

          {!listening &&
            !speechFinished &&
            voiceError && (
              <div className="voice-recovery-actions">

                <button
                  type="button"
                  className="voice-retry-button"
                  onClick={handleRetryVoice}
                >
                  🎙 Try again
                </button>

                <button
                  type="button"
                  className="voice-screen-button"
                  onClick={handleUnderstandScreen}
                >
                  ✦ Continue with screen
                </button>

              </div>
            )}


          {/* =============================================
              START SPEAKING
          ============================================= */}

          {!listening &&
            !speechFinished &&
            !voiceError && (
              <button
                type="button"
                className="voice-start-button"
                onClick={startListening}
              >
                🎙 Start speaking
              </button>
            )}


          {/* =============================================
              STOP SPEAKING
          ============================================= */}

          {listening && (
            <button
              type="button"
              className="voice-stop-button"
              onClick={stopListening}
            >
              ■ Done speaking
            </button>
          )}


          {/* =============================================
              RECOGNIZED SPEECH
          ============================================= */}

          {spokenText && (
            <div className="spoken-text">

              <span className="spoken-label">
                YOU SAID
              </span>

              <p>
                "{spokenText}"
              </p>

            </div>
          )}


          {/* =============================================
              UNDERSTAND SCREEN
          ============================================= */}

          {speechFinished &&
            spokenText && (
              <button
                type="button"
                className="voice-understand-button"
                onClick={handleUnderstandScreen}
              >
                <span>
                  ✦
                </span>

                <span>
                  Understand this screen
                </span>

                <span className="button-arrow">
                  →
                </span>
              </button>
            )}


          {/* =============================================
              PRIVACY
          ============================================= */}

          <div className="voice-privacy">

            <span>
              🔒
            </span>

            <span>
              {t.privacy ||
                "You stay in control. SERI only understands what you choose to share."}
            </span>

          </div>

        </div>
      )}
    </>
  );
}

export default SeriOverlay;