import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiCache, ApiCache, CacheKeys, cacheUtils } from '@/lib/api-cache';

describe('ApiCache', () => {
  let cache: ApiCache;

  beforeEach(() => {
    cache = new ApiCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      const testData = { id: 1, name: 'Test' };
      cache.set('test-key', testData);

      const result = cache.get('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent-key');
      expect(result).toBe(null);
    });

    it('should return null for expired entries', () => {
      const testData = { id: 1, name: 'Test' };
      cache.set('test-key', testData, { ttl: 1000 });

      // Before expiration
      let result = cache.get('test-key');
      expect(result).toEqual(testData);

      // After expiration
      vi.advanceTimersByTime(1100);
      result = cache.get('test-key');
      expect(result).toBe(null);
    });
  });

  describe('has', () => {
    it('should return true for existing non-expired keys', () => {
      const testData = { id: 1, name: 'Test' };
      cache.set('test-key', testData);

      expect(cache.has('test-key')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('non-existent-key')).toBe(false);
    });

    it('should return false for expired keys', () => {
      const testData = { id: 1, name: 'Test' };
      cache.set('test-key', testData, { ttl: 1000 });

      vi.advanceTimersByTime(1100);

      expect(cache.has('test-key')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove specific keys', () => {
      const testData = { id: 1, name: 'Test' };
      cache.set('test-key', testData);

      expect(cache.has('test-key')).toBe(true);

      const deleted = cache.delete('test-key');
      expect(deleted).toBe(true);
      expect(cache.has('test-key')).toBe(false);
    });

    it('should return false when deleting non-existent keys', () => {
      const deleted = cache.delete('non-existent-key');
      expect(deleted).toBe(false);
    });
  });

  describe('clearExpired', () => {
    it('should remove expired entries', () => {
      const testData1 = { id: 1, name: 'Test1' };
      const testData2 = { id: 2, name: 'Test2' };
      const testData3 = { id: 3, name: 'Test3' };

      cache.set('key1', testData1, { ttl: 1000 });
      cache.set('key2', testData2, { ttl: 2000 });
      cache.set('key3', testData3, { ttl: 3000 });

      // Advance time past first entry's TTL
      vi.advanceTimersByTime(1500);

      const deletedCount = cache.clearExpired();
      expect(deletedCount).toBe(1);

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
    });

    it('should return 0 when no expired entries exist', () => {
      const testData = { id: 1, name: 'Test' };
      cache.set('test-key', testData, { ttl: 5000 });

      const deletedCount = cache.clearExpired();
      expect(deletedCount).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', { data: 1 });
      cache.set('key2', { data: 2 });
      cache.set('key3', { data: 3 });

      const deletedCount = cache.clear();
      expect(deletedCount).toBe(3);

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const testData1 = { id: 1, name: 'Test1' };
      const testData2 = { id: 2, name: 'Test2' };
      const testData3 = { id: 3, name: 'Test3' };

      cache.set('key1', testData1, { ttl: 1000 });
      cache.set('key2', testData2, { ttl: 2000 });
      cache.set('key3', testData3, { ttl: 3000 });

      vi.advanceTimersByTime(1500);

      const stats = cache.getStats();
      expect(stats.size).toBe(3);
      expect(stats.expiredEntries).toBe(1);
      expect(stats.validEntries).toBe(2);
    });
  });
});

describe('CacheKeys', () => {
  it('should generate homepage config key', () => {
    expect(CacheKeys.homepageConfig()).toBe('homepage:config');
  });

  it('should generate user stats key', () => {
    expect(CacheKeys.userStats('user123')).toBe('user:user123:stats');
  });

  it('should generate user quizzes key', () => {
    expect(CacheKeys.userQuizzes('user123')).toBe('user:user123:quizzes');
  });

  it('should generate quiz details key', () => {
    expect(CacheKeys.quizDetails('quiz456')).toBe('quiz:quiz456:details');
  });
});

describe('ApiCache.createKey', () => {
  it('should create key from multiple parts', () => {
    expect(ApiCache.createKey('user', '123', 'stats')).toBe('user:123:stats');
  });

  it('should handle empty parts', () => {
    expect(ApiCache.createKey('user', '', 'stats')).toBe('user::stats');
  });

  it('should handle single part', () => {
    expect(ApiCache.createKey('homepage')).toBe('homepage');
  });
});

describe('cacheUtils', () => {
  let cache: ApiCache;

  beforeEach(() => {
    cache = new ApiCache();
  });

  describe('withCache', () => {
    it('should cache function results', async () => {
      const mockFn = vi.fn().mockResolvedValue({ data: 'test' });
      const keyGenerator = () => 'test-key';

      const cachedFn = cacheUtils.withCache(mockFn, keyGenerator);

      // First call should execute function
      const result1 = await cachedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ data: 'test' });

      // Second call should use cache
      const result2 = await cachedFn();
      expect(mockFn).toHaveBeenCalledTimes(1); // Still only called once
      expect(result2).toEqual({ data: 'test' });
    });

    it('should pass arguments to key generator and function', async () => {
      const mockFn = vi.fn().mockImplementation((userId: string) =>
        Promise.resolve({ userId, data: 'test' })
      );
      const keyGenerator = (userId: string) => `user:${userId}:data`;

      const cachedFn = cacheUtils.withCache(mockFn, keyGenerator);

      await cachedFn('user123');
      await cachedFn('user456');

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('user123');
      expect(mockFn).toHaveBeenCalledWith('user456');
    });

    it('should use custom TTL', async () => {
      const mockFn = vi.fn().mockResolvedValue({ data: 'test' });
      const keyGenerator = () => 'test-key';

      const cachedFn = cacheUtils.withCache(mockFn, keyGenerator, { ttl: 1000 });

      await cachedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Before TTL expires
      await cachedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      // After TTL expires
      vi.advanceTimersByTime(1100);
      await cachedFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalidatePattern', () => {
    it('should invalidate cache entries matching pattern', () => {
      const cache = new ApiCache();
      cache.set('user:123:stats', { data: 'stats1' });
      cache.set('user:123:quizzes', { data: 'quizzes1' });
      cache.set('user:456:stats', { data: 'stats2' });
      cache.set('homepage:config', { data: 'config' });

      const deletedCount = cacheUtils.invalidatePattern('user:123');

      expect(deletedCount).toBe(2);
      expect(cache.has('user:123:stats')).toBe(false);
      expect(cache.has('user:123:quizzes')).toBe(false);
      expect(cache.has('user:456:stats')).toBe(true);
      expect(cache.has('homepage:config')).toBe(true);
    });

    it('should return 0 when no entries match pattern', () => {
      cache.set('homepage:config', { data: 'config' });

      const deletedCount = cacheUtils.invalidatePattern('user:123');

      expect(deletedCount).toBe(0);
      expect(cache.has('homepage:config')).toBe(true);
    });
  });
});