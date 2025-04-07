import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Appwrite configuration from environment variables
    const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || '';
    const apiKey = process.env.APPWRITE_API_KEY || ''; // Server-side API key

    if (!projectId || !databaseId || !collectionId) {
      return res.status(400).json({ 
        error: 'Missing Appwrite configuration in environment variables' 
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

    let collection;
    
    try {
      // Check if collection exists
      const collectionResponse = await appwrite.get(`/databases/${databaseId}/collections/${collectionId}`);
      collection = collectionResponse.data;
      console.log('Collection exists:', collection.name);
    } catch (error) {
      console.log('Collection not found or error occurred, trying to create it');
      
      try {
        // Create the collection
        const createResponse = await appwrite.post(`/databases/${databaseId}/collections`, {
          collectionId: collectionId,
          name: 'Quizzes',
          permissions: [
            `read("user:${collectionId}/userId")`,
            'create("users")',
            `update("user:${collectionId}/userId")`,
            `delete("user:${collectionId}/userId")`
          ],
          documentSecurity: true
        });
        
        collection = createResponse.data;
        console.log('Created collection:', collection.name);
      } catch (createError) {
        console.error('Error creating collection:', createError);
      }
    }

    // Define the attribute creation functions
    const createStringAttribute = async (name: string, size: number, required: boolean, defaultValue: string | null) => {
      try {
        await appwrite.post(`/databases/${databaseId}/collections/${collectionId}/attributes/string`, {
          key: name,
          size,
          required,
          default: defaultValue
        });
        console.log(`Created string attribute: ${name}`);
      } catch (error) {
        console.log(`Attribute ${name} may already exist: `, error);
      }
    };

    const createDatetimeAttribute = async (name: string, required: boolean, defaultValue: string | null) => {
      try {
        await appwrite.post(`/databases/${databaseId}/collections/${collectionId}/attributes/datetime`, {
          key: name,
          required,
          default: defaultValue
        });
        console.log(`Created datetime attribute: ${name}`);
      } catch (error) {
        console.log(`Attribute ${name} may already exist: `, error);
      }
    };

    // Create the necessary attributes
    await createStringAttribute('text', 1000000, true, null);
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await createStringAttribute('title', 256, false, 'Untitled Quiz');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await createStringAttribute('userId', 36, true, null);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await createDatetimeAttribute('createdAt', true, null);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await createStringAttribute('questions', 1000000, true, null);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create index for userId
    try {
      await appwrite.post(`/databases/${databaseId}/collections/${collectionId}/indexes`, {
        key: 'userId_index',
        type: 'key',
        attributes: ['userId']
      });
      console.log('Created userId index');
    } catch (error) {
      console.log('Index might already exist or error occurred:', error);
    }

    return res.status(200).json({ 
      success: true,
      message: 'Collection and attributes setup completed',
      collectionId
    });
  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({ 
      error: 'Failed to setup collection', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
} 