#!/bin/bash
set -e

# Navigate to the server directory
cd "$(dirname "$0")"

# Set environment variables if needed
export API_HOST="127.0.0.1"  # Only listen on localhost since Nginx will proxy
export API_PORT="8000"
export API_WORKERS="1"  # Reduced workers since we're not using all dependencies

# Start the FastAPI application
echo "Starting FastAPI application..."
./venv/bin/python -m uvicorn fastapi_app:app --host $API_HOST --port $API_PORT 