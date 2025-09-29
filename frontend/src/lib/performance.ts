/**
 * Performance Monitoring Utilities for Aceternity UI Integration
 * Tracks animation performance, frame rates, and bundle impact
 */

import { analyticsService } from './analytics-service';
import type { PageViewMetrics, WebVitalsMetrics } from '@/types/analytics';

export interface PerformanceMetrics {
  frameRate: number;
  droppedFrames: number;
  memoryUsage: number;
  loadTime: number;
  animationLatency: number;
}

export interface PerformanceBudget {
  maxBundleSize: number; // KB
  minFrameRate: number; // FPS
  maxMemoryUsage: number; // MB
  maxLoadTime: number; // ms
}

export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  maxBundleSize: 500, // 500KB additional bundle size
  minFrameRate: 60, // 60 FPS minimum
  maxMemoryUsage: 50, // 50MB max memory usage
  maxLoadTime: 200, // 200ms max component load time
};

/**
 * Frame Rate Monitor
 * Tracks animation frame rate and dropped frames
 */
export class FrameRateMonitor {
  private frameCount = 0;
  private droppedFrames = 0;
  private lastTimestamp = 0;
  private isMonitoring = false;
  private rafId: number | null = null;

  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.lastTimestamp = performance.now();
    
    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  stop(): PerformanceMetrics {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    this.isMonitoring = false;
    const now = performance.now();
    const duration = now - this.lastTimestamp;
    const frameRate = (this.frameCount / duration) * 1000;
    
    return {
      frameRate: Math.round(frameRate),
      droppedFrames: this.droppedFrames,
      memoryUsage: this.getMemoryUsage(),
      loadTime: duration,
      animationLatency: 0, // To be calculated by specific components
    };
  }

  private tick(timestamp: number): void {
    if (!this.isMonitoring) return;
    
    const deltaTime = timestamp - this.lastTimestamp;
    
    // Detect dropped frames (assuming 60fps target)
    const expectedFrameTime = 1000 / 60;
    if (deltaTime > expectedFrameTime * 1.5) {
      this.droppedFrames++;
    }
    
    this.frameCount++;
    this.lastTimestamp = timestamp;
    
    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // Convert to MB
    }
    return 0;
  }
}

/**
 * Bundle Size Tracker
 * Monitors bundle size impact of Aceternity components
 */
export class BundleSizeTracker {
  private static instance: BundleSizeTracker;
  private loadedComponents = new Set<string>();
  private componentSizes = new Map<string, number>();

  static getInstance(): BundleSizeTracker {
    if (!BundleSizeTracker.instance) {
      BundleSizeTracker.instance = new BundleSizeTracker();
    }
    return BundleSizeTracker.instance;
  }

  trackComponent(componentName: string, size?: number): void {
    this.loadedComponents.add(componentName);
    
    if (size) {
      this.componentSizes.set(componentName, size);
    }
    
    this.checkBudget();
  }

  getTotalSize(): number {
    return Array.from(this.componentSizes.values()).reduce((total, size) => total + size, 0);
  }

  getLoadedComponents(): string[] {
    return Array.from(this.loadedComponents);
  }

  private checkBudget(): void {
    const totalSize = this.getTotalSize();
    
    if (totalSize > DEFAULT_PERFORMANCE_BUDGET.maxBundleSize) {
      console.warn(
        `⚠️ Bundle size budget exceeded: ${totalSize}KB > ${DEFAULT_PERFORMANCE_BUDGET.maxBundleSize}KB`
      );
    }
  }
}

/**
 * Animation Performance Tracker
 * Tracks individual animation performance
 */
export class AnimationTracker {
  private animationMetrics = new Map<string, PerformanceMetrics>();
  private activeAnimations = new Map<string, FrameRateMonitor>();

  startAnimation(animationId: string): void {
    const monitor = new FrameRateMonitor();
    monitor.start();
    this.activeAnimations.set(animationId, monitor);
  }

