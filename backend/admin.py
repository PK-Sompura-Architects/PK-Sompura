import os
import mimetypes
import re
import secrets
import time
from pathlib import Path
from dotenv import load_dotenv

from sqladmin import ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from wtforms import FileField
from markupsafe import Markup
from supabase import create_client, Client

from backend.models import (
    LineageMember, TempleProject, TempleImage,
    DashboardGallery, GalleryImage, ContactSubmission,
)
from backend.security import verify_password

# --- SUPABASE CONFIGURATION ---
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")

# Storage writes need the service-role key. The anon key is deliberately
# blocked from writing to the image buckets, so uploads with it fail with an
# RLS error. This key never leaves the server.
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_KEY = SUPABASE_SERVICE_KEY or os.getenv("SUPABASE_KEY")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    if not SUPABASE_SERVICE_KEY:
        print(
            "WARNING: SUPABASE_SERVICE_KEY is not set, falling back to "
            "SUPABASE_KEY. If that is the anon key, image uploads will be "
            "rejected by row level security."
        )
else:
    print("WARNING: Supabase credentials missing. Image uploads will fail.")


# --- AUTHENTICATION BACKEND ---
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH")

# Falling back to a default password would put a known credential on a panel
# with full write access to every model, so an unset hash disables login.
if not ADMIN_PASSWORD_HASH:
    print(
        "WARNING: ADMIN_PASSWORD_HASH is not set. The /admin panel will reject "
        "every login. Generate one with: python -m backend.security"
    )

# Throttle repeated failures per client so the panel cannot be brute forced.
MAX_ATTEMPTS = 5
LOCKOUT_SECONDS = 300
_failures: dict[str, list[float]] = {}


def _client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _is_locked(key: str) -> bool:
    now = time.time()
    recent = [t for t in _failures.get(key, []) if now - t < LOCKOUT_SECONDS]
    _failures[key] = recent
    return len(recent) >= MAX_ATTEMPTS


def _record_failure(key: str) -> None:
    _failures.setdefault(key, []).append(time.time())

# Sessions are signed with this. A committed constant lets anyone forge an
# admin cookie, so it comes from the environment; the random fallback keeps
# the app bootable while simply invalidating sessions on restart.
SESSION_SECRET = os.getenv("SESSION_SECRET") or secrets.token_urlsafe(32)


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username") or ""
        password = form.get("password") or ""

        key = _client_key(request)
        if not ADMIN_PASSWORD_HASH or _is_locked(key):
            return False

        # Both checks always run, so a wrong username and a wrong password
        # cost the same time and cannot be told apart.
        user_ok = secrets.compare_digest(username, ADMIN_USERNAME)
        pass_ok = verify_password(password, ADMIN_PASSWORD_HASH)

        if user_ok and pass_ok:
            _failures.pop(key, None)
            request.session.update({"token": secrets.token_urlsafe(32)})
            return True

        _record_failure(key)
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        return "token" in request.session


authentication_backend = AdminAuth(secret_key=SESSION_SECRET)


# --- CLOUD UPLOAD HELPER ---
async def upload_to_supabase(file, bucket_name: str) -> str:
    """Upload a binary file to Supabase storage and return its public URL."""
    if not supabase:
        raise RuntimeError(
            "Supabase is not configured. Set SUPABASE_URL and "
            "SUPABASE_SERVICE_KEY in backend/.env."
        )

    # Seconds alone collide when two files of the same name are uploaded in the
    # same second, and Supabase rejects the second one as a duplicate.
    stamp = f"{int(time.time())}{secrets.token_hex(3)}"
    clean_name = re.sub(r"[^A-Za-z0-9._-]", "_", file.filename or "upload")
    filename = f"{stamp}_{clean_name}"
    content = await file.read()
    # The buckets only accept image MIME types, so a generic octet-stream is
    # rejected with a 415 that reads like a permissions problem. Browsers set
    # this header correctly; fall back to the extension for anything that does
    # not, rather than sending a type the bucket is guaranteed to refuse.
    content_type = getattr(file, "content_type", None)
    if not content_type or content_type == "application/octet-stream":
        content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

    try:
        supabase.storage.from_(bucket_name).upload(
            path=filename,
            file=content,
            file_options={"content-type": content_type},
        )
    except Exception as exc:  # noqa: BLE001 - surfaced to the admin UI
        detail = str(exc)
        if "row-level security" in detail or "Unauthorized" in detail:
            raise RuntimeError(
                "Storage rejected the upload. This usually means "
                "SUPABASE_SERVICE_KEY holds the anon key rather than the "
                "service-role key; only the latter may write to the image "
                "buckets."
            ) from exc
        if "Bucket not found" in detail:
            raise RuntimeError(
                f"The '{bucket_name}' storage bucket does not exist in this "
                "Supabase project."
            ) from exc
        raise

    return supabase.storage.from_(bucket_name).get_public_url(filename)


# --- ADMIN VIEWS ---

