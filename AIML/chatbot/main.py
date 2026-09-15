# AIML/chatbot/main.py
#
# Kisan Mitra — BeejRakshak's farming-only chatbot module.
# Mount this the same way mandi_intelligence and scrapbot are already mounted
# in AIML/main.py, e.g.:
#
#   from chatbot.main import router as chatbot_router
#   app.include_router(chatbot_router, prefix="/chatbot")
#
# Env vars needed (put in AIML/.env):
#   CHATBOT_PROVIDER=openai        # or "gemini"
#   OPENAI_API_KEY=sk-...
#   GEMINI_API_KEY=...
#   SUPABASE_URL=...               # only needed if you want farmer-context lookup
#   SUPABASE_SERVICE_KEY=...

import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

CHATBOT_PROVIDER = os.getenv("CHATBOT_PROVIDER", "openai").lower()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# ---------------------------------------------------------------------------
# The guardrail. This is the single most important piece — everything else
# is plumbing. Be explicit about scope AND give a couple of refusal examples
# so the model has a pattern to imitate rather than guessing.
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are Kisan Mitra, the in-app assistant for BeejRakshak,
a farming platform used by farmers in Gujarat and across India.

You ONLY answer questions related to farming and agriculture, including:
- Crop selection, sowing, irrigation, pest and disease management
- Soil health, NPK fertilizer needs, soil pH and texture
- Weather and its effect on crops (rainfall, moisture, flooding, drought)
- Mandi (market) prices and when/where to sell a crop
- Government agricultural schemes (PM-Kisan, PMFBY crop insurance, etc.)
- Yield expectations and crop planning

If the farmer asks about anything unrelated to farming — politics, celebrities,
general coding help, entertainment, unrelated personal advice, etc. — do NOT
answer it. Instead reply briefly and kindly that you can only help with
farming questions, and suggest one farming topic they might ask instead.

Example refusal (adapt the language to match the farmer's message):
"I can only help with farming questions — things like crop care, mandi
prices, weather for your fields, or government schemes. Want to ask about
one of those instead?"

Reply in the same language the farmer writes in (Hindi, Gujarati, or
English). Keep answers short, practical, and specific to Indian smallholder
farming conditions. If you don't have real-time data (like today's exact
weather or mandi price), say so plainly instead of guessing a number, and
point the farmer to the relevant in-app feature (Mandi Intelligence, SAR
Field Monitoring, Fertilizer Advisor, or Government Schemes) where they can
get the live figure.
"""

DEFAULT_QUESTIONS = [
    "How will the rainfall and soil moisture be in my area this week?",
    "Where can I get the best mandi price for my crop today?",
    "What government schemes are active in my state?",
    "What fertilizer (NPK) do I need for my crop?",
]


class FarmerContext(BaseModel):
    district: Optional[str] = None
    state: Optional[str] = None
    primary_crop: Optional[str] = None
    crop_stage: Optional[str] = None
    land_area: Optional[float] = None
    land_unit: Optional[str] = None
    preferred_language: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    farmer_context: Optional[FarmerContext] = None
    # pass prior turns so the bot has short-term memory of the conversation
    history: Optional[list[dict]] = None  # [{"role": "user"/"assistant", "content": "..."}]


class ChatResponse(BaseModel):
    reply: str


def _build_context_note(ctx: Optional[FarmerContext]) -> str:
    if not ctx:
        return ""
    parts = []
    if ctx.district or ctx.state:
        parts.append(f"Farmer location: {ctx.district or ''}, {ctx.state or ''}".strip(", "))
    if ctx.primary_crop:
        parts.append(f"Primary crop: {ctx.primary_crop} (stage: {ctx.crop_stage or 'unknown'})")
    if ctx.land_area:
        parts.append(f"Land size: {ctx.land_area} {ctx.land_unit or ''}")
    if not parts:
        return ""
    return "Known farmer profile (use this to personalize, don't just repeat it back): " + "; ".join(parts)


async def _call_openai(messages: list[dict]) -> str:
    if not OPENAI_API_KEY:
        # Fallback/warning message for testing when API key is missing
        return "Note: OpenAI API Key is not configured in AIML/.env. Please configure OPENAI_API_KEY to receive AI responses."
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={
                "model": "gpt-4o-mini",
                "messages": messages,
                "temperature": 0.4,
                "max_tokens": 400,
            },
        )
    if resp.status_code != 200:
        raise HTTPException(502, f"OpenAI error: {resp.text}")
    data = resp.json()
    return data["choices"][0]["message"]["content"]


async def _call_gemini(messages: list[dict]) -> str:
    if not GEMINI_API_KEY:
        # Fallback/warning message for testing when API key is missing
        return "Note: Gemini API Key is not configured in AIML/.env. Please configure GEMINI_API_KEY to receive AI responses."
    # Gemini doesn't have a "system" role the same way — fold the system
    # prompt into the first user turn instead.
    system_msg = next((m["content"] for m in messages if m["role"] == "system"), "")
    convo = [m for m in messages if m["role"] != "system"]

    contents = []
    if convo:
        first = convo[0]
        contents.append({
            "role": "user",
            "parts": [{"text": f"{system_msg}\n\n{first['content']}"}],
        })
        convo = convo[1:]
    for m in convo:
        role = "model" if m["role"] == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": m["content"]}]})

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
            json={"contents": contents, "generationConfig": {"temperature": 0.4, "maxOutputTokens": 400}},
        )
    if resp.status_code != 200:
        raise HTTPException(502, f"Gemini error: {resp.text}")
    data = resp.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


@router.get("/default-questions")
async def get_default_questions():
    return {"questions": DEFAULT_QUESTIONS}


@router.post("/ask", response_model=ChatResponse)
async def ask(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(400, "message cannot be empty")

    context_note = _build_context_note(req.farmer_context)
    system_content = SYSTEM_PROMPT + ("\n\n" + context_note if context_note else "")

    messages = [{"role": "system", "content": system_content}]
    if req.history:
        messages.extend(req.history[-6:])  # keep last 6 turns, no need for more
    messages.append({"role": "user", "content": req.message})

    if CHATBOT_PROVIDER == "gemini":
        reply = await _call_gemini(messages)
    else:
        reply = await _call_openai(messages)

    return ChatResponse(reply=reply.strip())
