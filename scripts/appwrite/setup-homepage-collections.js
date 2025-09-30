#!/usr/bin/env node
/**
 * Setup script for Homepage SAAS Appwrite collections
 * Configures: homepage_metrics, conversion_events, feature_engagement
 * 
 * Usage: node scripts/appwrite/setup-homepage-collections.js
 * Requires: APPWRITE_ENDPOINT and APPWRITE_PROJECT_ID in environment
 */

const { Client, Databases, ID, Permission, Role } = require('node-appwrite');

// Configuration
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY; // Server-side API key for admin operations

if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   APPWRITE_PROJECT_ID - Your Appwrite project ID');
  console.error('   APPWRITE_API_KEY - Server-side API key with database permissions');
  process.exit(1);
}

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = 'default'; // Use default database

async function createCollection(collectionId, name, attributes, indexes = []) {
  try {
    console.log(`📝 Creating collection: ${name}...`);
    
    // Create collection with proper permissions
    const collection = await databases.createCollection(
      DATABASE_ID,
      collectionId,
      name,
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    console.log(`✅ Collection "${name}" created with ID: ${collection.$id}`);

    // Add attributes
    for (const attr of attributes) {
      try {
        await databases.createStringAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.size,
          attr.required,
          attr.default,
          attr.array || false
        );
        console.log(`   ✓ Added attribute: ${attr.key}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`   ⚠️  Attribute ${attr.key} already exists`);
        } else {
          console.error(`   ❌ Failed to create attribute ${attr.key}:`, error.message);
        }
      }
    }

    // Add indexes
    for (const index of indexes) {
      try {
        await databases.createIndex(
          DATABASE_ID,
          collectionId,
          index.key,
          index.type,
          index.attributes,
          index.orders || []
        );
        console.log(`   ✓ Added index: ${index.key}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`   ⚠️  Index ${index.key} already exists`);
        } else {
          console.error(`   ❌ Failed to create index ${index.key}:`, error.message);
        }
      }
    }

    return collection;
  } catch (error) {
    if (error.code === 409) {
      console.log(`   ⚠️  Collection "${name}" already exists`);
      return null;
    } else {
      console.error(`❌ Failed to create collection "${name}":`, error.message);
      throw error;
    }
  }
}

async function setupHomepageMetricsCollection() {
  const attributes = [
    { key: 'sessionId', size: 128, required: true },
    { key: 'userId', size: 36, required: false },
    { key: 'timestamp', size: 32, required: true },
    { key: 'pageView', size: 1000, required: true }, // JSON string
    { key: 'userAgent', size: 512, required: true },
    { key: 'viewport', size: 100, required: true }, // JSON string
    { key: 'referrer', size: 512, required: false },
    { key: 'createdAt', size: 32, required: true }
  ];

  const indexes = [
    { key: 'sessionId_idx', type: 'key', attributes: ['sessionId'] },
    { key: 'userId_idx', type: 'key', attributes: ['userId'] },
    { key: 'timestamp_idx', type: 'key', attributes: ['timestamp'] },
    { key: 'createdAt_idx', type: 'key', attributes: ['createdAt'] }
  ];

  return await createCollection('homepage_metrics', 'Homepage Metrics', attributes, indexes);
}

async function setupConversionEventsCollection() {
  const attributes = [
    { key: 'sessionId', size: 128, required: true },
    { key: 'userId', size: 36, required: false },
    { key: 'eventType', size: 50, required: true },
    { key: 'eventData', size: 1000, required: true }, // JSON string
    { key: 'timestamp', size: 32, required: true },
    { key: 'successful', size: 10, required: true }, // boolean as string
    { key: 'errorMessage', size: 512, required: false },
    { key: 'createdAt', size: 32, required: true }
  ];

  const indexes = [
    { key: 'sessionId_idx', type: 'key', attributes: ['sessionId'] },
    { key: 'eventType_idx', type: 'key', attributes: ['eventType'] },
    { key: 'timestamp_idx', type: 'key', attributes: ['timestamp'] },
    { key: 'successful_idx', type: 'key', attributes: ['successful'] }
  ];

  return await createCollection('conversion_events', 'Conversion Events', attributes, indexes);
}

async function setupFeatureEngagementCollection() {
  const attributes = [
    { key: 'sessionId', size: 128, required: true },
    { key: 'sectionName', size: 50, required: true },
    { key: 'engagementType', size: 50, required: true },
    { key: 'duration', size: 20, required: true }, // number as string
    { key: 'scrollDepth', size: 10, required: true }, // number as string
    { key: 'interactions', size: 10, required: true }, // number as string
    { key: 'timestamp', size: 32, required: true },
    { key: 'createdAt', size: 32, required: true }
  ];

  const indexes = [
    { key: 'sessionId_idx', type: 'key', attributes: ['sessionId'] },
    { key: 'sectionName_idx', type: 'key', attributes: ['sectionName'] },
    { key: 'engagementType_idx', type: 'key', attributes: ['engagementType'] }
  ];

  return await createCollection('feature_engagement', 'Feature Engagement', attributes, indexes);
}

async function main() {
  try {
    console.log('🚀 Setting up Homepage SAAS Appwrite collections...');
    console.log(`📍 Endpoint: ${APPWRITE_ENDPOINT}`);
    console.log(`📁 Project: ${APPWRITE_PROJECT_ID}`);
    console.log(`🗄️  Database: ${DATABASE_ID}`);
    console.log('');

    // Setup collections
    await setupHomepageMetricsCollection();
    await setupConversionEventsCollection();
    await setupFeatureEngagementCollection();

    console.log('');
    console.log('✅ Homepage analytics collections setup complete!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   • homepage_metrics - Performance and user metrics');
    console.log('   • conversion_events - CTA clicks and conversion tracking');
    console.log('   • feature_engagement - Section-level user engagement');
    console.log('');
    console.log('🔗 Next steps:');
    console.log('   1. Update frontend analytics service to use these collections');
    console.log('   2. Configure proper read/write permissions as needed');
    console.log('   3. Test data insertion with sample analytics events');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
main();