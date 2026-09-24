"""Backfill temple city, state, coordinates, category, stone type and status
from data/project-coordinates.csv.

Additive by design: a blank cell is skipped, never written as NULL, so the CSV
can be filled in a few rows at a time and imported repeatedly. Nothing is
deleted and no row is created — the CSV matches existing temples by id.

Dry run (default):
    backend/venv/Scripts/python.exe tools/import_project_data.py

Apply:
    backend/venv/Scripts/python.exe tools/import_project_data.py --apply
"""
import csv
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

CSV_PATH = ROOT / "data" / "project-coordinates.csv"

# Only these are written. `name` is in the CSV so a human can see which row
# they are editing; overwriting a name from a spreadsheet is not worth the risk
# of a typo silently renaming a temple.
FLOAT_FIELDS = ("latitude", "longitude")
TEXT_FIELDS = ("city", "state", "category", "stone_type", "status")

VALID_CATEGORY = {"mountain", "stone"}
VALID_STATUS = {"completed", "in_progress", "planned"}


def parse_row(row, line_no):
    """Return (id, {column: value}) for the non-blank cells, or raise."""
    try:
        temple_id = int(row["id"])
    except (KeyError, TypeError, ValueError):
        raise ValueError(f"line {line_no}: 'id' must be a whole number, got {row.get('id')!r}")

    changes = {}

    for field in TEXT_FIELDS:
        value = (row.get(field) or "").strip()
        if not value:
            continue
        if field == "category" and value not in VALID_CATEGORY:
            raise ValueError(
                f"line {line_no}: category {value!r} must be one of {sorted(VALID_CATEGORY)}"
            )
        if field == "status" and value not in VALID_STATUS:
            raise ValueError(
                f"line {line_no}: status {value!r} must be one of {sorted(VALID_STATUS)}"
            )
        changes[field] = value

    for field in FLOAT_FIELDS:
        raw = (row.get(field) or "").strip()
        if not raw:
            continue
        try:
            value = float(raw)
        except ValueError:
            raise ValueError(f"line {line_no}: {field} {raw!r} is not a number")
        # India spans roughly 6-38 N and 68-98 E. A swapped pair is the easy
        # mistake to make when copying from Google Maps, and it would silently
        # drop the marker into the ocean rather than fail.
        if field == "latitude" and not 6 <= value <= 38:
            raise ValueError(
                f"line {line_no}: latitude {value} is outside India (6 to 38). "
                "Latitude and longitude may be the wrong way round."
            )
        if field == "longitude" and not 68 <= value <= 98:
            raise ValueError(
                f"line {line_no}: longitude {value} is outside India (68 to 98). "
                "Latitude and longitude may be the wrong way round."
            )
        changes[field] = value

    # Coordinates are only useful as a pair; one alone puts nothing on a map.
    has_lat = "latitude" in changes
    has_lng = "longitude" in changes
    if has_lat != has_lng:
        missing = "longitude" if has_lat else "latitude"
        raise ValueError(f"line {line_no}: {missing} is missing, so the pair is unusable")

    return temple_id, changes


def main():
    apply = "--apply" in sys.argv

    if not CSV_PATH.exists():
        sys.exit(f"Not found: {CSV_PATH}")

    with CSV_PATH.open(newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))

    parsed, problems = [], []
    for i, row in enumerate(rows, start=2):  # start=2: line 1 is the header
        try:
            temple_id, changes = parse_row(row, i)
        except ValueError as exc:
            problems.append(str(exc))
            continue
        if changes:
            parsed.append((temple_id, row.get("name", ""), changes))

    if problems:
        print("Nothing was imported. Fix these first:\n")
        for p in problems:
            print(f"  - {p}")
        sys.exit(1)

    if not parsed:
        print("Every row is blank, so there is nothing to import yet.")
        print(f"Fill in {CSV_PATH.relative_to(ROOT)} and run this again.")
        return

    print(f"{len(parsed)} of {len(rows)} rows have something to write:\n")
    for temple_id, name, changes in parsed:
        summary = ", ".join(f"{k}={v}" for k, v in sorted(changes.items()))
        print(f"  #{temple_id:<3} {name:<24} {summary}")

    if not apply:
        print("\nDry run. Re-run with --apply to write these to the database.")
        return

    from dotenv import load_dotenv
    load_dotenv(ROOT / "backend" / ".env")
    if not os.getenv("DATABASE_URL"):
        sys.exit("DATABASE_URL is not set. Add it to backend/.env.")

    from backend.database import SessionLocal
    from backend.models import TempleProject

    db = SessionLocal()
    try:
        written, missing = 0, []
        for temple_id, name, changes in parsed:
            temple = db.get(TempleProject, temple_id)
            if temple is None:
                missing.append(f"#{temple_id} {name}")
                continue
            for column, value in changes.items():
                setattr(temple, column, value)
            written += 1
        db.commit()
    finally:
        db.close()

    print(f"\nWrote {written} rows.")
    if missing:
        print("These ids are not in the database and were skipped:")
        for m in missing:
            print(f"  - {m}")


if __name__ == "__main__":
    main()
