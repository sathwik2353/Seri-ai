import { useState } from "react";
import "./ScreenAnalyzer.css";
import { analyzeScreen } from "../services/api";

function ScreenAnalyzer({
  onBack,
  onResult,
  language
}) {

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState(null);

  const [loading, setLoading] =
    useState(false);


  const handleImage = (event) => {

    const file =
      event.target.files[0];

    if (file) {

      setSelectedFile(file);

      setImagePreview(
        URL.createObjectURL(file)
      );
    }
  };


  const handleAnalyze = async () => {

    if (!selectedFile) {

      alert(
        "Please select a screenshot first."
      );

      return;
    }


    try {

      setLoading(true);

      const result =
        await analyzeScreen(
          selectedFile,
          language || "English"
        );

      onResult(result);

    } catch (error) {

      console.error(error);

      alert(
        "Unable to connect to SERI backend. Make sure the backend is running."
      );

    } finally {

      setLoading(false);
    }
  };


  return (
    <div className="analyzer-page">

      <header className="analyzer-header">

        <button
          className="back-button"
          onClick={onBack}
        >
          ←
        </button>

        <div>

          <strong>
            SERI
          </strong>

          <span>
            Screen Understanding
          </span>

        </div>

      </header>


      <main className="analyzer-main">

        <div className="analyzer-title">

          <span className="step-label">
            STEP 1
          </span>

          <h1>
            Show SERI your screen
          </h1>

          <p>
            Upload a screenshot and SERI
            will explain what it means.
          </p>

          <div
            style={{
              marginTop: "12px",
              fontSize: "13px",
              color: "#2563eb",
              fontWeight: "600"
            }}
          >
            Explanation language:{" "}
            {language || "English"}
          </div>

        </div>


        <label className="upload-area">

          {imagePreview ? (

            <img
              src={imagePreview}
              alt="Selected screen"
              className="preview-image"
            />

          ) : (

            <>
              <div className="upload-icon">
                📱
              </div>

              <h3>
                Upload a screenshot
              </h3>

              <p>
                PNG, JPG or JPEG
              </p>
            </>

          )}

          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleImage}
            hidden
          />

        </label>


        <div className="privacy-note">
          🔒 Your screen is analyzed only
          when you choose to continue.
        </div>


        <button
          className="analyze-button"
          onClick={handleAnalyze}
          disabled={loading}
        >

          {loading ? (

            <>
              ⏳ Analyzing...
            </>

          ) : (

            <>
              <span>
                ✨
              </span>

              Understand with SERI
            </>

          )}

        </button>

      </main>

    </div>
  );
}

export default ScreenAnalyzer;