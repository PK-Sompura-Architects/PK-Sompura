from sqladmin import ModelView, Admin
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import RedirectResponse
from backend.models import Temple, TempleImage, ContactSubmission, LineageMember
from wtforms import FileField
from markupsafe import Markup
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import time
import os

# --- SUPABASE CLIENT INIT ---
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("WARNING: Supabase credentials missing. Admin image uploads will fail.")

# --- AUTHENTICATION (Step 12) ---
class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")
        
        print(f"DEBUG: Login attempt for user: {username}")
        
        # Default credentials per Master Blueprint
        if username == "admin" and password == "admin123":
            print("DEBUG: Credentials correct. Setting session.")
            request.session.update({"token": "admin_token"})
            return True
        print("DEBUG: Invalid credentials.")
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        token = request.session.get("token")
        print(f"DEBUG: Authenticate. Session: {request.session}")
        if not token:
            print("DEBUG: No token found in session.")
            return False
        return True

authentication_backend = AdminAuth(secret_key="pk_sompura_secure_secret_key_change_this_in_production")


# --- HELPER: Upload to Supabase ---
async def upload_to_supabase(file, bucket_name: str) -> str:
    """
    Reads a file uploaded through the admin form,
    pushes it to a Supabase Storage bucket,
    and returns the public CDN URL.
    """
    if not supabase:
        raise RuntimeError("Supabase client is not configured. Check your .env file.")

    timestamp = int(time.time())
    clean_name = file.filename.replace(" ", "_")
    filename = f"{timestamp}_{clean_name}"

    content = await file.read()

    # Determine content type
    content_type = getattr(file, "content_type", None) or "application/octet-stream"

    supabase.storage.from_(bucket_name).upload(
        path=filename,
        file=content,
        file_options={"content-type": content_type}
    )

    public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
    return public_url


# --- ADMIN VIEWS (Step 9 & 6) ---
class TempleAdmin(ModelView, model=Temple):
    column_list = [
        Temple.id,
        Temple.name_en,
        Temple.city,
        Temple.year,
        Temple.is_milestone,
        Temple.is_featured,
        Temple.order_index,
    ]
    column_searchable_list = [Temple.name_en, Temple.city]
    column_sortable_list = [Temple.id, Temple.year, Temple.order_index]
    
    form_columns = [
        "name_en", "name_gu", "name_hi",
        "description_en", "description_gu", "description_hi",
        "city", "state", "location", "year",
        "is_milestone", "is_featured", "order_index"
    ]
    icon = "fa-solid fa-gopuram"

class TempleImageAdmin(ModelView, model=TempleImage):
    column_list = [
        TempleImage.id,
        TempleImage.temple,
        TempleImage.url,
        TempleImage.is_cutout,
        TempleImage.order_index
    ]
    
    form_columns = ["temple", "is_cutout", "order_index"]
    
    form_extra_fields = {
        "file": FileField("Image Upload")
    }
    
    icon = "fa-solid fa-image"
    
    # Image Preview
    column_formatters = {
        TempleImage.url: lambda m, a: Markup(f'<img src="{m.url}" width="100" style="object-fit: cover; border-radius: 4px;" />') if m.url else ""
    }

    async def on_model_change(self, data, model, is_created, request):
        file = data.get("file")
        
        if file and hasattr(file, "filename") and file.filename:
            public_url = await upload_to_supabase(file, "temples")
            model.url = public_url
        elif is_created and not model.url:
            pass
        
        if "file" in data:
            del data["file"]

class LineageMemberAdmin(ModelView, model=LineageMember):
    column_list = [LineageMember.id, LineageMember.name, LineageMember.role, LineageMember.order_index]
    column_sortable_list = [LineageMember.order_index, LineageMember.name]
    
    # Exclude image_url from form, use 'file' upload instead
    form_columns = ["name", "role", "description", "order_index"]
    form_extra_fields = {
        "file": FileField("Profile Image Upload")
    }
    icon = "fa-solid fa-users"

    # Show small image preview in Admin table
    column_formatters = {
        LineageMember.image_url: lambda m, a: Markup(f'<img src="{m.image_url}" width="50" style="border-radius: 50%;" />') if m.image_url else ""
    }

    async def on_model_change(self, data, model, is_created, request):
        file = data.get("file")
        if file and hasattr(file, "filename") and file.filename:
            public_url = await upload_to_supabase(file, "team")
            model.image_url = public_url
            
        if "file" in data:
            del data["file"]

class ContactSubmissionAdmin(ModelView, model=ContactSubmission):
    column_list = [
        ContactSubmission.id,
        ContactSubmission.name,
        ContactSubmission.email,
        ContactSubmission.phone,
        ContactSubmission.temple_type,
        ContactSubmission.submitted_at
    ]
    column_default_sort = ("submitted_at", True)
    can_create = False
    can_edit = False
    can_delete = True
    icon = "fa-solid fa-envelope"
