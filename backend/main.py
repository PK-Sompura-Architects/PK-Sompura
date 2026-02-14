from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "PK Sompura Backend Running"}
