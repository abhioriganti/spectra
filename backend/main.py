from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import sqlite3
import anthropic
import os
import json
import re
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "spectra.db"
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="Spectra API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS sensory_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            sensory_type TEXT NOT NULL,
            intensity INTEGER NOT NULL,
            location TEXT,
            description TEXT,
            functional_impact TEXT,
            duration_minutes INTEGER
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS meltdown_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            event_type TEXT NOT NULL,
            severity INTEGER NOT NULL,
            duration_minutes INTEGER,
            triggers TEXT,
            description TEXT,
            what_helped TEXT,
            recovery_time_minutes INTEGER
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS script_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            situation_type TEXT NOT NULL,
            user_prompt TEXT NOT NULL,
            generated_script TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS coping_strategies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            label TEXT NOT NULL,
            description TEXT
        )
    """)
    conn.commit()
    conn.close()


init_db()


# ── Pydantic models ──────────────────────────────────────────────────────────

class SensoryEntryCreate(BaseModel):
    sensory_type: str
    intensity: int
    location: Optional[str] = None
    description: Optional[str] = None
    functional_impact: Optional[str] = None
    duration_minutes: Optional[int] = None


class MeltdownEntryCreate(BaseModel):
    event_type: str
    severity: int
    duration_minutes: Optional[int] = None
    triggers: Optional[str] = None
    description: Optional[str] = None
    what_helped: Optional[str] = None
    recovery_time_minutes: Optional[int] = None


class ScriptRequest(BaseModel):
    situation_type: str
    user_prompt: str


class CopingStrategyCreate(BaseModel):
    label: str
    description: Optional[str] = None


class SafeModeRequest(BaseModel):
    anxiety_description: str


# ── Sensory Diary ─────────────────────────────────────────────────────────────

@app.get("/api/diary")
def get_diary_entries():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM sensory_entries ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/diary")
def create_diary_entry(entry: SensoryEntryCreate):
    conn = get_db()
    c = conn.cursor()
    c.execute(
        """INSERT INTO sensory_entries
           (created_at, sensory_type, intensity, location, description, functional_impact, duration_minutes)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (datetime.now().isoformat(), entry.sensory_type, entry.intensity,
         entry.location, entry.description, entry.functional_impact, entry.duration_minutes),
    )
    conn.commit()
    new_id = c.lastrowid
    conn.close()
    return {"id": new_id, "message": "Entry logged"}


@app.delete("/api/diary/{entry_id}")
def delete_diary_entry(entry_id: int):
    conn = get_db()
    conn.execute("DELETE FROM sensory_entries WHERE id = ?", (entry_id,))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}


# ── Meltdown Log ──────────────────────────────────────────────────────────────

@app.get("/api/meltdown")
def get_meltdown_entries():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM meltdown_entries ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/meltdown")
def create_meltdown_entry(entry: MeltdownEntryCreate):
    conn = get_db()
    c = conn.cursor()
    c.execute(
        """INSERT INTO meltdown_entries
           (created_at, event_type, severity, duration_minutes, triggers, description, what_helped, recovery_time_minutes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (datetime.now().isoformat(), entry.event_type, entry.severity,
         entry.duration_minutes, entry.triggers, entry.description,
         entry.what_helped, entry.recovery_time_minutes),
    )
    conn.commit()
    new_id = c.lastrowid
    conn.close()
    return {"id": new_id, "message": "Entry logged"}


@app.delete("/api/meltdown/{entry_id}")
def delete_meltdown_entry(entry_id: int):
    conn = get_db()
    conn.execute("DELETE FROM meltdown_entries WHERE id = ?", (entry_id,))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}


# ── Script Generator ──────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are Spectra's communication helper, built for autistic people who need support putting their thoughts into words.

Your job is to take someone's raw, messy, anxious thoughts and turn them into a message they can actually send. The person may be overwhelmed, scared of being judged, or just struggling to start. Your output should feel like it was written by a real person, not a corporate template.

Write in plain, clear, natural English. Short sentences. Simple words. No flowery language.

Rules:
- Never use em dashes (-- or the character). Use commas or periods instead.
- No corporate filler phrases like "I wanted to reach out", "I hope this finds you well", "Please do not hesitate", "I look forward to hearing from you", "touch base", or "circle back".
- No over-apologizing or excessive hedging. The person has a real need. State it clearly.
- Do not make the person sound needy or fragile. They are self-advocating.
- Keep it short. Two to four short paragraphs is enough.
- Sound like a real human wrote this on a Tuesday afternoon.
- If it is an email, include a simple subject line.
- Frame sensory or autism-related needs as practical workplace or personal needs, not as a disability unless the user specifically asked to mention disability.

After the script, add 2 to 3 short, practical tips to help the person actually send or say this message. Tips should be grounded and specific, not generic advice.

Respond ONLY with valid JSON in this exact format:
{
  "script": "the full script or email body",
  "subject": "email subject line, or null if not an email",
  "tips": ["tip 1", "tip 2", "tip 3"]
}"""


@app.post("/api/generate-script")
def generate_script(request: ScriptRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set in environment")

    client = anthropic.Anthropic(api_key=api_key)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
        messages=[{
            "role": "user",
            "content": f"Situation type: {request.situation_type}\n\nUser's raw thoughts:\n{request.user_prompt}\n\nGenerate a supportive, professional script."
        }],
    )

    raw = message.content[0].text

    try:
        json_match = re.search(r'\{[\s\S]*\}', raw)
        result = json.loads(json_match.group()) if json_match else {"script": raw, "subject": None, "tips": []}
    except Exception:
        result = {"script": raw, "subject": None, "tips": []}

    conn = get_db()
    conn.execute(
        "INSERT INTO script_history (created_at, situation_type, user_prompt, generated_script) VALUES (?, ?, ?, ?)",
        (datetime.now().isoformat(), request.situation_type, request.user_prompt, json.dumps(result)),
    )
    conn.commit()
    conn.close()

    return result


@app.get("/api/scripts")
def get_script_history():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM script_history ORDER BY created_at DESC LIMIT 20"
    ).fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        try:
            d["generated_script"] = json.loads(d["generated_script"])
        except Exception:
            pass
        results.append(d)
    return results


