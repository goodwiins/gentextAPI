/**
 * useHomepageAnalytics Hook
 * React hook for tracking homepage analytics events
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { analyticsService } from '@/lib/analytics-service';
import type {
  UseAnalyticsReturn,
  PageViewMetrics,
  ConversionEvent,
  FeatureEngagement,
  ConversionEventData
} from '@/types/analytics';

export function useHomepageAnalytics(): UseAnalyticsReturn {
  const { user } = useAuth();
  const sessionStartTime = useRef<number>(Date.now());
  const isInitialized = useRef<boolean>(false);

  // Initialize analytics with user context
  useEffect(() => {
    if (!isInitialized.current) {
      analyticsService.setUserId(user?.$id || null);
      isInitialized.current = true;
    } else if (user) {
      // Update user ID if authentication state changes
      analyticsService.setUserId(user.$id);
    }
  }, [user]);

  /**
   * Track page view performance metrics
   */
  const trackPageView = useCallback(async (metrics: PageViewMetrics): Promise<void> => {
    try {
      await analyticsService.trackPageView(metrics, {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        referrer: document.referrer
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
      // Don't throw to prevent breaking the UI
    }
  }, []);

  /**
   * Track conversion events (CTA clicks, form submissions, etc.)
   */
  const trackConversion = useCallback(async (
    event: Omit<ConversionEvent, 'id' | 'sessionId' | 'timestamp' | 'createdAt'>
  ): Promise<void> => {
    try {
      // Calculate time on page
      const timeOnPage = Date.now() - sessionStartTime.current;
      
      // Get current scroll position as percentage
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;

      // Enhance event data with automatic metrics
      const enhancedEventData: ConversionEventData = {
        ...event.eventData,
        scrollDepth: event.eventData.scrollDepth || Math.max(0, Math.min(100, scrollDepth)),
        timeOnPage: event.eventData.timeOnPage || timeOnPage
      };

      await analyticsService.trackConversion(
        event.eventType,
        enhancedEventData,
        event.successful,
        event.errorMessage
      );
    } catch (error) {
      console.error('Failed to track conversion:', error);
      // Don't throw to prevent breaking the UI
    }
  }, []);

  /**
   * Track section engagement
   */
  const trackEngagement = useCallback(async (
    engagement: Omit<FeatureEngagement, 'id' | 'sessionId' | 'timestamp' | 'createdAt'>
  ): Promise<void> => {
    try {
      await analyticsService.trackEngagement(
        engagement.sectionName,
        engagement.engagementType,
        engagement.duration,
        engagement.scrollDepth,
        engagement.interactions
      );
    } catch (error) {
      console.error('Failed to track engagement:', error);
      // Don't throw to prevent breaking the UI
    }
  }, []);

  /**
   * Manually flush queued analytics events
   */
  const flush = useCallback(async (): Promise<void> => {
    try {
      await analyticsService.flush();
    } catch (error) {
      console.error('Failed to flush analytics:', error);
    }
  }, []);

  /**
   * Get current session ID
   */
  const sessionId = analyticsService.getSessionId();

  /**
   * Check if tracking is currently active
   */
  const isTracking = analyticsService.getStatus().enabled;

  return {
    trackPageView,
    trackConversion,
    trackEngagement,
    sessionId,
    isTracking,
    flush
  };
}

export default useHomepageAnalytics;