# Spectra - Sensory Companion for Autistic Users

Spectra is an AI-powered app built to help autistic individuals track sensory experiences, log meltdown events, communicate their needs to others, and regulate during moments of overwhelm. It was built for the Anthropic Claude Hackathon.

---

## Features

### Sensory Diary
Log sensory experiences throughout the day across eight types: sound, light, smell, touch, taste, temperature, movement, and body sense. Each entry captures intensity (1-10), location, duration, and functional impact. The dashboard surfaces patterns over time.

### Meltdown Log
A private space to document meltdown and shutdown events after they happen. Record triggers, severity, duration, what helped, and recovery time. Patterns are visualized on the dashboard to help connect daily sensory load to breaking points.

### AI Script Generator
Powered by Claude. Describe what you need to communicate in plain, unfiltered language and Spectra generates a clear, professional, self-advocating message. Covers workplace accommodations, medical appointments, family conversations, school requests, service providers, and more. Output is written to sound like a real person, not a corporate template.

### Safe Mode
A calm, low-stimulation crisis page for moments of overwhelm. Describe what you are feeling and Claude generates a personalized regulation plan:
- A direct validation of what you are experiencing
- A breathing exercise chosen for your specific state (box breathing, 4-7-8, or slow breathing based on severity)
- Step-by-step grounding instructions tailored to your situation
- A closing affirmation
- Pre-written communication cards to show another person without needing to speak

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3, FastAPI, Uvicorn |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) with prompt caching |
| Database | SQLite |
| Frontend | Vanilla HTML, CSS, JavaScript |
| Config | python-dotenv |

---

## Getting Started

### Prerequisites

- Python 3.10 or higher
- An API key from one of the supported providers below

### API Key Setup

Spectra uses the Anthropic Claude API by default. You need to provide your own API key to run this project.

**Get a free API key:**

| Provider | Model used | Get your key |
|---|---|---|
| **Anthropic (default)** | `claude-sonnet-4-6` | [console.anthropic.com](https://console.anthropic.com/) |
| **Alternative** | Any OpenAI-compatible model | [platform.openai.com](https://platform.openai.com/) |

> **Note:** If you switch to a different provider, update the `client` initialization and model name in `backend/main.py` accordingly.

### Installation

```bash
# Clone the repository
git clone https://github.com/abhioriganti/spectra.git
cd spectra

# Install dependencies
pip install -r backend/requirements.txt

# Set up environment variables
cp backend/.env.example backend/.env
```

Open `backend/.env` and add your own API key:

```
ANTHROPIC_API_KEY=your_api_key_here
```

> **Important:** Never share your `.env` file or commit it to version control. It is already listed in `.gitignore`.

### Run

```bash
python backend/main.py
```

Open **http://localhost:8000** in your browser.

---

## Project Structure

```
spectra/
├── backend/
│   ├── main.py              # FastAPI app — all API routes and Claude logic
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variable template
│   └── static/
│       ├── index.html       # App shell and navigation
│       ├── style.css        # All styles
│       └── app.js           # Frontend single-page app
├── render.yaml              # Deployment config
├── .gitignore
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/diary` | Get all sensory diary entries |
| POST | `/api/diary` | Create a new sensory entry |
| DELETE | `/api/diary/{id}` | Delete a sensory entry |
| GET | `/api/meltdown` | Get all meltdown log entries |
| POST | `/api/meltdown` | Create a new meltdown entry |
| DELETE | `/api/meltdown/{id}` | Delete a meltdown entry |
| POST | `/api/generate-script` | Generate a communication script via Claude |
| GET | `/api/scripts` | Get script generation history |
| POST | `/api/safe-mode` | Get a personalized regulation plan via Claude |
| GET | `/api/coping` | Get saved coping strategies |
| POST | `/api/coping` | Save a new coping strategy |
| DELETE | `/api/coping/{id}` | Delete a coping strategy |
| GET | `/api/insights` | Get dashboard insights and pattern summaries |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | API key from console.anthropic.com |

---

## License

MIT
