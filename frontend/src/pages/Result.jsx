import { useState } from "react";

import "./Result.css";

import {
  getTranslations,
  getLanguageCode
} from "../services/i18n";


function Result({
  result,
  language,
  onBack
}) {

  const [isSpeaking, setIsSpeaking] =
    useState(false);


  const t =
    getTranslations(language);

  const languageCode =
    getLanguageCode(language);


  const riskLevel =
    result?.risk_level || "HIGH";


  const getRiskClass = () => {

    if (riskLevel === "HIGH")
      return "risk-high";

    if (riskLevel === "MEDIUM")
      return "risk-medium";

    if (riskLevel === "LOW")
      return "risk-low";

    return "risk-unknown";
  };


  const getRiskTitle = () => {

    if (riskLevel === "HIGH")
      return t.beCareful;

    if (riskLevel === "MEDIUM")
      return t.reviewCarefully;

    if (riskLevel === "LOW")
      return t.relativelySafe;

    return t.reviewCarefully;
  };


  const getRiskLabel = () => {

    if (riskLevel === "HIGH")
      return t.highRisk;

    if (riskLevel === "MEDIUM")
      return t.mediumRisk;

    return t.lowRisk;
  };


  const handleListen = () => {

    if (!result) return;


    if (!("speechSynthesis" in window)) {

      alert(
        "Speech synthesis is not supported in this browser."
      );

      return;
    }


    window.speechSynthesis.cancel();


    const text = `
      ${result.summary}.
      ${result.simple_explanation}.
      ${result.risk_reason}.
      ${result.recommended_action}.
    `;


    const speech =
      new SpeechSynthesisUtterance(text);


    speech.lang =
      languageCode;

    speech.rate =
      0.88;

    speech.pitch =
      1;


    speech.onstart = () => {
      setIsSpeaking(true);
    };


    speech.onend = () => {
      setIsSpeaking(false);
    };


    speech.onerror = () => {
      setIsSpeaking(false);
    };


    setIsSpeaking(true);

    window.speechSynthesis.speak(
      speech
    );
  };


  const handleStopSpeaking = () => {

    window.speechSynthesis.cancel();

    setIsSpeaking(false);
  };


  return (
    <div className="result-page">

      <header className="result-header">

        <button
          className="result-back-button"
          onClick={onBack}
        >
          ←
        </button>


        <div className="result-brand">

          <div className="result-logo">
            ✦
          </div>

          <div>

            <strong>
              SERI
            </strong>

            <span>
              {t.screenUnderstanding}
            </span>

          </div>

        </div>


        <div className="result-status">

          <span></span>

          {t.ready}

        </div>

      </header>


      <main className="result-main">

        <section className="result-intro">

          <span className="result-eyebrow">
            {t.screenUnderstood}
          </span>

          <h1>
            {t.resultTitle}
          </h1>

          <p>
            {t.resultDescription}
          </p>

        </section>


        <section
          className={`risk-card ${
            getRiskClass()
          }`}
        >

          <div className="risk-icon">

            {riskLevel === "HIGH"
              ? "!"
              : "✓"}

          </div>


          <div className="risk-content">

            <span className="risk-label">
              {getRiskLabel()}
            </span>

            <h2>
              {getRiskTitle()}
            </h2>

            <p>
              {result?.risk_reason ||
                t.noRisk}
            </p>

          </div>

        </section>


        <section className="result-section">

          <div className="section-heading">

            <div className="section-icon">
              ◉
            </div>

            <div>

              <span>
                {t.understand}
              </span>

              <h2>
                {t.whatScreenSays}
              </h2>

            </div>

          </div>


          <div className="result-content-card">

            <p>
              {result?.summary ||
                t.noExplanation}
            </p>

          </div>

        </section>


        <section className="result-section">

          <div className="section-heading">

            <div className="section-icon blue-icon">
              ✦
            </div>

            <div>

              <span>
                {t.simpleWords}
              </span>

              <h2>
                {t.whatDoesMean}
              </h2>

            </div>

          </div>


          <div className="simple-explanation-card">

            <div className="simple-icon">
              💡
            </div>

            <p>
              {result?.simple_explanation ||
                t.noExplanation}
            </p>

          </div>

        </section>


        <section className="result-section">

          <div className="section-heading">

            <div className="section-icon safety-icon">
              🛡
            </div>

            <div>

              <span>
                {t.safetyCheck}
              </span>

              <h2>
                {t.whyCareful}
              </h2>

            </div>

          </div>


          <div className="safety-card">

            <div className="safety-check">
              <span>
                ✓
              </span>
            </div>

            <p>
              {result?.risk_reason ||
                t.noRisk}
            </p>

          </div>

        </section>


        <section className="result-section">

          <div className="section-heading">

            <div className="section-icon action-icon">
              →
            </div>

            <div>

              <span>
                {t.nextStep}
              </span>

              <h2>
                {t.whatShouldDo}
              </h2>

            </div>

          </div>


          <div className="action-card">

            <div className="action-badge">
              {t.recommended}
            </div>

            <p>
              {result?.recommended_action ||
                t.noExplanation}
            </p>

          </div>

        </section>


        <section className="voice-section">

          <div className="voice-header">

            <div className="voice-icon">
              🔊
            </div>

            <div>

              <h2>
                {t.listenToSeri}
              </h2>

              <p>
                {t.hearExplanation}
              </p>

            </div>

          </div>


          {!isSpeaking ? (

            <button
              className="listen-button"
              onClick={handleListen}
            >

              <span>
                ▶
              </span>

              {t.listenExplanation}

            </button>

          ) : (

            <button
              className="stop-button"
              onClick={handleStopSpeaking}
            >

              <span>
                ■
              </span>

              {t.stopListening}

            </button>

          )}

        </section>


        <div className="result-footer">

          <span className="footer-logo">
            ✦
          </span>

          <p>

            {t.footer}

            <br />

            {t.footer2}

          </p>

        </div>

      </main>

    </div>
  );
}


export default Result;