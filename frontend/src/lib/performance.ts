/**
 * Performance Monitoring Utilities for Aceternity UI Integration
 * Tracks animation performance, frame rates, and bundle impact
 */

import { analyticsService } from './analytics-service';
import type { PageViewMetrics, WebVitalsMetrics } from '@/types/analytics';
import { SectionName, EngagementType } from '@/types/analytics';

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
    
    const metrics = this.animationTracker.endAnimation(animationId);
    
    // Send animation performance metrics to analytics
    if (metrics) {
      this.reportAnimationMetrics(animationId, metrics);
    }
    
    return metrics;
  }

  /**
   * Report animation performance metrics to analytics
   */
  private reportAnimationMetrics(animationId: string, metrics: PerformanceMetrics): void {
    // Only report poor performance to avoid noise
    if (metrics.frameRate < DEFAULT_PERFORMANCE_BUDGET.minFrameRate || 
        metrics.memoryUsage > DEFAULT_PERFORMANCE_BUDGET.maxMemoryUsage ||
        metrics.droppedFrames > 10) {
      
      analyticsService.trackEngagement(
        SectionName.FEATURES, // Animations are typically part of features
        EngagementType.INTERACT, // Animation is an interaction
        metrics.loadTime, // Duration of animation
        0, // No scroll depth for animations
        1  // One animation interaction
      ).catch(error => {
        console.warn(`[Performance] Failed to report animation metrics for ${animationId}:`, error);
      });

      console.warn(`[Performance] Poor animation performance for ${animationId}:`, {
        frameRate: metrics.frameRate,
        droppedFrames: metrics.droppedFrames,
        memoryUsage: metrics.memoryUsage
      });
    }
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

    // Send to analytics with enhanced error handling and retry logic
    this.sendMetricsToAnalytics(pageViewMetrics, 'pageLoad');
  }

  /**
   * Send metrics to analytics with retry logic
   */
  private async sendMetricsToAnalytics(
    metrics: PageViewMetrics, 
    source: string,
    retryCount: number = 0
  ): Promise<void> {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

    try {
      await analyticsService.trackPageView(metrics);
      console.log(`[Performance] Successfully sent ${source} metrics to analytics`);
    } catch (error) {
      console.error(`[Performance] Failed to send ${source} metrics (attempt ${retryCount + 1}):`, error);
      
      // Retry with exponential backoff
      if (retryCount < maxRetries) {
        setTimeout(() => {
          this.sendMetricsToAnalytics(metrics, source, retryCount + 1);
        }, retryDelay);
      } else {
        console.error(`[Performance] Failed to send ${source} metrics after ${maxRetries} attempts`);
      }
    }
  }

  /**
   * Track Web Vitals metrics
   */
  private trackWebVitals(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      // Track Core Web Vitals with automatic analytics reporting
      const vitalsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const metric = entry as any;
          let metricName = '';
          let metricValue = 0;
          
          switch (metric.name) {
            case 'LCP':
              this.webVitalsMetrics.lcp = Math.round(metric.startTime);
              metricName = 'LCP';
              metricValue = this.webVitalsMetrics.lcp;
              break;
            case 'FCP':
              this.webVitalsMetrics.fcp = Math.round(metric.startTime);
              metricName = 'FCP';
              metricValue = this.webVitalsMetrics.fcp;
              break;
            case 'CLS':
              this.webVitalsMetrics.cls = Math.round(metric.value * 1000) / 1000;
              metricName = 'CLS';
              metricValue = this.webVitalsMetrics.cls;
              break;
            case 'FID':
              this.webVitalsMetrics.fid = Math.round(metric.duration);
              metricName = 'FID';
              metricValue = this.webVitalsMetrics.fid;
              break;
            case 'TTFB':
              this.webVitalsMetrics.ttfb = Math.round(metric.startTime);
              metricName = 'TTFB';
              metricValue = this.webVitalsMetrics.ttfb;
              break;
          }

          // Send individual Web Vital metric to analytics for real-time monitoring
          if (metricName) {
            this.reportWebVitalMetric(metricName, metricValue);
          }
        });
      });

      vitalsObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-contentful-paint', 'layout-shift', 'first-input'] });
    } catch (error) {
      console.warn('Failed to setup Web Vitals tracking:', error);
    }
  }

  /**
   * Report individual Web Vital metric to analytics
   */
  private reportWebVitalMetric(metricName: string, value: number): void {
    // Create a performance engagement event for the Web Vital
    analyticsService.trackEngagement(
      SectionName.HERO, // Use HERO as the default section for page-level metrics
      EngagementType.VIEW, // Use VIEW for performance metrics
      value, // Duration represents the metric value
      0, // No scroll depth for performance metrics
      0  // No interactions for performance metrics
    ).catch(error => {
      console.warn(`[Performance] Failed to report ${metricName} metric:`, error);
    });

    // Log performance warnings based on Web Vitals thresholds
    this.checkPerformanceThresholds(metricName, value);
  }

  /**
   * Check performance thresholds and warn about poor performance
   */
  private checkPerformanceThresholds(metricName: string, value: number): void {
    const thresholds: Record<string, { good: number; poor: number }> = {
      'LCP': { good: 2500, poor: 4000 },
      'FCP': { good: 1800, poor: 3000 },
      'CLS': { good: 0.1, poor: 0.25 },
      'FID': { good: 100, poor: 300 },
      'TTFB': { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metricName];
    if (!threshold) return;

    if (value > threshold.poor) {
      console.warn(`⚠️ Poor ${metricName} performance: ${value} (threshold: ${threshold.poor})`);
    } else if (value > threshold.good) {
      console.warn(`⚠️ Needs improvement ${metricName}: ${value} (threshold: ${threshold.good})`);
    } else {
      console.log(`✅ Good ${metricName} performance: ${value}`);
    }
  }

  /**
   * Track session duration
   */
  private trackSessionDuration(): void {
    const duration = performance.now() - this.sessionStartTime;
    
    // Track session duration as engagement
    analyticsService.trackEngagement(
      SectionName.HERO,
      EngagementType.VIEW,
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

  /**
   * Get comprehensive performance summary and optionally send to analytics
   */
  getPerformanceSummary(sendToAnalytics: boolean = false): {
    webVitals: WebVitalsMetrics;
    bundleSize: number;
    memoryUsage: number;
    frameRate: number;
    animationCount: number;
    componentCount: number;
    sessionDuration: number;
  } {
    const sessionDuration = performance.now() - this.sessionStartTime;
    const overallMetrics = this.getOverallMetrics();
    
    const summary = {
      webVitals: this.getWebVitalsMetrics(),
      bundleSize: overallMetrics.bundleSize,
      memoryUsage: this.getCurrentMemoryUsage(),
      frameRate: this.getAverageFrameRate(),
      animationCount: overallMetrics.animationMetrics.size,
      componentCount: overallMetrics.loadedComponents.length,
      sessionDuration: Math.round(sessionDuration)
    };

    if (sendToAnalytics) {
      // Create a comprehensive page view metric
      const comprehensiveMetrics: PageViewMetrics = {
        loadTime: summary.sessionDuration,
        lcp: summary.webVitals.lcp || 0,
        fcp: summary.webVitals.fcp || 0,
        cls: summary.webVitals.cls || 0,
        fid: summary.webVitals.fid || 0,
        ttfb: summary.webVitals.ttfb || 0,
        bundleSize: summary.bundleSize,
        memoryUsage: summary.memoryUsage,
        frameRate: summary.frameRate,
        domContentLoaded: 0, // Not applicable for summary
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : { width: 0, height: 0 }
      };

      this.sendMetricsToAnalytics(comprehensiveMetrics, 'performanceSummary');
    }

    return summary;
  }

  /**
   * Force a performance summary report to analytics
   */
  reportPerformanceSummary(): void {
    this.getPerformanceSummary(true);
  }
}

// Export singleton instance
export const performanceManager = PerformanceManager.getInstance();

/**
 * Performance Optimization Strategies
 * Based on monitoring data and test results
 */

/**
 * Adaptive Performance Manager
 * Automatically adjusts performance settings based on device capabilities
 */
export class AdaptivePerformanceManager {
  private static instance: AdaptivePerformanceManager;
  private deviceCapabilities: DeviceCapabilities;
  private performanceMode: 'high' | 'standard' | 'low' = 'standard';

  static getInstance(): AdaptivePerformanceManager {
    if (!AdaptivePerformanceManager.instance) {
      AdaptivePerformanceManager.instance = new AdaptivePerformanceManager();
    }
    return AdaptivePerformanceManager.instance;
  }

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.performanceMode = this.determinePerformanceMode();
  }

  getPerformanceMode(): 'high' | 'standard' | 'low' {
    return this.performanceMode;
  }

  shouldReduceAnimations(): boolean {
    // Check for reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return true;
    }

    // Check device capabilities
    return this.performanceMode === 'low';
  }

  shouldOptimizeImages(): boolean {
    return this.performanceMode === 'low' || this.deviceCapabilities.connectionType === 'slow';
  }

  shouldLazyLoadComponents(): boolean {
    return this.performanceMode !== 'high';
  }

  getOptimalAnimationDuration(defaultDuration: number): number {
    switch (this.performanceMode) {
      case 'high':
        return defaultDuration;
      case 'standard':
        return defaultDuration * 0.8;
      case 'low':
        return defaultDuration * 0.5;
      default:
        return defaultDuration;
    }
  }

  private detectDeviceCapabilities(): DeviceCapabilities {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return { memory: 4, cores: 2, connectionType: 'unknown' };
    }

    const memory = (navigator as any).deviceMemory || 4; // GB
    const cores = navigator.hardwareConcurrency || 2;
    
    // Detect connection type
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    let connectionType: 'fast' | 'medium' | 'slow' | 'unknown' = 'unknown';
    
    if (connection) {
      if (connection.effectiveType === '4g' || connection.effectiveType === '5g') {
        connectionType = 'fast';
      } else if (connection.effectiveType === '3g') {
        connectionType = 'medium';
      } else {
        connectionType = 'slow';
      }
    }

    return { memory, cores, connectionType };
  }

  private determinePerformanceMode(): 'high' | 'standard' | 'low' {
    const { memory, cores, connectionType } = this.deviceCapabilities;

    // High performance: 8GB+ RAM, 4+ cores, fast connection
    if (memory >= 8 && cores >= 4 && connectionType === 'fast') {
      return 'high';
    }

    // Low performance: <2GB RAM, <2 cores, or slow connection
    if (memory < 2 || cores < 2 || connectionType === 'slow') {
      return 'low';
    }

    // Standard performance for everything else
    return 'standard';
  }
}

