"""
Check /health/db on both paths: a reachable database and a dead one.

The dead-database case is the one that matters. This endpoint exists so an
uptime monitor can tell the difference, so a version that answered 200 while
the database was unreachable would keep the site's own monitoring quiet during
an outage -- worse than having no endpoint at all.

Run directly (`python backend/tests/test_health.py`) as well as under pytest,
so the check needs no test runner installed.
"""
import os
import pathlib
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))

# A file-backed SQLite database, not ":memory:". In-memory gives every
# connection its own empty database, so the app and the test would not share
# one and the table would appear to be missing.
TMPDB = str(pathlib.Path(tempfile.gettempdir(), "pk_health_test.sqlite")).replace("\\", "/")
pathlib.Path(TMPDB).unlink(missing_ok=True)

os.environ.setdefault("SESSION_SECRET", "test-only-not-a-real-secret")
os.environ.setdefault("ADMIN_USERNAME", "t")
os.environ.setdefault("ADMIN_PASSWORD_HASH", "x")

from fastapi.testclient import TestClient
from sqlalchemy import create_engine

import backend.main as m

client = TestClient(m.app)

# --- 1. Reachable ---------------------------------------------------------
m.engine = create_engine(
    "sqlite+pysqlite:///" + TMPDB, connect_args={"check_same_thread": False}
)

r = client.get("/health/db")
assert r.status_code == 200, f"expected 200 on a reachable database, got {r.status_code}"
body = r.json()
assert body == {"ok": True, "database": "reachable"}, body

# --- 2. Unreachable -------------------------------------------------------
# A directory that does not exist, so opening the file fails rather than
# SQLite helpfully creating one.
m.engine = create_engine("sqlite+pysqlite:////nonexistent-dir/nope.sqlite")

r = client.get("/health/db")
assert r.status_code == 503, (
    f"expected 503 when the database is unreachable, got {r.status_code}. "
    "A 200 here would keep an uptime monitor silent through an outage."
)
body = r.json()
assert body["ok"] is False, body

# The reason goes to the logs, never the body: a SQLAlchemy connection error
# can quote the DSN, which carries the database password.
flat = str(body).lower()
for leak in ("nonexistent-dir", "password", "sqlite+pysqlite", "traceback"):
    assert leak not in flat, f"/health/db leaked {leak!r} in its response body: {body}"

# --- 3. Still the plain root for Render's health check --------------------
# render.yaml points healthCheckPath at "/", deliberately not at this endpoint.
# If "/" ever started touching the database, a pooler blip would restart the
# service and cost the next visitor a cold start.
r = client.get("/")
assert r.status_code == 200, r.status_code
assert r.json() == {"message": "PK Sompura Backend API is running"}, r.json()

print("test_health.py OK - 200 when reachable, 503 when not, no DSN in the body")
