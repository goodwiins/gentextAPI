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
import type {
  UseHomepageAnalyticsReturn,
  AnalyticsEvent,
  SectionEngagement,
  PerformanceMetrics
} from '../../../specs/001-homepage-saas/contracts/frontend-components';

export function useHomepageAnalytics(): UseHomepageAnalyticsReturn {
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
  const trackPageView = useCallback(async (metrics: PerformanceMetrics): Promise<void> => {
    try {
      await analyticsService.trackPageViewMetrics(metrics);
    } catch (error) {
      console.error('Failed to track page view:', error);
      // Don't throw to prevent breaking the UI
    }
  }, []);

  /**
   * Track conversion events (CTA clicks, form submissions, etc.)
   */
  const trackConversion = useCallback(async (
    event: Omit<AnalyticsEvent, 'sessionId' | 'timestamp'>
  ): Promise<void> => {
    try {
      await analyticsService.trackConversionEvent(event);
    } catch (error) {
      console.error('Failed to track conversion:', error);
      // Track the error as a failed conversion
      try {
        await analyticsService.trackConversionError(event, error instanceof Error ? error.message : 'Unknown error');
      } catch (trackingError) {
        console.error('Failed to track conversion error:', trackingError);
      }
      // Don't throw to prevent breaking the UI
    }
  }, []);

  /**
   * Track section engagement
   */
  const trackEngagement = useCallback(async (
    engagement: Omit<SectionEngagement, 'sessionId'>
  ): Promise<void> => {
    try {
      await analyticsService.trackSectionEngagement(engagement);
    } catch (error) {
      console.error('Failed to track engagement:', error);
      // Don't throw to prevent breaking the UI
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
    isTracking
  };
}

export default useHomepageAnalytics;