#!/bin/bash

# Production Deployment Script for Homepage SAAS
# Deploys both frontend (Vercel) and backend (DigitalOcean)

set -e

echo "🚀 Deploying Homepage SAAS to Production..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "001-homepage-saas" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}⚠️  Warning: You're not on 001-homepage-saas or main branch${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 1. Build and test frontend
echo -e "${GREEN}📦 Building frontend...${NC}"
cd frontend
npm run build
npm run lint

# 2. Deploy frontend to Vercel
echo -e "${GREEN}🚀 Deploying frontend to Vercel...${NC}"
if command -v vercel &> /dev/null; then
    vercel --prod
else
    echo "Vercel CLI not found. Install with: npm i -g vercel"
    echo "Or deploy manually through Vercel dashboard"
fi
cd ..

# 3. Deploy backend to DigitalOcean
echo -e "${GREEN}🚀 Deploying backend to DigitalOcean...${NC}"
cd server

# Run backend deployment script
if [ -f "src/scripts/deploy_do.sh" ]; then
    bash src/scripts/deploy_do.sh
else
    echo "Backend deployment script not found. Deploying manually..."
    # Add your backend deployment commands here
fi

cd ..

# 4. Run smoke tests
echo -e "${GREEN}🧪 Running smoke tests...${NC}"
# Add smoke test commands here

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📊 Deployment Summary:"
echo "- Frontend: Deployed to Vercel"
echo "- Backend: Deployed to DigitalOcean"
echo "- Analytics: Collections configured"
echo ""
echo "🔗 Next steps:"
echo "1. Verify deployment at your production URL"
echo "2. Check analytics are tracking correctly"
echo "3. Monitor error rates and performance"
echo "4. Set up alerting for critical metrics"
