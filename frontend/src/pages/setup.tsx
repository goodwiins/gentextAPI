import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/Icons';
import { useAuthContext } from '@/context/auth-context';
import { useRouter } from 'next/router';
import { Home } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Setup() {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const { authState } = useAuthContext();
  const router = useRouter();

  // Check if user is authenticated
  if (!authState.isLoading && !authState.user) {
    router.push('/login');
    return null;
  }

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/create-collection', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup collection');
      }
      
      setResult(data);
    } catch (err) {
      console.error('Setup error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTestDocument = async () => {
    setTestLoading(true);
    setTestError(null);
    
    try {
      console.log('Creating test document for user:', authState.user?.$id);
      
      const response = await fetch('/api/create-test-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: authState.user?.$id
        })
      });
      
      const data = await response.json();
      console.log('API response:', data);
      
      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || `Failed to create test document: ${response.status} ${response.statusText}`);
      }
      
      setTestResult(data);
      console.log('Test document created successfully:', data);
    } catch (err) {
      console.error('Test document error:', err);
      setTestError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Appwrite Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="schema">
            <TabsList className="mb-4">
              <TabsTrigger value="schema">Collection Schema</TabsTrigger>
              <TabsTrigger value="test">Test Document</TabsTrigger>
            </TabsList>
            
            <TabsContent value="schema">
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  This will set up the required Appwrite collection schema for the history page.
                  Click the button below to create the collection with the correct attributes.
                </p>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-4 rounded-lg mb-4">
                  <h3 className="text-yellow-800 dark:text-yellow-400 font-medium">Important:</h3>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    For this setup to work, you need to add a server-side API key to your environment variables.
                  </p>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-yellow-600 dark:text-yellow-400">
                    <li>Go to your Appwrite Console {'->'} Project Settings {'->'} API Keys</li>
                    <li>Create a new API key with permissions for databases and collections</li>
                    <li>Add it to your .env.local file as <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">APPWRITE_API_KEY=your-api-key</code></li>
                    <li>Restart your development server</li>
                  </ol>
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    onClick={handleSetup} 
                    disabled={loading}
                  >
                    {loading ? <Icons.Loader className="mr-2 h-4 w-4 animate-spin" /> : <Icons.Settings className="mr-2 h-4 w-4" />}
                    Setup Collection Schema
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/')}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Return to Home
                  </Button>
                </div>
                
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-lg">
                    <h3 className="text-red-800 dark:text-red-400 font-medium">Error:</h3>
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}
                
                {result && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 rounded-lg">
                    <h3 className="text-green-800 dark:text-green-400 font-medium">Success!</h3>
                    <p className="text-green-700 dark:text-green-300">Collection schema set up successfully</p>
                    
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">Next Steps:</h4>
                      <ol className="list-decimal list-inside mt-2 space-y-2 text-gray-600 dark:text-gray-400">
                        <li>Create a test document to verify the schema</li>
                        <li>Go to the History page to see your documents</li>
                        <li>If you still have issues, check the Appwrite console</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="test">
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  This will create a test document in your Appwrite collection to verify everything is working correctly.
                  Click the button below to create a sample quiz document.
                </p>
                
                <Button 
                  onClick={handleTestDocument} 
                  disabled={testLoading}
                >
                  {testLoading ? <Icons.Loader className="mr-2 h-4 w-4 animate-spin" /> : <Icons.PlusCircle className="mr-2 h-4 w-4" />}
                  Create Test Document
                </Button>
                
                {testError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-lg">
                    <h3 className="text-red-800 dark:text-red-400 font-medium">Error:</h3>
                    <p className="text-red-700 dark:text-red-300">{testError}</p>
                  </div>
                )}
                
                {testResult && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 rounded-lg">
                    <h3 className="text-green-800 dark:text-green-400 font-medium">Success!</h3>
                    <p className="text-green-700 dark:text-green-300">Test document created successfully</p>
                    
                    <div className="mt-4 flex space-x-4">
                      <Button
                        onClick={() => router.push('/history')}
                      >
                        <Icons.AlertCircle className="mr-2 h-4 w-4" />
                        View in History Page
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 