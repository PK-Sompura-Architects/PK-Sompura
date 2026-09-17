from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import TempleProject, SUPPORTED_LANGS

router = APIRouter()


def _serialise(project: TempleProject, lang: str) -> dict:
    return {
        "id": project.id,
        "name": project.name(lang),
        "description": project.description(lang),
        "city": project.city,
        "state": project.state,
        "location": project.location,
        "year": project.year,
        "is_featured": bool(project.is_featured),
        "is_milestone": bool(project.is_milestone),
        "cover_image": project.cover_image,
        "cutout_image": project.cutout_image,
        "images": [img.url for img in project.images],
    }


@router.get("/")
def get_projects(
    lang: str = Query("en", pattern="^(en|gu|hi)$"),
    featured: bool | None = None,
    db: Session = Depends(get_db),
):
    """
    Temple projects in the requested language.

    Text is resolved server-side rather than shipping all three translations,
    so the payload does not triple for content the visitor will not read.
    """
    query = db.query(TempleProject)
    if featured is not None:
        query = query.filter(TempleProject.is_featured.is_(featured))

    projects = query.order_by(
        TempleProject.order_index, TempleProject.id
    ).all()

    return {
        "lang": lang,
        "projects": [_serialise(p, lang) for p in projects],
    }


@router.get("/milestones")
def get_milestones(
    lang: str = Query("en", pattern="^(en|gu|hi)$"),
    db: Session = Depends(get_db),
):
    projects = (
        db.query(TempleProject)
        .filter(TempleProject.is_milestone.is_(True))
        .order_by(TempleProject.order_index, TempleProject.id)
        .all()
    )
    return {"lang": lang, "projects": [_serialise(p, lang) for p in projects]}


@router.get("/languages")
def get_languages():
    return {"languages": list(SUPPORTED_LANGS)}
