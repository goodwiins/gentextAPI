// Simple in-memory cache for API responses
// In a production app, you might want to use a more sophisticated caching solution

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const { ttl = this.defaultTTL } = options;
    const now = Date.now();
    const expiresAt = now + ttl;

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    });
  }

  /**
   * Retrieve data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Check if cache entry has expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    const now = Date.now();

    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all expired entries
   */
  clearExpired(): number {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Clear all cache entries
   */
  clear(): number {
    const size = this.cache.size;
    this.cache.clear();
    return size;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    expiredEntries: number;
    validEntries: number;
  } {
    const now = Date.now();
    let expiredEntries = 0;
    let validEntries = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      size: this.cache.size,
      expiredEntries,
      validEntries
    };
  }

  /**
   * Create a cache key from multiple parts
   */
  static createKey(...parts: string[]): string {
    return parts.join(':');
  }
}

// Export singleton instance and class
export const apiCache = new ApiCache();
export { ApiCache };

// Export cache key generators
export const CacheKeys = {
  homepageConfig: () => 'homepage:config',
  userStats: (userId: string) => `user:${userId}:stats`,
  userQuizzes: (userId: string) => `user:${userId}:quizzes`,
  quizDetails: (quizId: string) => `quiz:${quizId}:details`
};

// Export cache utility functions
export const cacheUtils = {
  /**
   * Cache wrapper for async functions
   */
  withCache<T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>,
    keyGenerator: (...args: Args) => string,
    options: CacheOptions = {}
  ) {
    return async (...args: Args): Promise<T> => {
      const key = keyGenerator(...args);

      // Try to get from cache first
      const cached = apiCache.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Execute function and cache result
      const result = await fn(...args);
      apiCache.set(key, result, options);

      return result;
    };
  },

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern: (pattern: string): number => {
    let deletedCount = 0;
    const keys = Array.from((apiCache as any).cache.keys());

    for (const key of keys as string[]) {
      if (key.includes(pattern)) {
        apiCache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }
};

// Set up periodic cleanup of expired entries
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.clearExpired();
  }, 60000); // Clean up every minute
}