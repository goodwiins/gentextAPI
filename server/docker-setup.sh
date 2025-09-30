#!/bin/bash

# GenTextAPI Docker Setup Script
# This script helps you set up Docker for your GenTextAPI server

set -e

echo "🐳 GenTextAPI Docker Setup"
echo "=========================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed (plugin or standalone)
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# GenTextAPI Environment Variables
OPENROUTE_API_KEY=your_openroute_api_key_here
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
DEBUG=True
MAX_THREAD_WORKERS=4
MODEL_DEVICE=cpu
WORKERS=1
EOF
    echo "✅ Created .env file. Please edit it with your actual API key."
else
    echo "✅ .env file already exists"
fi

# Create logs directory
mkdir -p logs
echo "✅ Created logs directory"

echo ""
echo "🚀 Available Docker Commands:"
echo "============================="
echo ""
echo "1. Development (with hot reload):"
echo "   docker compose -f src/deployment/docker-compose.yml up --build"
echo ""
echo "2. Production:"
echo "   docker compose -f src/deployment/docker-compose.production.yml up --build -d"
echo ""
echo "3. View logs:"
echo "   docker compose logs -f"
echo ""
echo "4. Stop containers:"
echo "   docker compose down"
echo ""
echo "5. Rebuild and restart:"
echo "   docker compose up --build --force-recreate"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Edit .env file with your OpenRoute API key"
echo "2. Run: docker compose -f src/deployment/docker-compose.yml up --build"
echo "3. Visit: http://localhost:8000/docs"
echo ""
echo "🔧 Troubleshooting:"
echo "=================="
echo "If you encounter issues:"
echo "- Check logs: docker compose logs"
echo "- Check health: curl http://localhost:8000/health"
echo "- Rebuild: docker compose up --build --force-recreate"