class LineageMemberAdmin(ModelView, model=LineageMember):
    column_list = ["id", "rank", "name", "role", "phone"]
    column_sortable_list = ["rank", "name"]
    form_columns = ["rank", "name", "role", "phone", "image_url"]
    icon = "fa-solid fa-users"

    column_formatters = {
        "image_url": lambda m, a: Markup(f'<img src="{m.image_url}" width="50" style="border-radius:50%;" />') if m.image_url else ""
    }

    async def scaffold_form(self, rules=None):
        form = await super().scaffold_form(rules)
        form.upload_file = FileField("Upload Profile Image")
        return form

    async def on_model_change(self, data, model, is_created, request):
        # 1. Pop the binary file out of the data dictionary to prevent DB crash
        file_obj = data.pop("upload_file", None)
        
        # 2. Process and replace with string URL
        if file_obj and hasattr(file_obj, "filename") and file_obj.filename:
            public_url = await upload_to_supabase(file_obj, "team")
            model.image_url = public_url
            data["image_url"] = public_url


class TempleProjectAdmin(ModelView, model=TempleProject):
    name = "Temple"
    name_plural = "Temples"
    column_list = ["id", "name_en", "images", "city", "state", "year", "is_featured", "is_milestone"]
    column_searchable_list = ["name_en", "name_gu", "name_hi", "city"]
    column_sortable_list = ["order_index", "year", "city"]
    form_columns = [
        "name_en", "name_gu", "name_hi",
        "description_en", "description_gu", "description_hi",
        "city", "state", "location", "year",
        "is_featured", "is_milestone", "order_index",
        # Without this the edit page showed only text fields, so a
        # temple's own photos were unreachable from the temple itself.
        "images",
    ]
    icon = "fa-solid fa-gopuram"

    # Gujarati and Hindi are required for the site's language switcher, so the
    # list view shows at a glance which rows are still missing a translation.
    column_formatters = {
        "name_en": lambda m, a: Markup(
            f'{m.name_en or "<em>untitled</em>"}'
            f'{"" if m.name_gu else " <span style=\'color:#283848\'>(no GU)</span>"}'
            f'{"" if m.name_hi else " <span style=\'color:#283848\'>(no HI)</span>"}'
        ),
    }


class TempleImageAdmin(ModelView, model=TempleImage):
    name = "Temple Image"
    name_plural = "Temple Images"
    column_list = ["id", "temple", "url", "is_cutout", "order_index"]
    form_columns = ["temple", "url", "is_cutout", "order_index"]
    icon = "fa-solid fa-image"

    # The default ten-per-page with no ordering meant hunting one temple's
    # photos across eight unsorted pages.
    column_searchable_list = ["url"]
    column_sortable_list = ["id", "temple_id", "order_index"]
    column_default_sort = [("temple_id", False), ("order_index", False)]
    page_size = 50
    page_size_options = [25, 50, 100, 200]

    column_formatters = {
        "url": lambda m, a: Markup(
            f'<img src="{m.url}" width="80" style="border-radius:4px;" />'
        ) if m.url else ""
    }

    async def scaffold_form(self, rules=None):
        form = await super().scaffold_form(rules)
        form.upload_file = FileField("Upload Image")
        return form

    async def on_model_change(self, data, model, is_created, request):
        file_obj = data.pop("upload_file", None)
        if file_obj and hasattr(file_obj, "filename") and file_obj.filename:
            public_url = await upload_to_supabase(file_obj, "temples")
            model.url = public_url
            data["url"] = public_url


class DashboardGalleryAdmin(ModelView, model=DashboardGallery):
    column_list = ["id", "title"]
    form_columns = ["title", "main_image"]
    icon = "fa-solid fa-layer-group"

    column_formatters = {
        "main_image": lambda m, a: Markup(f'<img src="{m.main_image}" width="80" style="border-radius:4px;" />') if m.main_image else ""
    }

    async def scaffold_form(self, rules=None):
        form = await super().scaffold_form(rules)
        form.upload_file = FileField("Upload Gallery Cover Image")
        return form

    async def on_model_change(self, data, model, is_created, request):
        file_obj = data.pop("upload_file", None)
        if file_obj and hasattr(file_obj, "filename") and file_obj.filename:
            public_url = await upload_to_supabase(file_obj, "temples") # Reusing temples bucket for general site assets
            model.main_image = public_url
            data["main_image"] = public_url


class ContactSubmissionAdmin(ModelView, model=ContactSubmission):
    name = "Inquiry"
    name_plural = "Inquiries"
    column_list = ["id", "name", "phone", "email", "temple_type", "submitted_at"]
    column_sortable_list = ["submitted_at"]
    column_default_sort = ("submitted_at", True)
    can_create = False
    can_edit = False
    icon = "fa-solid fa-envelope-open-text"


class GalleryImageAdmin(ModelView, model=GalleryImage):
    column_list = ["id", "gallery", "url"]
    form_columns = ["gallery", "url"]
    icon = "fa-solid fa-images"

    column_formatters = {
        "url": lambda m, a: Markup(f'<img src="{m.url}" width="80" style="border-radius:4px;" />') if m.url else ""
    }

    async def scaffold_form(self, rules=None):
        form = await super().scaffold_form(rules)
        form.upload_file = FileField("Upload Gallery Image")
        return form

    async def on_model_change(self, data, model, is_created, request):
        file_obj = data.pop("upload_file", None)
        if file_obj and hasattr(file_obj, "filename") and file_obj.filename:
            # We save all sub-images to the temples bucket
            public_url = await upload_to_supabase(file_obj, "temples")
            model.url = public_url
            data["url"] = public_url