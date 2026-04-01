from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Temple(Base):
    __tablename__ = "temples"

    id = Column(Integer, primary_key=True, index=True)
    name_en = Column(String, index=True)
    name_gu = Column(String)
    name_hi = Column(String)
    
    description_en = Column(Text)
    description_gu = Column(Text)
    description_hi = Column(Text)
    
    city = Column(String)
    state = Column(String)
    location = Column(String) # Blueprint Step 10 specific field
    year = Column(String)
    
    is_featured = Column(Boolean, default=False)
    is_milestone = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    images = relationship("TempleImage", back_populates="temple", cascade="all, delete-orphan")

class TempleImage(Base):
    __tablename__ = "temple_images"

    id = Column(Integer, primary_key=True, index=True)
    temple_id = Column(Integer, ForeignKey("temples.id"))
    url = Column(String)
    is_cutout = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    temple = relationship("Temple", back_populates="images")

class ContactSubmission(Base):
    __tablename__ = "contact_submissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    phone = Column(String)
    temple_type = Column(String)
    message = Column(Text)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

class LineageMember(Base):
    __tablename__ = "lineage_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    role = Column(String)
    description = Column(Text)
    image_url = Column(String)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())