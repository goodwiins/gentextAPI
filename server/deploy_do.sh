#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

echo "=== 📋 Checking system requirements ==="
# Install Docker if not available
if ! command_exists docker; then
  echo "Installing Docker..."
  apt-get update
  apt-get install -y apt-transport-https ca-certificates curl software-properties-common
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
  add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io
fi

# Install Docker Compose if not available
if ! command_exists docker-compose; then
  echo "Installing Docker Compose..."
  curl -L "https://github.com/docker/compose/releases/download/v2.24.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
fi

# Build the base image first to check for dependency issues
echo "=== 🧪 Testing dependencies ==="
echo "Building base image to verify dependencies..."
docker build --target=dependencies -t gentext-deps .

echo "=== 🚀 Building and deploying ==="
# Use docker-compose for deployment
docker-compose down || true
docker-compose build --no-cache
docker-compose up -d

# Check if the service is running
echo "=== 🔍 Checking deployment ==="
sleep 5
if curl -s http://localhost:8000/health | grep -q "ok"; then
  echo "✅ Deployment successful!"
  echo "API is available at: http://$(curl -s ifconfig.me):8000"
  echo "API documentation available at: http://$(curl -s ifconfig.me):8000/docs"
else
  echo "❌ Deployment might have issues. Checking logs..."
  docker-compose logs
  exit 1
fi 