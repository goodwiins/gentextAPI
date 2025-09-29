/**
 * Analytics Service Integration
 * Centralized service for tracking homepage analytics with Appwrite
 */

import { v4 as uuidv4 } from 'uuid';
import { HomepageMetricsService } from './models/homepage-metrics';
import { ConversionEventsService } from './models/conversion-events';
import { FeatureEngagementService } from './models/feature-engagement';
import type {
  HomepageMetrics,
  ConversionEvent,
  FeatureEngagement,
  PageViewMetrics,
  ConversionEventData,
  AnalyticsEvent,
  AnalyticsQueue,
  AnalyticsServiceConfig
} from '@/types/analytics';

class AnalyticsService {
  private sessionId: string;
  private userId: string | null = null;
  private isEnabled: boolean = true;
  private queue: AnalyticsEvent[] = [];
  private config: AnalyticsServiceConfig;
  private flushTimeout: NodeJS.Timeout | null = null;

  constructor(config?: Partial<AnalyticsServiceConfig>) {
    this.sessionId = uuidv4();
    this.config = {
      endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
      projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
      enabledInDevelopment: false,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      ...config
    };

    // Disable in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !this.config.enabledInDevelopment) {
      this.isEnabled = false;
      console.warn('[Analytics] Disabled in development mode');
    }

    // Auto-flush queue periodically
    this.scheduleFlush();

    // Flush queue before page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  /**
   * Generate a unique ID for analytics events
   */
  private generateId(): string {
    return uuidv4();
  }

  /**
   * Set the current user ID for analytics tracking
   */
  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Track homepage performance metrics
   */
  async trackPageView(metrics: PageViewMetrics, options?: {
    userAgent?: string;
    viewport?: { width: number; height: number };
    referrer?: string;
  }): Promise<void> {
    if (!this.isEnabled) {
      console.log('[Analytics] Page view tracking disabled');
      return;
    }

    try {
      const homepageMetrics: HomepageMetrics = {
        id: this.generateId(),
        sessionId: this.sessionId,
        userId: this.userId || undefined,
        timestamp: new Date().toISOString(),
        pageView: metrics,
        userAgent: options?.userAgent || navigator.userAgent,
        viewport: options?.viewport || {
          width: window.innerWidth,
          height: window.innerHeight
        },
        referrer: options?.referrer || document.referrer,
        createdAt: new Date().toISOString()
      };

      // Add to queue for batch processing
      this.addToQueue({
        type: 'pageView',
        data: homepageMetrics,
        timestamp: new Date().toISOString()
      });

      // Process immediately for page view metrics (important for performance tracking)
      await this.processPageViewMetrics(homepageMetrics);

    } catch (error) {
      console.error('[Analytics] Failed to track page view:', error);
    }
  }

  /**
   * Track conversion events (CTA clicks, sign-ups, etc.)
   */
  async trackConversion(
    eventType: ConversionEvent['eventType'],
    eventData: ConversionEventData,
    successful: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    if (!this.isEnabled) {
      console.log('[Analytics] Conversion tracking disabled');
      return;
    }

    try {
      const conversionEvent: ConversionEvent = {
        id: this.generateId(),
        sessionId: this.sessionId,
        userId: this.userId || undefined,
        eventType,
        eventData,
        timestamp: new Date().toISOString(),
        successful,
        errorMessage,
        createdAt: new Date().toISOString()
      };

      // Add to queue
      this.addToQueue({
        type: 'conversion',
        data: conversionEvent,
        timestamp: new Date().toISOString()
      });

      // Flush immediately for conversion events (high priority)
      await this.processConversionEvent(conversionEvent);

    } catch (error) {
      console.error('[Analytics] Failed to track conversion:', error);
    }
  }

