import { useEffect, useRef, useState } from "react";
import "./SeriOverlay.css";

import {
  getTranslations,
  getLanguageCode
} from "../services/i18n";


function SeriOverlay({
  language,
  onAnalyze
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

        clearTimeout(
          openingTimerRef.current
        );

      }

      if (recognitionRef.current) {

        try {

          recognitionRef.current.abort();

        } catch (error) {

          console.log(
            "Recognition cleanup:",
            error
          );

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


    // Browser support check
    if (!SpeechRecognition) {

      setVoiceError(
        "Voice recognition is not supported in this browser. Please use Google Chrome."
      );

      setListening(false);

      return null;

    }


    const recognition =
      new SpeechRecognition();


    // ===================================================
    // SPEECH SETTINGS
    // ===================================================

    recognition.lang =
      languageCode;

    /*
      IMPORTANT:

      false means the recognition session
      ends automatically when the user
      stops speaking.
    */

    recognition.continuous =
      false;

    recognition.interimResults =
      true;

    recognition.maxAlternatives =
      1;


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


        if (
          event.results[i].isFinal
        ) {

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


      setSpokenText(
        fullText
      );

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


      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {

        setVoiceError(
          "Microphone permission was denied. Please allow microphone access in Chrome."
        );

        return;

      }


      if (
        event.error === "audio-capture"
      ) {

        setVoiceError(
          "Microphone could not be detected. Please check your microphone."
        );

        return;

      }


      if (
        event.error === "network"
      ) {

        setVoiceError(
          "Voice recognition needs an internet connection."
        );

        return;

      }


      if (
        event.error === "no-speech"
      ) {

        setVoiceError(
          "No speech detected. Please try again."
        );

        return;

      }


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


      recognitionRef.current =
        null;


      setListening(false);


      /*
        IMPORTANT:

        DO NOT restart recognition.

        The user has finished speaking.

        SERI stays open.
      */


      const finalText =
        finalTranscriptRef.current.trim();


      if (finalText) {

        setSpokenText(
          finalText
        );

        setSpeechFinished(
          true
        );

      }

    };


    return recognition;

  };


  // =====================================================
  // START LISTENING
  // =====================================================

  const startListening = () => {

    setVoiceError("");

    setSpokenText("");

    setSpeechFinished(false);


    finalTranscriptRef.current =
      "";


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


      recognitionRef.current =
        null;


      setListening(false);

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


    recognitionRef.current =
      null;


    setListening(false);

  };


  // =====================================================
  // OPEN SERI
  // =====================================================

  const handleSeriIconClick = () => {

    /*
      If SERI is already open,
      don't close it by clicking
      the floating icon.
    */

    if (open) {

      return;

    }


    setOpen(true);

    setVoiceError("");

    setSpokenText("");

    setSpeechFinished(false);


    finalTranscriptRef.current =
      "";


    /*
      Wait 300ms so the SERI panel
      appears first.

      Then microphone starts
      automatically.
    */

    openingTimerRef.current =
      setTimeout(() => {

        startListening();

      }, 300);

  };


  // =====================================================
  // CLOSE SERI
  // =====================================================

  const handleClose = () => {

    if (openingTimerRef.current) {

      clearTimeout(
        openingTimerRef.current
      );

      openingTimerRef.current =
        null;

    }


    stopListening();


    setOpen(false);


    setSpokenText("");

    setSpeechFinished(false);

    setVoiceError("");

  };


  // =====================================================
  // UNDERSTAND SCREEN
  // =====================================================

  const handleUnderstandScreen = () => {

    if (openingTimerRef.current) {

      clearTimeout(
        openingTimerRef.current
      );

      openingTimerRef.current =
        null;

    }


    stopListening();


    setOpen(false);


    /*
      Go directly to the existing
      screen analyzer.
    */

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

        <span className="orb-ring ring-one"></span>

        <span className="orb-ring ring-two"></span>

        <span className="orb-ring ring-three"></span>

        <span className="orb-glow"></span>


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
                  {t.assistant}
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

              <span className="assistant-ring ring-a"></span>

              <span className="assistant-ring ring-b"></span>

              <span className="assistant-ring ring-c"></span>


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
                    {t.listening}
                  </strong>

                  <span>
                    {t.speakNaturally}
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

              ) : (

                <>
                  <strong>
                    {t.seriReady}
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

            {Array.from({
              length: 15
            }).map(
              (_, index) => (

                <span
                  key={index}
                  style={{
                    animationDelay:
                      `${index * 0.07}s`
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
              {t.privacy}
            </span>

          </div>

        </div>

      )}

    </>
  );
}


export default SeriOverlay;