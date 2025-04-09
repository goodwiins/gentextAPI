import axios, { AxiosError, AxiosResponse } from 'axios';
import { setupCache } from 'axios-cache-interceptor';

// Create the axios instance with better defaults
// Using relative URL to leverage Next.js API routes instead of direct connection
const httpClient = setupCache(
  axios.create({
    baseURL: '/api',
    timeout: 15000, // 15 second timeout
    headers: {
      'Content-Type': 'application/json',
    }
  })
);

// Type the cache options correctly
interface CacheOptions {
  ttl: number;
  methods: string[];
  interpretHeader: boolean;
  cachePredicate: {
    statusCheck: (status: number) => boolean;
  };
}

// Configure caching (will not cache POST/PUT/DELETE requests by default)
(httpClient.defaults.cache as CacheOptions) = {
  ttl: 5 * 60 * 1000, // 5 minutes cache
  methods: ['get'], // Only cache GET requests
  interpretHeader: true, // Use cache-control headers if available
  cachePredicate: {
    statusCheck: (status: number) => status >= 200 && status < 400,
  }
};

// Add comprehensive response interceptor
httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status } = error.response;
      
      if (status === 401) {
        // Handle unauthorized error
        console.log('Unauthorized access. Please login.');
        // Event could be dispatched for auth handling across the app
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      } else if (status === 429) {
        // Rate limiting handler
        console.log('Too many requests. Please try again later.');
        // Could implement retry with exponential backoff
      } else if (status >= 500) {
        // Server errors
        console.error('Server error occurred:', error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network error - no response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default httpClient;