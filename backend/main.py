from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqladmin import Admin
from starlette.middleware.sessions import SessionMiddleware

from backend.database import engine
from backend.models import Base
from backend.routes import temples, lineage, galleries 
from backend.admin import (
    authentication_backend, 
    LineageMemberAdmin, 
    TempleProjectAdmin, 
    DashboardGalleryAdmin, 
    GalleryImageAdmin
)

Base.metadata.create_all(bind=engine)
app = FastAPI(title="PK Sompura API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins temporarily for easy deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware, 
    secret_key="pk_sompura_secure_secret_key",
    https_only=False
)

app.include_router(lineage.router, prefix="/lineage", tags=["Lineage"])
app.include_router(temples.router, prefix="/projects", tags=["Projects"])
app.include_router(galleries.router, prefix="/galleries", tags=["Galleries"])

admin = Admin(app, engine, title="PK Sompura Admin", authentication_backend=authentication_backend)
admin.add_view(LineageMemberAdmin)
admin.add_view(TempleProjectAdmin)
admin.add_view(DashboardGalleryAdmin)
admin.add_view(GalleryImageAdmin)

@app.get("/")
def read_root(): return {"message": "PK Sompura Backend API is running"}
