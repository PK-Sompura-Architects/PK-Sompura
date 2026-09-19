from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import DashboardGallery

router = APIRouter()

@router.get("")
@router.get("/")
def get_galleries(db: Session = Depends(get_db)):
    galleries = db.query(DashboardGallery).all()
    return {
        "galleries": [
            {
                "id": g.id,
                "title": g.title,
                "main_image": g.main_image,
                "images": [img.url for img in g.images]
            }
            for g in galleries
        ]
    }