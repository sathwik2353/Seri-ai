import os
import sys
import time
import io
import wave
import threading
import requests
import pyttsx3
import tkinter as tk
import numpy as np
from PIL import Image

try:
    import sounddevice as sd
    HAS_SOUNDDEVICE = True
except Exception as e:
    print("[SERI Desktop] sounddevice import warning:", e)
    HAS_SOUNDDEVICE = False

try:
    import mss
    HAS_MSS = True
except Exception:
    HAS_MSS = False

try:
    from PIL import ImageGrab
except Exception:
    ImageGrab = None

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

try:
    import speech_recognition as sr
    HAS_SR = True
except Exception as e:
    print("[SERI Desktop] SpeechRecognition load warning:", e)
    HAS_SR = False

API_URL = "http://localhost:8000"

SERI_WAKE_KEYWORDS = [
    "seri", "siri", "ceri", "sere", "saree", "sorry", "surrey", "series",
    "cherry", "serry", "hey seri", "hi seri", "hey siri", "scan", "screen", "check",
    "సరి", "సరీ", "సెరి", "స్క్రీన్", "చూడు",
    "सरी", "सेरी", "स्क्रीन", "चेक",
    "சரி", "செரி", "ஸ்கிரீன்",
    "ಸರಿ", "ಸೆರಿ", "ಸ್ಕ್ರೀನ್"
]

