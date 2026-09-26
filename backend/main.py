from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqladmin import Admin
from starlette.middleware.sessions import SessionMiddleware

import os

from backend.database import engine
from backend.models import Base
from backend.routes import temples, lineage, galleries, contact
from backend.admin import (
    authentication_backend,
    SESSION_SECRET,
    LineageMemberAdmin,
    TempleProjectAdmin,
    TempleImageAdmin,
    DashboardGalleryAdmin,
    GalleryImageAdmin,
    ContactSubmissionAdmin,
)

app = FastAPI(title="PK Sompura API")


@app.on_event("startup")
def ensure_schema() -> None:
    """
    Create any missing tables, without letting a database problem stop the
    process from starting.

    This used to run at import time, which meant an unreachable database
    prevented the app from booting at all — so the health check failed too and
    the host could only report the service as down, never why.
    """
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:  # noqa: BLE001 - startup must not be fatal
        print(f"WARNING: could not verify the database schema at startup: {exc}")
        return

    # create_all only creates missing *tables*, never missing columns, so a
    # model that grows a field on an existing table needs this. Additive and
    # idempotent: every statement is ADD COLUMN IF NOT EXISTS, so it is safe
    # to run on every boot and never drops or rewrites anything. A column
    # removal would need a real migration and a deliberate decision.
    additions = [
        ("temples", "latitude", "DOUBLE PRECISION"),
        ("temples", "longitude", "DOUBLE PRECISION"),
        ("temples", "category", "VARCHAR"),
        ("temples", "stone_type", "VARCHAR"),
        ("temples", "status", "VARCHAR"),
    ]
    try:
        with engine.begin() as conn:
            for table, column, ddl_type in additions:
                conn.execute(
                    text(f'ALTER TABLE {table} ADD COLUMN IF NOT EXISTS "{column}" {ddl_type}')
                )
            # Existing rows are all finished temples; without this they would
            # read as NULL and be filtered out by a status filter.
            conn.execute(
                text("UPDATE temples SET status = 'completed' WHERE status IS NULL")
            )
    except Exception as exc:  # noqa: BLE001 - startup must not be fatal
        print(f"WARNING: could not apply additive column migrations: {exc}")

# Browsers reject "*" together with credentials, so the previous config
# silently broke every credentialed cross-origin request. Set
# ALLOWED_ORIGINS to a comma-separated list of deployed front-end origins.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    https_only=os.getenv("SESSION_HTTPS_ONLY", "false").lower() == "true",
    same_site="lax",
)

app.include_router(lineage.router, prefix="/api/lineage", tags=["Lineage"])
app.include_router(temples.router, prefix="/api/projects", tags=["Projects"])
app.include_router(galleries.router, prefix="/api/galleries", tags=["Galleries"])
app.include_router(contact.router, prefix="/api/contact", tags=["Contact"])

admin = Admin(app, engine, title="PK Sompura Admin", authentication_backend=authentication_backend)
admin.add_view(LineageMemberAdmin)
admin.add_view(TempleProjectAdmin)
admin.add_view(TempleImageAdmin)
admin.add_view(DashboardGalleryAdmin)
admin.add_view(GalleryImageAdmin)
admin.add_view(ContactSubmissionAdmin)

@app.get("/")
def read_root(): return {"message": "PK Sompura Backend API is running"}


@app.get("/health/db")
def health_db(response: Response):
    """
    One ping that keeps both free tiers alive.

    Render stops a free web service after 15 minutes without traffic, and
    Supabase pauses a free project after roughly 7 days without database
    activity. These are two different timers and "/" only resets the first: it
    returns a hardcoded string and never opens a connection.

    So an external monitor hitting "/" every 10 minutes keeps the API warm
    while Supabase quietly counts down to a pause that takes the whole site
    off the air until someone restores it by hand. Reaching the REST endpoint
    is not enough either -- it takes a real query.

    This runs one, so a single scheduled request resets both timers. That is
    the whole reason it exists; it is not a general health check.

    503 rather than a 200 with an error body, so an uptime monitor treats a
    dead database as a failure and actually sends the alert.

    Deliberately NOT render.yaml's healthCheckPath, which stays "/". If Render
    health-checked this, a momentary pooler blip would restart the service --
    turning a self-healing hiccup into a cold start for the next visitor.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001 - the reason is for our logs only
        print(f"WARNING: /health/db could not reach the database: {exc}")
        response.status_code = 503
        # No exception detail in the body: it can carry the connection string.
        return {"ok": False, "database": "unreachable"}

    return {"ok": True, "database": "reachable"}
