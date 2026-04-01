from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import Temple
from ..schemas import TempleOut

# router prefix is defined in main.py, so we don't add it here
router = APIRouter()

@router.get("/", response_model=dict)
def get_temples(
    lang: str = Query("en", regex="^(en|gu|hi)$"),
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    temples = db.query(Temple).order_by(Temple.order_index).offset(skip).limit(limit).all()
    
    # helper to resolve language
    results = []
    for t in temples:
        t_out = TempleOut.model_validate(t)
        
        # dynamic name/desc resolution
        if lang == 'gu':
            t_out.name = t.name_gu or t.name_en
            t_out.description = t.description_gu or t.description_en
        elif lang == 'hi':
            t_out.name = t.name_hi or t.name_en
            t_out.description = t.description_hi or t.description_en
        else:
            t_out.name = t.name_en
            t_out.description = t.description_en
            
        results.append(t_out)
        
    return {"temples": results}

@router.get("/featured", response_model=List[TempleOut])
def get_featured_temples(
    lang: str = Query("en", regex="^(en|gu|hi)$"),
    db: Session = Depends(get_db)
):
    # Featured can be milestone or explicitly featured
    temples = db.query(Temple).filter((Temple.is_milestone == True) | (Temple.is_featured == True)).order_by(Temple.order_index).all()
    
    results = []
    for t in temples:
        t_out = TempleOut.model_validate(t)
        if lang == 'gu':
            t_out.name = t.name_gu or t.name_en
            t_out.description = t.description_gu or t.description_en
        elif lang == 'hi':
            t_out.name = t.name_hi or t.name_en
            t_out.description = t.description_hi or t.description_en
        else:
            t_out.name = t.name_en
            t_out.description = t.description_en
        results.append(t_out)
        
    return results