SAFE_MODE_PROMPT = """You are a calm, grounding support companion inside Spectra, an app for autistic people. Someone is overwhelmed right now and has told you what they are feeling. Your job is to help them regulate in this moment.

Rules:
- Be warm, short, and very simple. The person is overwhelmed. Do not write walls of text.
- Never use em dashes (the — character or --). Use a comma or period instead.
- Start by briefly validating what they said in one or two plain sentences. Do not say "I understand" or "I hear you". Just reflect what is hard and name it.
- Choose ONE breathing technique that fits their situation. Common options: box breathing (4-4-4-4), 4-7-8 breathing (inhale 4, hold 7, exhale 8, no final hold), or simple slow breathing (inhale 4, exhale 6, no holds). Pick the one that best matches their state. High panic = 4-7-8. General stress = box breathing. Mild anxiety = slow breathing.
- Give 3 to 4 simple grounding or coping steps. Each step should be one or two sentences max. Practical. Specific. No generic advice.
- End with one short, honest affirmation. Not cheesy. Not "you've got this". Something grounded like "This feeling will pass. You have gotten through this before."

Respond ONLY with valid JSON in this exact format:
{
  "validation": "one or two sentence validation of what they are feeling",
  "breathing": {
    "name": "name of the technique",
    "phases": [
      {"label": "Breathe In", "duration": 4, "cls": "inhale"},
      {"label": "Hold", "duration": 7, "cls": "hold"},
      {"label": "Breathe Out", "duration": 8, "cls": "exhale"}
    ]
  },
  "steps": [
    {"emoji": "🌊", "title": "Short title", "body": "One or two sentence instruction."},
    {"emoji": "🤚", "title": "Short title", "body": "One or two sentence instruction."},
    {"emoji": "🧊", "title": "Short title", "body": "One or two sentence instruction."}
  ],
  "affirmation": "One grounded, honest closing sentence."
}"""


@app.post("/api/safe-mode")
def safe_mode_help(request: SafeModeRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")

    client = anthropic.Anthropic(api_key=api_key)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=900,
        system=[{"type": "text", "text": SAFE_MODE_PROMPT, "cache_control": {"type": "ephemeral"}}],
        messages=[{
            "role": "user",
            "content": f"What I am feeling right now:\n{request.anxiety_description}"
        }],
    )

    raw = message.content[0].text
    try:
        match = re.search(r'\{[\s\S]*\}', raw)
        result = json.loads(match.group()) if match else {"validation": raw, "breathing": None, "steps": [], "affirmation": ""}
    except Exception:
        result = {"validation": raw, "breathing": None, "steps": [], "affirmation": ""}

    return result


# ── Coping Strategies ────────────────────────────────────────────────────────

@app.get("/api/coping")
def get_coping_strategies():
    conn = get_db()
    rows = conn.execute("SELECT * FROM coping_strategies ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/coping")
def create_coping_strategy(strategy: CopingStrategyCreate):
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "INSERT INTO coping_strategies (created_at, label, description) VALUES (?, ?, ?)",
        (datetime.now().isoformat(), strategy.label, strategy.description),
    )
    conn.commit()
    new_id = c.lastrowid
    conn.close()
    return {"id": new_id, "message": "Strategy saved"}


@app.delete("/api/coping/{strategy_id}")
def delete_coping_strategy(strategy_id: int):
    conn = get_db()
    conn.execute("DELETE FROM coping_strategies WHERE id = ?", (strategy_id,))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}


# ── Insights ──────────────────────────────────────────────────────────────────

@app.get("/api/insights")
def get_insights():
    conn = get_db()
    sensory_summary = conn.execute("""
        SELECT sensory_type, COUNT(*) as count, ROUND(AVG(intensity), 1) as avg_intensity
        FROM sensory_entries GROUP BY sensory_type ORDER BY avg_intensity DESC
    """).fetchall()
    meltdown_summary = conn.execute("""
        SELECT event_type, COUNT(*) as count, ROUND(AVG(severity), 1) as avg_severity
        FROM meltdown_entries GROUP BY event_type
    """).fetchall()
    total_diary = conn.execute("SELECT COUNT(*) as n FROM sensory_entries").fetchone()["n"]
    total_meltdown = conn.execute("SELECT COUNT(*) as n FROM meltdown_entries").fetchone()["n"]
    total_scripts = conn.execute("SELECT COUNT(*) as n FROM script_history").fetchone()["n"]
    conn.close()
    return {
        "sensory_summary": [dict(s) for s in sensory_summary],
        "meltdown_summary": [dict(m) for m in meltdown_summary],
        "totals": {"diary": total_diary, "meltdown": total_meltdown, "scripts": total_scripts},
    }


# ── Serve frontend ────────────────────────────────────────────────────────────

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def root():
    return FileResponse(STATIC_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
