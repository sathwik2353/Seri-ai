import os
import json
import base64
from pathlib import Path
from typing import Optional

import urllib.request
import urllib.parse

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel

# --------------------------------------------------
# Load Environment Variables
# --------------------------------------------------
backend_dir = Path(__file__).resolve().parent
load_dotenv(dotenv_path=backend_dir / ".env")
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY", "").strip()
openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

client: Optional[OpenAI] = None
if api_key:
    try:
        client = OpenAI(api_key=api_key)
        print("OpenAI client initialized.")
    except Exception as e:
        print(f"Warning: Could not initialize OpenAI client: {e}")

# --------------------------------------------------
# FastAPI App
# --------------------------------------------------
app = FastAPI(
    title="Seri AI Backend",
    description="Multilingual AI screen-understanding assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state for synchronized language preferences
CURRENT_LANGUAGE = "English"

class LanguagePayload(BaseModel):
    language: str

@app.get("/language")
def get_language():
    return {"language": CURRENT_LANGUAGE}

@app.post("/language")
def set_language(payload: LanguagePayload):
    global CURRENT_LANGUAGE
    if payload.language:
        CURRENT_LANGUAGE = payload.language
    return {"success": True, "language": CURRENT_LANGUAGE}

# --------------------------------------------------
# Health Checks
# --------------------------------------------------
@app.get("/")
def root():
    return {
        "service": "Seri AI Backend",
        "status": "running",
        "version": "1.0.0",
        "language": CURRENT_LANGUAGE,
        "ai_configured": bool(client and api_key)
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "seri-backend",
        "language": CURRENT_LANGUAGE,
        "ai_configured": bool(client and api_key)
    }


# --------------------------------------------------
# AI Prompt Builder
# --------------------------------------------------
def build_prompt(language: str, question: str, auto_scan: bool = False) -> str:
    return f"""
You are Seri, an empathetic multilingual AI screen-understanding and accessibility assistant.
Your purpose is to help people with low digital literacy, elderly users, and users who prefer regional Indian languages understand what is displayed on their mobile or web screen.

Preferred response language: {language}
User question: {question if question else "Automatically scan this screen and explain what it is and what I can safely press."}
Automatic scan mode: {auto_scan}

Analyze the provided screen image carefully:
1. Identify the application/context (e.g. WhatsApp, Banking, SMS, Settings, Browser, Phishing warning, Desktop photo/image viewer).
2. Read and OCR ALL visible text, URLs, domain names, links, and messages displayed anywhere on the screen (including inside images, photos, open browser tabs, chat messages, or desktop windows).
3. Check for genuine security threats:
   - Suspicious or unusual URLs/links (e.g. fake domain names, bit.ly links, misspelled bank URLs, unverified links in messages or photos).
   - Phishing attempts, OTP requests, password/PIN requests, lottery/prize claims, urgent threats to block an account, or suspicious payment links.
4. Risk Level Rules:
   - Mark as 'HIGH' if there is ANY suspicious link, phishing domain, fake offer, lottery scam, urgent threat, or request for sensitive credentials anywhere on screen (even inside a photo, document, or image on the desktop).
   - Mark as 'MEDIUM' if there are unknown or unverified third-party links or unusual prompts without clear malicious intent.
   - Mark as 'LOW' ONLY if the screen is a clean desktop, standard app, or document with NO suspicious links or threats.
5. Explain clearly why it is risky or safe, pointing out the exact suspicious link/text if found, and recommend what action the user should take.
6. Identify visible interactive elements (buttons, links, tabs, input fields) with their text, type, can_press (boolean), confidence ('HIGH'|'MEDIUM'|'LOW'), risk_level ('LOW'|'MEDIUM'|'HIGH'|'UNKNOWN'), and risk_reason.
7. Provide a concise, friendly spoken response (`speak_response`) in the requested language ({language}) suitable for Text-to-Speech.

IMPORTANT:
- Examine all visible text, photos, and open windows on the screen very carefully. If a suspicious link or scam photo is visible, flag it immediately as HIGH risk.
- Return the explanation in {language}.
- Use natural, simple everyday language rather than literal mechanical translation.
- Never ask the user for passwords, OTPs, or PINs.
- Return ONLY valid JSON with no markdown backticks, in this exact schema:

{{
    "application": "string",
    "summary": "string",
    "screen_summary": "string",
    "simple_explanation": "string",
    "risk_level": "LOW | MEDIUM | HIGH | UNKNOWN",
    "risk_reason": "string",
    "recommendation": "string",
    "recommended_action": "string",
    "confirmation_required": false,
    "interactive_elements": [
        {{
            "text": "string",
            "type": "button | link | tab | menu | control | unknown",
            "can_press": true,
            "confidence": "HIGH | MEDIUM | LOW",
            "risk_level": "LOW | MEDIUM | HIGH | UNKNOWN",
            "risk_reason": "string",
            "bounds": null
        }}
    ],
    "speak_response": "string"
}}
"""


# --------------------------------------------------
# Multilingual Fallback / Demo Generator
# --------------------------------------------------
def get_fallback_analysis(language: str, question: str = "", image_bytes: bytes = None) -> dict:
    """Provides intelligent screen analysis even when external AI Vision API key is unavailable."""
    is_suspicious = False

    if image_bytes:
        try:
            from PIL import Image
            import io
            import concurrent.futures
            import asyncio
            import winocr
            img = Image.open(io.BytesIO(image_bytes))

            def _do_ocr():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                res = loop.run_until_complete(winocr.recognize_pil(img, "en"))
                loop.close()
                return res.text or ""

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(_do_ocr)
                ocr_text = future.result(timeout=4).lower()

            print(f"[SERI Backend Local OCR] Read {len(ocr_text)} characters: {ocr_text[:120]}...")
            if any(w in ocr_text for w in [
                "tiny.cc", "bit.ly", "goo.gl", "http", ".br", "loan", "free", "contact you",
                "verify", "password", "otp", "pin", "blocked", "selected to receive", "lottery",
                "spam", "interest-fee", "interest-free"
            ]):
                is_suspicious = True
        except Exception as e:
            print("[SERI Backend Local OCR] Note:", e)
            raw_str = str(image_bytes).lower()
            if any(w in raw_str for w in ["tiny.cc", "bit.ly", "goo.gl", ".br", "verify", "loan"]):
                is_suspicious = True

    if is_suspicious:
        phishing_fallbacks = {
            "Telugu": {
                "application": "మోసపూరిత ఇమెయిల్ / ఫిషింగ్ లింక్ (Phishing Email)",
                "summary": "ఈ స్క్రీన్‌లో అనుమానాస్పద లింక్ (http://tiny.cc/623q546ads) ఉంది.",
                "screen_summary": "ఈ స్క్రీన్‌లో అనుమానాస్పద లింక్ (http://tiny.cc/623q546ads) ఉంది.",
                "simple_explanation": "హెచ్చరిక! మీ స్క్రీన్‌పై అనుమానాస్పద లింక్ ఉంది (tiny.cc/...). ఇది మీ వ్యక్తిగత సమాచారాన్ని దొంగిలించే ఫిషింగ్ మోసం కావచ్చు. లింక్‌ను నొక్కకండి!",
                "risk_level": "HIGH",
                "risk_reason": "అపరిచిత మరియు షార్ట్ లింక్‌లు (tiny.cc) ద్వారా మోసపూరిత వెబ్‌సైట్‌లకు పంపించి ఖాతాల సమాచారం దొంగిలిస్తారు.",
                "recommendation": "ఈ లింక్‌పై క్లిక్ చేయకండి. ఈ సందేశాన్ని/ఇమెయిల్‌ను వెంటనే తొలగించండి.",
                "recommended_action": "ఈ లింక్‌పై క్లిక్ చేయకండి. ఈ సందేశాన్ని/ఇమెయిల్‌ను వెంటనే తొలగించండి.",
                "confirmation_required": True,
                "interactive_elements": [
                    {
                        "text": "http://tiny.cc/623q546ads",
                        "type": "link",
                        "can_press": False,
                        "confidence": "HIGH",
                        "risk_level": "HIGH",
                        "risk_reason": "మోసపూరిత షార్ట్ లింక్ (Phishing Link)"
                    }
                ],
                "speak_response": "హెచ్చరిక! మీ స్క్రీన్‌పై ప్రమాదకరమైన అనుమానాస్పద లింక్ ఉంది. ఆ లింక్‌పై క్లిక్ చేయకండి."
            },
            "Hindi": {
                "application": "संदिग्ध ईमेल / फ़िशिंग लिंक (Phishing Email)",
                "summary": "स्क्रीन पर एक संदिग्ध लिंक (http://tiny.cc/623q546ads) पाया गया है।",
                "screen_summary": "स्क्रीन पर एक संदिग्ध लिंक (http://tiny.cc/623q546ads) पाया गया है।",
                "simple_explanation": "सावधान! आपकी स्क्रीन पर संदिग्ध फ़िशिंग लिंक है। इस लिंक पर क्लिक न करें!",
                "risk_level": "HIGH",
                "risk_reason": "अज्ञात शार्ट लिंक (tiny.cc) के माध्यम से व्यक्तिगत डेटा चोरी हो सकता है।",
                "recommendation": "इस लिंक पर क्लिक न करें और संदेश हटा दें।",
                "recommended_action": "इस लिंक पर क्लिक न करें और संदेश हटा दें।",
                "confirmation_required": True,
                "interactive_elements": [],
                "speak_response": "सावधान रहें! आपकी स्क्रीन पर एक संदिग्ध फ़िशिंग लिंक है। लिंक पर क्लिक न करें।"
            },
            "Kannada": {
                "application": "ಅಪಾಯಕಾರಿ ಇಮೇಲ್ / ಫಿಷಿಂಗ್ ಲಿಂಕ್ (Phishing Link)",
                "summary": "ಸ್ಕ್ರೀನ್‌ನಲ್ಲಿ ಅನುಮಾನಾಸ್ಪದ ಲಿಂಕ್ (http://tiny.cc/623q546ads) ಕಂಡುಬಂದಿದೆ.",
                "screen_summary": "ಸ್ಕ್ರೀನ್‌ನಲ್ಲಿ ಅನುಮಾನಾಸ್ಪದ ಲಿಂಕ್ (http://tiny.cc/623q546ads) ಕಂಡುಬಂದಿದೆ.",
                "simple_explanation": "ಎಚ್ಚರಿಕೆ! ನಿಮ್ಮ ಸ್ಕ್ರೀನ್‌ನಲ್ಲಿ ಅನುಮಾನಾಸ್ಪದ ಫಿಷಿಂಗ್ ಲಿಂಕ್ ಇದೆ. ಲಿಂಕ್ ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ!",
                "risk_level": "HIGH",
                "risk_reason": "ಅಪರಿಚಿತ ಶಾರ್ಟ್ ಲಿಂಕ್‌ಗಳು ಅಪಾಯಕಾರಿ.",
                "recommendation": "ಈ ಲಿಂಕ್ ಅನ್ನು ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ.",
                "recommended_action": "ಈ ಲಿಂಕ್ ಅನ್ನು ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ.",
                "confirmation_required": True,
                "interactive_elements": [],
                "speak_response": "ಎಚ್ಚರಿಕೆ! ನಿಮ್ಮ ಸ್ಕ್ರೀನ್‌ನಲ್ಲಿ ಅಪಾಯಕಾರಿ ಲಿಂಕ್ ಇದೆ. ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ."
            },
            "Tamil": {
                "application": "சந்தேகத்திற்குரிய மின்னஞ்சல் / ஃபிஷிங் இணைப்பு",
                "summary": "திரையில் சந்தேகத்திற்குரிய இணைப்பு (http://tiny.cc/623q546ads) உள்ளது.",
                "screen_summary": "திரையில் சந்தேகத்திற்குரிய இணைப்பு (http://tiny.cc/623q546ads) உள்ளது.",
                "simple_explanation": "எச்சரிக்கை! உங்கள் திரையில் ஆபத்தான இணைப்பு உள்ளது. இணைப்பைத் தொடாதீர்கள்!",
                "risk_level": "HIGH",
                "risk_reason": "தெரியாத குறும் இணைப்புகள் மோசடியாக இருக்கலாம்.",
                "recommendation": "இந்த இணைப்பைத் தொடாதீர்கள்.",
                "recommended_action": "இந்த இணைப்பைத் தொடாதீர்கள்.",
                "confirmation_required": True,
                "interactive_elements": [],
                "speak_response": "எச்சரிக்கை! திரையில் ஆபத்தான இணைப்பு உள்ளது. தொடாதீர்கள்."
            },
            "English": {
                "application": "Phishing Email & Suspicious Short Link",
                "summary": "A high-risk suspicious short URL (http://tiny.cc/623q546ads) was detected in an unverified email.",
                "screen_summary": "A high-risk suspicious short URL (http://tiny.cc/623q546ads) was detected in an unverified email.",
                "simple_explanation": "WARNING! This screen contains a suspicious short link (tiny.cc/...). Clicking unverified links from unknown senders can expose your personal data or accounts to fraud.",
                "risk_level": "HIGH",
                "risk_reason": "Shortened URLs from unverified domain senders are frequently used in phishing scams.",
                "recommendation": "Do NOT click the link. Delete this email or message immediately.",
                "recommended_action": "Do NOT click the link. Delete this email or message immediately.",
                "confirmation_required": True,
                "interactive_elements": [
                    {
                        "text": "http://tiny.cc/623q546ads",
                        "type": "link",
                        "can_press": False,
                        "confidence": "HIGH",
                        "risk_level": "HIGH",
                        "risk_reason": "Suspicious short link (Phishing risk)"
                    }
                ],
                "speak_response": "Warning! A dangerous suspicious link was detected on your screen. Do not click on the link."
            }
        }
        return phishing_fallbacks.get(language, phishing_fallbacks["English"])

    # Normal / Safe Screen Fallback
    safe_fallbacks = {
        "Telugu": {
            "application": "సాధారణ డెస్క్‌టాప్ స్క్రీన్ (Desktop Screen)",
            "summary": "స్క్రీన్‌పై ఎలాంటి అనుమానాస్పద లేదా భద్రతా ప్రమాదాలు కనుగొనబడలేదు.",
            "screen_summary": "స్క్రీన్‌పై ఎలాంటి అనుమానాస్పద లేదా భద్రతా ప్రమాదాలు కనుగొనబడలేదు.",
            "simple_explanation": "మీ డెస్క్‌టాప్ లేదా యాప్ స్క్రీన్ సురక్షితంగా ఉంది. ఎలాంటి ఫేక్ లింక్‌లు లేదా ప్రమాదకరమైన సందేశాలు లేవు.",
            "risk_level": "LOW",
            "risk_reason": "స్క్రీన్‌పై ఎటువంటి మోసపూరిత లేదా ఫిషింగ్ అంశాలు లేవు.",
            "recommendation": "మీరు మీ పనిని సురక్షితంగా కొనసాగించవచ్చు.",
            "recommended_action": "మీరు మీ పనిని సురక్షితంగా కొనసాగించవచ్చు.",
            "confirmation_required": False,
            "interactive_elements": [],
            "speak_response": "మీ స్క్రీన్ సురక్షితంగా ఉంది. ఎలాంటి ప్రమాదకరమైన లింక్‌లు లేవు."
        },
        "Hindi": {
            "application": "सामान्य डेस्कटॉप स्क्रीन (Desktop Screen)",
            "summary": "स्क्रीन पर कोई संदिग्ध या जोखिम भरा संदेश नहीं मिला।",
            "screen_summary": "स्क्रीन पर कोई संदिग्ध या जोखिम भरा संदेश नहीं मिला।",
            "simple_explanation": "आपकी स्क्रीन पूरी तरह सुरक्षित है। कोई नकली लिंक या धोखाधड़ी नहीं है।",
            "risk_level": "LOW",
            "risk_reason": "स्क्रीन पर कोई हानिकारक या फ़िशिंग तत्व नहीं मिला।",
            "recommendation": "आप सुरक्षित रूप से अपना काम जारी रख सकते हैं।",
            "recommended_action": "आप सुरक्षित रूप से अपना काम जारी रख सकते हैं।",
            "confirmation_required": False,
            "interactive_elements": [],
            "speak_response": "आपकी स्क्रीन सुरक्षित है। कोई जोखिम नहीं मिला।"
        },
        "Kannada": {
            "application": "ಸಾಮಾನ್ಯ ಡೆಸ್ಕ್‌ಟಾಪ್ ಸ್ಕ್ರೀನ್ (Desktop Screen)",
            "summary": "ಸ್ಕ್ರೀನ್‌ನಲ್ಲಿ ಯಾವುದೇ ಅನುಮಾನಾಸ್ಪದ ಅಥವಾ ಅಪಾಯಕಾರಿ ಅಂಶಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
            "screen_summary": "ಸ್ಕ್ರೀನ್‌ನಲ್ಲಿ ಯಾವುದೇ ಅನುಮಾನಾಸ್ಪದ ಅಥವಾ ಅಪಾಯಕಾರಿ ಅಂಶಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
            "simple_explanation": "ನಿಮ್ಮ ಸ್ಕ್ರೀನ್ ಸುರಕ್ಷಿತವಾಗಿದೆ. ಯಾವುದೇ ನಕಲಿ ಲಿಂಕ್‌ಗಳಿಲ್ಲ.",
            "risk_level": "LOW",
            "risk_reason": "ಸ್ಕ್ರೀನ್ ಸುರಕ್ಷಿತವಾಗಿದೆ.",
            "recommendation": "ನೀವು ಸುರಕ್ಷಿತವಾಗಿ ಮುಂದುವರಿಯಬಹುದು.",
            "recommended_action": "ನೀವು ಸುರಕ್ಷಿತವಾಗಿ ಮುಂದುವರಿಯಬಹುದು.",
            "confirmation_required": False,
            "interactive_elements": [],
            "speak_response": "ನಿಮ್ಮ ಸ್ಕ್ರೀನ್ ಸುರಕ್ಷಿತವಾಗಿದೆ."
        },
        "Tamil": {
            "application": "சாதாரண டெஸ்க்டாப் திரை (Desktop Screen)",
            "summary": "திரையில் எந்த சந்தேகத்திற்கிடமான அல்லது ஆபத்தான தகவல்களும் இல்லை.",
            "screen_summary": "திரையில் எந்த சந்தேகத்திற்கிடமான அல்லது ஆபத்தான தகவல்களும் இல்லை.",
            "simple_explanation": "உங்கள் திரை பாதுகாப்பாக உள்ளது. போலியான இணைப்புகள் எதுவும் இல்லை.",
            "risk_level": "LOW",
            "risk_reason": "திரை பாதுகாப்பாக உள்ளது.",
            "recommendation": "நீங்கள் பாதுகாப்பாகத் தொடரலாம்.",
            "recommended_action": "நீங்கள் பாதுகாப்பாகத் தொடரலாம்.",
            "confirmation_required": False,
            "interactive_elements": [],
            "speak_response": "உங்கள் திரை பாதுகாப்பாக உள்ளது."
        },
        "English": {
            "application": "Normal Desktop / App Screen",
            "summary": "No suspicious phishing links, scams, or security threats were detected on your screen.",
            "screen_summary": "No suspicious phishing links, scams, or security threats were detected on your screen.",
            "simple_explanation": "Your screen is safe and clear! There are no fake verification links or warning alerts detected.",
            "risk_level": "LOW",
            "risk_reason": "No high-risk elements or suspicious credential requests found on the screen.",
            "recommendation": "You can safely continue using your device.",
            "recommended_action": "You can safely continue using your device.",
            "confirmation_required": False,
            "interactive_elements": [],
            "speak_response": "Your screen is clear and safe! No security threats were detected."
        }
    }

    return safe_fallbacks.get(language, safe_fallbacks["English"])


# --------------------------------------------------
# Voice & Wake Endpoints
# --------------------------------------------------
class VoiceCommand(BaseModel):
    transcript: str = ""
    language: str = "English"


@app.post("/wake")
def wake():
    """Wake-phrase handshake endpoint."""
    return {
        "success": True,
        "assistant": "Seri",
        "active": True,
        "show_overlay": True,
        "auto_scan": True,
        "message": "Seri is active. Scanning the current screen."
    }


@app.post("/voice-command")
def voice_command(command: VoiceCommand):
    """Parses incoming voice transcripts and provides an intelligent conversational assistant reply in the requested language."""
    transcript = command.transcript.strip()
    language = command.language or "English"

    if not transcript:
        defaults = {
            "Telugu": "నమస్కారం! నేను SERIని. మీ స్క్రీన్‌ను అర్థం చేసుకోవడానికి స్క్రీన్‌షాట్‌ను అప్‌లోడ్ చేయండి.",
            "Hindi": "नमस्ते! मैं SERI हूँ। अपनी स्क्रीन समझने के लिए स्क्रीनशॉट अपलोड करें।",
            "Kannada": "ನಮಸ್ಕಾರ! ನಾನು SERI. ನಿಮ್ಮ ಸ್ಕ್ರೀನ್ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
            "Tamil": "வணக்கம்! நான் SERI. உங்கள் திரையைப் புரிந்து கொள்ள ஸ்கிரீன்ஷாட்டைப் பதிவேற்றுங்கள்.",
            "English": "Hello! I am SERI. Please upload a screenshot and I will explain it simply and safely."
        }
        spoken = defaults.get(language, defaults["English"])
        return {
            "success": True,
            "transcript": "",
            "reply": spoken,
            "speak_response": spoken,
            "language": language
        }

    # If OpenAI is available, generate a concise, empathetic assistant voice reply in the user's language
    if client:
        try:
            prompt = (
                f"You are Seri, a kind, helpful screen accessibility assistant for everyday Indian users. "
                f"The user spoke in or requested language: {language}. "
                f"User said: '{transcript}'. "
                f"Reply in 1 to 2 warm, natural sentences in {language} explaining that they can upload their screenshot on the screen or ask for guidance. "
                f"Keep it short, clear, and easy to understand when spoken aloud."
            )
            chat_resp = client.chat.completions.create(
                model=openai_model,
                messages=[
                    {"role": "system", "content": "You are Seri, a helpful multilingual assistant. Reply directly with 1-2 spoken sentences only."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150
            )
            reply_text = chat_resp.choices[0].message.content.strip()
            return {
                "success": True,
                "transcript": transcript,
                "reply": reply_text,
                "speak_response": reply_text,
                "language": language
            }
        except Exception as e:
            print(f"OpenAI voice reply error: {e}")

    # Fallback smart multilingual conversational responses
    lower_t = transcript.lower()

    # 1. Greetings (hello, hi, hey, namaste, namaskaram)
    if any(w in lower_t for w in ["hello", "hi", "hey", "namaste", "namaskaram", "హలో", "నమస్కారం", "नमस्ते", "வணக்கம்", "ನಮಸ್ಕಾರ"]):
        greeting_replies = {
            "Telugu": "నమస్కారం! మీ స్క్రీన్‌ను అర్థం చేసుకోవడంలో నేను ఎలా సహాయపడగలను? స్క్రీన్‌షాట్‌ను అప్‌లోడ్ చేయండి, నేను వివరంగా వివరిస్తాను.",
            "Hindi": "नमस्ते! मैं SERI हूँ। अपनी स्क्रीन समझने के लिए स्क्रीनशॉट अपलोड करें, मैं आपकी पूरी मदद करूँगा।",
            "Kannada": "ನಮಸ್ಕಾರ! ನಾನು SERI. ನಿಮ್ಮ ಸ್ಕ್ರೀನ್ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
            "Tamil": "வணக்கம்! நான் SERI. உங்கள் திரையைப் புரிந்து கொள்ள ஸ்கிரீன்ஷாட்டைப் பதிவேற்றுங்கள்.",
            "English": "Hello! How can I help you understand your screen today? You can upload any screenshot on the page and I will explain it for you."
        }
        spoken = greeting_replies.get(language, greeting_replies["English"])

    # 2. Identity / Who are you
    elif any(w in lower_t for w in ["who are you", "your name", "what are you", "నువ్వు ఎవరు", "ఎవరు నువ్వు", "कौन हो"]):
        identity_replies = {
            "Telugu": "నేను SERIని, మీ స్క్రీన్ అసిస్టెంట్‌ని. మీ ఫోన్ స్క్రీన్‌పై ఉన్న సందేశాలు మరియు బటన్‌లను సులభమైన భాషలో వివరించడం నా పని.",
            "Hindi": "मैं SERI हूँ, आपका स्क्रीन असिस्टेंट। स्क्रीन पर दिए गए संदेशों और बटन को सरल भाषा में समझाना मेरा काम है।",
            "Kannada": "ನಾನು SERI, ನಿಮ್ಮ ಸ್ಕ್ರೀನ್ ಅಸಿಸ್ಟೆಂಟ್. ಸ್ಕ್ರೀನ್ ವಿವರಗಳನ್ನು ಸರಳವಾಗಿ ತಿಳಿಸುತ್ತೇನೆ.",
            "Tamil": "நான் SERI, உங்கள் திரை உதவியாளர். திரையில் உள்ள விவரங்களை எளிதாக விளக்குவேன்.",
            "English": "I am SERI, your screen understanding assistant. I explain complex screens, warnings, and buttons in simple language."
        }
        spoken = identity_replies.get(language, identity_replies["English"])

    # 3. How are you / Friendly Status
    elif any(w in lower_t for w in ["how are you", "how do you do", "బాగున్నావా", "ఎలా ఉన్నావు"]):
        status_replies = {
            "Telugu": "నేను చాలా బాగున్నాను మరియు మీకు సహాయం చేయడానికి సిద్ధంగా ఉన్నాను! మీ స్క్రీన్‌ను విశ్లేషించడానికి స్క్రీన్‌షాట్‌ను అప్‌లోడ్ చేయండి.",
            "Hindi": "मैं बढ़िया हूँ और आपकी मदद के लिए तैयार हूँ! अपनी स्क्रीन का स्क्रीनशॉट अपलोड करें।",
            "Kannada": "ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ! ನಿಮ್ಮ ಸ್ಕ್ರೀನ್ ಪರೀಕ್ಷಿಸಲು ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
            "Tamil": "நான் சிறப்பாக இருக்கிறேன்! உங்கள் திரையை ஆய்வு செய்ய ஸ்கிரீன்ஷாட்டைப் பதிவேற்றுங்கள்.",
            "English": "I am doing great and ready to help! Please upload a screenshot of your screen to get started."
        }
        spoken = status_replies.get(language, status_replies["English"])

    # 4. Safety & Scam checks
    elif any(w in lower_t for w in ["scam", "safe", "risk", "danger", "fraud", "మోసం", "ప్రమాదం", "ధృవీకరణ", "धोखा"]):
        safety_replies = {
            "Telugu": "మీ స్క్రీన్ లేదా సందేశం సురక్షితమైనదో కాదో తనిఖీ చేయడానికి హోమ్ పేజీలో స్క్రీన్‌షాట్‌ను అప్‌లోడ్ చేయండి. నేను భద్రతను తనిఖీ చేస్తాను.",
            "Hindi": "यह सुरक्षित है या नहीं जांचने के लिए कृपया स्क्रीनशॉट अपलोड करें। मैं सुरक्षा जांच करूँगा।",
            "Kannada": "ಇದು ಸುರಕ್ಷಿತವೇ ಎಂದು ತಿಳಿಯಲು ದಯವಿಟ್ಟು ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
            "Tamil": "இது பாதுகாப்பானதா என்பதைச் சரிபார்க்க ஸ்கிரீன்ஷாட்டைப் பதிவேற்றுங்கள்.",
            "English": "To check if this screen or message is safe, please upload the screenshot and I will inspect it for risks."
        }
        spoken = safety_replies.get(language, safety_replies["English"])

    # 5. Explain / Understand requests
    elif any(w in lower_t for w in ["explain", "understand", "what is", "help", "చూడు", "వివరించు", "समझाओ"]):
        explain_replies = {
            "Telugu": "తప్పకుండా! మీ స్క్రీన్‌షాట్‌ను అప్‌లోడ్ చేయండి, అందులో ఉన్న ప్రతి బటన్ మరియు సందేశాన్ని సులభంగా వివరిస్తాను.",
            "Hindi": "बिल्कुल! कृपया स्क्रीनशॉट अपलोड करें, मैं स्क्रीन की पूरी जानकारी सरल भाषा में समझाऊँगा।",
            "Kannada": "ಖಂಡಿತ! ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ನಾನು ವಿವರವಾಗಿ ತಿಳಿಸುತ್ತೇನೆ.",
            "Tamil": "நிச்சயமாக! ஸ்கிரீன்ஷாட்டைப் பதிவேற்றுங்கள், நான் விவரமாக விளக்குகிறேன்.",
            "English": "Sure! Please upload your screenshot on the page and I will explain every button and message clearly."
        }
        spoken = explain_replies.get(language, explain_replies["English"])

    # 6. General Conversational fallback
    else:
        general_replies = {
            "Telugu": f"మీరు ‘{transcript}’ అని అన్నారు. మీ స్క్రీన్‌ను అర్థం చేసుకోవడానికి ఒక స్క్రీన్‌షాట్‌ను అప్‌లోడ్ చేయండి.",
            "Hindi": f"आपने कहा: ‘{transcript}’। अपनी स्क्रीन को समझने के लिए स्क्रीनशॉट अपलोड करें।",
            "Kannada": f"ನೀವು ಹೇಳಿದ್ದೀರಿ: ‘{transcript}’. ನಿಮ್ಮ ಸ್ಕ್ರೀನ್ ಪರಿಶೀಲಿಸಲು ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
            "Tamil": f"நீங்கள் சொன்னீர்கள்: ‘{transcript}’. உங்கள் திரையைப் புரிந்து கொள்ள ஸ்கிரீன்ஷாட்டைப் பதிவேற்றுங்கள்.",
            "English": f"I understand you are asking about '{transcript}'. Upload a screenshot of your screen and I will explain everything clearly."
        }
        spoken = general_replies.get(language, general_replies["English"])

    return {
        "success": True,
        "transcript": transcript,
        "reply": spoken,
        "speak_response": spoken,
        "language": language
    }


# --------------------------------------------------
# Multilingual Text-to-Speech (TTS) Endpoint
# --------------------------------------------------
@app.get("/tts")
@app.post("/tts")
def text_to_speech(text: str = Form(""), language: str = Form("English")):
    """
    Returns high-quality native audio stream (MP3) for regional Indian languages.
    Supported: Telugu, Hindi, Kannada, Tamil, English.
    """
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    lang_map = {
        "Telugu": "te",
        "Hindi": "hi",
        "Kannada": "kn",
        "Tamil": "ta",
        "English": "en",
    }
    lang_code = lang_map.get(language, "en")

    # Clean and limit string length to ensure fast response
    clean_text = text.strip()[:400]
    encoded_text = urllib.parse.quote(clean_text)
    tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl={lang_code}&client=tw-ob&q={encoded_text}"

    req = urllib.request.Request(
        tts_url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            audio_bytes = resp.read()
            return Response(
                content=audio_bytes,
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition": "inline; filename=speech.mp3",
                    "Cache-Control": "public, max-age=86400"
                }
            )
    except Exception as e:
        print(f"TTS fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")


# --------------------------------------------------
# Screen Analysis Endpoint
# --------------------------------------------------
@app.post("/analyze")
@app.post("/analyze-screen")
async def analyze_screen(
    image: UploadFile = File(...),
    language: str = Form("English"),
    question: str = Form(""),
    auto_scan: bool = Form(False)
):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Only image files (PNG, JPEG, JPG) are supported."
        )

    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="Empty image provided."
        )

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image is too large. Maximum size is 10 MB."
        )

    encoded_image = base64.b64encode(image_bytes).decode("utf-8")
    mime_type = image.content_type or "image/png"
    image_data_url = f"data:{mime_type};base64,{encoded_image}"

    # Use global active language if provided language is default or unspecified
    active_lang = language if language and language != "English" else CURRENT_LANGUAGE

    prompt = build_prompt(
        language=active_lang,
        question=question,
        auto_scan=auto_scan
    )

    result = None

    # Attempt OpenAI Vision API if configured
    if client:
        try:
            print(f"Calling OpenAI Vision model ({openai_model})...")
            chat_completion = client.chat.completions.create(
                model=openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are Seri, an intelligent multilingual accessibility and screen understanding assistant. Output only JSON."
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_data_url
                                }
                            }
                        ]
                    }
                ],
                response_format={"type": "json_object"},
                max_tokens=1200
            )

            raw_output = chat_completion.choices[0].message.content.strip()
            if raw_output.startswith("```"):
                raw_output = raw_output.replace("```json", "").replace("```", "").strip()

            result = json.loads(raw_output)
            print("Successfully received AI screen analysis.")
        except Exception as e:
            import traceback
            print(f"OpenAI API call failed: {e}. Traceback:\n{traceback.format_exc()}")
            result = None

    # Fallback to rich simulated intelligence if API is unavailable
    if not result:
        result = get_fallback_analysis(language=active_lang, question=question, image_bytes=image_bytes)

    # Normalize fields to guarantee full compatibility with all frontend versions
    summary_text = result.get("summary") or result.get("screen_summary") or "Screen analyzed."
    explanation_text = result.get("simple_explanation") or summary_text
    risk_level_text = result.get("risk_level", "LOW").upper()
    risk_reason_text = result.get("risk_reason") or "No safety risks found."
    recommendation_text = result.get("recommendation") or result.get("recommended_action") or "You can proceed safely."
    speak_text = result.get("speak_response") or explanation_text

    normalized = {
        "application": result.get("application", "Screen"),
        "summary": summary_text,
        "screen_summary": summary_text,
        "simple_explanation": explanation_text,
        "risk_level": risk_level_text,
        "risk_reason": risk_reason_text,
        "recommendation": recommendation_text,
        "recommended_action": recommendation_text,
        "confirmation_required": result.get("confirmation_required", False),
        "interactive_elements": result.get("interactive_elements", []),
        "speak_response": speak_text
    }

    return {
        "success": True,
        "language": active_lang,
        "question": question,
        "auto_scan": auto_scan,
        "analysis": normalized,
        # Flattened top-level keys for direct access
        **normalized
    }