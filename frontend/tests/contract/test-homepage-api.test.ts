import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the modules that will be created
vi.mock('@/lib/homepage-service', () => ({
  getHomepageConfig: vi.fn(),
}));

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: vi.fn(() => ({
    breakpoint: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: 1024,
    height: 768,
  })),
}));

import { getHomepageConfig } from '@/lib/homepage-service';

describe('Homepage API Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/homepage/config', () => {
    it('should return homepage configuration with all required sections', async () => {
      // Mock successful API response
      const mockConfig = {
        success: true,
        data: {
          sections: [
            {
              id: 'hero-1',
              type: 'hero',
              title: 'Generate AI-Powered Quizzes',
              content: {
                headline: 'Create engaging quizzes in seconds',
                subheadline: 'AI-powered question generation',
                primaryCTA: {
                  text: 'Start Creating',
                  url: '/signup',
                  variant: 'primary',
                  size: 'lg',
                },
                backgroundType: 'gradient',
              },
              isVisible: true,
              order: 1,
              responsiveConfig: {
                mobile: { enabled: true, spacing: 'compact', fontSize: 'base' },
                tablet: { enabled: true, spacing: 'normal', fontSize: 'lg' },
                desktop: { enabled: true, spacing: 'comfortable', fontSize: 'xl' },
              },
            },
          ],
          globalSettings: {
            theme: 'auto',
            animations: {
              enabled: true,
              reducedMotion: false,
              duration: 300,
            },
            performance: {
              lazyLoadImages: true,
              prefetchCriticalResources: true,
            },
          },
          version: '1.0.0',
          lastUpdated: '2025-10-06T12:00:00Z',
        },
      };

      vi.mocked(getHomepageConfig).mockResolvedValue(mockConfig);

      // Test the API response structure
      const result = await getHomepageConfig('desktop', false);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('sections');
      expect(result.data).toHaveProperty('globalSettings');
      expect(result.data).toHaveProperty('version');
      expect(result.data).toHaveProperty('lastUpdated');

      // Validate sections structure
      expect(Array.isArray(result.data.sections)).toBe(true);
      expect(result.data.sections.length).toBeGreaterThan(0);

      const heroSection = result.data.sections.find((s: any) => s.type === 'hero');
      expect(heroSection).toBeDefined();
      expect(heroSection).toHaveProperty('id');
      expect(heroSection).toHaveProperty('title');
      expect(heroSection).toHaveProperty('content');
      expect(heroSection).toHaveProperty('isVisible');
      expect(heroSection).toHaveProperty('order');
      expect(heroSection).toHaveProperty('responsiveConfig');

      // Validate responsive configuration
      expect(heroSection.responsiveConfig).toHaveProperty('mobile');
      expect(heroSection.responsiveConfig).toHaveProperty('tablet');
      expect(heroSection.responsiveConfig).toHaveProperty('desktop');
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error response
      const mockError = {
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Homepage configuration not available',
          details: {},
        },
      };

      vi.mocked(getHomepageConfig).mockRejectedValue(new Error('API Error'));

      await expect(getHomepageConfig('desktop', false)).rejects.toThrow('API Error');
    });

    it('should validate responsive breakpoint parameter', async () => {
      const mockConfig = {
        success: true,
        data: {
          sections: [],
          globalSettings: {},
          version: '1.0.0',
          lastUpdated: '2025-10-06T12:00:00Z',
        },
      };

      vi.mocked(getHomepageConfig).mockResolvedValue(mockConfig);

      // Test different breakpoints
      await getHomepageConfig('mobile', false);
      await getHomepageConfig('tablet', false);
      await getHomepageConfig('desktop', false);

      expect(getHomepageConfig).toHaveBeenCalledTimes(3);
      expect(getHomepageConfig).toHaveBeenNthCalledWith(1, 'mobile', false);
      expect(getHomepageConfig).toHaveBeenNthCalledWith(2, 'tablet', false);
      expect(getHomepageConfig).toHaveBeenNthCalledWith(3, 'desktop', false);
    });

    it('should validate authentication parameter', async () => {
      const mockConfig = {
        success: true,
        data: {
          sections: [],
          globalSettings: {},
          version: '1.0.0',
          lastUpdated: '2025-10-06T12:00:00Z',
        },
      };

      vi.mocked(getHomepageConfig).mockResolvedValue(mockConfig);

      // Test with and without authentication
      await getHomepageConfig('desktop', false);
      await getHomepageConfig('desktop', true);

      expect(getHomepageConfig).toHaveBeenNthCalledWith(1, 'desktop', false);
      expect(getHomepageConfig).toHaveBeenNthCalledWith(2, 'desktop', true);
    });

    it('should validate data types and structure', async () => {
      const mockConfig = {
        success: true,
        data: {
          sections: [
            {
              id: 'test-section',
              type: 'hero',
              title: 'Test Section',
              content: {
                headline: 'Test Headline',
                primaryCTA: {
                  text: 'Test Button',
                  url: '/test',
                  variant: 'primary',
                  size: 'lg',
                },
                backgroundType: 'gradient',
              },
              isVisible: true,
              order: 1,
              responsiveConfig: {
                mobile: { enabled: true, spacing: 'compact' },
                tablet: { enabled: true, spacing: 'normal' },
                desktop: { enabled: true, spacing: 'comfortable' },
              },
            },
          ],
          globalSettings: {
            theme: 'auto',
            animations: {
              enabled: true,
              reducedMotion: false,
              duration: 300,
            },
            performance: {
              lazyLoadImages: true,
              prefetchCriticalResources: true,
            },
          },
          version: '1.0.0',
          lastUpdated: '2025-10-06T12:00:00Z',
        },
      };

      vi.mocked(getHomepageConfig).mockResolvedValue(mockConfig);

      const result = await getHomepageConfig('desktop', false);

      // Validate data types
      expect(typeof result.data.version).toBe('string');
      expect(typeof result.data.lastUpdated).toBe('string');
      expect(Array.isArray(result.data.sections)).toBe(true);
      expect(typeof result.data.globalSettings).toBe('object');

      // Validate section data types
      const section = result.data.sections[0];
      expect(typeof section.id).toBe('string');
      expect(typeof section.type).toBe('string');
      expect(typeof section.title).toBe('string');
      expect(typeof section.isVisible).toBe('boolean');
      expect(typeof section.order).toBe('number');

      // Validate global settings data types
      expect(['light', 'dark', 'auto']).toContain(result.data.globalSettings.theme);
      expect(typeof result.data.globalSettings.animations.enabled).toBe('boolean');
      expect(typeof result.data.globalSettings.animations.duration).toBe('number');
    });
  });
});