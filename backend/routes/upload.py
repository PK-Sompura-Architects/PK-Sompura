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
    print("WARNING: Supabase URL or Key is missing. Image uploads will fail.")
    supabase: Client | None = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Ensure this matches the exact name of your public bucket in Supabase
BUCKET_NAME = "temples" 

@router.post("/")
async def upload_image(file: UploadFile = File(...)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Storage is not configured on the server.")

    try:
        # File Validation
        allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
        extension = Path(file.filename).suffix.lower()
        if extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Invalid file type. Only .jpg, .jpeg, .png, .webp are allowed.")

        # Prevent Overwrite with Timestamp
        timestamp = int(time.time())
        clean_filename = file.filename.replace(" ", "_")
        filename = f"{timestamp}_{clean_filename}"
        
        # Read file bytes into memory
        file_bytes = await file.read()
        
        # Upload directly to Supabase Storage
        supabase.storage.from_(BUCKET_NAME).upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
        
        # Get the live public URL from Supabase
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(filename)
        
        # Return the absolute URL so the frontend/admin panel can render it immediately
        return JSONResponse(content={"url": public_url})

    except Exception as e:
        print(f"Upload error: {str(e)}") # Helpful logging for the terminal
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))