# Use Python 3.8 slim as base image
FROM python:3.8-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies and Rust
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libffi-dev \
    wget \
    && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
    && . $HOME/.cargo/env \
    && rm -rf /var/lib/apt/lists/*

# Add cargo to PATH
ENV PATH="/root/.cargo/bin:${PATH}"

# Create a virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and install build tools
RUN pip install --upgrade pip setuptools wheel

# Install core dependencies first
COPY docker-requirements.txt /tmp/
RUN pip install -r /tmp/docker-requirements.txt

# Install ML libraries with CPU versions to avoid compatibility issues
RUN pip install tensorflow==2.11.0  # Last version compatible with Python 3.8
RUN pip install torch==2.2.1 --index-url https://download.pytorch.org/whl/cpu
RUN pip install transformers==4.38.2
RUN pip install sentence-transformers==2.2.2

# Download NLP models
RUN python -c "import nltk; nltk.download('punkt')"
RUN python -c "import spacy; spacy.cli.download('en_core_web_sm')"
RUN python -c "import benepar; benepar.download('benepar_en3')"

# Final stage - Copy only what we need
FROM python:3.8-slim

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy application code
COPY server/ /app/

# Run application as a non-root user
RUN adduser --disabled-password --gecos "" appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Set environment variables
ENV FLASK_APP=app.py
ENV PYTHONPATH=/app

# Run the application
CMD ["python", "app.py"]