/**
 * Analytics Context Provider
 * Manages session state and provides analytics context to the application
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { analyticsService } from '@/lib/analytics-service';
import { useAuthContext } from '@/context/auth-context';
import { performanceManager } from '@/lib/performance';
import type { AuthUser } from '@/types/analytics';
import { SectionName, EngagementType, ConversionType } from '@/types/analytics';

interface AnalyticsContextType {
  sessionId: string;
  isTracking: boolean;
  userId: string | null;
  startSession: () => void;
  endSession: () => void;
  trackPageView: (data: any) => Promise<void>;
  trackConversion: (action: ConversionType, data?: any) => Promise<void>;
  trackEngagement: (section: SectionName, type: EngagementType, duration?: number) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export function AnalyticsProvider({ children, enabled = true }: AnalyticsProviderProps) {
  const [sessionId, setSessionId] = useState<string>('');
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { authState } = useAuthContext();

  // Initialize analytics session
  const startSession = useCallback(() => {
    if (!enabled) return;

    try {
      // Get session ID from analytics service
      const newSessionId = analyticsService.getSessionId();
      setSessionId(newSessionId);
      setIsTracking(true);

      // Set user ID if authenticated
      if (authState.user) {
        setUserId(authState.user.$id);
        analyticsService.setUserId(authState.user.$id);
      }

      // Enable performance monitoring
      performanceManager.enable();

      console.log(`[Analytics] Session started: ${newSessionId}`);
    } catch (error) {
      console.error('[Analytics] Failed to start session:', error);
    }
  }, [enabled, authState.user]);

  // End analytics session
  const endSession = useCallback(() => {
    if (!isTracking) return;

    try {
      // Flush any remaining analytics data
      analyticsService.flush();

      // Disable performance monitoring
      performanceManager.disable();

      // Clear user ID
      setUserId(null);
      analyticsService.setUserId(null);

      setIsTracking(false);
      console.log(`[Analytics] Session ended: ${sessionId}`);
    } catch (error) {
      console.error('[Analytics] Failed to end session:', error);
    }
  }, [isTracking, sessionId]);

  // Track page view with enhanced data
  const trackPageView = useCallback(async (data: any) => {
    if (!isTracking) return;

    try {
      await analyticsService.trackPageView(data, {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        referrer: document.referrer
      });
    } catch (error) {
      console.error('[Analytics] Failed to track page view:', error);
    }
  }, [isTracking]);

  // Track conversion events
  const trackConversion = useCallback(async (action: ConversionType, data: any = {}) => {
    if (!isTracking) return;

    try {
      await analyticsService.trackConversion(action, data, true);
    } catch (error) {
      console.error('[Analytics] Failed to track conversion:', error);
    }
  }, [isTracking]);

  // Track engagement events
  const trackEngagement = useCallback(async (
    section: SectionName, 
    type: EngagementType, 
    duration: number = 0
  ) => {
    if (!isTracking) return;

    try {
      await analyticsService.trackEngagement(
        section,
        type,
        duration,
        0, // scroll depth (will be calculated separately)
        1   // interaction count
      );
    } catch (error) {
      console.error('[Analytics] Failed to track engagement:', error);
    }
  }, [isTracking]);

  // Initialize session on mount
  useEffect(() => {
    if (enabled) {
      startSession();
    }

    // Cleanup on unmount
    return () => {
      if (enabled) {
        endSession();
      }
    };
  }, [enabled, startSession, endSession]);

  // Update user ID when auth state changes
  useEffect(() => {
    if (isTracking && authState.user) {
      setUserId(authState.user.$id);
      analyticsService.setUserId(authState.user.$id);
    } else if (isTracking && !authState.user) {
      setUserId(null);
      analyticsService.setUserId(null);
    }
  }, [authState.user, isTracking]);

  // Handle page visibility changes for session management
  useEffect(() => {
    if (!enabled || !isTracking) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause intensive tracking
        performanceManager.disable();
      } else {
        // Page is visible, resume tracking
        performanceManager.enable();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isTracking]);

  // Handle page unload for session cleanup
  useEffect(() => {
    if (!enabled || !isTracking) return;

    const handleBeforeUnload = () => {
      // Flush analytics before page unload
      analyticsService.flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, isTracking]);

  const contextValue: AnalyticsContextType = {
    sessionId,
    isTracking,
    userId,
    startSession,
    endSession,
    trackPageView,
    trackConversion,
    trackEngagement
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Hook for using analytics context
export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
}

// Hook for easy analytics tracking in components
export function useAnalytics() {
  const context = useAnalyticsContext();
  
  return {
    sessionId: context.sessionId,
    isTracking: context.isTracking,
    userId: context.userId,
    
    // Simplified tracking methods
    trackPageView: context.trackPageView,
    trackConversion: context.trackConversion,
    trackEngagement: context.trackEngagement,
    
    // Convenience methods for common events
    trackCTAClick: async (ctaText: string, ctaPosition: SectionName) => {
      await context.trackConversion(ConversionType.LEARN_MORE_CLICKED, {
        ctaText,
        ctaPosition,
        timestamp: new Date().toISOString()
      });
    },
    
    trackFeatureView: async (featureName: string) => {
      await context.trackEngagement(SectionName.FEATURES, EngagementType.VIEW);
    },
    
    trackFeatureInteraction: async (featureName: string, interactionType: string) => {
      await context.trackEngagement(SectionName.FEATURES, EngagementType.INTERACT);
    }
  };
}