  endAnimation(animationId: string): PerformanceMetrics | null {
    const monitor = this.activeAnimations.get(animationId);
    
    if (!monitor) {
      console.warn(`Animation ${animationId} not found in active animations`);
      return null;
    }
    
    const metrics = monitor.stop();
    this.animationMetrics.set(animationId, metrics);
    this.activeAnimations.delete(animationId);
    
    this.validatePerformance(animationId, metrics);
    
    return metrics;
  }

  getAnimationMetrics(animationId: string): PerformanceMetrics | null {
    return this.animationMetrics.get(animationId) || null;
  }

  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.animationMetrics);
  }

  private validatePerformance(animationId: string, metrics: PerformanceMetrics): void {
    const budget = DEFAULT_PERFORMANCE_BUDGET;
    
    if (metrics.frameRate < budget.minFrameRate) {
      console.warn(
        `⚠️ Poor animation performance for ${animationId}: ${metrics.frameRate}fps < ${budget.minFrameRate}fps`
      );
    }
    
    if (metrics.memoryUsage > budget.maxMemoryUsage) {
      console.warn(
        `⚠️ High memory usage for ${animationId}: ${metrics.memoryUsage}MB > ${budget.maxMemoryUsage}MB`
      );
    }
  }
}

/**
 * Performance Observer Utility
 * Uses browser Performance Observer API for detailed metrics
 */
export class PerformanceObserverUtil {
  private observer: PerformanceObserver | null = null;
  private metrics: PerformanceEntry[] = [];

