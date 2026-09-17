from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    DashboardGalleryAdmin,
    GalleryImageAdmin
)

Base.metadata.create_all(bind=engine)
app = FastAPI(title="PK Sompura API")

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

app.include_router(lineage.router, prefix="/lineage", tags=["Lineage"])
app.include_router(temples.router, prefix="/projects", tags=["Projects"])
app.include_router(galleries.router, prefix="/galleries", tags=["Galleries"])
app.include_router(contact.router, prefix="/contact", tags=["Contact"])

admin = Admin(app, engine, title="PK Sompura Admin", authentication_backend=authentication_backend)
admin.add_view(LineageMemberAdmin)
admin.add_view(TempleProjectAdmin)
admin.add_view(DashboardGalleryAdmin)
admin.add_view(GalleryImageAdmin)

@app.get("/")
def read_root(): return {"message": "PK Sompura Backend API is running"}
