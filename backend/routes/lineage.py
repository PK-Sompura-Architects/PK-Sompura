from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import LineageMember

router = APIRouter()

@router.get("/")
def get_lineage(db: Session = Depends(get_db)):
    members = db.query(LineageMember).order_by(LineageMember.order_index).all()
    # Convert SQLAlchemy objects to dicts manually or use Pydantic
    return [{"id": m.id, "name": m.name, "role": m.role, "description": m.description, "image_url": m.image_url} for m in members]