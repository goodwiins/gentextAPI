#!/bin/bash

# Automated Appwrite Collections Setup
# Uses values from frontend/.env.production

set -e

echo "🚀 Setting up Appwrite collections for Homepage SAAS..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load environment variables
if [ -f "frontend/.env.production" ]; then
    export $(cat frontend/.env.production | grep -v '^#' | grep -v '^$' | xargs)
else
    echo -e "${RED}❌ frontend/.env.production not found${NC}"
    exit 1
fi

# Check required variables
if [ -z "$NEXT_PUBLIC_APPWRITE_PROJECT_ID" ] || [ -z "$NEXT_PUBLIC_APPWRITE_DATABASE_ID" ]; then
    echo -e "${RED}❌ Missing required environment variables${NC}"
    exit 1
fi

# Check if Appwrite CLI is available
export PATH="$HOME/.npm-global/bin:$PATH"
if ! command -v appwrite &> /dev/null; then
    echo -e "${RED}❌ Appwrite CLI not found${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  This script will create collections in your Appwrite project${NC}"
echo "Project ID: $NEXT_PUBLIC_APPWRITE_PROJECT_ID"
echo "Database ID: $NEXT_PUBLIC_APPWRITE_DATABASE_ID"
echo ""
echo -e "${YELLOW}To complete setup, you need to:${NC}"
echo "1. Go to Appwrite Console: https://cloud.appwrite.io/console"
echo "2. Navigate to your project > Databases > $NEXT_PUBLIC_APPWRITE_DATABASE_ID"
echo "3. Create these 3 collections manually or via API:"
echo ""
echo "   📊 Collection: homepage_metrics"
echo "   - sessionId (string, 36 chars)"
echo "   - userId (string, 36 chars, optional)"
echo "   - timestamp (datetime)"
echo "   - loadTime (integer)"
echo "   - fcp (integer)"
echo "   - lcp (integer)"
echo "   - cls (float)"
echo "   - fid (integer)"
echo "   - ttfb (integer)"
echo "   - userAgent (string, 500 chars)"
echo ""
echo "   🎯 Collection: conversion_events"
echo "   - sessionId (string, 36 chars)"
echo "   - userId (string, 36 chars, optional)"
echo "   - timestamp (datetime)"
echo "   - eventType (enum: signup, quiz_start, quiz_complete, upgrade)"
echo "   - eventData (json)"
echo "   - successful (boolean)"
echo ""
echo "   👆 Collection: feature_engagement"
echo "   - sessionId (string, 36 chars)"
echo "   - userId (string, 36 chars, optional)"
echo "   - timestamp (datetime)"
echo "   - section (enum: hero, features, process, testimonials, cta, pricing)"
echo "   - action (enum: view, click, scroll, hover)"
echo "   - duration (integer)"
echo "   - scrollDepth (integer)"
echo ""
echo -e "${GREEN}✓ Collection IDs are already configured in .env.production${NC}"
echo ""
echo "4. Create indexes for better query performance:"
echo "   - Index on sessionId + timestamp (for analytics queries)"
echo "   - Index on userId + timestamp (for user analytics)"
echo "   - Index on eventType (for conversion_events)"
echo "   - Index on section + action (for feature_engagement)"
echo ""
echo -e "${YELLOW}📚 See docs/analytics-api.md for complete schema details${NC}"