interface DeviceCapabilities {
  memory: number; // GB
  cores: number;
  connectionType: 'fast' | 'medium' | 'slow' | 'unknown';
}

/**
 * Bundle Size Optimizer
 * Implements code splitting and lazy loading strategies
 */
export class BundleSizeOptimizer {
  private static instance: BundleSizeOptimizer;
  private loadedChunks = new Set<string>();
  private chunkSizes = new Map<string, number>();
  private criticalChunks = new Set(['main', 'vendor', 'runtime']);

  static getInstance(): BundleSizeOptimizer {
    if (!BundleSizeOptimizer.instance) {
      BundleSizeOptimizer.instance = new BundleSizeOptimizer();
    }
    return BundleSizeOptimizer.instance;
  }

  /**
   * Preload critical chunks
   */
  preloadCriticalChunks(): void {
    if (typeof window === 'undefined') return;

    // Preload critical CSS and JS chunks
    this.criticalChunks.forEach(chunkName => {
      this.preloadChunk(chunkName);
    });
  }

  /**
   * Lazy load non-critical components
   */
  async lazyLoadComponent<T>(
    componentLoader: () => Promise<T>,
    componentName: string,
    fallback?: React.ComponentType
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const component = await componentLoader();
      
      const loadTime = performance.now() - startTime;
      this.trackChunkLoad(componentName, loadTime);
      
      return component;
    } catch (error) {
      console.error(`Failed to lazy load component ${componentName}:`, error);
      throw error;
    }
  }

  /**
   * Optimize image loading based on device capabilities
   */
  getOptimizedImageProps(src: string, alt: string): {
    src: string;
    alt: string;
    loading: 'lazy' | 'eager';
    sizes?: string;
  } {
    const adaptiveManager = AdaptivePerformanceManager.getInstance();
    const shouldOptimize = adaptiveManager.shouldOptimizeImages();

    return {
      src: shouldOptimize ? this.getOptimizedImageSrc(src) : src,
      alt,
      loading: adaptiveManager.shouldLazyLoadComponents() ? 'lazy' : 'eager',
      sizes: shouldOptimize ? this.getResponsiveSizes() : undefined
    };
  }

  private preloadChunk(chunkName: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = `/chunks/${chunkName}.js`; // Adjust path as needed
    document.head.appendChild(link);
  }

  private trackChunkLoad(chunkName: string, loadTime: number): void {
    this.loadedChunks.add(chunkName);
    this.chunkSizes.set(chunkName, loadTime);

    // Warn about slow chunk loading
    if (loadTime > 1000) {
      console.warn(`⚠️ Slow chunk load: ${chunkName} took ${loadTime.toFixed(2)}ms`);
    }
  }

  private getOptimizedImageSrc(src: string): string {
    // Implement image optimization logic (WebP, compression, etc.)
    return src.replace(/\.(jpg|jpeg|png)$/, '.webp');
  }

  private getResponsiveSizes(): string {
    return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
  }
}

