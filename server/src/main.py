from fastapi import FastAPI
from .database import engine, Base
from .api import auth

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MFA Security Analysis API")

app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "MFA Security Analysis API is running"}
