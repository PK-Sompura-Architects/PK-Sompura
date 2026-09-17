"""
Supabase REST API client helper.
Uses the project's anon key to call PostgREST endpoints directly,
so we don't need a Postgres password.
"""
import os
from pathlib import Path
from dotenv import load_dotenv
import httpx

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

def _headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }

def supabase_get(table: str, params: dict = None) -> list:
    """Fetch rows from a Supabase table via PostgREST."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    response = httpx.get(url, headers=_headers(), params=params or {}, timeout=10)
    response.raise_for_status()
    return response.json()
