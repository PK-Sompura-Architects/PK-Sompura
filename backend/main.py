"""
PK Sompura — FastAPI Backend
Main application with CORS, routers, database initialization, and Admin
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqladmin import Admin
from backend.routes import temples, contact, upload, lineage
from backend.database import engine
from backend.models import Base
from backend.admin import authentication_backend, TempleAdmin, TempleImageAdmin, ContactSubmissionAdmin
from backend.admin import LineageMemberAdmin

# Create database tables on startup
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="PK Sompura API",
    description="Backend API for the PK Sompura Temple Architecture Legacy website",
    version="1.0.0",
)

# CORS — allow frontend origin
origins = [
    "http://localhost:5173",    # Vite dev server
    "http://localhost:3000",    # Alternative dev port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Step 1: Add SessionMiddleware (CRITICAL for Admin)
# Added last to run FIRST in the request chain
from starlette.middleware.sessions import SessionMiddleware
app.add_middleware(
    SessionMiddleware, 
    secret_key="pk_sompura_secure_secret_key_change_this_in_production",
    https_only=False
)


# Include routers with prefixes (Step 2)
app.include_router(temples.router, prefix="/temples", tags=["Temples"])
app.include_router(contact.router, prefix="/contact", tags=["Contact"])
app.include_router(upload.router, prefix="/upload", tags=["Upload"])
app.include_router(lineage.router, prefix="/lineage", tags=["Lineage"])

# Admin Interface with Authentication (Step 9 & 12)
admin = Admin(app, engine, title="PK Sompura Admin", authentication_backend=authentication_backend)
admin.add_view(TempleAdmin)
admin.add_view(TempleImageAdmin)
admin.add_view(ContactSubmissionAdmin)
admin.add_view(LineageMemberAdmin)

@app.get("/")
def read_root():
    return {"message": "PK Sompura Backend API"}