/**
 * Memory Optimizer
 * Manages memory usage and prevents memory leaks
 */
export class MemoryOptimizer {
  private static instance: MemoryOptimizer;
  private cleanupTasks = new Set<() => void>();
  private memoryThreshold = 50; // MB
  private checkInterval: NodeJS.Timeout | null = null;

  static getInstance(): MemoryOptimizer {
    if (!MemoryOptimizer.instance) {
      MemoryOptimizer.instance = new MemoryOptimizer();
    }
    return MemoryOptimizer.instance;
  }

  startMonitoring(): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Check every 30 seconds
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  addCleanupTask(task: () => void): void {
    this.cleanupTasks.add(task);
  }

  removeCleanupTask(task: () => void): void {
    this.cleanupTasks.delete(task);
  }

  forceCleanup(): void {
    // Run all cleanup tasks
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    });

    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  private checkMemoryUsage(): void {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    const memory = (performance as any).memory;
    const usedMB = memory.usedJSHeapSize / 1024 / 1024;

    if (usedMB > this.memoryThreshold) {
      console.warn(`⚠️ High memory usage: ${usedMB.toFixed(2)}MB > ${this.memoryThreshold}MB`);
      this.forceCleanup();
    }
  }
}

/**
 * Performance Optimization Utility Functions
 */
