#!/bin/bash

set -e

# Define text colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

display_help() {
  echo -e "${GREEN}GenText API Management Script${NC}"
  echo
  echo "Usage: $0 [command]"
  echo
  echo "Commands:"
  echo "  deploy      Full deployment (build and start containers)"
  echo "  start       Start existing containers"
  echo "  stop        Stop running containers"
  echo "  restart     Restart containers"
  echo "  logs        View container logs"
  echo "  status      Check container status"
  echo "  test-deps   Test dependencies without full deployment"
  echo "  help        Display this help message"
  echo
}

check_docker() {
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    exit 1
  fi
  
  if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed.${NC}"
    exit 1
  fi
}

# Make sure necessary directories exist
ensure_directories() {
  mkdir -p logs
}

# Test dependencies
test_dependencies() {
  echo -e "${YELLOW}Testing dependencies...${NC}"
  
  # Create a temporary Dockerfile just for testing dependencies
  cat > Dockerfile.test << EOL
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -v --no-cache-dir -r requirements.txt
CMD ["echo", "Dependencies installed successfully!"]
EOL

  # Try to build the test image
  if docker build -f Dockerfile.test -t gentext-deps-test . ; then
    echo -e "${GREEN}✓ Dependencies look good!${NC}"
    rm Dockerfile.test
    return 0
  else
    echo -e "${RED}✗ Dependency issues detected.${NC}"
    rm Dockerfile.test
    return 1
  fi
}

# Deploy application
deploy() {
  echo -e "${YELLOW}Starting deployment...${NC}"
  ensure_directories
  
  # First test dependencies
  if ! test_dependencies; then
    echo -e "${RED}Dependency check failed. Fix requirements.txt before deploying.${NC}"
    exit 1
  fi
  
  # Stop any existing containers
  docker-compose down || true
  
  # Build and start
  if docker-compose build --no-cache && docker-compose up -d; then
    echo -e "${YELLOW}Waiting for service to be ready...${NC}"
    
    # Give the application time to start up
    for i in {1..30}; do
      echo -ne "${YELLOW}Waiting for health check... ($i/30)${NC}\r"
      if curl -s http://localhost:8000/health | grep -q "ok"; then
        echo -e "\n${GREEN}✓ Deployment successful!${NC}"
        echo -e "API available at: ${GREEN}http://$(curl -s ifconfig.me):8000${NC}"
        echo -e "API documentation at: ${GREEN}http://$(curl -s ifconfig.me):8000/docs${NC}"
        return 0
      fi
      sleep 2
    done
    
    echo -e "\n${RED}✗ Health check timed out. Checking logs:${NC}"
    docker-compose logs
    return 1
  else
    echo -e "${RED}✗ Build or deployment failed.${NC}"
    return 1
  fi
}

# Start containers
start() {
  echo -e "${YELLOW}Starting containers...${NC}"
  docker-compose up -d && \
  echo -e "${GREEN}✓ Containers started.${NC}"
}

# Stop containers
stop() {
  echo -e "${YELLOW}Stopping containers...${NC}"
  docker-compose down && \
  echo -e "${GREEN}✓ Containers stopped.${NC}"
}

# View logs
logs() {
  docker-compose logs -f
}

# Check status
status() {
  docker-compose ps
  echo
  if curl -s http://localhost:8000/health | grep -q "ok"; then
    echo -e "${GREEN}✓ API is running and healthy.${NC}"
  else
    echo -e "${RED}✗ API is not responding properly.${NC}"
    docker-compose logs --tail=50
  fi
}

# Main logic
check_docker

case "$1" in
  deploy)
    deploy
    ;;
  start)
    start
    ;;
  stop)
    stop
    ;;
  restart)
    stop
    start
    ;;
  logs)
    logs
    ;;
  status)
    status
    ;;
  test-deps)
    test_dependencies
    ;;
  help|*)
    display_help
    ;;
esac 