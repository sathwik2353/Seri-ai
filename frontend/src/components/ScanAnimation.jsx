import { useEffect, useState } from "react";
import "./ScanAnimation.css";

function ScanAnimation({ onComplete, language }) {
  const [stage, setStage] = useState(0);

  const stages = [
    "Activating SERI...",
    "Reading your screen...",
    "Understanding the content...",
    "Checking for safety...",
    "Preparing a simple explanation..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStage((current) => {
        if (current < stages.length - 1) {
          return current + 1;
        }

        clearInterval(timer);

        setTimeout(() => {
          onComplete();
        }, 700);

        return current;
      });
    }, 900);

    return () => clearInterval(timer);
  }, [onComplete, stages.length]);

  return (
    <div className="scan-page">

      <div className="scan-background-glow"></div>

      <div className="scan-content">

        <div className="scan-orb">

          <div className="scan-ring scan-ring-1"></div>
          <div className="scan-ring scan-ring-2"></div>
          <div className="scan-ring scan-ring-3"></div>

          <div className="scan-core">
            ✦
          </div>

        </div>


        <div className="scan-title">
          SERI
        </div>

        <div className="scan-status">
          {stages[stage]}
        </div>


        <div className="scan-progress">

          <div
            className="scan-progress-bar"
            style={{
              width: `${((stage + 1) / stages.length) * 100}%`
            }}
          />

        </div>


        <div className="scan-step-count">
          {stage + 1} / {stages.length}
        </div>


        <div className="scan-language">
          Explaining in <strong>{language}</strong>
        </div>

      </div>

    </div>
  );
}

export default ScanAnimation;