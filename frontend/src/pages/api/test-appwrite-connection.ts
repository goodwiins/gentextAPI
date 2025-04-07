import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

type TestResult = {
  name: string;
  success: boolean;
  status?: number;
  error?: string;
  data?: any;
};

type TestResults = {
  config: {
    endpoint?: string;
    projectId?: string;
    databaseId?: string;
    collectionId?: string;
    apiKeyPresent?: boolean;
  };
  tests: TestResult[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results: TestResults = {
    config: {},
    tests: []
  };

  try {
    // Get Appwrite configuration 
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || '';
    const apiKey = process.env.APPWRITE_API_KEY || '';

    // Add config (without sensitive info)
    results.config = {
      endpoint,
      projectId,
      databaseId,
      collectionId,
      apiKeyPresent: !!apiKey
    };

    if (!apiKey) {
      results.tests.push({
        name: 'API Key Check',
        success: false,
        error: 'API Key is missing. Please add APPWRITE_API_KEY to your .env.local file'
      });
      return res.status(200).json(results);
    }

    // Create Appwrite API client
    const client = axios.create({
      baseURL: endpoint,
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey
      }
    });

    // Test 1: Check if we can access the project
    try {
      const projectResponse = await client.get('/projects/' + projectId);
      results.tests.push({
        name: 'Project Access',
        success: true,
        status: projectResponse.status,
        data: {
          name: projectResponse.data?.name,
          description: projectResponse.data?.description
        }
      });
    } catch (error: any) {
      results.tests.push({
        name: 'Project Access',
        success: false,
        status: error.response?.status,
        error: error.response?.data?.message || error.message
      });
    }

    // Test 2: Check if we can access the database
    try {
      const databaseResponse = await client.get('/databases/' + databaseId);
      results.tests.push({
        name: 'Database Access',
        success: true,
        status: databaseResponse.status,
        data: {
          name: databaseResponse.data?.name
        }
      });
    } catch (error: any) {
      results.tests.push({
        name: 'Database Access',
        success: false,
        status: error.response?.status,
        error: error.response?.data?.message || error.message
      });
    }

    // Test 3: Check if we can access the collection
    try {
      const collectionResponse = await client.get(`/databases/${databaseId}/collections/${collectionId}`);
      results.tests.push({
        name: 'Collection Access',
        success: true,
        status: collectionResponse.status,
        data: {
          name: collectionResponse.data?.name,
          documentSecurity: collectionResponse.data?.documentSecurity
        }
      });
    } catch (error: any) {
      results.tests.push({
        name: 'Collection Access',
        success: false,
        status: error.response?.status,
        error: error.response?.data?.message || error.message
      });
    }

    // Test 4: List documents from collection (read permission test)
    try {
      const documentsResponse = await client.get(`/databases/${databaseId}/collections/${collectionId}/documents?limit=1`);
      results.tests.push({
        name: 'List Documents (Read Permission)',
        success: true,
        status: documentsResponse.status,
        data: {
          total: documentsResponse.data?.total
        }
      });
    } catch (error: any) {
      results.tests.push({
        name: 'List Documents (Read Permission)',
        success: false,
        status: error.response?.status,
        error: error.response?.data?.message || error.message
      });
    }

    // Test 5: Check if we can create a document (write permission test)
    try {
      // First try - standard format
      const testDoc = {
        documentId: 'test-' + Date.now(),
        data: {
          title: 'API Test Document',
          text: 'This is a test document created via API',
          userId: 'test-user-id',
          createdAt: new Date().toISOString(),
          questions: JSON.stringify([{ question: 'Test question', options: ['A', 'B'], answer: 'A' }])
        }
      };

      let createSuccess = false;
      let documentId = '';
      let responseData = null;
      let createError = null;

      // Try standard format with JSON.stringify
      try {
        const createResponse = await client.post(
          `/databases/${databaseId}/collections/${collectionId}/documents`,
          JSON.stringify(testDoc)
        );
        createSuccess = true;
        documentId = createResponse.data?.$id;
        responseData = createResponse.data;
      } catch (error: any) {
        createError = error;
        console.log('First attempt failed, trying alternative format');

        // Try alternative format - direct object without separate documentId
        try {
          const alternativeResponse = await client.post(
            `/databases/${databaseId}/collections/${collectionId}/documents`,
            {
              documentId: 'test-alt-' + Date.now(),
              title: 'API Test Document (Alt)',
              text: 'This is a test document created via API with alternative format',
              userId: 'test-user-id',
              createdAt: new Date().toISOString(),
              questions: JSON.stringify([{ question: 'Test question', options: ['A', 'B'], answer: 'A' }])
            }
          );
          createSuccess = true;
          documentId = alternativeResponse.data?.$id;
          responseData = alternativeResponse.data;
        } catch (altError: any) {
          console.log('Alternative format also failed, trying with SDK format');

          // Try SDK-like format
          try {
            const sdkResponse = await client.post(
              `/databases/${databaseId}/collections/${collectionId}/documents`,
              {
                documentId: 'test-sdk-' + Date.now(),
                data: {
                  title: 'API Test Document (SDK Format)',
                  text: 'This is a test document created via API with SDK format',
                  userId: 'test-user-id',
                  createdAt: new Date().toISOString(),
                  questions: JSON.stringify([{ question: 'Test question', options: ['A', 'B'], answer: 'A' }])
                }
              }
            );
            createSuccess = true;
            documentId = sdkResponse.data?.$id;
            responseData = sdkResponse.data;
          } catch (sdkError: any) {
            // All attempts failed
            createError = {
              standard: error.response?.data || error.message,
              alternative: altError.response?.data || altError.message,
              sdk: sdkError.response?.data || sdkError.message
            };
          }
        }
      }

      if (createSuccess) {
        results.tests.push({
          name: 'Create Document (Write Permission)',
          success: true,
          status: 200,
          data: {
            documentId,
            responseData
          }
        });

        // Clean up if document was created
        if (documentId) {
          try {
            await client.delete(`/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`);
          } catch (cleanupError) {
            console.error('Failed to clean up test document:', cleanupError);
          }
        }
      } else {
        results.tests.push({
          name: 'Create Document (Write Permission)',
          success: false,
          status: createError?.response?.status || 500,
          error: 'All document creation attempts failed',
          data: createError
        });
      }
    } catch (error: any) {
      results.tests.push({
        name: 'Create Document (Write Permission)',
        success: false,
        status: error.response?.status,
        error: error.response?.data?.message || error.message
      });
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('Unexpected error during Appwrite connection tests:', error);
    return res.status(500).json({ 
      error: 'Failed to test Appwrite connection', 
      details: error instanceof Error ? error.message : String(error),
      results
    });
  }
} 