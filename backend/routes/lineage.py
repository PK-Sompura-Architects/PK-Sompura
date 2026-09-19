from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import LineageMember

router = APIRouter()

# Both paths, so a caller that omits the trailing slash is answered
# rather than 307-redirected. Behind the Netlify proxy that redirect
# pointed at the Render host, taking the browser cross-origin.
@router.get("")
@router.get("/")
def get_lineage(db: Session = Depends(get_db)):
    members = db.query(LineageMember).order_by(LineageMember.rank).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "role": m.role,
            "image_url": m.image_url,
            "rank": m.rank,
            "phone": m.phone,
        }
        for m in members
    ]
