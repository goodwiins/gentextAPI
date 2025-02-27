#!/usr/bin/env zsh
# test-docker.zsh

# Enable bash-compatible behavior
setopt SH_WORD_SPLIT
setopt BASH_REMATCH

echo "🐳 Building and starting containers..."
docker-compose up -d

echo "⏳ Waiting for services to initialize..."
sleep 20

echo "🔍 Testing backend health..."
backend_health=$(curl -s http://localhost:8000/api/health)
if [[ $backend_health == *"ok"* ]]; then
  echo "✅ Backend health check: PASSED"
else
  echo "❌ Backend health check: FAILED"
  docker-compose logs backend
fi

echo "🔍 Testing frontend availability..."
frontend_check=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [[ $frontend_check == "200" ]]; then
  echo "✅ Frontend availability check: PASSED"
else
  echo "❌ Frontend availability check: FAILED"
  docker-compose logs frontend
fi

echo "🧹 Cleaning up..."
docker-compose down

# Optional: Add colorized output with Oh My Zsh styling
if [[ $backend_health == *"ok"* ]] && [[ $frontend_check == "200" ]]; then
  echo "\e[32m🎉 All tests passed! Your Docker setup is working correctly.\e[0m"
else
  echo "\e[31m⚠️ Some tests failed. Please check the logs above for details.\e[0m"
fi
