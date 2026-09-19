from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

SUPPORTED_LANGS = ("en", "gu", "hi")


def _localised(row, field: str, lang: str) -> str:
    """
    Return `field` in `lang`, falling back to English then to any populated
    translation, so a partially translated row still renders something.
    """
    lang = lang if lang in SUPPORTED_LANGS else "en"
    for candidate in (lang, "en", *SUPPORTED_LANGS):
        value = getattr(row, f"{field}_{candidate}", None)
        if value:
            return value
    return ""


class LineageMember(Base):
    __tablename__ = "lineage_members"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    rank = Column(Integer, default=1)
    # The site used to hand out numbers from a hardcoded list by list
    # position, so the card showed whichever number happened to land on that
    # index. The number belongs to the person, so it is stored with them.
    phone = Column(String, nullable=True)

    def __str__(self):
        return f"{self.rank}. {self.name}"


class TempleProject(Base):
    __tablename__ = "temples"
    id = Column(Integer, primary_key=True, index=True)

    name_en = Column(String, nullable=True)
    name_gu = Column(String, nullable=True)
    name_hi = Column(String, nullable=True)

    description_en = Column(Text, nullable=True)
    description_gu = Column(Text, nullable=True)
    description_hi = Column(Text, nullable=True)

    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    location = Column(String, nullable=True)
    year = Column(String, nullable=True)

    is_featured = Column(Boolean, default=False)
    is_milestone = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)

    images = relationship(
        "TempleImage",
        back_populates="temple",
        cascade="all, delete-orphan",
        order_by="TempleImage.order_index",
    )

    def name(self, lang: str = "en") -> str:
        return _localised(self, "name", lang)

    def description(self, lang: str = "en") -> str:
        return _localised(self, "description", lang)

    @property
    def cover_image(self):
        """First non-cutout image, used as the card background."""
        for image in self.images:
            if not image.is_cutout:
                return image.url
        return self.images[0].url if self.images else None

    @property
    def cutout_image(self):
        """Transparent cutout, layered in front of the card background."""
        for image in self.images:
            if image.is_cutout:
                return image.url
        return None

    def __str__(self):
        return self.name_en or self.name_gu or self.name_hi or f"Temple {self.id}"


class TempleImage(Base):
    __tablename__ = "temple_images"
    id = Column(Integer, primary_key=True, index=True)
    temple_id = Column(Integer, ForeignKey("temples.id", ondelete="CASCADE"), nullable=True)
    url = Column(String, nullable=True)
    is_cutout = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    temple = relationship("TempleProject", back_populates="images")

    def __str__(self):
        # Only columns already loaded on this row. Reaching through .temple
        # lazy loads, and the admin renders its templates after the session
        # has closed, so that raised DetachedInstanceError and 500'd the
        # temple list and every page that embeds an image label.
        kind = "Cutout" if self.is_cutout else "Image"
        return f"{kind} #{self.id}" if self.temple_id else f"{kind} (unassigned)"


class DashboardGallery(Base):
    __tablename__ = "dashboard_galleries"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    main_image = Column(String, nullable=True)

    images = relationship(
        "GalleryImage", back_populates="gallery", cascade="all, delete-orphan"
    )

    def __str__(self):
        return self.title


class GalleryImage(Base):
    __tablename__ = "gallery_images"
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=False)
    temple_id = Column(Integer, ForeignKey("temples.id", ondelete="CASCADE"), nullable=True)
    gallery_id = Column(
        Integer, ForeignKey("dashboard_galleries.id", ondelete="CASCADE"), nullable=True
    )

    gallery = relationship("DashboardGallery", back_populates="images")

    def __str__(self):
        # Same reason as TempleImage.__str__: no relationship traversal here.
        if self.gallery_id is not None:
            return f"Gallery Image #{self.id}"
        return "Unassigned Image"


class ContactSubmission(Base):
    __tablename__ = "contact_submissions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    temple_type = Column(String, nullable=True)
    message = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    def __str__(self):
        return f"{self.name or 'Anonymous'} ({self.submitted_at:%Y-%m-%d})"
