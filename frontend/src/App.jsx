import {
  useEffect,
  useState
} from "react";

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
     LANGUAGE
  ===================================================== */

  const [language, setLanguage] =
    useState("English");


  /* =====================================================
     ANALYSIS RESULT
  ===================================================== */

  const [analysisResult, setAnalysisResult] =
    useState(null);


  /* =====================================================
     THEME
     
     Read previously selected theme from localStorage.
     
     If nothing exists:
     use LIGHT mode.
  ===================================================== */

  const [theme, setTheme] = useState(() => {

    const savedTheme =
      localStorage.getItem("seri-theme");

    if (
      savedTheme === "dark" ||
      savedTheme === "light"
    ) {
      return savedTheme;
    }

    return "light";

  });


  /* =====================================================
     APPLY THEME TO HTML ROOT
     
     This is the important part.

     It changes:

       <html data-theme="light">

     into:

       <html data-theme="dark">

     Every CSS file can then use:

       [data-theme="dark"]
     
     or

       var(--seri-text)
  ===================================================== */

  useEffect(() => {

    const root =
      document.documentElement;


    /* Set theme attribute */

    root.setAttribute(
      "data-theme",
      theme
    );


    /* Save selected theme */

    localStorage.setItem(
      "seri-theme",
      theme
    );


    /* Update browser color */

    const metaThemeColor =
      document.querySelector(
        'meta[name="theme-color"]'
      );


    if (metaThemeColor) {

      metaThemeColor.setAttribute(
        "content",
        theme === "dark"
          ? "#020617"
          : "#f8fafc"
      );

    }

  }, [theme]);


  /* =====================================================
     THEME TOGGLE
  ===================================================== */

  const handleThemeChange = () => {

    setTheme((currentTheme) => {

      if (currentTheme === "light") {
        return "dark";
      }

      return "light";

    });

  };


  /* =====================================================
     HOME → SCREEN ANALYZER
  ===================================================== */

  const handleAnalyze = () => {

    setPage("analyzer");

  };


  /* =====================================================
     LANGUAGE CHANGE
  ===================================================== */

  const handleLanguageChange = (
    newLanguage
  ) => {

    setLanguage(
      newLanguage
    );

  };


  /* =====================================================
     SCREEN ANALYZER → SCANNING
  ===================================================== */

  const handleStartScanning = (
    result
  ) => {

    setAnalysisResult(
      result
    );

    setPage(
      "scanning"
    );

  };


  /* =====================================================
     SCANNING → RESULT
  ===================================================== */

  const handleScanComplete = () => {

    setPage(
      "result"
    );

  };


  /* =====================================================
     RESULT → ANALYZER
  ===================================================== */

  const handleBackToAnalyzer = () => {

    setPage(
      "analyzer"
    );

  };


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div
      className="app"
      data-theme={theme}
    >

      {/* =================================================
          HOME
      ================================================= */}

      {page === "home" && (

        <>

          <Home
            language={language}
            onLanguageChange={
              handleLanguageChange
            }
            onAnalyze={
              handleAnalyze
            }
            theme={theme}
            onThemeChange={
              handleThemeChange
            }
          />


          {/* =============================================
              SERI VOICE ASSISTANT
          ============================================= */}

          <SeriOverlay
            language={language}
            onAnalyze={
              handleAnalyze
            }
          />

        </>

      )}


      {/* =================================================
          SCREEN ANALYZER
      ================================================= */}

      {page === "analyzer" && (

        <ScreenAnalyzer
          language={language}
          onBack={() =>
            setPage("home")
          }
          onResult={
            handleStartScanning
          }
        />

      )}


      {/* =================================================
          SCANNING
      ================================================= */}

      {page === "scanning" && (

        <ScanAnimation
          language={language}
          onComplete={
            handleScanComplete
          }
        />

      )}


      {/* =================================================
          RESULT
      ================================================= */}

      {page === "result" && (

        <Result
          language={language}
          result={analysisResult}
          onBack={
            handleBackToAnalyzer
          }
        />

      )}

    </div>

  );

}


export default App;