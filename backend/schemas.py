from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- TEMPLE SCHEMAS ---
class TempleBase(BaseModel):
    name_en: str
    name_gu: Optional[str] = None
    name_hi: Optional[str] = None
    
    description_en: Optional[str] = None
    description_gu: Optional[str] = None
    description_hi: Optional[str] = None
    
    city: Optional[str] = None
    state: Optional[str] = None
    location: Optional[str] = None # Added
    year: Optional[str] = None
    
    is_featured: bool = False
    is_milestone: bool = False
    order_index: int = 0

class TempleImageOut(BaseModel):
    id: int
    url: str
    is_cutout: bool
    
    class Config:
        from_attributes = True

class TempleOut(TempleBase):
    id: int
    # Computed localized fields for frontend convenience
    name: Optional[str] = None
    description: Optional[str] = None
    
    images: List[TempleImageOut] = []
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- CONTACT SCHEMAS ---
class ContactIn(BaseModel):
    name: str
    email: str
    temple_type: Optional[str] = None
    message: str

class ContactOut(BaseModel):
    id: int
    name: str
    email: str
    temple_type: Optional[str] = None
    message: str
    submitted_at: Optional[datetime] = None # Matches model

    class Config:
        from_attributes = True
