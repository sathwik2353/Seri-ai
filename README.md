# Seri — Understand. Listen. Stay Safe.

> **A voice-first, multilingual AI web assistant that understands what's on your screen and explains it in simple language.**

## 🚀 Overview

**Seri** is an AI-powered web application designed to help people who struggle with complex digital interfaces, technical terminology, and English-heavy content.

Users can upload a screenshot of a message, notification, website, form, payment request, or other digital screen. Seri analyzes the screen using AI and provides:

* Simple explanations
* Regional-language explanations
* Voice-based assistance
* Safety warnings
* Clear next steps
* Explanations of unfamiliar buttons, links, forms, and requests

Seri is designed to **assist users without taking control away from them**. The user makes the final decision before performing any consequential action.

---

## 🎯 Problem Statement

Smartphones are filled with messages, notifications, forms, websites, and application screens written in complex or technical language.

This creates difficulties for:

* Elderly users
* People with low digital literacy
* Users more comfortable with regional languages
* Users unfamiliar with technical terminology

The problem becomes more serious when users encounter:

* Suspicious messages
* Phishing links
* Fake offers
* Payment requests
* OTP requests
* Password requests
* Unfamiliar forms and buttons

Existing tools often solve only one part of the problem. A chatbot may answer questions, while a scam detector may identify suspicious content, but users still need to understand **what is actually displayed on their screen and what they should do next**.

---

## 💡 Our Solution

Seri combines:

```text
Screen Understanding
        +
Simple Explanation
        +
Regional Languages
        +
Voice Assistance
        +
Safety Guidance
```

### Core workflow

```text
User uploads screenshot
          ↓
      Seri Backend
          ↓
    AI Screen Analysis
          ↓
 ┌────────┼─────────┐
 ↓        ↓         ↓
Content  Risk     Context
 ↓        ↓         ↓
 └────────┼─────────┘
          ↓
 Simple Explanation
          ↓
 Regional Language
          ↓
     Text + Voice
          ↓
     User Decides
```

---

# ✨ Key Features

## 1. Screen Understanding

Seri can analyze screenshots containing:

* Messages
* Notifications
* Websites
* Forms
* Images
* Buttons
* Links
* Payment information
* Warnings
* Digital-service interfaces

The user does not need to manually type or describe everything on the screen.

---

## 2. Simple Explanation

Instead of returning technical terminology, Seri provides:

* Short sentences
* Simple vocabulary
* Clear explanations
* Step-by-step guidance
* Explanation of unfamiliar buttons and options

### Example

**Original message:**

> Congratulations! You have won ₹50,000. Click the link and enter your OTP to claim your reward.

### Seri:

> ⚠️ This message may be a scam.
>
> It says you won ₹50,000 and asks you to click a link and provide an OTP.
>
> **Do not share your OTP.**
>
> Verify the offer using the company's official website or application.

---

## 3. Regional Languages

Seri is designed to support users who prefer regional languages.

Initial target languages include:

* English
* Telugu
* Hindi
* Tamil
* Kannada
* Malayalam

More languages can be added later.

The goal is not only word-for-word translation. Seri should provide **natural, easy-to-understand explanations** using familiar terminology and examples.

---

## 4. Voice-First Assistance

Users can interact with Seri through voice.

### Voice input

```text
🎤 Ask Seri
       ↓
Speech → Text
       ↓
AI
       ↓
Answer
```

### Voice output

```text
AI Explanation
      ↓
Text-to-Speech
      ↓
🔊 User listens
```

This helps users who find reading difficult.

---

## 5. Safety Assistance

Seri identifies potentially risky content such as:

* Suspicious links
* OTP requests
* Password requests
* Unexpected payment requests
* Fake offers
* Urgent requests
* Potential phishing messages

Instead of claiming absolute certainty, Seri explains **why something may be dangerous**.

Example:

```text
⚠️ POSSIBLE RISK

Why?

• The message asks for an OTP.
• It contains an unfamiliar link.
• It creates urgency.

Recommended:

✓ Do not share your OTP.
✓ Do not enter your password.
✓ Verify through the official website.
```

---

## 6. Human Control

Seri is an assistant, not an autonomous decision-maker.

The system follows these principles:

* User activates screen analysis
* Permissions are explained
* No secret access
* No automatic payments
* No automatic message sending
* No automatic deletion
* No automatic form submission
* Consequential actions require explicit confirmation

### Principle

> **AI recommends. The user decides.**

---

# 🏗️ System Architecture

```text
┌──────────────────────────────────────────┐
│              SERI WEB APP                │
│          Next.js + React + Tailwind      │
└────────────────────┬─────────────────────┘
                     │
                     │ REST API
                     ▼
┌──────────────────────────────────────────┐
│              FASTAPI BACKEND             │
│                Python                    │
├──────────────────────────────────────────┤
│                                          │
│  Image Processing                        │
│  AI Service                              │
│  Risk Analysis                           │
│  Language Processing                     │
│  Voice Services                          │
│                                          │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│           MULTIMODAL AI MODEL            │
│                                          │
│  Screen Understanding                    │
│  Text Understanding                      │
│  Context Analysis                        │
│  Risk Assessment                         │
│  Simplification                          │
│  Language Generation                     │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│              SERI RESPONSE               │
├──────────────────────────────────────────┤
│ Simple Explanation                       │
│ Safety Warning                           │
│ Recommended Actions                      │
│ Regional Language                        │
│ Voice Output                             │
└──────────────────────────────────────────┘
```

---

# 🛠️ Technology Stack

| Component         | Technology                          |
| ----------------- | ----------------------------------- |
| Frontend          | Next.js                             |
| UI                | React + Tailwind CSS                |
| Backend           | Python                              |
| API Framework     | FastAPI                             |
| AI                | Multimodal Vision/Language Model    |
| OCR               | AI/OCR service                      |
| Speech Input      | Browser Speech API / Speech-to-Text |
| Text-to-Speech    | Browser Speech Synthesis / TTS      |
| API Communication | REST                                |
| Version Control   | Git + GitHub                        |
| Deployment        | Cloud hosting                       |

---

# 📁 Project Structure

```text
seri/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── routes/
│   │   ├── analyze.py
│   │   ├── chat.py
│   │   └── voice.py
│   │
│   ├── services/
│   │   ├── ai_service.py
│   │   ├── ocr_service.py
│   │   ├── risk_service.py
│   │   └── language_service.py
│   │
│   ├── models/
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
│
├── screenshots/
│
├── docs/
│
├── .gitignore
└── README.md
```

---

# 🔌 API Design

## Analyze Screen

```http
POST /api/analyze
```

### Input

```text
Image
Selected language
Optional user question
```

### Example response

```json
{
  "success": true,
  "risk_level": "HIGH",
  "summary": "The message claims that the user has won a prize.",
  "risk_reason": "The message requests an OTP and contains a suspicious link.",
  "simple_explanation": "This may be a scam. Do not share your OTP.",
  "what_to_do": [
    "Do not share your OTP",
    "Do not click the link",
    "Verify through the official website"
  ],
  "language": "English"
}
```

---

## Ask Seri

```http
POST /api/ask
```

Used for follow-up questions.

Example:

```text
User:
"Can I click this link?"

Seri:
"It is safer not to click the link. Verify the message
through the organization's official website."
```

---

## Health Check

```http
GET /api/health
```

Used to verify that the backend is running.

---

# 💻 Local Development

## Prerequisites

Install:

* Node.js
* Python 3
* Git
* npm

---

## Clone Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd seri
```

---

# Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# Backend Setup

Open another terminal:

```bash
cd backend
python3 -m venv venv
```

Activate the environment.

### macOS / Linux

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the server:

```bash
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

---

# 🔐 Environment Variables

Create:

```text
backend/.env
```

Example:

```env
AI_API_KEY=your_api_key_here
AI_MODEL=your_model_name
```

**Never commit API keys to GitHub.**

Add `.env` to `.gitignore`.

Example:

```text
.env
venv/
__pycache__/
node_modules/
.next/
```

---

# 🧪 Prototype Demo

The recommended hackathon demonstration:

### Step 1 — Upload

Upload a screenshot containing a suspicious message.

### Step 2 — Analyze

Click:

```text
🔍 Understand Screen
```

### Step 3 — AI Analysis

Seri identifies:

```text
Message
Link
OTP request
Potential risk
```

### Step 4 — Explanation

Seri explains the screen in simple language.

### Step 5 — Language

Switch:

```text
English → Telugu
```

### Step 6 — Voice

Click:

```text
🔊 Listen
```

### Step 7 — Follow-up

Click:

```text
🎤 Ask Seri
```

Ask:

> "What should I do?"

Seri provides the next safe step.

---

# 🎯 Target Users

Seri is primarily designed for:

* Elderly users
* People with low digital literacy
* Users who prefer regional languages
* Users unfamiliar with technical terminology
* Users who need help understanding digital services

---

# 🌍 Expected Impact

Seri aims to make digital services more accessible by allowing users to:

* Understand unfamiliar screens
* Read information in their preferred language
* Listen instead of reading
* Understand unfamiliar icons and buttons
* Recognize potentially suspicious requests
* Make more informed decisions

The architecture can be extended to additional languages, regions, and digital content types.

---

# 🚀 Scalability

The same architecture can support:

```text
Messages
   ↓
Notifications
   ↓
Websites
   ↓
Forms
   ↓
Payment Screens
   ↓
Banking Interfaces
   ↓
Government Services
   ↓
Digital Applications
```

Additional languages can be added without changing the core architecture.

---

# 💡 Innovation

Seri combines several capabilities into one accessibility layer:

```text
        SCREEN
           ↓
     AI UNDERSTANDING
           ↓
   SIMPLE EXPLANATION
           ↓
   REGIONAL LANGUAGE
           ↓
    SAFETY GUIDANCE
           ↓
      VOICE OUTPUT
           ↓
     USER DECISION
```

Seri is not intended to replace existing chatbots or scam detectors.

Its focus is helping users understand **what they are currently looking at**, why it may matter, and what options they have.

---

# 🔒 Privacy & Safety Principles

Seri follows a user-control approach.

### Principles

1. Screen analysis is user-initiated.
2. No secret screen access.
3. Permissions should be clearly explained.
4. Sensitive information should not be unnecessarily stored.
5. API keys must remain private.
6. Consequential actions require user confirmation.
7. Risk assessments should communicate uncertainty.
8. Seri should not claim that a message is definitely a scam unless the evidence supports that conclusion.

---

# 🏆 Hackathon MVP

The minimum viable prototype consists of:

```text
✅ Web Interface
✅ Screenshot Upload
✅ AI Screen Understanding
✅ Simple Explanation
✅ Scam/Risk Detection
✅ Regional Language
✅ Voice Output
✅ Follow-up Question
✅ User-Controlled Workflow
```

---

# 🔮 Future Development

Possible future improvements include:

* Browser extension
* Real-time screen assistance
* More Indian languages
* Advanced OCR
* Accessibility modes
* Larger fonts
* High-contrast interface
* Offline language models
* On-device processing
* Voice-only navigation
* Integration with digital public services
* More advanced phishing detection
* Personalized accessibility settings

---

# 👥 Team

**Project:** Seri

**Theme:** AI for Digital Accessibility & Safety

**Platform:** Web Application

**Status:** Hackathon Prototype

---

# 📜 License

This project is currently developed as a hackathon prototype.

Add an appropriate open-source license if the project is later released publicly.

---

## ⭐ Core Idea

> **Seri helps people understand what they see on a digital screen, in a language they understand, so they can make safer and more confident decisions.**

**Understand. Listen. Stay Safe.**
