import os
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

from backend.models import LineageMember, TempleProject, DashboardGallery, GalleryImage

# --- SUPABASE CONFIGURATION ---
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("WARNING: Supabase credentials missing. Image uploads will fail.")


# --- AUTHENTICATION BACKEND ---
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# Falling back to a default password would put a known credential on a panel
# with full write access to every model, so an unset password disables login.
if not ADMIN_PASSWORD:
    print(
        "WARNING: ADMIN_PASSWORD is not set. The /admin panel will reject "
        "every login until it is configured in backend/.env."
    )

# Sessions are signed with this. A committed constant lets anyone forge an
# admin cookie, so it comes from the environment; the random fallback keeps
# the app bootable while simply invalidating sessions on restart.
SESSION_SECRET = os.getenv("SESSION_SECRET") or secrets.token_urlsafe(32)


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username") or ""
        password = form.get("password") or ""

        if not ADMIN_PASSWORD:
            return False

        # compare_digest avoids leaking the credentials through timing.
        valid = secrets.compare_digest(username, ADMIN_USERNAME) and \
            secrets.compare_digest(password, ADMIN_PASSWORD)

        if valid:
            request.session.update({"token": secrets.token_urlsafe(32)})
            return True
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        return "token" in request.session


authentication_backend = AdminAuth(secret_key=SESSION_SECRET)


# --- CLOUD UPLOAD HELPER ---
async def upload_to_supabase(file, bucket_name: str) -> str:
    """Uploads binary file to Supabase and returns public CDN URL."""
    if not supabase:
        raise RuntimeError("Supabase client not configured.")

    timestamp = int(time.time())
    clean_name = file.filename.replace(" ", "_")
    filename = f"{timestamp}_{clean_name}"
    content = await file.read()
    content_type = getattr(file, "content_type", None) or "application/octet-stream"

    supabase.storage.from_(bucket_name).upload(
        path=filename,
        file=content,
        file_options={"content-type": content_type}
    )
    return supabase.storage.from_(bucket_name).get_public_url(filename)


# --- ADMIN VIEWS ---

class LineageMemberAdmin(ModelView, model=LineageMember):
    column_list = ["id", "rank", "name", "role"]
    column_sortable_list = ["rank", "name"]
    form_columns = ["rank", "name", "role", "image_url"]
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
    column_list = ["id", "name", "status", "city"]
    column_searchable_list = ["name", "city"]
    form_columns = ["name", "trust_name", "status", "city", "main_image"]
    icon = "fa-solid fa-gopuram"
    
    column_formatters = {
        "main_image": lambda m, a: Markup(f'<img src="{m.main_image}" width="80" style="border-radius:4px;" />') if m.main_image else ""
    }

    async def scaffold_form(self, rules=None):
        form = await super().scaffold_form(rules)
        form.upload_file = FileField("Upload Main Background Image")
        return form

    async def on_model_change(self, data, model, is_created, request):
        file_obj = data.pop("upload_file", None)
        if file_obj and hasattr(file_obj, "filename") and file_obj.filename:
            public_url = await upload_to_supabase(file_obj, "temples")
            model.main_image = public_url
            data["main_image"] = public_url


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


class GalleryImageAdmin(ModelView, model=GalleryImage):
    column_list = ["id", "temple", "gallery", "url"]
    form_columns = ["temple", "gallery", "url"]
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