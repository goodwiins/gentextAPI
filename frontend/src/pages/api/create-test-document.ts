import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { ID } from 'appwrite';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // Get Appwrite configuration from environment variables
    const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || '';
    const apiKey = process.env.APPWRITE_API_KEY || ''; // Server-side API key

    // Log configuration (without sensitive values)
    console.log('API Config:', {
      endpoint: appwriteEndpoint,
      projectId,
      databaseId,
      collectionId,
      hasApiKey: !!apiKey
    });

    if (!projectId || !databaseId || !collectionId) {
      return res.status(400).json({ 
        error: 'Missing Appwrite configuration in environment variables' 
      });
    }

    if (!apiKey) {
      return res.status(400).json({
        error: 'Missing API key. Please add APPWRITE_API_KEY to your .env.local file'
      });
    }

    // Create a default axios instance with Appwrite config
    const appwrite = axios.create({
      baseURL: appwriteEndpoint,
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey // Add API key for server-side authentication
      }
    });

    // Create a test document
    const documentId = `test-${Date.now()}`;
    console.log('Creating document with ID:', documentId);
    
    const testDocument = {
      title: 'Test Quiz',
      text: 'This is a test quiz created from the setup page.',
      userId: userId,
      createdAt: new Date().toISOString(),
      questions: JSON.stringify([
        {
          question: 'What is the capital of France?',
          options: ['Paris', 'London', 'Berlin', 'Madrid'],
          answer: 'Paris'
        },
        {
          question: 'Which programming language is this application built with?',
          options: ['Python', 'JavaScript/TypeScript', 'Java', 'C++'],
          answer: 'JavaScript/TypeScript'
        }
      ])
    };

    console.log('Document data:', testDocument);

    // Try multiple formats to create the document
    let success = false;
    let response;
    let error;

    // Method 1: Standard SDK format
    try {
      console.log('Trying SDK format...');
      response = await appwrite.post(
        `/databases/${databaseId}/collections/${collectionId}/documents`,
        JSON.stringify({
          documentId: documentId,
          data: testDocument
        })
      );
      success = true;
      console.log('SDK format succeeded');
    } catch (err1: any) {
      console.log('SDK format failed, trying alternative format 1');
      error = err1;
      
      // Method 2: Direct data format
      try {
        console.log('Trying direct data format...');
        const directDoc = {
          documentId: `test-alt-${Date.now()}`,
          ...testDocument
        };
        
        response = await appwrite.post(
          `/databases/${databaseId}/collections/${collectionId}/documents`,
          JSON.stringify(directDoc)
        );
        success = true;
        console.log('Direct data format succeeded');
      } catch (err2: any) {
        console.log('Alternative format 1 failed, trying alternative format 2');
        
        // Method 3: Without stringifying
        try {
          console.log('Trying without JSON.stringify...');
          response = await appwrite.post(
            `/databases/${databaseId}/collections/${collectionId}/documents`,
            {
              documentId: `test-alt2-${Date.now()}`,
              data: testDocument
            }
          );
          success = true;
          console.log('Format without stringify succeeded');
        } catch (err3: any) {
          console.error('All document creation attempts failed');
          error = {
            sdk: err1.response?.data || err1.message,
            direct: err2.response?.data || err2.message,
            noStringify: err3.response?.data || err3.message
          };
        }
      }
    }

    if (success) {
      return res.status(200).json({
        success: true,
        message: 'Test document created successfully',
        document: response?.data
      });
    } else {
      console.error('Document creation failed after all attempts');
      return res.status(500).json({
        error: 'Failed to create test document after trying multiple formats',
        details: error
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Failed to create test document', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
} 