import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/Icons';
import { useAuthContext } from '@/context/auth-context';
import { useRouter } from 'next/router';
import { Home, CheckCircle, AlertCircle, ArrowRight, Settings, PlusCircle, Database, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

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
      toast.success('Collection schema set up successfully!');
    } catch (err) {
      console.error('Setup error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Setup failed: ${errorMessage}`);
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
      toast.success('Test document created successfully!');
      console.log('Test document created successfully:', data);
    } catch (err) {
      console.error('Test document error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setTestError(errorMessage);
      toast.error(`Test document creation failed: ${errorMessage}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border border-gray-200 dark:border-gray-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Appwrite Setup
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="schema" className="w-full">
              <TabsList className="grid grid-cols-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <TabsTrigger value="schema" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm">
                  <Database className="h-4 w-4 mr-2" />
                  Collection Schema
                </TabsTrigger>
                <TabsTrigger value="test" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Test Document
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="schema">
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    This will set up the required Appwrite collection schema for the history page.
                    Click the button below to create the collection with the correct attributes.
                  </p>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-5 rounded-lg mb-6">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-yellow-800 dark:text-yellow-400 font-medium">Important:</h3>
                        <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                          For this setup to work, you need to add a server-side API key to your environment variables.
                        </p>
                        <ol className="list-decimal list-inside mt-3 space-y-2 text-yellow-600 dark:text-yellow-400">
                          <li>Go to your Appwrite Console {'->'} Project Settings {'->'} API Keys</li>
                          <li>Create a new API key with permissions for databases and collections</li>
                          <li>Add it to your .env.local file as <code className="bg-yellow-100 dark:bg-yellow-800 px-1.5 py-0.5 rounded text-sm">APPWRITE_API_KEY=your-api-key</code></li>
                          <li>Restart your development server</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={handleSetup} 
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      {loading ? (
                        <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Settings className="mr-2 h-4 w-4" />
                      )}
                      Setup Collection Schema
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/')}
                      className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Return to Home
                    </Button>
                  </div>
                  
                  {error && (
                    <motion.div 
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-5 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="text-red-800 dark:text-red-400 font-medium">Error:</h3>
                          <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {result && (
                    <motion.div 
                      className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-5 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="text-green-800 dark:text-green-400 font-medium">Success!</h3>
                          <p className="text-green-700 dark:text-green-300 mt-1">Collection schema set up successfully</p>
                          
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200">Next Steps:</h4>
                            <ol className="list-decimal list-inside mt-2 space-y-2 text-gray-600 dark:text-gray-400">
                              <li>Create a test document to verify the schema</li>
                              <li>Go to the History page to see your documents</li>
                              <li>If you still have issues, check the Appwrite console</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </TabsContent>
              
              <TabsContent value="test">
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    This will create a test document in your Appwrite collection to verify everything is working correctly.
                    Click the button below to create a sample quiz document.
                  </p>
                  
                  <Button 
                    onClick={handleTestDocument} 
                    disabled={testLoading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    {testLoading ? (
                      <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="mr-2 h-4 w-4" />
                    )}
                    Create Test Document
                  </Button>
                  
                  {testError && (
                    <motion.div 
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-5 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="text-red-800 dark:text-red-400 font-medium">Error:</h3>
                          <p className="text-red-700 dark:text-red-300 mt-1">{testError}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {testResult && (
                    <motion.div 
                      className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-5 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="text-green-800 dark:text-green-400 font-medium">Success!</h3>
                          <p className="text-green-700 dark:text-green-300 mt-1">Test document created successfully</p>
                          
                          <div className="mt-4">
                            <Button
                              onClick={() => router.push('/history')}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                            >
                              <ArrowRight className="mr-2 h-4 w-4" />
                              View in History Page
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 