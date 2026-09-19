import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load backend/.env explicitly, as admin.py and supabase_client.py do. A bare
# load_dotenv() resolves against the working directory, so running from the
# repo root missed this file and silently fell back to SQLite.
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

# The SQLite fallback is a local-development convenience only. On a hosted
# deploy it is a trap: SQLAlchemy happily creates an empty file, create_all
# builds empty tables, and every endpoint answers 200 with an empty list. The
# deploy looks perfectly healthy while the site shows nothing at all. Render
# sets RENDER=true, so fail loudly there instead of serving an empty site.
if not DATABASE_URL:
    if os.getenv("RENDER") or os.getenv("PORT"):
        raise RuntimeError(
            "DATABASE_URL is not set. Refusing to fall back to SQLite on a "
            "hosted deploy, which would serve an empty site. Set it in the "
            "Render dashboard under Environment."
        )
    DATABASE_URL = "sqlite:///./pk_sompura.db"

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Supabase sits behind a pooler and drops idle connections, so verify a
    # connection before handing it out and recycle well inside that timeout.
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=280)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
