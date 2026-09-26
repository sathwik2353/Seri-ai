import "./Home.css";
import { getTranslations } from "../services/i18n";

function Home({
  language,
  onLanguageChange,
  onAnalyze,
  theme,
  onThemeChange,
}) {
  const t = getTranslations(language);
  const isDark = theme === "dark";

  const languages = [
    { label: "English", value: "English" },
    { label: "తెలుగు", value: "Telugu" },
    { label: "हिन्दी", value: "Hindi" },
    { label: "ಕನ್ನಡ", value: "Kannada" },
    { label: "தமிழ்", value: "Tamil" },
  ];

  return (
    <div className="home-page">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <header className="home-header">

        <div className="home-logo">
          <div
            className={`logo-icon ${
              isDark ? "logo-icon-dark" : "logo-icon-light"
            }`}
          >
            <span className="logo-spark">✦</span>
          </div>

          <div className="logo-text">
            <span className="logo-title">SERI</span>

            <span className="logo-subtitle">
              Screen Intelligence
            </span>
          </div>
        </div>

        <div className="header-right">

          <div className="system-status">
            <span className="status-dot" />
            <span>{t.ready || "Ready"}</span>
          </div>

          <button
            type="button"
            className="theme-toggle"
            onClick={onThemeChange}
            aria-label={
              isDark
                ? "Switch to light theme"
                : "Switch to dark theme"
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
      ===================================================== */}
      <main className="home-main">

        {/* ===================================================
            HERO
        =================================================== */}
        <section className="home-hero">

          <div className="hero-content">

            <div className="hero-badge">
              <span className="hero-badge-dot" />

              {t.screenIntelligence ||
                "Screen Intelligence"}
            </div>


            <h1 className="hero-title">

              <span>
                {t.heroTitle1 || "Understand what"}
              </span>

              <span className="hero-title-accent">
                {t.heroTitle2 || "you see."}
              </span>

            </h1>


            <p className="hero-kicker">
              Confused by a message, button or form?
            </p>


            <p className="hero-description">
              {t.heroDescription ||
                "SERI understands what's on your screen and explains it simply, safely, and in a language you understand."}
            </p>


            {/* =================================================
                MAIN ACTION
            ================================================= */}
            <div className="hero-actions">

              <button
                type="button"
                className="understand-button"
                onClick={onAnalyze}
              >

                <span className="button-icon">
                  ✦
                </span>

                <span>
                  {t.understandScreen ||
                    "Understand this screen"}
                </span>

                <span className="button-arrow">
                  →
                </span>

              </button>

            </div>


            {/* =================================================
                LANGUAGE SELECTOR
            ================================================= */}
            <div className="language-selector">

              <div className="language-selector-label">

                <span className="language-label-icon">
                  文
                </span>

                <span>
                  {t.chooseLanguage ||
                    "Choose language"}
                </span>

              </div>


              <div className="language-options">

                {languages.map((item) => {

                  const selected =
                    language === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      className={`language-option ${
                        selected
                          ? "language-option-active"
                          : ""
                      }`}
                      onClick={() =>
                        onLanguageChange(item.value)
                      }
                    >
                      {item.label}
                    </button>
                  );
                })}

              </div>

            </div>


            {/* =================================================
                VOICE HINT
            ================================================= */}
            <div className="voice-hint">

              <span className="voice-hint-icon">
                ●
              </span>

              <span>
                {t.speakToSeri ||
                  "You can also speak to SERI"}
              </span>

              <span className="voice-hint-divider">
                •
              </span>

              <span>
                {t.tapFloatingAssistant ||
                  "Use the floating assistant"}
              </span>

            </div>


            {/* =================================================
                PRIVACY
            ================================================= */}
            <div className="home-privacy">

              <span>
                ⌁
              </span>

              <span>
                {t.privacy ||
                  "You stay in control. SERI only understands what you choose to share."}
              </span>

            </div>

          </div>


          {/* =================================================
              PHONE DEMO
          ================================================= */}
          <div className="screen-demo">

            <div className="phone-demo">

              <div className="phone-frame">

                <div className="phone-notch" />

                <div className="phone-screen">

                  {/* PHONE STATUS */}
                  <div className="phone-status-bar">

                    <span>
                      9:41
                    </span>

                    <div className="phone-status-icons">
                      <span>▮▮</span>
                      <span>⌁</span>
                      <span>▰</span>
                    </div>

                  </div>


                  {/* APP HEADER */}
                  <div className="phone-app-header">

                    <span>
                      Messages
                    </span>

                    <span>
                      ⋯
                    </span>

                  </div>


                  {/* MESSAGE */}
                  <div className="phone-message">

                    <div className="message-header">

                      <div className="message-avatar">
                        A
                      </div>

                      <div>

                        <strong>
                          Account Security
                        </strong>

                        <small>
                          Just now
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
                        !
                      </span>

                      <span>
                        Verify your account →
                      </span>

                    </div>

                  </div>


                  {/* SERI RESPONSE */}
                  <div className="phone-seri-response">

                    <div className="seri-response-header">

                      <div className="mini-seri-logo">
                        ✦
                      </div>

                      <span>
                        SERI
                      </span>

                    </div>


                    <p>
                      This message asks you to
                      verify your account.
                      Be careful before clicking
                      the link.
                    </p>


                    <div className="seri-safe-label">

                      <span>
                        ✓
                      </span>

                      Check before acting

                    </div>

                  </div>


                  {/* FLOATING LABEL */}
                  <div className="demo-floating-label">

                    <span>
                      ✦
                    </span>

                    SERI understands what is
                    on your screen

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            HOW SERI WORKS
        =================================================== */}
        <section className="how-seri-works">

          <div className="section-heading">

            <span className="section-eyebrow">
              HOW SERI WORKS
            </span>

            <h2>
              From confusion to clarity.
            </h2>

            <p>
              Three simple steps. No technical knowledge required.
            </p>

          </div>


          <div className="steps-grid">

            {/* STEP 01 */}
            <article className="step-card">

              <div className="step-number">
                01
              </div>

              <div className="step-icon">
                ⌖
              </div>

              <h3>
                Activate
              </h3>

              <p>
                Choose what is on your screen
                and ask SERI for help.
              </p>

            </article>


            <div className="step-connector">
              <span>
                →
              </span>
            </div>


            {/* STEP 02 */}
            <article className="step-card">

              <div className="step-number">
                02
              </div>

              <div className="step-icon">
                ◉
              </div>

              <h3>
                Understand
              </h3>

              <p>
                SERI reads the screen and
                identifies what matters.
              </p>

            </article>


            <div className="step-connector">
              <span>
                →
              </span>
            </div>


            {/* STEP 03 */}
            <article className="step-card">

              <div className="step-number">
                03
              </div>

              <div className="step-icon">
                ✦
              </div>

              <h3>
                Explain
              </h3>

              <p>
                Get a simple explanation,
                safety guidance, and next step.
              </p>

            </article>

          </div>

        </section>


        {/* ===================================================
            SAFETY ASSISTANCE
        =================================================== */}
        <section className="safety-section">

          <div className="safety-visual">

            <div className="safety-shield">
              <span>
                ✓
              </span>
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
              SERI can help you recognize potentially
              risky messages, links, payment requests,
              OTP requests and account verification prompts.
            </p>


            <div className="safety-points">

              {/* SAFETY POINT 01 */}
              <div className="safety-point">

                <span>
                  01
                </span>

                <div>

                  <strong>
                    Identify suspicious content
                  </strong>

                  <p>
                    Highlight things that deserve
                    a closer look.
                  </p>

                </div>

              </div>


              {/* SAFETY POINT 02 */}
              <div className="safety-point">

                <span>
                  02
                </span>

                <div>

                  <strong>
                    Explain why it matters
                  </strong>

                  <p>
                    Understand the possible risk
                    in simple language.
                  </p>

                </div>

              </div>


              {/* SAFETY POINT 03 */}
              <div className="safety-point">

                <span>
                  03
                </span>

                <div>

                  <strong>
                    Help you decide safely
                  </strong>

                  <p>
                    SERI suggests safer next steps
                    without acting for you.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            FEATURES
        =================================================== */}
        <section className="home-features">

          <div className="section-heading">

            <span className="section-eyebrow">
              BUILT FOR REAL PEOPLE
            </span>

            <h2>
              Simple by design.
            </h2>

            <p>
              SERI focuses on understanding, not overwhelming.
            </p>

          </div>


          <div className="feature-grid">

            {/* FEATURE 01 */}
            <article className="feature-card">

              <div className="feature-icon">
                ◉
              </div>

              <h3>
                Screen Understanding
              </h3>

              <p>
                Understands text, buttons,
                warnings, forms and visual context.
              </p>

            </article>


            {/* FEATURE 02 */}
            <article className="feature-card">

              <div className="feature-icon">
                ≡
              </div>

              <h3>
                Simple Explanation
              </h3>

              <p>
                Converts complicated digital
                language into something easier to understand.
              </p>

            </article>


            {/* FEATURE 03 */}
            <article className="feature-card">

              <div className="feature-icon">
                ●
              </div>

              <h3>
                Voice First
              </h3>

              <p>
                Listen to explanations and
                communicate naturally with SERI.
              </p>

            </article>


            {/* FEATURE 04 */}
            <article className="feature-card">

              <div className="feature-icon">
                文
              </div>

              <h3>
                Regional Languages
              </h3>

              <p>
                Designed to make digital information
                easier across Indian languages.
              </p>

            </article>


            {/* FEATURE 05 */}
            <article className="feature-card">

              <div className="feature-icon">
                ✓
              </div>

              <h3>
                Safety Assistance
              </h3>

              <p>
                Helps identify potentially risky
                messages and actions.
              </p>

            </article>


            {/* FEATURE 06 */}
            <article className="feature-card">

              <div className="feature-icon">
                ⌁
              </div>

              <h3>
                Human Control
              </h3>

              <p>
                SERI explains and assists while
                keeping important decisions with you.
              </p>

            </article>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}
      <footer className="home-footer">

        <div className="footer-brand">

          <div className="footer-logo">
            ✦
          </div>

          <div>

            <strong>
              SERI
            </strong>

            <span>
              Screen Intelligence
            </span>

          </div>

        </div>


        <div className="footer-copy">
          © 2026 SERI
        </div>

      </footer>

    </div>
  );
}

export default Home;