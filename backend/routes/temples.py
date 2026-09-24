from fastapi import APIRouter, Depends, Query, Response
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
        # The Projects page filters the grid and the map from one control, so
        # the list payload needs the same fields the map endpoint returns.
        "category": project.category,
        "status": project.status or "completed",
        "stone_type": project.stone_type,
        "cover_image": project.cover_image,
        "cutout_image": project.cutout_image,
        "images": [img.url for img in project.images],
    }


@router.get("")
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



# Projects without coordinates are excluded here on purpose: they are still
# returned by the list endpoint above, so they keep their gallery card and
# still count towards the project total. They simply have nowhere to sit on a
# map. See TODO.md item 2 -- several exist only to be counted.
@router.get("/map")
@router.get("/map/")
def get_map_projects(response: Response, db: Session = Depends(get_db)):
    """
    The lean payload the India map needs, and nothing else.

    Deliberately not `_serialise`: that carries every image URL and both
    description bodies, which for ~40 markers is a large response to send so a
    map can draw dots. Descriptions and image lists are fetched per project
    when a marker is actually opened.
    """
    projects = (
        db.query(TempleProject)
        .filter(
            TempleProject.latitude.isnot(None),
            TempleProject.longitude.isnot(None),
        )
        .order_by(TempleProject.order_index, TempleProject.id)
        .all()
    )

    # The marker set changes only when the admin edits a temple, so a short
    # shared cache is safe and spares the free-tier backend a query per visit.
    response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=3600"

    return {
        "projects": [
            {
                "id": p.id,
                "name": p.name("en"),
                "city": p.city,
                "state": p.state,
                "lat": p.latitude,
                "lng": p.longitude,
                "category": p.category,
                "status": p.status or "completed",
                "stone_type": p.stone_type,
                # There is no thumbnail pipeline yet, so this is the full-size
                # cover image. Do not render it at marker size -- the detail
                # panel is the only place it belongs until a `cover_thumb`
                # variant actually exists. Tracked in TODO.md.
                "cover_image": p.cover_image,
            }
            for p in projects
        ],
    }
