# ✦ Spectra — Sensory Companion for Autistic Users

> A calm, AI-powered app that helps autistic individuals track sensory experiences, log meltdown events, communicate their needs, and regulate during moments of overwhelm.

**Live Demo:** https://spectra-l26n.onrender.com

---

## What is Spectra?

Spectra is built for autistic people who struggle with sensory overload, communication barriers, and the anxiety of advocating for their own needs in neurotypical environments. It combines personal tracking tools with Claude AI to provide real-time, personalized support.

---

## Features

### 📓 Sensory Diary
Log sensory experiences throughout the day — sound, light, smell, touch, temperature, and more. Track intensity (1–10), location, duration, and how each experience affected your ability to function.

### 🌊 Meltdown Log
A private, judgment-free space to document meltdown and shutdown events. Record triggers, severity, duration, what helped you recover, and recovery time. Patterns surface on the dashboard automatically.

### ✍️ AI Script Generator
Powered by Claude. Describe what you need to communicate in your own words — messy, anxious, unfiltered — and Spectra turns it into a clear, professional, self-advocating message. Covers workplace accommodations, medical appointments, family conversations, school requests, and more.

### 🛡️ Safe Mode
A calm, low-stimulation crisis page for moments of overwhelm. Describe what you are feeling and Claude generates a personalized regulation plan including:
- A validation of what you are experiencing
- A breathing exercise chosen for your specific state (box breathing, 4-7-8, or slow breathing)
- Step-by-step grounding instructions tailored to your situation
- Pre-written communication cards to show another person without needing to speak

### 🏠 Dashboard
Visual overview of your sensory patterns, meltdown history, and activity across all features.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3, FastAPI, Uvicorn |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) with prompt caching |
| Database | SQLite |
| Frontend | Vanilla HTML, CSS, JavaScript (no framework, no build step) |
| Deployment | Render |

---

## Getting Started

### Prerequisites
- Python 3.10+
- An [Anthropic API key](https://console.anthropic.com/)

### Installation

```bash
# Clone the repo
git clone https://github.com/abhioriganti/spectra.git
cd spectra

# Install dependencies
pip install -r backend/requirements.txt

# Set up your API key
cp backend/.env.example backend/.env
# Open backend/.env and add your ANTHROPIC_API_KEY

# Start the server
python backend/main.py
```

Open **http://localhost:8000** in your browser.

---

## Project Structure

```
spectra/
├── backend/
│   ├── main.py              # FastAPI app — all routes and Claude API logic
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # API key template
│   └── static/
│       ├── index.html       # App shell and navigation
│       ├── style.css        # All styles
│       └── app.js           # Full frontend SPA
├── render.yaml              # Render deployment config
└── .gitignore
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key from console.anthropic.com |

---

## Deployment

This project is configured for one-click deployment on [Render](https://render.com).

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

**Manual setup on Render:**
- Runtime: Python 3
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Add `ANTHROPIC_API_KEY` as an environment variable

---

## Built With

- [Anthropic Claude API](https://www.anthropic.com/) — AI script generation and Safe Mode regulation plans
- [FastAPI](https://fastapi.tiangolo.com/) — Backend framework
- [Render](https://render.com/) — Deployment platform

---

## License

MIT
