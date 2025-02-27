#!/bin/bash
# run-app.sh - Run the Educational Question Generator app with one command

# Function to check if Docker is running
check_docker() {
  if ! docker info &>/dev/null; then
    echo "🚫 Docker is not running."
    echo "🚀 Please start Docker Desktop from your Applications folder"
    echo "   and wait until the icon in the menu bar stops animating."
    echo "   Then run this script again."
    return 1
  fi
  echo "✅ Docker is running."
  return 0
}

# Main execution
echo "🔍 Checking Docker status..."
if ! check_docker; then
  exit 1
fi

echo "🧹 Cleaning up any existing containers..."
docker compose down &>/dev/null

echo "🔨 Building and starting the application..."
docker compose up --build -d

echo "⏳ Waiting for services to start (20 seconds)..."
sleep 20

echo "🔍 Checking if services are running..."
if docker ps | grep "quiz-generator-backend" &>/dev/null && docker ps | grep "quiz-generator-frontend" &>/dev/null; then
  echo "✅ Services are running!"
  echo "🌐 You can access the application at: http://localhost:3000"
  echo ""
  echo "📋 Use these commands if needed:"
  echo "   - View logs: docker compose logs -f"
  echo "   - Stop app:  docker compose down"
else
  echo "❌ Services failed to start properly."
  echo "📜 Check the logs with: docker compose logs"
fi
