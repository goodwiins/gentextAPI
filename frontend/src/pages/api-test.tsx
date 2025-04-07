import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/Icons';

export default function ApiTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use the Next.js API route instead of direct API access
  const API_URL = '/api';
  
  const testEndpoint = async () => {
    setLoading(true);
    setError(null);
    try {
      // Test the simple-qa endpoint first (GET request)
      const response = await fetch(`${API_URL}/generate/simple-qa`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResult(data);
      console.log('API Response:', data);
      
    } catch (err) {
      console.error('API Test Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const testQaEndpoint = async () => {
    setLoading(true);
    setError(null);
    try {
      // Test the QA endpoint (POST request)
      const response = await fetch(`${API_URL}/generate/qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: "This is a sample text for testing the QA generation. The API should process this text and return some questions.",
          num_statements: 3
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResult(data);
      console.log('API Response:', data);
      
    } catch (err) {
      console.error('API Test Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>API Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Button 
                onClick={testEndpoint} 
                disabled={loading}
                variant="outline"
              >
                {loading ? <Icons.Loader className="mr-2 h-4 w-4 animate-spin" /> : <Icons.AlertCircle className="mr-2 h-4 w-4" />}
                Test Simple Endpoint
              </Button>
              
              <Button 
                onClick={testQaEndpoint} 
                disabled={loading}
              >
                {loading ? <Icons.Loader className="mr-2 h-4 w-4 animate-spin" /> : <Icons.AlertCircle className="mr-2 h-4 w-4" />}
                Test QA Endpoint
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
                <div className="mt-2">
                  <p className="text-sm font-medium">Generator Used: <span className="font-normal">{result.generator_used || 'N/A'}</span></p>
                  <p className="text-sm font-medium">Questions: <span className="font-normal">{result.data?.length || 0}</span></p>
                </div>
                <div className="mt-4 overflow-auto max-h-96">
                  <pre className="text-xs text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 