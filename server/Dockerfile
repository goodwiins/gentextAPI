FROM python:3.9-slim AS dependencies

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements.txt first
COPY requirements.txt ./

# Install dependencies with proper error output
RUN pip install --no-cache-dir -v --timeout 1000 -r requirements.txt || (echo "Failed to install dependencies!" && exit 1)

# Download NLTK data
RUN python -m nltk.downloader punkt

# Final stage
FROM dependencies AS runtime

WORKDIR /app

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Create log directory
RUN mkdir -p /app/logs && chmod 777 /app/logs

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Start with a shell script to handle signals properly
RUN echo '#!/bin/bash\nset -e\nuvicorn fastapi_app:app --host 0.0.0.0 --port 8000 --log-level info "$@"' > /app/start.sh && \
    chmod +x /app/start.sh

# Run the startup script
CMD ["/app/start.sh"] 