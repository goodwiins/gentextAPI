import React, { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface User {
  id: string;
  name: string;
  email: string;
}

interface ApiDemo {
  title: string;
  description: string;
  endpoint: string;
  method: 'get' | 'post' | 'put' | 'delete';
}

// Example component showing optimal API usage
export function ApiUsageExample() {
  // Track which demo is active
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  // Define some example API demos
  const demos: Record<string, ApiDemo> = {
    getUsers: {
      title: 'Fetch Users',
      description: 'GET request with automatic caching',
      endpoint: '/api/users',
      method: 'get'
    },
    getUserById: {
      title: 'Get User by ID',
      description: 'GET request with URL parameter',
      endpoint: '/api/users/1',
      method: 'get'
    },
    createUser: {
      title: 'Create User',
      description: 'POST request with payload',
      endpoint: '/api/users',
      method: 'post'
    }
  };

  // Use our optimized API hook for the GET example with auto-fetching
  const getUsersApi = useApi<User[]>(
    demos.getUsers.endpoint,
    'get',
    {
      enabled: activeDemo === 'getUsers',
      // Transform the response if needed
      transform: (data) => {
        // Example transformation
        return data.map((user: any) => ({
          ...user,
          name: user.name.toUpperCase()
        }));
      },
      // Cache for 1 minute
      cacheDuration: 60 * 1000
    }
  );

  // Example for a POST request - not auto-executed
  const createUserApi = useApi<User, { name: string; email: string }>(
    demos.createUser.endpoint,
    'post',
    {
      enabled: false, // Don't auto-execute 
      onSuccess: (data) => {
        console.log('User created:', data);
        // Could update local state or show toast here
      }
    }
  );

  // Handle creating a new user
  const handleCreateUser = () => {
    createUserApi.execute({
      name: 'New User',
      email: 'user@example.com'
    });
  };

  // Toggle which demo is active
  const toggleDemo = (demoKey: string) => {
    setActiveDemo(activeDemo === demoKey ? null : demoKey);
  };

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">Optimized API Usage Examples</h2>
      
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(demos).map(([key, demo]) => (
          <Card key={key} className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${activeDemo === key ? 'ring-2 ring-blue-500' : ''}`} onClick={() => toggleDemo(key)}>
            <h3 className="text-lg font-semibold">{demo.title}</h3>
            <p className="text-sm text-gray-500">{demo.description}</p>
            <div className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
              <code>{`${demo.method.toUpperCase()} ${demo.endpoint}`}</code>
            </div>
          </Card>
        ))}
      </div>

      {/* Display based on active demo */}
      {activeDemo === 'getUsers' && (
        <div className="border rounded-lg p-4">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold">Users List</h3>
            <div className="space-x-2">
              <Button size="sm" onClick={getUsersApi.refresh} disabled={getUsersApi.loading}>
                Refresh
              </Button>
              <Button size="sm" variant="outline" onClick={getUsersApi.clear}>
                Clear Cache
              </Button>
            </div>
          </div>

          {getUsersApi.loading && <p>Loading users...</p>}
          
          {getUsersApi.error && (
            <div className="bg-red-50 p-3 rounded text-red-800">
              Error: {getUsersApi.error.message}
            </div>
          )}
          
          {getUsersApi.data && (
            <div>
              <ul className="divide-y">
                {getUsersApi.data.map((user) => (
                  <li key={user.id} className="py-2">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </li>
                ))}
              </ul>
              
              {getUsersApi.isStale && (
                <div className="mt-3 text-xs text-amber-600">
                  Data is stale. Consider refreshing.
                </div>
              )}
              
              {getUsersApi.timestamp && (
                <div className="mt-2 text-xs text-gray-500">
                  Last updated: {new Date(getUsersApi.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeDemo === 'createUser' && (
        <div className="border rounded-lg p-4">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold">Create New User</h3>
          </div>
          
          <Button 
            onClick={handleCreateUser} 
            disabled={createUserApi.loading}
          >
            {createUserApi.loading ? 'Creating...' : 'Create Sample User'}
          </Button>
          
          {createUserApi.error && (
            <div className="bg-red-50 p-3 mt-3 rounded text-red-800">
              Error: {createUserApi.error.message}
            </div>
          )}
          
          {createUserApi.data && (
            <div className="mt-3 p-3 bg-green-50 rounded">
              <p className="text-green-800">User created successfully:</p>
              <pre className="mt-2 text-xs bg-white p-2 rounded">
                {JSON.stringify(createUserApi.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ApiUsageExample; 