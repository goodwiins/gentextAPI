FROM python:3.8-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    libffi-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY server/requirements.txt .

# Install Python dependencies with special handling for problematic packages
RUN pip install --upgrade pip && \
    pip install wheel setuptools && \
    # Install CPU versions of ML libraries
    pip install tensorflow-cpu==2.13.0 && \
    pip install torch==2.2.1 --index-url https://download.pytorch.org/whl/cpu && \
    # Filter out problematic packages
    grep -v "tensorflow-macos\|tensorflow$" requirements.txt > requirements-filtered.txt && \
    pip install --no-cache-dir -r requirements-filtered.txt

# Copy application code
COPY server/ .

# Download required NLP models
RUN python -c "import nltk; nltk.download('punkt')" && \
    python -c "import spacy; spacy.cli.download('en_core_web_sm')" && \
    python -c "import benepar; benepar.download('benepar_en3')"

# Expose port
EXPOSE 8000

# Set environment variables
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["python", "app.py"]