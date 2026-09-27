import { useState, useRef } from "react";
import "./Home.css";
import { getTranslations } from "../services/i18n";
import { analyzeScreen } from "../services/api";
import SeriVoiceAssistant from "../components/SeriVoiceAssistant";

function Home({
  language,
  onLanguageChange,
  onAnalyze,
  onResult,
  theme,
  onThemeChange,
}) {
  const t = getTranslations(language);
  const isDark = theme === "dark";

  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const languages = [
    { label: "English", value: "English" },
    { label: "తెలుగు", value: "Telugu" },
    { label: "हिन्दी", value: "Hindi" },
    { label: "ಕನ್ನಡ", value: "Kannada" },
    { label: "தமிழ்", value: "Tamil" },
  ];

  const handleVoiceCommand = (command) => {
    console.log("SERI voice command:", command);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, JPEG).");
      return;
    }
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyzeDirectly = async () => {
    if (!selectedFile) {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        alert("Please select or drop a screenshot first.");
      }
      return;
    }

    try {
      setLoading(true);
      const result = await analyzeScreen(
        selectedFile,
        language || "English"
      );

      if (onResult) {
        onResult(result);
      } else if (onAnalyze) {
        onAnalyze();
      }
    } catch (err) {
      console.error("Analysis error:", err);
      alert(
        err?.message ||
        "Unable to connect to SERI backend. Make sure the backend is running on http://localhost:8000."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemoImage = async () => {
    try {
      setLoading(true);
      const response = await fetch("/icons.svg");
      const blob = await response.blob();
      const demoFile = new File([blob], "demo-account-verification.png", { type: "image/png" });
      setSelectedFile(demoFile);
      setImagePreview(URL.createObjectURL(demoFile));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      {/* =====================================================
          HEADER (Pic 2 Match & Multilingual)
      ===================================================== */}
      <header className="home-header">
        <div className="home-logo">
          <div className="logo-icon-box">
            <span>S<sup>✦</sup></span>
          </div>
          <div className="logo-text">
            <span className="logo-title">SERI</span>
            <span className="logo-subtitle">{t.screenIntelligence || "AI Screen Understanding"}</span>
          </div>
        </div>

        <div className="header-right">
          <div className="system-status">
            <span className="status-dot" />
            <span>{t.ready || "Ready"}</span>
          </div>

          <div className="header-lang-select-wrap">
            <select
              className="header-lang-select"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
            >
              {languages.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="theme-toggle"
            onClick={onThemeChange}
            aria-label="Toggle theme"
          >
            <span className="theme-icon">{isDark ? "☀" : "☾"}</span>
          </button>
        </div>
      </header>

      {/* =====================================================
          MAIN CONTENT AREA (Multilingual & Pic 2 Hero)
      ===================================================== */}
      <main className="home-main-container">
        {/* Top Info Banner */}
        <section className="top-info-banner">
          <div className="info-badge-col">
            <span className="step-tag">01 · {(t.screenUnderstanding || "SCREEN UNDERSTANDING").toUpperCase()}</span>
          </div>
          <div className="info-title-col">
            <h2>{t.showScreen || "Show SERI your screen."}</h2>
          </div>
          <div className="info-desc-col">
            <p>
              {t.uploadDescription || "Upload a screenshot and SERI will explain what it means."}
            </p>
          </div>
        </section>

        {/* Center Upload Card Section (Exact Pic 2 Match) */}
        <section className="upload-card-wrapper">
          <div className="pic2-upload-card">
            <div className="card-top-bar">
              <span className="card-logo-text">SERI</span>
              <span className="card-step-badge">1/1</span>
            </div>

            <h1 className="card-main-title">{t.uploadScreenshot || "Upload a screenshot"}</h1>

            {/* DROPZONE */}
            <div
              className={`pic2-dropzone ${dragOver ? "dropzone-active" : ""} ${
                imagePreview ? "dropzone-has-image" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                hidden
              />

              {imagePreview ? (
                <div className="home-preview-container">
                  <img
                    src={imagePreview}
                    alt="Screenshot preview"
                    className="home-preview-img"
                  />
                  <div className="home-preview-overlay">
                    <span className="home-preview-filename">
                      {selectedFile?.name || "screenshot.png"}
                    </span>
                    <button
                      type="button"
                      className="home-preview-change-btn"
                      onClick={handleRemoveImage}
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pic2-dropzone-inner">
                  <div className="pic2-square-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="4" y="4" width="16" height="16" rx="4" stroke="#2563eb" strokeWidth="2"/>
                      <rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="#2563eb"/>
                    </svg>
                  </div>
                  <h3>{t.uploadScreenshot || "Upload a screenshot"}</h3>
                  <p>{t.chooseLanguage || "Choose a screenshot from your device."}</p>
                  <span className="pic2-formats">{t.imageFormats || "PNG · JPG · JPEG"}</span>
                </div>
              )}
            </div>

            {/* LANGUAGE ROW */}
            <div className="pic2-lang-row">
              <div className="pic2-lang-left">
                <span className="pic2-globe">🌐</span>
                <span>{t.explanationLanguageLabel || "Explanation language"}</span>
              </div>
              <div className="pic2-lang-right">
                <select
                  className="pic2-lang-select"
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value)}
                >
                  {languages.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <button
              type="button"
              className="pic2-action-btn"
              onClick={handleAnalyzeDirectly}
              disabled={loading}
            >
              {loading ? (
                <span>{t.analyzing || "Analyzing..."}</span>
              ) : (
                <>
                  <span>✦</span>
                  <span>{t.understandWithSeri || "Understand with SERI"}</span>
                  <span>→</span>
                </>
              )}
            </button>

            {!imagePreview && (
              <button
                type="button"
                className="pic2-demo-btn"
                onClick={handleLoadDemoImage}
              >
                💡 {t.understandScreen || "Try sample screen"}
              </button>
            )}
          </div>

          <div className="pic2-disclaimer">
            <span>⚠️</span> {t.analyzedOnly || "Your screen is analyzed only when you choose to continue."}
          </div>
        </section>

        {/* ===================================================
            HOW SERI WORKS
        =================================================== */}
        <section className="how-seri-works">
          <div className="section-heading">
            <span className="section-eyebrow">HOW SERI WORKS</span>
            <h2>{language === "Telugu" ? "అయోమయం నుండి స్పష్టత వైపు." : language === "Hindi" ? "उलझन से स्पष्टता तक।" : language === "Kannada" ? "ಗೊಂದಲದಿಂದ ಸ್ಪಷ್ಟತೆಗೆ." : language === "Tamil" ? "குழப்பத்திலிருந்து தெளிவுக்கு." : "From confusion to clarity."}</h2>
            <p>{language === "Telugu" ? "మూడు సులభమైన దశలు. సాంకేతిక పరిజ్ఞానం అవసరం లేదు." : language === "Hindi" ? "तीन आसान कदम। तकनीकी ज्ञान की आवश्यकता नहीं।" : "Three simple steps. No technical knowledge required."}</p>
          </div>

          <div className="steps-grid">
            <article className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon">⌖</div>
              <h3>{language === "Telugu" ? "యాక్టివేట్ చేయండి" : language === "Hindi" ? "सक्रिय करें" : language === "Kannada" ? "ಸಕ್ರಿಯಗೊಳಿಸಿ" : language === "Tamil" ? "செயல்படுத்துங்கள்" : "Activate"}</h3>
              <p>{t.uploadDescription || "Upload what is on your screen or speak to SERI for help."}</p>
            </article>

            <div className="step-connector">
              <span>→</span>
            </div>

            <article className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon">◉</div>
              <h3>{t.understand || "Understand"}</h3>
              <p>{language === "Telugu" ? "SERI స్క్రీన్‌ను చదివి, భద్రతను తనిఖీ చేస్తుంది." : "SERI reads the screen, checks safety, and identifies interactive elements."}</p>
            </article>

            <div className="step-connector">
              <span>→</span>
            </div>

            <article className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon">✦</div>
              <h3>{language === "Telugu" ? "వివరించండి" : language === "Hindi" ? "समझाएं" : "Explain"}</h3>
              <p>{language === "Telugu" ? "సులభమైన వివరణ మరియు వాయిస్ ప్లేబ్యాక్ పొందండి." : "Get a simple explanation, audio voice playback, and recommended next steps."}</p>
            </article>
          </div>
        </section>

        {/* ===================================================
            SAFETY ASSISTANCE
        =================================================== */}
        <section className="safety-section">
          <div className="safety-visual">
            <div className="safety-shield">
              <span>✓</span>
            </div>
          </div>

          <div className="safety-content">
            <span className="section-eyebrow">SAFETY ASSISTANCE</span>
            <h2>{language === "Telugu" ? "చర్య తీసుకునే ముందు అర్థం చేసుకోండి." : language === "Hindi" ? "कार्रवाई करने से पहले समझें।" : "Understand before you act."}</h2>
            <p>
              {language === "Telugu"
                ? "ప్రమాదకరమైన సందేశాలు, లింక్‌లు, చెల్లింపు అభ్యర్థనలు మరియు OTP అభ్యర్థనలను గుర్తించడంలో SERI సహాయపడుతుంది."
                : "SERI can help you recognize potentially risky messages, links, payment requests, OTP requests and account verification prompts."}
            </p>

            <div className="safety-points">
              <div className="safety-point">
                <span>01</span>
                <div>
                  <strong>{language === "Telugu" ? "సందేశాలను విశ్లేషించండి" : "Identify suspicious content"}</strong>
                  <p>{t.privacy}</p>
                </div>
              </div>

              <div className="safety-point">
                <span>02</span>
                <div>
                  <strong>{language === "Telugu" ? "ఎందుకు ముఖ్యమో అర్థం చేసుకోండి" : "Explain why it matters"}</strong>
                  <p>{t.heroDescription}</p>
                </div>
              </div>

              <div className="safety-point">
                <span>03</span>
                <div>
                  <strong>{language === "Telugu" ? "సురక్షితంగా నిర్ణయించుకోండి" : "Help you decide safely"}</strong>
                  <p>{t.analyzedOnly}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            BUILT FOR REAL PEOPLE (FEATURES)
        =================================================== */}
        <section className="home-features">
          <div className="section-heading">
            <span className="section-eyebrow">BUILT FOR REAL PEOPLE</span>
            <h2>{language === "Telugu" ? "సులభమైన రూపకల్పన." : "Simple by design."}</h2>
            <p>{t.heroDescription}</p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon">◉</div>
              <h3>{t.screenUnderstanding}</h3>
              <p>{t.uploadDescription}</p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">≡</div>
              <h3>{t.simpleWords}</h3>
              <p>{t.heroDescription}</p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">●</div>
              <h3>{t.talkToSeri}</h3>
              <p>{t.speakToSeri}</p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">文</div>
              <h3>{t.explanationLanguageLabel}</h3>
              <p>{t.chooseLanguage}</p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">✓</div>
              <h3>{t.safetyCheck}</h3>
              <p>{t.privacy}</p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">⌁</div>
              <h3>{t.nextStep}</h3>
              <p>{t.footer2}</p>
            </article>
          </div>
        </section>
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}
      <footer className="home-footer">
        <div className="footer-brand">
          <div className="footer-logo footer-logo-light">✦</div>
          <div>
            <strong>SERI</strong>
            <span>{t.screenIntelligence}</span>
          </div>
        </div>

        <div className="footer-right">
          <span>© 2026 SERI</span>
          <span className="footer-divider">•</span>
          <span>{t.footer}</span>
        </div>
      </footer>

      {/* Voice Assistant Modal */}
      {voiceAssistantOpen && (
        <SeriVoiceAssistant
          language={language}
          onClose={() => setVoiceAssistantOpen(false)}
          onCommand={handleVoiceCommand}
        />
      )}
    </div>
  );
}

export default Home;