class SERIDesktopAssistant:
    def __init__(self):
        self.is_analyzing = False
        self.language = "English"
        self.tts_lock = threading.Lock()
        self.init_tts()

    def init_tts(self):
        try:
            self.engine = pyttsx3.init()
            self.engine.setProperty('rate', 160)
        except Exception as e:
            print("[SERI Desktop] TTS Init Warning:", e)
            self.engine = None

    def speak(self, text):
        if not text:
            return
        def _speak():
            try:
                # Try backend TTS first
                res = requests.post(f"{API_URL}/tts", data={"text": text, "language": self.language}, timeout=5)
                if res.status_code == 200 and len(res.content) > 100:
                    import tempfile
                    import ctypes
                    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_audio:
                        tmp_audio.write(res.content)
                        tmp_path = tmp_audio.name
                    
                    alias = f"seri_{int(time.time()*1000)}"
                    mci = ctypes.windll.winmm.mciSendStringW
                    mci(f'open "{tmp_path}" type mpegvideo alias {alias}', None, 0, None)
                    mci(f'play {alias} wait', None, 0, None)
                    mci(f'close {alias}', None, 0, None)
                    try:
                        os.remove(tmp_path)
                    except Exception:
                        pass
                    return
            except Exception as e:
                print("[SERI Desktop] Backend TTS warning:", e)

            # Thread-safe pyttsx3 fallback
            with self.tts_lock:
                try:
                    engine = pyttsx3.init()
                    engine.setProperty('rate', 160)
                    engine.say(text)
                    engine.runAndWait()
                    engine.stop()
                except Exception as e:
                    print("TTS error:", e)
        threading.Thread(target=_speak, daemon=True).start()

    def capture_screen_bytes(self):
        """Captures active desktop screen with fallbacks."""
        if HAS_MSS:
            try:
                with mss.mss() as sct:
                    # monitor[0] is the entire virtual screen across all monitors
                    monitor = sct.monitors[0]
                    sct_img = sct.grab(monitor)
                    img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
                    img_byte_arr = io.BytesIO()
                    img.save(img_byte_arr, format='PNG')
                    return img_byte_arr.getvalue()
            except Exception as e:
                print("[SERI Desktop] mss capture fallback:", e)

        if ImageGrab:
            try:
                screenshot = ImageGrab.grab(all_screens=True)
                img_byte_arr = io.BytesIO()
                screenshot.save(img_byte_arr, format='PNG')
                return img_byte_arr.getvalue()
            except Exception as e:
                print("[SERI Desktop] ImageGrab fallback:", e)

        raise RuntimeError("No desktop screen grabber available in current session.")

    def capture_and_analyze(self):
        if self.is_analyzing:
            return
        self.is_analyzing = True
        print("\n[SERI Desktop] 'SERI' voice trigger detected! Capturing entire screen...")

        # Sync active language set in web app or backend first
        try:
            lang_res = requests.get(f"{API_URL}/language", timeout=2)
            if lang_res.status_code == 200:
                self.language = lang_res.json().get("language") or self.language
        except Exception:
            pass

        scan_messages = {
            "Telugu": "సెరి మీ స్క్రీన్‌ను పరిశీలిస్తోంది...",
            "Hindi": "SERI आपकी स्क्रीन को स्कैन कर रहा है...",
            "Kannada": "SERI ನಿಮ್ಮ ಸ್ಕ್ರೀನ್ ಪರಿಶೀಲಿಸುತ್ತಿದೆ...",
            "Tamil": "SERI உங்கள் திரையை ஆய்வு செய்கிறது...",
            "English": "SERI is scanning your screen for safety..."
        }
        self.speak(scan_messages.get(self.language, scan_messages["English"]))

        # 1. Capture Full Desktop Screen
        try:
            time.sleep(0.3)
            img_bytes = self.capture_screen_bytes()
            print(f"[SERI Desktop] Screen captured! Size: {len(img_bytes)} bytes. Sending to backend...")
        except Exception as e:
            print("[SERI Desktop] Screen capture error:", e)
            self.speak("Could not capture screen.")
            self.is_analyzing = False
            return

        # 2. Send to SERI Backend API
        try:
            files = {'image': ('desktop_screen.png', img_bytes, 'image/png')}
            data = {'language': self.language}
            response = requests.post(f"{API_URL}/analyze", files=files, data=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                print("\n[SERI Desktop] AI Analysis Success!")
                print(f"Risk Level: {result.get('risk_level')}")
                print(f"Explanation: {result.get('simple_explanation') or result.get('summary')}")
                print(f"Recommendation: {result.get('recommended_action') or result.get('recommendation')}")
                self.display_and_voice_result(result)
            else:
                print(f"[SERI Desktop] Backend error: {response.status_code}")
                self.speak("Unable to analyze screen right now.")
        except Exception as e:
            print("[SERI Desktop] API connection error:", e)
            self.speak("Could not connect to SERI backend. Make sure SERI is running.")
        finally:
            self.is_analyzing = False

    def display_and_voice_result(self, result):
        summary = result.get("simple_explanation") or result.get("summary") or "Screen analyzed."
        risk_level = str(result.get("risk_level", "LOW")).upper()
        risk_reason = result.get("risk_reason", "")
        recommendation = result.get("recommended_action") or result.get("recommendation") or ""

        # Voice output
        speak_text = result.get("speak_response") or f"{summary}. {risk_reason}. {recommendation}"
        self.speak(speak_text)

        # Show Floating Popup Widget on Desktop
        self.show_floating_popup(risk_level, summary, risk_reason, recommendation)

    def show_floating_popup(self, risk_level, summary, risk_reason, recommendation):
        def _popup():
            try:
                root = tk.Tk()
                root.title("SERI Screen Intelligence")
                root.geometry("450x300+40+40")
                root.attributes('-topmost', True)
                root.configure(bg="#0f172a")

                header_bg = "#dc2626" if risk_level == "HIGH" else "#d97706" if risk_level == "MEDIUM" else "#16a34a"

                header = tk.Label(
                    root,
                    text=f"SERI SCREEN SAFETY: {risk_level} RISK",
                    font=("Segoe UI", 12, "bold"),
                    bg=header_bg,
                    fg="white",
                    pady=10
                )
                header.pack(fill="x")

                body_frame = tk.Frame(root, bg="#0f172a", padx=16, pady=12)
                body_frame.pack(fill="both", expand=True)

                lbl_summary = tk.Label(
                    body_frame,
                    text=summary,
                    font=("Segoe UI", 11, "bold"),
                    bg="#0f172a",
                    fg="#f8fafc",
                    wraplength=410,
                    justify="left"
                )
                lbl_summary.pack(anchor="w", pady=(0, 6))

                lbl_reason = tk.Label(
                    body_frame,
                    text=f"Risk Details: {risk_reason}",
                    font=("Segoe UI", 10),
                    bg="#0f172a",
                    fg="#cbd5e1",
                    wraplength=410,
                    justify="left"
                )
                lbl_reason.pack(anchor="w", pady=(0, 6))

                lbl_rec = tk.Label(
                    body_frame,
                    text=f"Action: {recommendation}",
                    font=("Segoe UI", 10, "bold"),
                    bg="#0f172a",
                    fg="#60a5fa",
                    wraplength=410,
                    justify="left"
                )
                lbl_rec.pack(anchor="w", pady=(0, 10))

                btn_close = tk.Button(
                    body_frame,
                    text="Dismiss Overlay",
                    font=("Segoe UI", 10, "bold"),
                    bg="#1e293b",
                    fg="white",
                    bd=1,
                    relief="solid",
                    command=root.destroy,
                    padx=14,
                    pady=4,
                    cursor="hand2"
                )
                btn_close.pack(anchor="e")

                root.after(12000, lambda: root.destroy())
                root.mainloop()
            except Exception as e:
                print("Popup window error:", e)

        threading.Thread(target=_popup, daemon=True).start()

    def start_gui_trigger(self):
        """Creates a mini floating widget desktop button as a trigger."""
        def _trigger_window():
            try:
                trigger = tk.Tk()
                trigger.title("SERI Voice")
                trigger.geometry("200x60+20+20")
                trigger.attributes('-topmost', True)
                trigger.configure(bg="#2563eb")

                btn = tk.Button(
                    trigger,
                    text="Say 'SERI'\nor Click to Scan Screen",
                    font=("Segoe UI", 9, "bold"),
                    bg="#2563eb",
                    fg="white",
                    bd=0,
                    command=self.capture_and_analyze,
                    cursor="hand2"
                )
                btn.pack(fill="both", expand=True)
                trigger.mainloop()
            except Exception as e:
                print("Trigger window error:", e)

        threading.Thread(target=_trigger_window, daemon=True).start()

    def listen_loop(self):
        if not HAS_SOUNDDEVICE or not HAS_SR:
            print("[SERI Desktop] sounddevice / SpeechRecognition in manual fallback mode.")
            return

        r = sr.Recognizer()
        samplerate = 16000
        duration = 3  # Seconds per listening chunk

        print("\n==================================================================")
        print(" SERI System-Wide Desktop Voice Assistant Active!")
        print(" 1. Say 'SERI' in ANY app (Chrome, WhatsApp, Bank App, etc.)")
        print(" 2. Click the floating SERI Voice widget on your screen.")
        print("==================================================================\n")

        while True:
            try:
                # Record chunk via sounddevice (PyAudio-free!)
                recording = sd.rec(int(duration * samplerate), samplerate=samplerate, channels=1, dtype='int16')
                sd.wait()

                audio_data = recording.flatten()
                amplitude = np.max(np.abs(audio_data))

                # Skip quiet silence
                if amplitude < 400:
                    continue

                wav_io = io.BytesIO()
                with wave.open(wav_io, 'wb') as wf:
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(samplerate)
                    wf.writeframes(audio_data.tobytes())
                wav_io.seek(0)

                with sr.AudioFile(wav_io) as source:
                    audio = r.record(source)

                text = r.recognize_google(audio).lower()
                print(f"Detected speech: '{text}'")

                if any(kw in text for kw in SERI_WAKE_KEYWORDS):
                    self.capture_and_analyze()

            except sr.UnknownValueError:
                continue
            except Exception as e:
                time.sleep(0.5)

def main():
    assistant = SERIDesktopAssistant()
    assistant.start_gui_trigger()
    
    if HAS_SOUNDDEVICE and HAS_SR:
        try:
            assistant.listen_loop()
        except KeyboardInterrupt:
            print("SERI Desktop Assistant stopped.")
    else:
        print("Running in manual trigger mode. Keep application window active.")
        while True:
            time.sleep(1)

if __name__ == "__main__":
    main()
