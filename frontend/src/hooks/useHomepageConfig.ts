import { useState, useEffect, useCallback } from 'react';
import { HomepageConfig, HomepageApiResponse } from '@/types/homepage';
import { homepageApi } from '@/lib/homepage-api';
import { toast } from 'react-hot-toast';

interface UseHomepageConfigOptions {
  enabled?: boolean;
  onError?: (error: string) => void;
  onSuccess?: (config: HomepageConfig) => void;
  cacheTime?: number; // in milliseconds
}

interface UseHomepageConfigReturn {
  config: HomepageConfig | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

export function useHomepageConfig(options: UseHomepageConfigOptions = {}): UseHomepageConfigReturn {
  const {
    enabled = true,
    onError,
    onSuccess,
    cacheTime = DEFAULT_CACHE_TIME
  } = options;

  const [config, setConfig] = useState<HomepageConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchConfig = useCallback(async (isRefetch = false) => {
    if (!enabled) return;

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetch;

    // Use cached data if still valid
    if (!isRefetch && config && timeSinceLastFetch < cacheTime) {
      return;
    }

    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response: HomepageApiResponse = await homepageApi.getConfig();

      if (response.success && response.data) {
        setConfig(response.data);
        setLastFetch(now);

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        const errorMessage = !response.success ? response.error?.message || 'Failed to load homepage configuration' : 'Unknown error occurred';
        setError(errorMessage);

        // Call error callback if provided
        if (onError) {
          onError(errorMessage);
        }

        // Show toast notification for errors
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);

      if (onError) {
        onError(errorMessage);
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [enabled, config, lastFetch, cacheTime, onError, onSuccess]);

  // Initial fetch
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Refetch function
  const refetch = useCallback(async () => {
    await fetchConfig(true);
  }, [fetchConfig]);

  return {
    config,
    isLoading,
    error,
    refetch,
    isRefetching
  };
}