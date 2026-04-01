from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ContactSubmission
from ..schemas import ContactIn, ContactOut

router = APIRouter()

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def submit_contact_form(submission: ContactIn, db: Session = Depends(get_db)):
    try:
        new_submission = ContactSubmission(
            name=submission.name,
            email=submission.email,
            temple_type=submission.temple_type,
            message=submission.message
        )
        db.add(new_submission)
        db.commit()
        db.refresh(new_submission)
        return {"message": "Inquiry received successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
