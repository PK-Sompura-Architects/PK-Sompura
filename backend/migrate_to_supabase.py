"""
One-off migration: copy the local SQLite data into Supabase Postgres.

Usage (from the repo root, with backend/venv active):

    python -m backend.migrate_to_supabase --check
    python -m backend.migrate_to_supabase

`--check` connects to both databases and reports row counts without writing
anything. Run it first.

Requires DATABASE_URL in backend/.env to point at Supabase Postgres. The
SQLite file is read directly and is never modified.
"""

import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from backend.models import (
    Base,
    LineageMember,
    TempleProject,
    DashboardGallery,
    GalleryImage,
)

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

SQLITE_URL = os.getenv("SQLITE_SOURCE_URL", "sqlite:///./pk_sompura.db")
TARGET_URL = os.getenv("DATABASE_URL", "")

# Parents before children: GalleryImage carries FKs to both other tables.
ORDER = [LineageMember, TempleProject, DashboardGallery, GalleryImage]


def _columns(model):
    return [c.name for c in model.__table__.columns]


def _row_to_dict(obj, model):
    return {c: getattr(obj, c) for c in _columns(model)}


def reset_sequences(engine):
    """
    Rows are copied with their original ids, which leaves Postgres identity
    sequences at 1. Without this the next insert from the admin panel fails
    with a duplicate key error.
    """
    with engine.begin() as conn:
        for model in ORDER:
            table = model.__table__.name
            conn.execute(text(f"""
                SELECT setval(
                    pg_get_serial_sequence('{table}', 'id'),
                    COALESCE((SELECT MAX(id) FROM {table}), 1),
                    (SELECT MAX(id) IS NOT NULL FROM {table})
                )
            """))
            print(f"  sequence reset: {table}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true",
                        help="Report row counts and exit without writing.")
    parser.add_argument("--force", action="store_true",
                        help="Copy even if the target tables already hold rows.")
    args = parser.parse_args()

    if not TARGET_URL or TARGET_URL.startswith("sqlite"):
        sys.exit(
            "DATABASE_URL is unset or still points at SQLite.\n"
            "Set it to the Supabase Postgres connection string in backend/.env "
            "before running this."
        )

    src_engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
    dst_engine = create_engine(TARGET_URL, pool_pre_ping=True)

    SrcSession = sessionmaker(bind=src_engine)
    DstSession = sessionmaker(bind=dst_engine)

    print(f"source: {SQLITE_URL}")
    print(f"target: {TARGET_URL.split('@')[-1] if '@' in TARGET_URL else TARGET_URL}\n")

    Base.metadata.create_all(bind=dst_engine)

    src, dst = SrcSession(), DstSession()
    try:
        counts = {}
        for model in ORDER:
            counts[model.__name__] = (
                src.query(model).count(),
                dst.query(model).count(),
            )

        print(f"{'table':22} {'source':>8} {'target':>8}")
        print("-" * 40)
        for name, (s, d) in counts.items():
            print(f"{name:22} {s:8} {d:8}")
        print()

        if args.check:
            print("--check only, nothing written.")
            return

        occupied = [n for n, (_, d) in counts.items() if d > 0]
        if occupied and not args.force:
            sys.exit(
                f"Target already has rows in: {', '.join(occupied)}.\n"
                "Refusing to copy so existing data is not duplicated. "
                "Re-run with --force only if you are sure."
            )

        for model in ORDER:
            rows = src.query(model).all()
            for obj in rows:
                dst.merge(model(**_row_to_dict(obj, model)))
            dst.commit()
            print(f"  copied {len(rows):4} -> {model.__table__.name}")

        print()
        reset_sequences(dst_engine)
        print("\nDone.")
    finally:
        src.close()
        dst.close()


if __name__ == "__main__":
    main()
