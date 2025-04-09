FROM python:3.9-slim AS dependencies

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    python3 \
    python3-pip \
    python3-dev \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements.txt first
COPY requirements.txt ./

# Install dependencies with proper versioning to avoid conflicts
RUN pip install --no-cache-dir -v huggingface-hub==0.11.1
RUN pip install --no-cache-dir -v transformers==4.25.1
RUN pip install --no-cache-dir -v sentence-transformers==0.4.0
RUN pip install --no-cache-dir -v tokenizers==0.13.3 
RUN pip install --no-cache-dir -v --timeout 1000 -r requirements.txt || (echo "Failed to install dependencies!" && exit 1)

# Download NLTK data
RUN python3 -m nltk.downloader punkt

# Download spaCy models
RUN python3 -m spacy download en_core_web_sm

# Pre-download models
RUN python -c "from transformers import GPT2Tokenizer, GPT2LMHeadModel; tokenizer = GPT2Tokenizer.from_pretrained('gpt2-medium'); model = GPT2LMHeadModel.from_pretrained('gpt2-medium')"

# Verify imports work
RUN python -c "from sentence_transformers import SentenceTransformer; print('Sentence transformers imports successfully')"
RUN python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('spaCy model loaded successfully')"

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

# Create systemd service file
RUN echo '[Unit]\nDescription=GenText FastAPI application\nAfter=network.target\n\n[Service]\nUser=root\nWorkingDirectory=/path/to/your/project/server\nExecStart=/usr/bin/python3 -m uvicorn fastapi_app:app --host 127.0.0.1 --port 8000\nRestart=on-failure\nEnvironment="API_HOST=127.0.0.1"\nEnvironment="API_PORT=8000"\nEnvironment="CORS_ORIGINS=http://localhost:3000"\nEnvironment="DEBUG=False"\nEnvironment="MAX_THREAD_WORKERS=4"\n\n[Install]\nWantedBy=multi-user.target' > /etc/systemd/system/gentext.service 