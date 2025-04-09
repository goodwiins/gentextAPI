import { useState, useCallback, useEffect, useRef } from 'react';
import httpClient from '@/httpClient';
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  timestamp: number | null;
}

interface ApiOptions<T, P> extends Omit<AxiosRequestConfig, 'data'> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  transform?: (data: any) => T;
  enabled?: boolean;
  cacheDuration?: number; // in milliseconds
  retry?: boolean;
  retryCount?: number;
  retryDelay?: number; // in milliseconds
  payload?: P;
}

type ApiMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export function useApi<T = any, P = any>(
  url: string,
  method: ApiMethod = 'get',
  options: ApiOptions<T, P> = {}
) {
  const {
    onSuccess,
    onError,
    transform,
    enabled = true,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    retry = true,
    retryCount = 3,
    retryDelay = 1000,
    payload,
    ...axiosOptions
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    timestamp: null
  });

  // Create a cache key based on the URL, method and payload
  const cacheKey = `${method}-${url}-${JSON.stringify(payload)}`;
  
  // Keep track of the abort controller
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (overridePayload?: P): Promise<T | null> => {
    // Clear any previous abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Configure the request
      const requestConfig: AxiosRequestConfig = {
        ...axiosOptions,
        signal: abortController.signal,
      };

      // Make the request based on the method
      let response: AxiosResponse;
      if (method === 'get') {
        response = await httpClient.get(url, requestConfig);
      } else if (method === 'delete') {
        response = await httpClient.delete(url, requestConfig);
      } else {
        // For post, put, patch methods
        const data = overridePayload || payload;
        response = await httpClient[method](url, data, requestConfig);
      }

      // Transform data if needed
      const processedData = transform ? transform(response.data) : response.data;

      // Update state with the response data
      setState({
        data: processedData,
        loading: false,
        error: null,
        timestamp: Date.now()
      });

      // Call the success handler if provided
      onSuccess?.(processedData);

      return processedData;
    } catch (err) {
      // Don't update state if the request was aborted
      if ((err as Error).name === 'AbortError' || (err as any)?.code === 'ERR_CANCELED') {
        return null;
      }

      // Format the error
      const error = err instanceof Error ? err : new Error(String(err));

      // Update state with the error
      setState(prev => ({
        ...prev,
        loading: false,
        error,
        timestamp: Date.now()
      }));

      // Call the error handler if provided
      onError?.(error);

      return null;
    }
  }, [url, method, payload, transform, onSuccess, onError, axiosOptions]);

  // Set up automatic fetching when enabled is true
  useEffect(() => {
    // Only execute automatically for GET requests with enabled=true
    if (method === 'get' && enabled) {
      // Check if we have cached data that is still valid
      const cachedState = getFromCache<ApiState<T>>(cacheKey);
      if (
        cachedState && 
        cachedState.timestamp && 
        Date.now() - cachedState.timestamp < cacheDuration
      ) {
        // Use cached data
        setState(cachedState);
      } else {
        // Fetch new data
        execute();
      }
    }

    // Cleanup function to abort requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cacheKey, enabled, method, execute, cacheDuration]);

  // Utility function to save data to cache
  useEffect(() => {
    // Only cache GET requests with data and a timestamp
    if (
      method === 'get' && 
      state.data !== null && 
      state.timestamp !== null
    ) {
      saveToCache(cacheKey, state);
    }
  }, [method, cacheKey, state]);

  // Function to refresh data (useful for pull-to-refresh)
  const refresh = useCallback(() => {
    return execute();
  }, [execute]);

  // Function to clear stored data
  const clear = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      timestamp: null
    });
    removeFromCache(cacheKey);
  }, [cacheKey]);

  return {
    ...state,
    execute,
    refresh,
    clear,
    isStale: state.timestamp 
      ? (Date.now() - state.timestamp > cacheDuration) 
      : true
  };
}

// In-memory cache implementation
const memoryCache = new Map<string, { data: any; timestamp: number }>();

function saveToCache<T>(key: string, data: T): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function getFromCache<T>(key: string): T | null {
  const cachedItem = memoryCache.get(key);
  if (cachedItem) {
    return cachedItem.data as T;
  }
  return null;
}

function removeFromCache(key: string): void {
  memoryCache.delete(key);
}

export default useApi; 