from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import TempleProject

router = APIRouter()

@router.get("/")
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(TempleProject).all()
    return {
        "projects": [
            {
                "id": p.id,
                "name": p.name,
                "trust_name": p.trust_name,
                "status": p.status,
                "city": p.city,
                "main_image": p.main_image,
                "other_images": [img.url for img in p.other_images]
            }
            for p in projects
        ]
    }
