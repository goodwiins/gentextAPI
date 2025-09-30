#!/bin/bash

# Appwrite Collections Setup Script for Production
# This script creates the required collections and indexes for the homepage analytics system

set -e

echo "🚀 Setting up Appwrite collections for Homepage SAAS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Appwrite CLI is installed
if ! command -v appwrite &> /dev/null; then
    echo -e "${RED}❌ Appwrite CLI not found. Please install it first:${NC}"
    echo "npm install -g appwrite-cli"
    exit 1
fi

# Prompt for configuration
echo -e "${YELLOW}📝 Please provide your Appwrite configuration:${NC}"
read -p "Appwrite Endpoint (default: https://cloud.appwrite.io/v1): " ENDPOINT
ENDPOINT=${ENDPOINT:-https://cloud.appwrite.io/v1}

read -p "Project ID: " PROJECT_ID
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Project ID is required${NC}"
    exit 1
fi

read -p "API Key: " API_KEY
if [ -z "$API_KEY" ]; then
    echo -e "${RED}❌ API Key is required${NC}"
    exit 1
fi

read -p "Database ID (default: default): " DATABASE_ID
DATABASE_ID=${DATABASE_ID:-default}

# Configure Appwrite CLI
echo -e "${GREEN}✓ Configuring Appwrite CLI...${NC}"
appwrite client --endpoint "$ENDPOINT"
appwrite client --key "$API_KEY"

# Create Collections

echo -e "${GREEN}📊 Creating homepage_metrics collection...${NC}"
appwrite databases createCollection \
    --databaseId "$DATABASE_ID" \
    --collectionId "homepage_metrics" \
    --name "Homepage Metrics" \
    --permissions "create(['any'])" \
    --documentSecurity true || echo "Collection may already exist"

# Add attributes for homepage_metrics
appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "homepage_metrics" \
    --key "sessionId" \
    --size 128 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "homepage_metrics" \
    --key "userId" \
    --size 128 \
    --required false || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "homepage_metrics" \
    --key "timestamp" \
    --size 50 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "homepage_metrics" \
    --key "userAgent" \
    --size 512 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "homepage_metrics" \
    --key "pageView" \
    --size 1000 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "homepage_metrics" \
    --key "viewport" \
    --size 100 \
    --required true || true

# Create indexes for homepage_metrics
appwrite databases createIndex \
    --databaseId "$DATABASE_ID" \
    --collectionId "homepage_metrics" \
    --key "sessionId_idx" \
    --type "key" \
    --attributes "sessionId" || true

appwrite databases createIndex \
    --databaseId "$DATABASE_ID" \
    --collectionId "homepage_metrics" \
    --key "userId_idx" \
    --type "key" \
    --attributes "userId" || true

appwrite databases createIndex \
    --databaseId "$DATABASE_ID" \
    --collectionId "homepage_metrics" \
    --key "timestamp_idx" \
    --type "key" \
    --attributes "timestamp" || true

echo -e "${GREEN}📊 Creating conversion_events collection...${NC}"
appwrite databases createCollection \
    --databaseId "$DATABASE_ID" \
    --collectionId "conversion_events" \
    --name "Conversion Events" \
    --permissions "create(['any'])" \
    --documentSecurity true || echo "Collection may already exist"

# Add attributes for conversion_events
appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "conversion_events" \
    --key "sessionId" \
    --size 128 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "conversion_events" \
    --key "userId" \
    --size 128 \
    --required false || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "conversion_events" \
    --key "eventType" \
    --size 50 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "conversion_events" \
    --key "eventData" \
    --size 2000 \
    --required true || true

appwrite databases createBooleanAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "conversion_events" \
    --key "successful" \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "conversion_events" \
    --key "timestamp" \
    --size 50 \
    --required true || true

# Create indexes for conversion_events
appwrite databases createIndex \
    --databaseId "$DATABASE_ID" \
    --collectionId "conversion_events" \
    --key "sessionId_idx" \
    --type "key" \
    --attributes "sessionId" || true

appwrite databases createIndex \
    --databaseId "$DATABASE_ID" \
    --collectionId "conversion_events" \
    --key "eventType_idx" \
    --type "key" \
    --attributes "eventType" || true

appwrite databases createIndex \
    --databaseId "$DATABASE_ID" \
    --collectionId "conversion_events" \
    --key "successful_idx" \
    --type "key" \
    --attributes "successful" || true

echo -e "${GREEN}📊 Creating feature_engagement collection...${NC}"
appwrite databases createCollection \
    --databaseId "$DATABASE_ID" \
    --collectionId "feature_engagement" \
    --name "Feature Engagement" \
    --permissions "create(['any'])" \
    --documentSecurity true || echo "Collection may already exist"

# Add attributes for feature_engagement
appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "feature_engagement" \
    --key "sessionId" \
    --size 128 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "feature_engagement" \
    --key "sectionName" \
    --size 50 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "feature_engagement" \
    --key "engagementType" \
    --size 50 \
    --required true || true

appwrite databases createIntegerAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "feature_engagement" \
    --key "duration" \
    --required true || true

appwrite databases createIntegerAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "feature_engagement" \
    --key "scrollDepth" \
    --required true || true

appwrite databases createIntegerAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "feature_engagement" \
    --key "interactions" \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "feature_engagement" \
    --key "timestamp" \
    --size 50 \
    --required true || true

# Create indexes for feature_engagement
appwrite databases createIndex \
    --databaseId "$DATABASE_ID" \
    --collectionId "feature_engagement" \
    --key "sessionId_idx" \
    --type "key" \
    --attributes "sessionId" || true

appwrite databases createIndex \
    --databaseId "$DATABASE_ID" \
    --collectionId "feature_engagement" \
    --key "sectionName_idx" \
    --type "key" \
    --attributes "sectionName" || true

appwrite databases createIndex \
    --databaseId "$DATABASE_ID" \
    --collectionId "feature_engagement" \
    --key "engagementType_idx" \
    --type "key" \
    --attributes "engagementType" || true

echo -e "${GREEN}✅ Appwrite collections setup complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Update your frontend/.env.production with the collection IDs"
echo "2. Configure collection permissions in the Appwrite console"
echo "3. Set up data retention policies for GDPR compliance"
echo "4. Enable rate limiting for the collections"
