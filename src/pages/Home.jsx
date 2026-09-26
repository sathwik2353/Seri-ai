import "./Home.css";

import {
  getTranslations
} from "../services/i18n";


function Home({
  language,
  onLanguageChange,
  onAnalyze,
  theme,
  onThemeChange
}) {

  const t = getTranslations(language);

  const isDark = theme === "dark";


  return (

    <div className="home-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="home-header">

        <div className="home-logo">

          {/* THEME-AWARE SERI LOGO */}

          <div
            className={`logo-icon ${
              isDark ? "logo-icon-dark" : "logo-icon-light"
            }`}
          >
            <span className="logo-spark">✦</span>
          </div>


          <div className="logo-text">

            <div className="logo-title">
              SERI
            </div>

            <div className="logo-subtitle">
              Screen Intelligence
            </div>

          </div>

        </div>


        <div className="header-right">

          <div className="system-status">

            <span className="status-dot"></span>

            <span className="status-text">
              {t.ready}
            </span>

          </div>


          {/* THEME BUTTON */}

          <button
            className="theme-toggle"
            onClick={onThemeChange}
            aria-label="Change theme"
            title={
              isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >

            <span className="theme-icon">
              {isDark ? "☀" : "☾"}
            </span>

          </button>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="home-main">


        {/* =================================================
            HERO
        ================================================== */}

        <section className="home-hero">

          <div className="hero-content">


            {/* BADGE */}

            <div className="hero-badge">

              <span className="badge-dot"></span>

              {t.screenIntelligence}

            </div>


            {/* MAIN TITLE */}

            <h1 className="hero-title">

              {t.heroTitle1}

              <span className="hero-title-gradient">
                {t.heroTitle2}
              </span>

            </h1>


            <p className="hero-kicker">
              Confused by a message, button or form?
            </p>


            {/* DESCRIPTION */}

            <p className="hero-description">

              {t.heroDescription}

            </p>


            {/* ACTIONS */}

            <div className="hero-actions">

              <button
                className="understand-button"
                onClick={onAnalyze}
              >

                <span className="button-icon">
                  ✦
                </span>

                <span>
                  {t.understandScreen}
                </span>

                <span className="button-arrow">
                  →
                </span>

              </button>


              <div className="voice-hint">

                <span className="voice-icon">
                  🎙
                </span>

                <div>

                  <span>
                    {t.speakToSeri}
                  </span>

                  <strong>
                    {t.tapFloatingAssistant}
                  </strong>

                </div>

              </div>

            </div>


            {/* =================================================
                PHONE DEMO
            ================================================== */}

            <div className="screen-demo">

              <div className="phone-demo">

                <div className="phone-notch"></div>


                <div className="phone-screen">

                  <div className="phone-status-bar">

                    <span>
                      9:41
                    </span>

                    <span>
                      ● ● ▰
                    </span>

                  </div>


                  <div className="phone-app-header">

                    <span className="phone-back">
                      ‹
                    </span>

                    <strong>
                      Messages
                    </strong>

                    <span>
                      ⋮
                    </span>

                  </div>


                  <div className="phone-message">

                    <div className="phone-message-heading">

                      <div className="message-avatar">
                        A
                      </div>

                      <div>

                        <strong>
                          Account Security
                        </strong>

                        <small>
                          Today, 9:38 AM
                        </small>

                      </div>

                    </div>


                    <p>
                      Your account will be blocked
                      unless you verify your
                      information.
                    </p>


                    <div className="phone-warning">

                      <span>
                        ⚠
                      </span>

                      <span>
                        Verify your account →
                      </span>

                    </div>

                  </div>


                  {/* SERI RESPONSE */}

                  <div className="phone-seri-response">

                    <div className="phone-seri-header">

                      <div
                        className={`mini-seri-logo ${
                          isDark
                            ? "mini-logo-dark"
                            : "mini-logo-light"
                        }`}
                      >
                        ✦
                      </div>

                      <strong>
                        SERI
                      </strong>

                      <span>
                        AI explanation
                      </span>

                    </div>


                    <p>
                      This message asks you to
                      verify your account. Be
                      careful before clicking the
                      link.
                    </p>


                    <div className="phone-safe-label">
                      🛡 Check before acting
                    </div>

                  </div>

                </div>

              </div>


              {/* DEMO LABEL */}

              <div className="demo-floating-label">

                <span className="demo-live-dot"></span>

                SERI understands what is
                on your screen

              </div>

            </div>


            {/* =================================================
                LANGUAGE
            ================================================== */}

            <div className="language-area">

              <div className="language-label">

                <span className="language-symbol">
                  文
                </span>


                <div>

                  <strong>
                    {t.explanationLanguage}
                  </strong>

                  <small>
                    {t.chooseLanguage}
                  </small>

                </div>

              </div>


              <select
                value={language}
                onChange={(event) =>
                  onLanguageChange(
                    event.target.value
                  )
                }
                className="language-select"
              >

                <option value="English">
                  English
                </option>

                <option value="Telugu">
                  తెలుగు
                </option>

                <option value="Hindi">
                  हिन्दी
                </option>

                <option value="Kannada">
                  ಕನ್ನಡ
                </option>

                <option value="Tamil">
                  தமிழ்
                </option>

              </select>

            </div>


            {/* PRIVACY */}

            <div className="home-privacy">

              <span>
                🔒
              </span>

              <span>
                {t.privacy}
              </span>

            </div>

          </div>

        </section>


        {/* =====================================================
            HOW SERI WORKS
        ====================================================== */}

        <section className="how-seri-works">

          <div className="section-heading">

            <span className="section-eyebrow">
              HOW IT WORKS
            </span>

            <h2>
              From screen to understanding
            </h2>

            <p>
              SERI turns confusing screen content
              into simple explanations you can understand.
            </p>

          </div>


          <div className="steps-grid">


            {/* STEP 1 */}

            <div className="step-card">

              <div className="step-number">
                01
              </div>

              <div className="step-icon">
                📱
              </div>

              <h3>
                Activate
              </h3>

              <p>
                Open SERI when you see something
                on your screen that you do not understand.
              </p>

            </div>


            <div className="step-connector">
              →
            </div>


            {/* STEP 2 */}

            <div className="step-card">

              <div className="step-number">
                02
              </div>

              <div className="step-icon">
                👁
              </div>

              <h3>
                Understand
              </h3>

              <p>
                SERI looks at the important information
                visible on the current screen.
              </p>

            </div>


            <div className="step-connector">
              →
            </div>


            {/* STEP 3 */}

            <div className="step-card">

              <div className="step-number">
                03
              </div>

              <div className="step-icon">
                💬
              </div>

              <h3>
                Explain
              </h3>

              <p>
                The information is explained in simple
                language, with voice support when needed.
              </p>

            </div>

          </div>

        </section>


        {/* =====================================================
            SAFETY SECTION
        ====================================================== */}

        <section className="safety-section">

          <div className="safety-card">

            <div className="safety-visual">

              <div className="safety-shield">
                🛡
              </div>

            </div>


            <div className="safety-content">

              <span className="section-eyebrow">
                SAFETY ASSISTANCE
              </span>

              <h2>
                Understand before you act.
              </h2>

              <p>
                SERI can highlight requests involving
                links, payments, passwords, OTPs or
                account verification and explain what
                you should check before taking action.
              </p>


              <div className="safety-points">

                <div>
                  <span>✓</span>
                  Suspicious requests are highlighted
                </div>

                <div>
                  <span>✓</span>
                  Important actions are explained
                </div>

                <div>
                  <span>✓</span>
                  You remain in control
                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            FEATURES
        ====================================================== */}

        <section className="home-features">

          <div className="section-heading">

            <span className="section-eyebrow">
              BUILT FOR EVERYONE
            </span>

            <h2>
              Simple by design
            </h2>

            <p>
              SERI focuses on clarity, accessibility
              and human control.
            </p>

          </div>


          <div className="feature-grid">


            {/* FEATURE 1 */}

            <div className="feature-card">

              <div className="feature-icon">
                👁
              </div>

              <h3>
                Screen Understanding
              </h3>

              <p>
                SERI reads important information
                visible on your screen and helps
                you understand what it means.
              </p>

            </div>


            {/* FEATURE 2 */}

            <div className="feature-card">

              <div className="feature-icon">
                💬
              </div>

              <h3>
                Simple Explanation
              </h3>

              <p>
                Complex messages are converted
                into clear and easy-to-understand
                language.
              </p>

            </div>


            {/* FEATURE 3 */}

            <div className="feature-card">

              <div className="feature-icon">
                🎙
              </div>

              <h3>
                Voice First
              </h3>

              <p>
                Speak naturally with SERI and
                receive explanations without
                needing to understand technical terms.
              </p>

            </div>


            {/* FEATURE 4 */}

            <div className="feature-card">

              <div className="feature-icon">
                🌐
              </div>

              <h3>
                Regional Languages
              </h3>

              <p>
                Get explanations in languages
                that are comfortable and familiar
                to you.
              </p>

            </div>


            {/* FEATURE 5 */}

            <div className="feature-card">

              <div className="feature-icon">
                🛡
              </div>

              <h3>
                Safety Assistance
              </h3>

              <p>
                SERI helps you notice potentially
                risky requests and explains what
                to check before acting.
              </p>

            </div>


            {/* FEATURE 6 */}

            <div className="feature-card">

              <div className="feature-icon">
                👤
              </div>

              <h3>
                Human Control
              </h3>

              <p>
                SERI explains and assists while
                keeping important decisions
                under your control.
              </p>

            </div>

          </div>

        </section>


        {/* =====================================================
            LANGUAGES
        ====================================================== */}

        <section className="languages-section">

          <div className="section-heading">

            <span className="section-eyebrow">
              YOUR LANGUAGE
            </span>

            <h2>
              Understanding should feel natural.
            </h2>

            <p>
              Choose the language you are most
              comfortable using.
            </p>

          </div>


          <div className="language-pills">

            <button
              className={
                language === "English"
                  ? "language-pill active"
                  : "language-pill"
              }
              onClick={() =>
                onLanguageChange("English")
              }
            >
              English
            </button>


            <button
              className={
                language === "Telugu"
                  ? "language-pill active"
                  : "language-pill"
              }
              onClick={() =>
                onLanguageChange("Telugu")
              }
            >
              తెలుగు
            </button>


            <button
              className={
                language === "Hindi"
                  ? "language-pill active"
                  : "language-pill"
              }
              onClick={() =>
                onLanguageChange("Hindi")
              }
            >
              हिन्दी
            </button>


            <button
              className={
                language === "Kannada"
                  ? "language-pill active"
                  : "language-pill"
              }
              onClick={() =>
                onLanguageChange("Kannada")
              }
            >
              ಕನ್ನಡ
            </button>


            <button
              className={
                language === "Tamil"
                  ? "language-pill active"
                  : "language-pill"
              }
              onClick={() =>
                onLanguageChange("Tamil")
              }
            >
              தமிழ்
            </button>

          </div>

        </section>


        {/* =====================================================
            FINAL CTA
        ====================================================== */}

        <section className="final-cta">

          <div className="final-cta-glow"></div>

          <div className="final-cta-content">

            <div className="final-seri-logo">
              ✦
            </div>

            <h2>
              Don't understand what's on your screen?
            </h2>

            <p>
              Let SERI explain it simply.
            </p>


            <button
              className="final-cta-button"
              onClick={onAnalyze}
            >

              <span>
                ✦
              </span>

              Understand my screen

              <span>
                →
              </span>

            </button>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="home-footer">

        <div className="footer-brand">

          <div
            className={`footer-logo ${
              isDark
                ? "footer-logo-dark"
                : "footer-logo-light"
            }`}
          >
            ✦
          </div>


          <div>

            <strong>
              SERI
            </strong>

            <span>
              AI Screen Understanding Assistant
            </span>

          </div>

        </div>


        <div className="footer-right">

          <span>
            Built for simpler digital experiences
          </span>

          <span className="footer-divider">
            •
          </span>

          <span>
            © 2026 SERI
          </span>

        </div>

      </footer>

    </div>

  );

}


export default Home;