  /**
   * Track section engagement
   */
  async trackEngagement(
    sectionName: FeatureEngagement['sectionName'],
    engagementType: FeatureEngagement['engagementType'],
    duration: number,
    scrollDepth: number,
    interactions: number = 0
  ): Promise<void> {
    if (!this.isEnabled) {
      console.log('[Analytics] Engagement tracking disabled');
      return;
    }

    try {
      const engagement: FeatureEngagement = {
        id: this.generateId(),
        sessionId: this.sessionId,
        sectionName,
        engagementType,
        duration,
        scrollDepth,
        interactions,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      // Add to queue
      this.addToQueue({
        type: 'engagement',
        data: engagement,
        timestamp: new Date().toISOString()
      });

      // Batch process engagement events (lower priority)
      if (this.queue.length >= this.config.batchSize!) {
        await this.flush();
      }

    } catch (error) {
      console.error('[Analytics] Failed to track engagement:', error);
    }
  }

  /**
   * Flush queued events to storage
   */
  async flush(): Promise<void> {
    if (!this.isEnabled || this.queue.length === 0) {
      return;
    }

    const eventsToProcess = [...this.queue];
    this.queue = [];

    try {
      // Process events by type
      const pageViewEvents = eventsToProcess.filter(e => e.type === 'pageView');
      const conversionEvents = eventsToProcess.filter(e => e.type === 'conversion');
      const engagementEvents = eventsToProcess.filter(e => e.type === 'engagement');

      // Process in parallel
      await Promise.allSettled([
        ...pageViewEvents.map(e => this.processPageViewMetrics(e.data as any)),
        ...conversionEvents.map(e => this.processConversionEvent(e.data as any)),
        ...engagementEvents.map(e => this.processEngagementEvent(e.data as any))
      ]);

      console.log(`[Analytics] Flushed ${eventsToProcess.length} events`);

    } catch (error) {
      console.error('[Analytics] Failed to flush events:', error);
      // Re-add failed events to queue
      this.queue.unshift(...eventsToProcess);
    }
  }

  /**
   * Enable or disable analytics tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled && this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    } else if (enabled) {
      this.scheduleFlush();
    }
  }

  /**
   * Get current analytics status
   */
  getStatus(): {
    enabled: boolean;
    sessionId: string;
    userId: string | null;
    queueSize: number;
  } {
    return {
      enabled: this.isEnabled,
      sessionId: this.sessionId,
      userId: this.userId,
      queueSize: this.queue.length
    };
  }

  /**
   * Clear analytics data (for GDPR compliance)
   */
  clearData(): void {
    this.queue = [];
    this.sessionId = uuidv4();
    this.userId = null;
  }

  /**
   * Private: Add event to processing queue
   */
  private addToQueue(event: AnalyticsEvent): void {
    this.queue.push(event);

    // Prevent queue from growing too large
    if (this.queue.length > this.config.batchSize! * 5) {
      console.warn('[Analytics] Queue size exceeded, dropping oldest events');
      this.queue = this.queue.slice(-this.config.batchSize! * 3);
    }
  }

  /**
   * Private: Schedule automatic queue flushing
   */
  private scheduleFlush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }

    this.flushTimeout = setTimeout(() => {
      this.flush().finally(() => {
        if (this.isEnabled) {
          this.scheduleFlush();
        }
      });
    }, this.config.flushInterval);
  }

  /**
   * Private: Process page view metrics
   */
  private async processPageViewMetrics(data: Omit<HomepageMetrics, 'id' | 'createdAt'>): Promise<void> {
    try {
      await HomepageMetricsService.create(data);
    } catch (error) {
      console.error('[Analytics] Failed to save page view metrics:', error);
      throw error;
    }
  }

  /**
   * Private: Process conversion event
   */
  private async processConversionEvent(data: ConversionEvent): Promise<void> {
    try {
      await ConversionEventsService.create(data);
    } catch (error) {
      console.error('[Analytics] Failed to save conversion event:', error);
      throw error;
    }
  }

  /**
   * Private: Process engagement event
   */
  private async processEngagementEvent(data: FeatureEngagement): Promise<void> {
    try {
      await FeatureEngagementService.create(data);
    } catch (error) {
      console.error('[Analytics] Failed to save engagement event:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService({
  enabledInDevelopment: process.env.NEXT_PUBLIC_PERFORMANCE_MODE === 'development'
});

export default analyticsService;