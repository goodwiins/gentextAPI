import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/auth-context';
import { Client, Databases, ID, Models } from 'appwrite';

export default function Debug() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientSideResult, setClientSideResult] = useState<any>(null);
  const [clientSideLoading, setClientSideLoading] = useState(false);
  const { authState } = useAuthContext();

  const runTests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-appwrite-connection');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to run tests');
      }
      
      setResults(data);
    } catch (err) {
      console.error('Test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createDirectDocument = async () => {
    setClientSideLoading(true);
    setClientSideResult(null);
    
    try {
      // Initialize Appwrite client
      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');
      
      const databases = new Databases(client);
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
      const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || '';
      
      // Check if we're logged in
      if (!authState.user) {
        throw new Error('You must be logged in to create a document');
      }
      
      // Create a test document
      const documentData = {
        title: 'Client-side Test Quiz',
        text: 'This is a test quiz created from the debug page with the client SDK.',
        userId: authState.user.$id,
        createdAt: new Date().toISOString(),
        questions: JSON.stringify([
          {
            question: 'What is the capital of France?',
            options: ['Paris', 'London', 'Berlin', 'Madrid'],
            answer: 'Paris'
          }
        ])
      };
      
      console.log('Creating document with client SDK:', documentData);
      
      const result = await databases.createDocument(
        databaseId,
        collectionId,
        ID.unique(),
        documentData
      );
      
      console.log('Document created successfully:', result);
      setClientSideResult({
        success: true,
        document: result
      });
    } catch (err) {
      console.error('Client SDK error:', err);
      setClientSideResult({
        success: false,
        error: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setClientSideLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Appwrite Connection Debugger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              This page will test your Appwrite connection and permissions.
              Click the button below to run the diagnostic tests.
            </p>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Current Config:</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto">
                {JSON.stringify({
                  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'Not set',
                  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'Not set',
                  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'Not set',
                  collectionId: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || 'Not set',
                  apiKeySet: !!process.env.APPWRITE_API_KEY,
                  user: authState.user ? {
                    id: authState.user.$id,
                    name: authState.user.name,
                    email: authState.user.email
                  } : 'Not logged in'
                }, null, 2)}
              </pre>
            </div>
            
            <div className="flex space-x-4">
              <Button 
                onClick={runTests} 
                disabled={loading}
              >
                {loading ? 'Running Server Tests...' : 'Run Server Connection Tests'}
              </Button>
              
              <Button 
                onClick={createDirectDocument} 
                disabled={clientSideLoading || !authState.user}
                variant="outline"
              >
                {clientSideLoading ? 'Creating...' : 'Create Document with Client SDK'}
              </Button>
            </div>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-lg">
                <h3 className="text-red-800 dark:text-red-400 font-medium">Error:</h3>
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
            
            {clientSideResult && (
              <div className={`border p-4 rounded-lg ${
                clientSideResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
              }`}>
                <h3 className={`font-medium ${
                  clientSideResult.success 
                    ? 'text-green-800 dark:text-green-400' 
                    : 'text-red-800 dark:text-red-400'
                }`}>
                  Client SDK Test: {clientSideResult.success ? 'Success' : 'Failed'}
                </h3>
                
                {clientSideResult.error && (
                  <p className="text-red-600 dark:text-red-400 mt-1">
                    {clientSideResult.error}
                  </p>
                )}
                
                {clientSideResult.document && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Document created:</p>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(clientSideResult.document, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
            
            {results && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Server Test Results:</h3>
                
                <div className="space-y-3">
                  {results.tests.map((test: any, index: number) => (
                    <div 
                      key={index}
                      className={`border p-4 rounded-lg ${
                        test.success 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                      }`}
                    >
                      <div className="flex justify-between">
                        <h4 className={`font-medium ${
                          test.success 
                            ? 'text-green-800 dark:text-green-400' 
                            : 'text-red-800 dark:text-red-400'
                        }`}>
                          {test.name}
                        </h4>
                        <span className={`text-sm px-2 py-1 rounded ${
                          test.success 
                            ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' 
                            : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                        }`}>
                          {test.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      
                      {test.status && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Status: {test.status}
                        </p>
                      )}
                      
                      {test.error && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          {test.error}
                        </p>
                      )}
                      
                      {test.data && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Response data:</p>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(test.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 