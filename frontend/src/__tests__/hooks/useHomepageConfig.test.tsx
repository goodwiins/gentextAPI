import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useHomepageConfig } from '@/hooks/useHomepageConfig';
import { homepageApi } from '@/lib/homepage-api';
import { toast } from 'react-hot-toast';

// Mock dependencies
vi.mock('@/lib/homepage-api');
vi.mock('react-hot-toast');

const mockHomepageApi = vi.mocked(homepageApi);
const mockToast = vi.mocked(toast);

describe('useHomepageConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockConfig = {
    sections: [
      {
        id: 'hero',
        type: 'hero' as const,
        title: 'Test Hero',
        content: {
          headline: 'Test Headline',
          subheadline: 'Test Subheadline',
          primaryCTA: {
            text: 'Get Started',
            url: '/signup',
            variant: 'primary' as const,
            size: 'lg' as const
          },
          backgroundType: 'gradient' as const
        },
        isVisible: true,
        order: 1,
        responsiveConfig: {
          mobile: { enabled: true, spacing: 'py-16 px-4', fontSize: 'text-base' },
          tablet: { enabled: true, spacing: 'py-20 px-6', fontSize: 'text-lg' },
          desktop: { enabled: true, spacing: 'py-20 px-6', fontSize: 'text-xl' }
        }
      }
    ],
    globalSettings: {
      theme: 'auto' as const,
      animations: {
        enabled: true,
        reducedMotion: false,
        duration: 300
      },
      performance: {
        lazyLoadImages: true,
        prefetchCriticalResources: true
      }
    },
    version: '1.0.0',
    lastUpdated: '2024-01-15T10:00:00Z'
  };

  it('should fetch config on mount when enabled', async () => {
    mockHomepageApi.getConfig.mockResolvedValue({
      success: true,
      data: mockConfig,
      meta: {
        timestamp: '2024-01-15T10:00:00Z',
        requestId: 'test-request-id'
      }
    });

    const { result } = renderHook(() => useHomepageConfig());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.config).toBe(null);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockHomepageApi.getConfig).toHaveBeenCalledTimes(1);
    expect(result.current.config).toEqual(mockConfig);
    expect(result.current.error).toBe(null);
    expect(result.current.isRefetching).toBe(false);
  });

  it('should not fetch config when disabled', () => {
    mockHomepageApi.getConfig.mockResolvedValue({
      success: true,
      data: mockConfig,
      meta: {
        timestamp: '2024-01-15T10:00:00Z',
        requestId: 'test-request-id'
      }
    });

    const { result } = renderHook(() => useHomepageConfig({ enabled: false }));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.config).toBe(null);
    expect(result.current.error).toBe(null);
    expect(mockHomepageApi.getConfig).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const mockError = {
      success: false,
      error: {
        code: 'API_ERROR',
        message: 'Failed to fetch configuration',
        details: {}
      }
    };

    mockHomepageApi.getConfig.mockResolvedValue(mockError);

    const onError = vi.fn();
    const { result } = renderHook(() => useHomepageConfig({ onError }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.config).toBe(null);
    expect(result.current.error).toBe('Failed to fetch configuration');
    expect(onError).toHaveBeenCalledWith('Failed to fetch configuration');
    expect(mockToast.error).toHaveBeenCalledWith('Failed to fetch configuration');
  });

  it('should call onSuccess callback when config is loaded', async () => {
    const onSuccess = vi.fn();

    mockHomepageApi.getConfig.mockResolvedValue({
      success: true,
      data: mockConfig,
      meta: {
        timestamp: '2024-01-15T10:00:00Z',
        requestId: 'test-request-id'
      }
    });

    const { result } = renderHook(() => useHomepageConfig({ onSuccess }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(onSuccess).toHaveBeenCalledWith(mockConfig);
  });

  it('should refetch data when refetch function is called', async () => {
    mockHomepageApi.getConfig.mockResolvedValue({
      success: true,
      data: mockConfig,
      meta: {
        timestamp: '2024-01-15T10:00:00Z',
        requestId: 'test-request-id'
      }
    });

    const { result } = renderHook(() => useHomepageConfig());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockHomepageApi.getConfig).toHaveBeenCalledTimes(1);

    // Reset mock for refetch
    mockHomepageApi.getConfig.mockClear();

    act(() => {
      result.current.refetch();
    });

    expect(result.current.isRefetching).toBe(true);
    expect(mockHomepageApi.getConfig).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(result.current.isRefetching).toBe(false);
    });

    expect(result.current.config).toEqual(mockConfig);
  });

  it('should use cached data within cache time', async () => {
    mockHomepageApi.getConfig.mockResolvedValue({
      success: true,
      data: mockConfig,
      meta: {
        timestamp: '2024-01-15T10:00:00Z',
        requestId: 'test-request-id'
      }
    });

    const { result, rerender } = renderHook(
      ({ cacheTime }) => useHomepageConfig({ cacheTime }),
      { initialProps: { cacheTime: 5000 } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callCount = mockHomepageApi.getConfig.mock.calls.length;

    // Rerender within cache time
    rerender({ cacheTime: 5000 });

    // Should not make additional API call
    expect(mockHomepageApi.getConfig).toHaveBeenCalledTimes(callCount);
  });

  it('should refetch after cache expires', async () => {
    mockHomepageApi.getConfig.mockResolvedValue({
      success: true,
      data: mockConfig,
      meta: {
        timestamp: '2024-01-15T10:00:00Z',
        requestId: 'test-request-id'
      }
    });

    const { result, rerender } = renderHook(
      ({ cacheTime }) => useHomepageConfig({ cacheTime }),
      { initialProps: { cacheTime: 100 } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callCount = mockHomepageApi.getConfig.mock.calls.length;

    // Fast forward past cache time
    vi.advanceTimersByTime(150);

    // Rerender after cache expires
    rerender({ cacheTime: 100 });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should make additional API call
    expect(mockHomepageApi.getConfig).toHaveBeenCalledTimes(callCount + 1);
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error');
    networkError.name = 'TypeError';

    mockHomepageApi.getConfig.mockRejectedValue(networkError);

    const { result } = renderHook(() => useHomepageConfig());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(mockToast.error).toHaveBeenCalledWith('Network error');
  });

  it('should provide correct loading states during refetch', async () => {
    let resolveApi: (value: any) => void;
    const apiPromise = new Promise(resolve => {
      resolveApi = resolve;
    });

    mockHomepageApi.getConfig.mockReturnValue(apiPromise);

    const { result } = renderHook(() => useHomepageConfig());

    expect(result.current.isLoading).toBe(true);

    // Resolve initial request
    act(() => {
      resolveApi!({
        success: true,
        data: mockConfig,
        meta: {
          timestamp: '2024-01-15T10:00:00Z',
          requestId: 'test-request-id'
        }
      });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Start refetch
    let resolveRefetch: (value: any) => void;
    const refetchPromise = new Promise(resolve => {
      resolveRefetch = resolve;
    });

    mockHomepageApi.getConfig.mockReturnValue(refetchPromise);

    act(() => {
      result.current.refetch();
    });

    expect(result.current.isRefetching).toBe(true);
    expect(result.current.isLoading).toBe(false); // Main loading should remain false

    // Resolve refetch
    act(() => {
      resolveRefetch!({
        success: true,
        data: mockConfig,
        meta: {
          timestamp: '2024-01-15T10:01:00Z',
          requestId: 'test-request-id-2'
        }
      });
    });

    await waitFor(() => {
      expect(result.current.isRefetching).toBe(false);
    });
  });
});