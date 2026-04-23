import time
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

router = APIRouter()

# CRITICAL FIX: Tell Python exactly where the .env file is located
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Initialize Supabase Client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Supabase URL or Key is missing. Uploads will fail.")
    supabase: Client | None = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Ensure this matches the exact name of your public bucket in Supabase
BUCKET_NAME = "temples" 

# ── Allowed file types: Images + 3D Models ──
ALLOWED_EXTENSIONS = {
    # Images
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    # 3D Model formats
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".fbx": "application/octet-stream",
}

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Storage is not configured on the server.")

    try:
        # File Validation
        extension = Path(file.filename).suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            allowed_list = ", ".join(ALLOWED_EXTENSIONS.keys())
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type '{extension}'. Allowed: {allowed_list}"
            )

        # Prevent Overwrite with Timestamp
        timestamp = int(time.time())
        clean_filename = file.filename.replace(" ", "_")
        filename = f"{timestamp}_{clean_filename}"
        
        # Read file bytes into memory
        file_bytes = await file.read()
        
        # Determine the correct MIME type
        # Use the known MIME type from our map, falling back to the browser-reported one
        content_type = ALLOWED_EXTENSIONS.get(extension, file.content_type)
        
        # Upload directly to Supabase Storage
        supabase.storage.from_(BUCKET_NAME).upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": content_type}
        )
        
        # Get the live public URL from Supabase
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(filename)
        
        # Return the absolute URL so the frontend/admin panel can render it immediately
        return JSONResponse(content={
            "url": public_url,
            "filename": filename,
            "type": "model" if extension in {".glb", ".gltf", ".fbx"} else "image"
        })

    except Exception as e:
        print(f"Upload error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))