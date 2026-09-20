"""Smoke-check the /api/projects/map endpoint against a throwaway SQLite DB."""
import os
import pathlib
import sys

# Run directly (`python backend/tests/test_map.py`) as well as under pytest,
# so the check needs no test runner installed.
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
import tempfile
TMPDB = str(pathlib.Path(tempfile.gettempdir(), "pk_map_test.sqlite")).replace("\\", "/")
pathlib.Path(TMPDB).unlink(missing_ok=True)
os.environ.setdefault("SESSION_SECRET", "test-only-not-a-real-secret")
os.environ.setdefault("ADMIN_USERNAME", "t")
os.environ.setdefault("ADMIN_PASSWORD_HASH", "x")

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.models import Base, TempleProject
from backend.database import get_db
import backend.main as m

engine = create_engine("sqlite+pysqlite:///" + TMPDB, connect_args={"check_same_thread": False})
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)

s = Session()
s.add_all([
    TempleProject(name_en="Vaishno Devi Ahmedabad", city="Ahmedabad", state="Gujarat",
                  latitude=23.0225, longitude=72.5714, category="mountain",
                  stone_type="Sandstone", status="completed", order_index=1),
    TempleProject(name_en="Hastgiri", city="Palitana", state="Gujarat",
                  latitude=21.5222, longitude=71.8219, category="stone",
                  status="in_progress", order_index=2),
    TempleProject(name_en="No coordinates yet", city="Somewhere", state="Gujarat",
                  order_index=3),
])
s.commit(); s.close()

def _override():
    db = Session()
    try:
        yield db
    finally:
        db.close()
m.app.dependency_overrides[get_db] = _override

c = TestClient(m.app)

for path in ("/api/projects/map", "/api/projects/map/"):
    r = c.get(path)
    assert r.status_code == 200, (path, r.status_code)
    rows = r.json()["projects"]
    assert len(rows) == 2, f"{path}: expected the uncoordinated row to be excluded, got {len(rows)}"
    assert r.headers["cache-control"] == "public, max-age=300, stale-while-revalidate=3600"
    print(f"{path} -> 200, {len(rows)} markers, cached")

first = c.get("/api/projects/map").json()["projects"][0]
assert set(first) == {"id","name","city","state","lat","lng","category","status","stone_type","cover_image"}, first
assert first["name"] == "Vaishno Devi Ahmedabad" and first["lat"] == 23.0225
assert first["category"] == "mountain" and first["status"] == "completed"
print("payload keys and values correct:", first)

# The uncoordinated project must still appear in the gallery list.
all_rows = c.get("/api/projects/").json()["projects"]
assert len(all_rows) == 3, f"list endpoint should still return all 3, got {len(all_rows)}"
assert any(p["name"] == "No coordinates yet" for p in all_rows)
print("list endpoint still returns all 3, including the uncoordinated one")
print("OK")