  start(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      this.metrics.push(...entries);
      
      // Log performance issues
      entries.forEach((entry) => {
        if (entry.entryType === 'measure' && entry.duration > 16) {
          console.warn(`⚠️ Slow operation: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
        }
      });
    });

    this.observer.observe({ 
      entryTypes: ['measure', 'navigation', 'paint', 'element']
    });
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  getMetrics(): PerformanceEntry[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

/**
 * Global Performance Manager
 * Coordinates all performance monitoring and integrates with analytics
 */
export class PerformanceManager {
  private static instance: PerformanceManager;
  private frameMonitor = new FrameRateMonitor();
  private bundleTracker = BundleSizeTracker.getInstance();
  private animationTracker = new AnimationTracker();
  private observerUtil = new PerformanceObserverUtil();
  private isEnabled = process.env.NODE_ENV === 'development';
  private sessionStartTime = performance.now();
  private webVitalsMetrics: WebVitalsMetrics = {};

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  enable(): void {
    this.isEnabled = true;
    this.observerUtil.start();
    this.startSessionTracking();
  }

  disable(): void {
    this.isEnabled = false;
    this.observerUtil.stop();
  }

  trackComponent(componentName: string, size?: number): void {
    if (!this.isEnabled) return;
    this.bundleTracker.trackComponent(componentName, size);
  }

  startAnimation(animationId: string): void {
    if (!this.isEnabled) return;
    this.animationTracker.startAnimation(animationId);
  }

  endAnimation(animationId: string): PerformanceMetrics | null {
    if (!this.isEnabled) return null;
    return this.animationTracker.endAnimation(animationId);
  }

  getOverallMetrics(): {
    bundleSize: number;
    loadedComponents: string[];
    animationMetrics: Map<string, PerformanceMetrics>;
    performanceEntries: PerformanceEntry[];
  } {
    return {
      bundleSize: this.bundleTracker.getTotalSize(),
      loadedComponents: this.bundleTracker.getLoadedComponents(),
      animationMetrics: this.animationTracker.getAllMetrics(),
      performanceEntries: this.observerUtil.getMetrics(),
    };
  }

  /**
   * Start session performance tracking
   */
  private startSessionTracking(): void {
    if (typeof window === 'undefined') return;

    // Track page load performance
    window.addEventListener('load', () => {
      this.trackPageLoadMetrics();
    });

    // Track Web Vitals
    this.trackWebVitals();

    // Track session duration
    window.addEventListener('beforeunload', () => {
      this.trackSessionDuration();
    });
  }

  /**
   * Track page load metrics
   */
  private trackPageLoadMetrics(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    const loadTime = navigation.loadEventEnd - navigation.fetchStart;
    const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
    const firstPaint = this.getMetricByType('paint', 'first-paint');
    const firstContentfulPaint = this.getMetricByType('paint', 'first-contentful-paint');

    const pageViewMetrics: PageViewMetrics = {
      loadTime: Math.round(loadTime),
      lcp: this.webVitalsMetrics.lcp || firstContentfulPaint || 0,
      fcp: this.webVitalsMetrics.fcp || firstPaint || 0,
      cls: this.webVitalsMetrics.cls || 0,
      fid: this.webVitalsMetrics.fid || 0,
      ttfb: Math.round(navigation.responseStart - navigation.fetchStart),
      bundleSize: this.bundleTracker.getTotalSize(),
      memoryUsage: this.getCurrentMemoryUsage(),
      frameRate: this.getAverageFrameRate(),
      domContentLoaded: Math.round(domContentLoaded),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // Send to analytics
    analyticsService.trackPageView(pageViewMetrics).catch(error => {
      console.error('Failed to track page view metrics:', error);
    });
  }

  /**
   * Track Web Vitals metrics
   */
  private trackWebVitals(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      // Track Core Web Vitals
      const vitalsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const metric = entry as any;
          
          switch (metric.name) {
            case 'LCP':
              this.webVitalsMetrics.lcp = Math.round(metric.startTime);
              break;
            case 'FCP':
              this.webVitalsMetrics.fcp = Math.round(metric.startTime);
              break;
            case 'CLS':
              this.webVitalsMetrics.cls = Math.round(metric.value * 1000) / 1000;
              break;
            case 'FID':
              this.webVitalsMetrics.fid = Math.round(metric.duration);
              break;
            case 'TTFB':
              this.webVitalsMetrics.ttfb = Math.round(metric.startTime);
              break;
          }
        });
      });

      vitalsObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-contentful-paint', 'layout-shift', 'first-input'] });
    } catch (error) {
      console.warn('Failed to setup Web Vitals tracking:', error);
    }
  }

  /**
   * Track session duration
   */
  private trackSessionDuration(): void {
    const duration = performance.now() - this.sessionStartTime;
    
    // Track session duration as engagement
    analyticsService.trackEngagement(
      'session',
      'duration',
      Math.round(duration),
      0,
      0
    ).catch(error => {
      console.error('Failed to track session duration:', error);
    });
  }

  /**
   * Get performance metric by type and name
   */
  private getMetricByType(type: string, name: string): number {
    const metrics = performance.getEntriesByType(type);
    const metric = metrics.find(m => m.name === name);
    return metric ? metric.startTime : 0;
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // Convert to MB
    }
    return 0;
  }

  /**
   * Get average frame rate
   */
  private getAverageFrameRate(): number {
    const metrics = this.getOverallMetrics().animationMetrics;
    if (metrics.size === 0) return 60; // Default assumption
    
    const frameRates = Array.from(metrics.values()).map(m => m.frameRate);
    const average = frameRates.reduce((sum, fr) => sum + fr, 0) / frameRates.length;
    return Math.round(average);
  }

  /**
   * Update Web Vitals metrics (for manual updates)
   */
  updateWebVitals(metrics: Partial<WebVitalsMetrics>): void {
    this.webVitalsMetrics = { ...this.webVitalsMetrics, ...metrics };
  }

  /**
   * Get current Web Vitals metrics
   */
  getWebVitalsMetrics(): WebVitalsMetrics {
    return { ...this.webVitalsMetrics };
  }
}

// Export singleton instance
export const performanceManager = PerformanceManager.getInstance();

// Development helpers
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Make performance manager available globally for debugging
  (window as any).__performanceManager = performanceManager;
  
  // Auto-enable in development
  performanceManager.enable();
}