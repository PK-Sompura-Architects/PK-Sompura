from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import LineageMember

router = APIRouter()

@router.get("/")
def get_lineage(db: Session = Depends(get_db)):
    members = db.query(LineageMember).order_by(LineageMember.rank).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "role": m.role,
            "image_url": m.image_url,
            "rank": m.rank
        }
        for m in members
    ]
