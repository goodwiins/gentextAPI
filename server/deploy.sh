#!/bin/bash

# Exit on error
set -e

# Update system
echo "Updating system..."
apt-get update
apt-get upgrade -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.24.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Create docker-compose.yml if it doesn't exist
if [ ! -f docker-compose.yml ]; then
    echo "Creating docker-compose.yml..."
    cat > docker-compose.yml << 'EOL'
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - API_HOST=0.0.0.0
      - API_PORT=8000
      - CORS_ORIGINS=http://localhost:3000
      - DEBUG=False
      - MAX_THREAD_WORKERS=4
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
EOL
fi

# Build and start the containers
echo "Building and starting containers..."
docker-compose up -d --build

# Wait for the application to be ready
echo "Waiting for application to be ready..."
sleep 10

# Check if the application is running
if curl -s http://localhost:8000/health | grep -q "ok"; then
    echo "Deployment successful! Application is running."
    echo "You can access the API at http://YOUR_DROPLET_IP:8000"
    echo "API documentation is available at http://YOUR_DROPLET_IP:8000/docs"
else
    echo "Deployment might have issues. Please check the logs with: docker-compose logs"
fi 