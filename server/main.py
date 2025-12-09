import uvicorn
import sys
import os
from src.api.fastapi_app import app

# Add the script's directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if __name__ == "__main__":
    uvicorn.run(
        "src.api.fastapi_app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )