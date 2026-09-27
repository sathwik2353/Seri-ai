const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let currentAudioInstance = null;

/**
 * Health check to test connectivity with the SERI backend.
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === "healthy";
  } catch {
    return false;
  }
}

/**
 * Sends a screenshot to the backend for multimodal screen understanding.
 */
export async function analyzeScreen(image, language = "English", question = "", autoScan = false) {
  if (!image) {
    throw new Error("No screenshot selected.");
  }

  const formData = new FormData();
  formData.append("image", image);
  formData.append("language", language || "English");
  formData.append("question", question || "");
  formData.append("auto_scan", autoScan);

  let response;

  try {
    response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    console.error("Fetch error to SERI backend:", err);
    throw new Error(
      "Unable to connect to SERI backend. Make sure the backend is running on http://localhost:8000."
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      data?.message ||
      `SERI backend returned an error (${response.status}).`
    );
  }

  return data;
}

/**
 * Wake handshake for voice assistant activation.
 */
export async function wakeAssistant() {
  try {
    const response = await fetch(`${API_URL}/wake`, {
      method: "POST",
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn("Wake request could not reach backend:", err);
    return null;
  }
}

/**
 * Sends a voice transcript to the backend for analysis & command routing.
 */
export async function sendVoiceCommand(transcript, language = "English") {
  try {
    const response = await fetch(`${API_URL}/voice-command`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript,
        language,
      }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn("Voice command could not reach backend:", err);
    return null;
  }
}

/**
 * Stops any currently playing speech/TTS audio.
 */
export function stopTtsAudio() {
  if (currentAudioInstance) {
    try {
      currentAudioInstance.pause();
      currentAudioInstance.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudioInstance = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Returns the backend stream URL for native regional TTS.
 */
export function getTtsAudioUrl(text, language = "English") {
  const cleanText = encodeURIComponent((text || "").trim().slice(0, 400));
  const lang = encodeURIComponent(language || "English");
  return `${API_URL}/tts?text=${cleanText}&language=${lang}`;
}

/**
 * Plays high-quality native audio for Telugu, Hindi, Kannada, Tamil, or English.
 * Uses the backend audio stream with browser Web Speech synthesis as fallback.
 */
export async function playTtsAudio(text, language = "English", { onStart, onEnd, onError } = {}) {
  stopTtsAudio();

  if (!text || !text.trim()) {
    if (onEnd) onEnd();
    return;
  }

  const audioUrl = getTtsAudioUrl(text, language);

  const playFallback = () => {
    console.warn("Backend audio stream failed, falling back to Web Speech API...");
    currentAudioInstance = null;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langCodes = {
        Telugu: "te-IN",
        Hindi: "hi-IN",
        Kannada: "kn-IN",
        Tamil: "ta-IN",
        English: "en-IN",
      };
      utterance.lang = langCodes[language] || "en-IN";
      utterance.rate = 0.9;

      const voices = window.speechSynthesis.getVoices();
      const targetPrefix = utterance.lang.split("-")[0];
      const matched = voices.find(
        (v) => v.lang.startsWith(targetPrefix) || v.lang.includes(targetPrefix)
      );
      if (matched) {
        utterance.voice = matched;
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };
      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = (e) => {
        if (onError) onError(e);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      if (onError) onError(new Error("Text to speech unsupported"));
      if (onEnd) onEnd();
    }
  };

  try {
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`TTS backend returned ${response.status}`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const audio = new Audio(objectUrl);
    currentAudioInstance = audio;

    audio.onplay = () => {
      if (onStart) onStart();
    };

    audio.onended = () => {
      currentAudioInstance = null;
      URL.revokeObjectURL(objectUrl);
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      playFallback();
    };

    await audio.play();
  } catch (err) {
    console.warn("Audio play prevented or failed:", err);
    playFallback();
  }
}