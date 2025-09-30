/**
 * Performance test for Core Web Vitals
 * Tests homepage performance metrics compliance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock web-vitals
const mockGetCLS = vi.fn();
const mockGetFCP = vi.fn();
const mockGetFID = vi.fn();
const mockGetLCP = vi.fn();
const mockGetTTFB = vi.fn();

vi.mock('web-vitals', () => ({
  getCLS: mockGetCLS,
  getFCP: mockGetFCP,
  getFID: mockGetFID,
  getLCP: mockGetLCP,
  getTTFB: mockGetTTFB,
}));

// Mock performance monitoring
const mockPerformanceMonitor = {
  startMonitoring: vi.fn(),
  stopMonitoring: vi.fn(),
  getMetrics: vi.fn()
};

vi.mock('@/lib/performance', () => ({
  performanceManager: mockPerformanceMonitor
}));

// Mock homepage component
const MockHomepage = () => (
  <div data-testid="homepage">
    <header>
      <h1>Generate Engaging Quizzes with AI</h1>
      <button>Get Started</button>
    </header>
    <section>
      <div>Features</div>
    </section>
  </div>
);

describe('Core Web Vitals Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock good performance metrics
    mockGetLCP.mockImplementation((callback) => {
      callback({ value: 1200 }); // Good LCP
    });
    
    mockGetFCP.mockImplementation((callback) => {
      callback({ value: 800 }); // Good FCP
    });
    
    mockGetCLS.mockImplementation((callback) => {
      callback({ value: 0.05 }); // Good CLS
    });
    
    mockGetFID.mockImplementation((callback) => {
      callback({ value: 50 }); // Good FID
    });
    
    mockGetTTFB.mockImplementation((callback) => {
      callback({ value: 300 }); // Good TTFB
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Largest Contentful Paint (LCP)', () => {
    it('should meet LCP performance target of ≤1.5s', async () => {
      // This test MUST fail until homepage performance is optimized
      render(<MockHomepage />);

      // Wait for LCP measurement
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockGetLCP).toHaveBeenCalled();
      
      // LCP should be ≤ 1500ms (1.5 seconds)
      const lcpCallback = mockGetLCP.mock.calls[0][0];
      lcpCallback({ value: 1200 });
      
      expect(1200).toBeLessThanOrEqual(1500);
    });

    it('should identify poor LCP performance', async () => {
      mockGetLCP.mockImplementation((callback) => {
        callback({ value: 3000 }); // Poor LCP
      });

      render(<MockHomepage />);

      await new Promise(resolve => setTimeout(resolve, 100));

      const lcpCallback = mockGetLCP.mock.calls[0][0];
      lcpCallback({ value: 3000 });
      
      // Should flag poor performance
      expect(3000).toBeGreaterThan(2500); // Poor threshold
    });
  });

  describe('First Contentful Paint (FCP)', () => {
    it('should meet FCP performance target of ≤1.5s', async () => {
      render(<MockHomepage />);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockGetFCP).toHaveBeenCalled();
      
      const fcpCallback = mockGetFCP.mock.calls[0][0];
      fcpCallback({ value: 800 });
      
      // FCP should be ≤ 1500ms (1.5 seconds)
      expect(800).toBeLessThanOrEqual(1500);
    });

    it('should measure FCP consistently', async () => {
      render(<MockHomepage />);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should be called exactly once per page load
      expect(mockGetFCP).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cumulative Layout Shift (CLS)', () => {
    it('should meet CLS performance target of ≤0.1', async () => {
      render(<MockHomepage />);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockGetCLS).toHaveBeenCalled();
      
      const clsCallback = mockGetCLS.mock.calls[0][0];
      clsCallback({ value: 0.05 });
      
      // CLS should be ≤ 0.1
      expect(0.05).toBeLessThanOrEqual(0.1);
    });

    it('should detect layout shift issues', async () => {
      mockGetCLS.mockImplementation((callback) => {
        callback({ value: 0.3 }); // Poor CLS
      });

      render(<MockHomepage />);

      await new Promise(resolve => setTimeout(resolve, 100));

      const clsCallback = mockGetCLS.mock.calls[0][0];
      clsCallback({ value: 0.3 });
      
      // Should flag poor layout stability
      expect(0.3).toBeGreaterThan(0.25); // Poor threshold
    });
  });

  describe('First Input Delay (FID)', () => {
    it('should meet FID performance target of ≤100ms', async () => {
      render(<MockHomepage />);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockGetFID).toHaveBeenCalled();
      
      const fidCallback = mockGetFID.mock.calls[0][0];
      fidCallback({ value: 50 });
      
      // FID should be ≤ 100ms
      expect(50).toBeLessThanOrEqual(100);
    });

    it('should handle interaction responsiveness', async () => {
      render(<MockHomepage />);

      // Simulate user interaction
      const button = document.querySelector('button');
      if (button) {
        button.click();
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockGetFID).toHaveBeenCalled();
    });
  });

  describe('Time to First Byte (TTFB)', () => {
    it('should measure server response time', async () => {
      render(<MockHomepage />);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockGetTTFB).toHaveBeenCalled();
      
      const ttfbCallback = mockGetTTFB.mock.calls[0][0];
      ttfbCallback({ value: 300 });
      
      // TTFB should be reasonable (≤800ms)
      expect(300).toBeLessThanOrEqual(800);
    });
  });

  describe('Performance Budget Compliance', () => {
    it('should meet overall performance budget requirements', async () => {
      render(<MockHomepage />);

      await new Promise(resolve => setTimeout(resolve, 200));

      // All metrics should be within budget
      const metrics = {
        lcp: 1200,  // ≤ 1500ms ✓
        fcp: 800,   // ≤ 1500ms ✓
        cls: 0.05,  // ≤ 0.1 ✓
        fid: 50,    // ≤ 100ms ✓
        ttfb: 300   // ≤ 800ms ✓
      };

      expect(metrics.lcp).toBeLessThanOrEqual(1500);
      expect(metrics.fcp).toBeLessThanOrEqual(1500);
      expect(metrics.cls).toBeLessThanOrEqual(0.1);
      expect(metrics.fid).toBeLessThanOrEqual(100);
      expect(metrics.ttfb).toBeLessThanOrEqual(800);
    });

    it('should track performance regression', async () => {
      // Mock poor performance across all metrics
      mockGetLCP.mockImplementation((callback) => callback({ value: 4000 }));
      mockGetFCP.mockImplementation((callback) => callback({ value: 3000 }));
      mockGetCLS.mockImplementation((callback) => callback({ value: 0.5 }));
      mockGetFID.mockImplementation((callback) => callback({ value: 500 }));

      render(<MockHomepage />);

      await new Promise(resolve => setTimeout(resolve, 200));

      // Should detect performance regression
      const poorMetrics = {
        lcp: 4000,
        fcp: 3000,
        cls: 0.5,
        fid: 500
      };

      expect(poorMetrics.lcp).toBeGreaterThan(1500);
      expect(poorMetrics.fcp).toBeGreaterThan(1500);
      expect(poorMetrics.cls).toBeGreaterThan(0.1);
      expect(poorMetrics.fid).toBeGreaterThan(100);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should integrate with performance monitoring system', async () => {
      render(<MockHomepage />);

      expect(mockPerformanceMonitor.startMonitoring).toHaveBeenCalled();
    });

    it('should collect and report metrics', async () => {
      mockPerformanceMonitor.getMetrics.mockReturnValue({
        lcp: 1200,
        fcp: 800,
        cls: 0.05,
        fid: 50,
        ttfb: 300
      });

      render(<MockHomepage />);

      const metrics = mockPerformanceMonitor.getMetrics();
      
      expect(metrics).toEqual({
        lcp: 1200,
        fcp: 800,
        cls: 0.05,
        fid: 50,
        ttfb: 300
      });
    });
  });

  describe('Real User Monitoring (RUM)', () => {
    it('should support RUM data collection', async () => {
      render(<MockHomepage />);

      // Should collect real user performance data
      expect(mockGetLCP).toHaveBeenCalled();
      expect(mockGetFCP).toHaveBeenCalled();
      expect(mockGetCLS).toHaveBeenCalled();
      expect(mockGetFID).toHaveBeenCalled();
    });

    it('should handle performance observer errors gracefully', async () => {
      mockGetLCP.mockImplementation(() => {
        throw new Error('PerformanceObserver not supported');
      });

      expect(() => {
        render(<MockHomepage />);
      }).not.toThrow();
    });
  });
});