export const PerformanceOptimizer = {
  /**
   * Debounce function to limit function calls
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function to limit function calls
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Intersection Observer with performance optimizations
   */
  createOptimizedIntersectionObserver(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver | null {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return null;
    }

    const adaptiveManager = AdaptivePerformanceManager.getInstance();
    const optimizedOptions = {
      rootMargin: '10px',
      threshold: adaptiveManager.getPerformanceMode() === 'low' ? [0] : [0, 0.25, 0.5, 0.75, 1],
      ...options
    };

    return new IntersectionObserver(callback, optimizedOptions);
  },

  /**
   * Optimized RAF for animations
   */
  createOptimizedAnimationFrame(
    callback: FrameRequestCallback
  ): number | null {
    if (typeof window === 'undefined') return null;

    const adaptiveManager = AdaptivePerformanceManager.getInstance();
    
    if (adaptiveManager.shouldReduceAnimations()) {
      // Skip animation frames on low-performance devices
      setTimeout(() => callback(performance.now()), 16);
      return null;
    }

    return requestAnimationFrame(callback);
  },

  /**
   * Preload resources based on priority
   */
  preloadResource(href: string, as: string, priority: 'high' | 'low' = 'low'): void {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = priority === 'high' ? 'preload' : 'prefetch';
    link.href = href;
    link.as = as;
    
    if (priority === 'high') {
      link.crossOrigin = 'anonymous';
    }

    document.head.appendChild(link);
  }
};

