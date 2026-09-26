import os
import json
import base64

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

load_dotenv()

# --------------------------------------------------
# OpenAI
# --------------------------------------------------

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise RuntimeError(
        "OPENAI_API_KEY is missing. Add it to your .env file."
    )

client = OpenAI(api_key=api_key)

# --------------------------------------------------
# FastAPI
# --------------------------------------------------

app = FastAPI(
    title="Seri AI Backend",
    description="Multilingual AI screen-understanding assistant",
    version="1.0.0"
)

# Allow Android / frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Health Check
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "service": "Seri AI Backend",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "seri-backend"
    }


# --------------------------------------------------
# AI PROMPT
# --------------------------------------------------

def build_prompt(language: str, question: str) -> str:

    return f"""
You are Seri, a multilingual AI screen-understanding
and accessibility assistant.

Your purpose is to help people with low digital literacy,
elderly users, and users who prefer regional languages
understand what is displayed on their mobile screen.

The user has explicitly shared the screen with you.

Preferred response language:
{language}

User question:
{question if question else "Explain what I am seeing on this screen."}

Analyze the provided screen carefully.

Identify:

1. APPLICATION
   Identify the application, website, or interface if possible.

2. SCREEN_SUMMARY
   Explain what the user is currently seeing.

3. IMPORTANT_INFORMATION
   Identify the most important information the user should understand.

4. REQUESTED_ACTION
   Explain what the screen is asking the user to do.

5. RISK_LEVEL
   Determine whether there are potential risks.

   Allowed values:
   - LOW
   - MEDIUM
   - HIGH
   - UNKNOWN

6. RISK_REASON
   Explain why the screen may be risky.

   Look especially for:
   - OTP requests
   - password requests
   - PIN requests
   - payment requests
   - suspicious links
   - fake offers
   - account verification requests
   - phishing-like language
   - requests for sensitive information

7. RECOMMENDATION
   Explain what the user should consider doing next.

8. SIMPLE_EXPLANATION
   Give a very simple explanation suitable for someone
   with low digital literacy.

9. CONFIRMATION_REQUIRED
   Set this to true if the user should explicitly
   confirm before performing a consequential action such as:
   payment, sending information, deleting something,
   submitting a form, or changing an important setting.

IMPORTANT SAFETY RULES:

- Never ask the user for passwords.
- Never ask the user for OTPs.
- Never ask for PINs.
- Never claim that something is definitely a scam unless
  the evidence shown on the screen clearly establishes it.
- If evidence is insufficient, say that the risk cannot
  be confirmed from the screen alone.
- Do not automatically perform actions.
- Seri explains and assists; the user remains in control.

LANGUAGE RULE:

Return the explanation in the requested language.
Use natural, simple language rather than literal translation.

OUTPUT FORMAT:

Return ONLY valid JSON.

{{
    "application": "...",
    "screen_summary": "...",
    "important_information": "...",
    "requested_action": "...",
    "risk_level": "LOW | MEDIUM | HIGH | UNKNOWN",
    "risk_reason": "...",
    "recommendation": "...",
    "simple_explanation": "...",
    "confirmation_required": true
}}
"""


# --------------------------------------------------
# Analyze Screen
# --------------------------------------------------

@app.post("/analyze-screen")
async def analyze_screen(
    image: UploadFile = File(...),
    language: str = Form("English"),
    question: str = Form("")
):

    # Validate image
    if not image.content_type:
        raise HTTPException(
            status_code=400,
            detail="Invalid image."
        )

    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Only image files are supported."
        )

    # Read image
    image_bytes = await image.read()

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="Empty image."
        )

    # Limit to approximately 10 MB
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image is too large. Maximum size is 10 MB."
        )

    # Convert image to base64
    encoded_image = base64.b64encode(image_bytes).decode("utf-8")

    mime_type = image.content_type

    image_data_url = (
        f"data:{mime_type};base64,{encoded_image}"
    )

    prompt = build_prompt(
        language=language,
        question=question
    )

    try:

        response = client.responses.create(
            model="gpt-5.6-luna",
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": prompt
                        },
                        {
                            "type": "input_image",
                            "image_url": image_data_url
                        }
                    ]
                }
            ]
        )

        output = response.output_text.strip()

        # Remove markdown JSON fences if model returns them
        if output.startswith("```"):
            output = output.replace("```json", "")
            output = output.replace("```", "")
            output = output.strip()

        try:
            result = json.loads(output)

        except json.JSONDecodeError:

            # Fallback if model returns plain text
            result = {
                "application": "Unknown",
                "screen_summary": output,
                "important_information": "",
                "requested_action": "",
                "risk_level": "UNKNOWN",
                "risk_reason": "",
                "recommendation": "",
                "simple_explanation": output,
                "confirmation_required": False
            }

        return {
            "success": True,
            "language": language,
            "question": question,
            "analysis": result
        }

    except Exception as e:

        print("OpenAI Error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to analyze the screen."
        )