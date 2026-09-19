import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import ContactSubmission

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
async def submit_contact(payload: ContactMessage, db: Session = Depends(get_db)):
    """
    Stores an inquiry, then tries to announce it on Telegram.

    The store comes first and is the only thing that can fail the request.
    This used to relay to Telegram and nothing else, so an unset bot token
    returned 503 and the inquiry was gone -- and the admin panel's Inquiries
    page, which has a table waiting for exactly these rows, stayed empty
    however many people wrote in.
    """
    row = ContactSubmission(
        name=payload.name,
        email=payload.email or None,
        phone=payload.phone or None,
        temple_type=payload.temple_type or None,
        message=payload.message or None,
    )
    db.add(row)
    db.commit()

    if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID:
        # Best effort. The inquiry is already saved, so a Telegram outage must
        # not be reported to the visitor as a failure to send.
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
        except httpx.HTTPError as exc:  # noqa: BLE001 - logged, not surfaced
            print(f"WARNING: inquiry {row.id} saved but not relayed to Telegram: {exc}")

    return {"status": "ok", "id": row.id}