// Initialize optimization singletons
export const adaptivePerformanceManager = AdaptivePerformanceManager.getInstance();
export const bundleSizeOptimizer = BundleSizeOptimizer.getInstance();
export const memoryOptimizer = MemoryOptimizer.getInstance();

// Enhanced performance manager with optimizations
export class EnhancedPerformanceManager extends PerformanceManager {
  private adaptiveManager = AdaptivePerformanceManager.getInstance();
  private bundleOptimizer = BundleSizeOptimizer.getInstance();
  private memoryOptimizer = MemoryOptimizer.getInstance();

  enable(): void {
    super.enable();
    
    // Start adaptive optimizations
    this.bundleOptimizer.preloadCriticalChunks();
    this.memoryOptimizer.startMonitoring();
    
    // Set up performance monitoring based on device capabilities
    this.setupAdaptiveMonitoring();
  }

  disable(): void {
    super.disable();
    this.memoryOptimizer.stopMonitoring();
  }

  private setupAdaptiveMonitoring(): void {
    const mode = this.adaptiveManager.getPerformanceMode();
    
    // Adjust monitoring frequency based on performance mode
    const monitoringInterval = mode === 'high' ? 5000 : mode === 'standard' ? 10000 : 20000;
    
    setInterval(() => {
      const summary = this.getPerformanceSummary();
      this.optimizeBasedOnMetrics(summary);
    }, monitoringInterval);
  }

  private optimizeBasedOnMetrics(summary: any): void {
    // Bundle size optimization
    if (summary.bundleSize > 400) { // KB
      console.warn('⚠️ Bundle size approaching limit, consider code splitting');
    }

    // Memory optimization
    if (summary.memoryUsage > 40) { // MB
      this.memoryOptimizer.forceCleanup();
    }

    // Frame rate optimization
    if (summary.frameRate < 45) {
      console.warn('⚠️ Low frame rate detected, reducing animation complexity');
    }
  }
}

// Export enhanced performance manager
export const enhancedPerformanceManager = new EnhancedPerformanceManager();

// Development helpers
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Make performance manager available globally for debugging
  (window as any).__performanceManager = performanceManager;
  (window as any).__enhancedPerformanceManager = enhancedPerformanceManager;
  (window as any).__adaptivePerformanceManager = adaptivePerformanceManager;
  
  // Auto-enable in development
  enhancedPerformanceManager.enable();
  
  // Add performance debugging commands
  (window as any).__performanceDebug = {
    getMetrics: () => enhancedPerformanceManager.getPerformanceSummary(),
    getDeviceCapabilities: () => adaptivePerformanceManager,
    optimizeMemory: () => memoryOptimizer.forceCleanup(),
    togglePerformanceMode: () => {
      const currentMode = adaptivePerformanceManager.getPerformanceMode();
      console.log(`Current performance mode: ${currentMode}`);
      console.log('Device capabilities:', adaptivePerformanceManager);
    }
  };
}