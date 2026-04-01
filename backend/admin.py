from sqladmin import ModelView, Admin
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import RedirectResponse
from backend.models import Temple, TempleImage, ContactSubmission
from wtforms import FileField
from markupsafe import Markup
from pathlib import Path
from backend.models import Temple, TempleImage, ContactSubmission, LineageMember
import time
import shutil
import os

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
    
    # Use 'file' instead of 'url' in the form
    # We remove 'url' from creation/edit forms so user doesn't manually enter it.
    # We also DON'T put 'file' in form_columns because it's not a model field, 
    # but verify if sqladmin needs it to show up. 
    # Actually, form_extra_fields adds it. 
    # Converting start of list to use "temple" and "is_cutout"
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
        
        # Check if a file was uploaded
        if file and hasattr(file, "filename") and file.filename:
            # Prepare path
            BASE_DIR = Path(__file__).resolve().parent.parent
            UPLOAD_DIR = BASE_DIR / "frontend" / "public" / "temples"
            UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            
            # Generate unique filename
            timestamp = int(time.time())
            clean_name = file.filename.replace(" ", "_")
            filename = f"{timestamp}_{clean_name}"
            file_path = UPLOAD_DIR / filename
            
            # Save file
            # Note: file is likely a Starlette UploadFile object or similar wrapper from wtforms/sqladmin
            # We need to read it. If it's pure wtforms it might be different, but sqladmin integrates with Starlette.
            # Let's try to read it as a stream.
            
            # In sqladmin with FastAPI, it seems it passes the UploadFile object.
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Set variable
            model.url = f"/temples/{filename}"
        elif is_created and not model.url:
             # If created and no file, maybe set a default or error? 
             # For now, allow empty or handle gracefully.
             pass
        
        # Clean up 'file' from data so it doesn't try to save to DB (though model doesn't have it, safe)
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
            # Create a /team folder inside public to hold portraits
            BASE_DIR = Path(__file__).resolve().parent.parent
            UPLOAD_DIR = BASE_DIR / "frontend" / "public" / "team"
            UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            
            timestamp = int(time.time())
            clean_name = file.filename.replace(" ", "_")
            filename = f"{timestamp}_{clean_name}"
            file_path = UPLOAD_DIR / filename
            
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
            model.image_url = f"/team/{filename}"
            
        if "file" in data:
            del data["file"]

class ContactSubmissionAdmin(ModelView, model=ContactSubmission):
    column_list = [
        ContactSubmission.id,
        ContactSubmission.name,
        ContactSubmission.email,
        ContactSubmission.phone, # Added
        ContactSubmission.temple_type,
        ContactSubmission.submitted_at
    ]
    column_default_sort = ("submitted_at", True)
    can_create = False
    can_edit = False
    can_delete = True
    icon = "fa-solid fa-envelope"
