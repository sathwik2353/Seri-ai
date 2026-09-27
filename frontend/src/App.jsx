import { useEffect, useState } from "react";

import "./assets/App.css";

import Home from "./pages/Home";
import ScreenAnalyzer from "./components/ScreenAnalyzer";
import Result from "./pages/Result";
import SeriOverlay from "./components/SeriOverlay";
import ScanAnimation from "./components/ScanAnimation";

function App() {
  /* =====================================================
     PAGE STATE
  ===================================================== */

  const [page, setPage] = useState("home");

  /* =====================================================
     LANGUAGE (PERSISTENT VIA LOCALSTORAGE)
  ===================================================== */

  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem("seri-language");
    return savedLang || "English";
  });

  useEffect(() => {
    localStorage.setItem("seri-language", language);
    fetch("http://localhost:8000/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    }).catch(() => {});
  }, [language]);

  /* =====================================================
     ANALYSIS RESULT
  ===================================================== */

  const [analysisResult, setAnalysisResult] = useState(null);

  /* =====================================================
     THEME (PERSISTENT VIA LOCALSTORAGE)
  ===================================================== */

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("seri-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    localStorage.setItem("seri-theme", theme);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        theme === "dark" ? "#020617" : "#f8fafc"
      );
    }
  }, [theme]);

  const handleThemeChange = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  const handleAnalyze = () => {
    setPage("analyzer");
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };

  const handleStartScanning = (result) => {
    setAnalysisResult(result);
    setPage("scanning");
  };

  const handleScanComplete = () => {
    setPage("result");
  };

  const handleBackToAnalyzer = () => {
    setPage("home");
  };

  return (
    <div className="app" data-theme={theme}>
      {/* HOME */}
      {page === "home" && (
        <>
          <Home
            language={language}
            onLanguageChange={handleLanguageChange}
            onAnalyze={handleAnalyze}
            onResult={handleStartScanning}
            theme={theme}
            onThemeChange={handleThemeChange}
          />

          <SeriOverlay language={language} onAnalyze={handleAnalyze} />
        </>
      )}

      {/* SCREEN ANALYZER */}
      {page === "analyzer" && (
        <ScreenAnalyzer
          language={language}
          onBack={() => setPage("home")}
          onResult={handleStartScanning}
        />
      )}

      {/* SCANNING */}
      {page === "scanning" && (
        <ScanAnimation language={language} onComplete={handleScanComplete} />
      )}

      {/* RESULT */}
      {page === "result" && (
        <Result
          language={language}
          result={analysisResult}
          onBack={handleBackToAnalyzer}
        />
      )}
    </div>
  );
}

export default App;