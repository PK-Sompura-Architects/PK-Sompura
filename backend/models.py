from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class LineageMember(Base):
    __tablename__ = "lineage_members"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    rank = Column(Integer, default=1)

    def __str__(self): return f"{self.rank}. {self.name}"

class TempleProject(Base):
    __tablename__ = "temples"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    trust_name = Column(String, nullable=True)
    status = Column(String, default="Completed")
    city = Column(String, nullable=True)
    main_image = Column(String, nullable=True)
    other_images = relationship("GalleryImage", back_populates="temple", cascade="all, delete-orphan")

    def __str__(self): return f"{self.name} ({self.status})"

class DashboardGallery(Base):
    __tablename__ = "dashboard_galleries"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    main_image = Column(String, nullable=True)
    images = relationship("GalleryImage", back_populates="gallery", cascade="all, delete-orphan")

    def __str__(self): return self.title

class GalleryImage(Base):
    __tablename__ = "gallery_images"
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=False)
    temple_id = Column(Integer, ForeignKey("temples.id", ondelete="CASCADE"), nullable=True)
    gallery_id = Column(Integer, ForeignKey("dashboard_galleries.id", ondelete="CASCADE"), nullable=True)
    temple = relationship("TempleProject", back_populates="other_images")
    gallery = relationship("DashboardGallery", back_populates="images")

    def __str__(self):
        if getattr(self, "temple_id", None) is not None:
            return f"Gallery Image -> {self.temple.name if self.temple else 'Temple'}"
        elif getattr(self, "gallery_id", None) is not None:
            return f"Gallery Image -> {self.gallery.title if self.gallery else 'Gallery'}"
        return "Unassigned Image"
