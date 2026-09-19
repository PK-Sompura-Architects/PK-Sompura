import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

router = APIRouter()


class ContactMessage(BaseModel):
    # Length caps keep a public endpoint from being used to relay bulk text.
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(default="", max_length=32)
    email: str = Field(default="", max_length=200)
    temple_type: str = Field(default="", max_length=120)
    message: str = Field(default="", max_length=4000)


def _format(payload: ContactMessage) -> str:
    lines = [
        "*P.K. Sompura - New Website Inquiry*",
        "",
        f"*Name:* {payload.name}",
    ]
    if payload.phone:
        clean = "".join(ch for ch in payload.phone if ch.isdigit())
        lines.append(f"*Phone:* {payload.phone}")
        if clean:
            lines.append(f"*WhatsApp:* https://wa.me/{clean}")
    if payload.email:
        lines.append(f"*Email:* {payload.email}")
    if payload.temple_type:
        lines.append(f"*Project Type:* {payload.temple_type}")
    if payload.message:
        lines.append("")
        lines.append(payload.message)
    return "\n".join(lines)


@router.post("")
@router.post("/")
async def submit_contact(payload: ContactMessage):
    """
    Relays an inquiry to Telegram from the server.

    The browser must never hold the bot token: anything shipped to the client
    is readable, and a leaked token lets anyone post as the bot or read its
    chats. The front end posts here instead.
    """
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        # Fail loudly rather than pretend, so a real enquiry is never
        # silently dropped without the sender knowing.
        raise HTTPException(
            status_code=503,
            detail="Inquiry delivery is not configured. Please call or email instead.",
        )

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                url,
                json={
                    "chat_id": TELEGRAM_CHAT_ID,
                    "text": _format(payload),
                    "parse_mode": "Markdown",
                },
            )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not deliver the inquiry. Please try again shortly.",
        ) from exc

    return {"status": "ok"}
