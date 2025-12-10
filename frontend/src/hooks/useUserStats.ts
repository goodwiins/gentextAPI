import { useState, useEffect, useCallback } from 'react';
import { UserStats, UseUserStatsReturn, UseUserStatsOptions } from '@/types/homepage';
import { useAuthContext } from '@/context/auth-context';
import { userStatsApi } from '@/lib/homepage-api';
import { apiCache, CacheKeys } from '@/lib/api-cache';
import { toast } from 'react-hot-toast';

const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_OPTIONS: Required<Omit<UseUserStatsOptions, 'enabled'>> = {
  cacheTime: DEFAULT_CACHE_TIME,
  retryLimit: 3,
  onSuccess: () => {},
  onError: () => {}
};

export function useUserStats(options: UseUserStatsOptions = {}): UseUserStatsReturn {
  const { enabled = true, cacheTime = DEFAULT_CACHE_TIME, retryLimit = 3 } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const { authState } = useAuthContext();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const fetchUserStats = useCallback(async (isRetry = false) => {
    if (!enabled || !authState.user) {
      return;
    }

    const userId = authState.user.$id;
    if (!userId) {
      setError('User ID not available');
      return;
    }

    const cacheKey = CacheKeys.userStats(userId);

    // Try to get from cache first
    const cachedStats = apiCache.get<UserStats>(cacheKey);
    if (cachedStats && !isRetry) {
      setStats(cachedStats);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await userStatsApi.getStats(userId);

      if (response.success && response.data) {
        setStats(response.data);
        setRetryCount(0);

        // Cache the result (don't cache mock data for too long)
        const isMockData = response.meta?.note?.includes('Mock data');
        apiCache.set(cacheKey, response.data, { ttl: isMockData ? 30000 : cacheTime }); // 30s for mock data

        // Log if we're using mock data (for debugging)
        if (isMockData) {
          console.info('Using mock user statistics data:', response.meta?.note);
        }
      } else {
        const errorMessage = !response.success ? response.error?.message || 'Failed to fetch user statistics' : 'Unknown error occurred';
        setError(errorMessage);

        // Only show toast for initial errors, not retries
        if (!isRetry && retryCount === 0) {
          toast.error(errorMessage);
        }

        // Retry logic
        if (retryCount < retryLimit) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchUserStats(true);
          }, delay);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user statistics';
      setError(errorMessage);

      if (!isRetry && retryCount === 0) {
        toast.error(errorMessage);
      }

      // Retry logic for unexpected errors
      if (retryCount < retryLimit) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchUserStats(true);
        }, delay);
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled, authState.user, cacheTime, retryCount, retryLimit]);

  const refetch = useCallback(() => {
    setRetryCount(0);
    fetchUserStats(true);
  }, [fetchUserStats]);

  // Clear cached stats when user changes
  useEffect(() => {
    if (authState.user) {
      const userId = authState.user.$id;
      if (userId) {
        apiCache.delete(CacheKeys.userStats(userId));
      }
    }
  }, [authState.user]);

  // Initial fetch
  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  return {
    stats,
    isLoading,
    error,
    refetch,
    retryCount,
  };
}