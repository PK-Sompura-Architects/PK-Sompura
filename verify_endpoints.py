import requests
import os

BASE_URL = "http://127.0.0.1:8000"

def test_root():
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"GET /: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"GET / failed: {e}")

def test_temples():
    try:
        response = requests.get(f"{BASE_URL}/temples")
        print(f"GET /temples: {response.status_code}")
        data = response.json()
        if "temples" in data:
            print(f"Found {len(data['temples'])} temples.")
        else:
            print("Response structure invalid for /temples")
    except Exception as e:
        print(f"GET /temples failed: {e}")

def test_upload():
    try:
        # Create dummy file
        with open("test_image.png", "wb") as f:
            f.write(b"dummy image content")
        
        # Context manager ensures file is closed immediately after sending
        with open('test_image.png', 'rb') as img_file:
            files = {'file': ('test_image.png', img_file, 'image/png')}
            response = requests.post(f"{BASE_URL}/upload", files=files)
        
        print(f"POST /upload: {response.status_code} - {response.json()}")
        
        if response.status_code == 200:
            url = response.json().get("url")
            full_url = url if url.startswith("http") else f"{BASE_URL}{url}"
            print(f"Verifying static file: {full_url}")
            img_response = requests.get(full_url)
            print(f"GET {url}: {img_response.status_code}")
        
    except Exception as e:
        print(f"POST /upload failed: {e}")
    finally:
        # Safe cleanup
        if os.path.exists("test_image.png"):
            try:
                os.remove("test_image.png")
            except Exception as e:
                pass # Ignore lingering windows locks if they somehow survive

if __name__ == "__main__":
    print("Starting verification...")
    test_root()
    test_temples()
    test_upload()
    print("Verification complete.")