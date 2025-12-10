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

interface AnalyticsSession {
  sessionId: string;
  startTime: number;
  userId: string | null;
  pageViews: number;
  events: number;
  lastActivity: number;
  isActive: boolean;
}

interface AnalyticsContextType {
  sessionId: string;
  isTracking: boolean;
  userId: string | null;
  session: AnalyticsSession | null;
  
  // Session management
  startSession: () => void;
  endSession: () => void;
  extendSession: () => void;
  getSessionDuration: () => number;
  getSessionSummary: () => AnalyticsSession | null;
  
  // Event tracking
  trackPageView: (data: any) => Promise<void>;
  trackConversion: (action: ConversionType, data?: any) => Promise<void>;
  trackEngagement: (section: SectionName, type: EngagementType, duration?: number) => Promise<void>;
  
  // Enhanced tracking with session context
  trackEventWithSession: (eventType: string, eventData: any) => Promise<void>;
  trackPerformanceWithSession: (metrics: any) => Promise<void>;
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
  const [session, setSession] = useState<AnalyticsSession | null>(null);
  const { authState } = useAuthContext();

  // Session timeout settings
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const SESSION_EXTENSION_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  // Initialize analytics session
  const startSession = useCallback(() => {
    if (!enabled) return;

    try {
      // Get session ID from analytics service
      const newSessionId = analyticsService.getSessionId();
      const now = Date.now();
      
      // Create session object
      const newSession: AnalyticsSession = {
        sessionId: newSessionId,
        startTime: now,
        userId: authState.user?.$id || null,
        pageViews: 0,
        events: 0,
        lastActivity: now,
        isActive: true
      };

      setSessionId(newSessionId);
      setSession(newSession);
      setIsTracking(true);

      // Set user ID if authenticated
      if (authState.user) {
        setUserId(authState.user.$id);
        analyticsService.setUserId(authState.user.$id);
      }

      // Enable performance monitoring
      performanceManager.enable();

      // Store session in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('analytics_session', JSON.stringify(newSession));
      }

      console.log(`[Analytics] Session started: ${newSessionId}`);
    } catch (error) {
      console.error('[Analytics] Failed to start session:', error);
    }
  }, [enabled, authState.user]);

  // End analytics session
  const endSession = useCallback(() => {
    if (!isTracking || !session) return;

    try {
      // Mark session as inactive
      const endedSession = {
        ...session,
        isActive: false,
        lastActivity: Date.now()
      };

      // Send session summary to analytics
      const sessionSummary = {
        sessionId: endedSession.sessionId,
        duration: endedSession.lastActivity - endedSession.startTime,
        pageViews: endedSession.pageViews,
        events: endedSession.events,
        userId: endedSession.userId,
        startTime: new Date(endedSession.startTime).toISOString(),
        endTime: new Date(endedSession.lastActivity).toISOString()
      };

      // Track session end as an engagement event
      analyticsService.trackEngagement(
        SectionName.HERO,
        EngagementType.VIEW,
        sessionSummary.duration,
        0,
        sessionSummary.events
      );

      console.log('[Analytics] Session summary:', sessionSummary);

      // Flush any remaining analytics data
      analyticsService.flush();

      // Disable performance monitoring
      performanceManager.disable();

      // Clear session data
      setSession(null);
      setUserId(null);
      analyticsService.setUserId(null);
      setIsTracking(false);

      // Clear from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('analytics_session');
      }

      console.log(`[Analytics] Session ended: ${sessionId}`);
    } catch (error) {
      console.error('[Analytics] Failed to end session:', error);
    }
  }, [isTracking, session, sessionId]);

  // Extend session activity
  const extendSession = useCallback(() => {
    if (!session || !isTracking) return;

    const now = Date.now();
    const updatedSession = {
      ...session,
      lastActivity: now
    };

    setSession(updatedSession);

    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_session', JSON.stringify(updatedSession));
    }
  }, [session, isTracking]);

  // Get session duration
  const getSessionDuration = useCallback(() => {
    if (!session) return 0;
    return Date.now() - session.startTime;
  }, [session]);

  // Get session summary
  const getSessionSummary = useCallback(() => {
    return session;
  }, [session]);

  // Track page view with enhanced data
  const trackPageView = useCallback(async (data: any) => {
    if (!isTracking || !session) return;

    try {
      // Update session page view count
      const updatedSession = {
        ...session,
        pageViews: session.pageViews + 1,
        lastActivity: Date.now()
      };
      setSession(updatedSession);

      // Extend session
      extendSession();

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
  }, [isTracking, session, extendSession]);

  // Track conversion events
  const trackConversion = useCallback(async (action: ConversionType, data: any = {}) => {
    if (!isTracking || !session) return;

    try {
      // Update session event count
      const updatedSession = {
        ...session,
        events: session.events + 1,
        lastActivity: Date.now()
      };
      setSession(updatedSession);

      // Extend session
      extendSession();

      await analyticsService.trackConversion(action, {
        ...data,
        sessionDuration: getSessionDuration(),
        sessionPageViews: session.pageViews,
        sessionEvents: session.events
      }, true);
    } catch (error) {
      console.error('[Analytics] Failed to track conversion:', error);
    }
  }, [isTracking, session, extendSession, getSessionDuration]);

  // Track engagement events
  const trackEngagement = useCallback(async (
    section: SectionName, 
    type: EngagementType, 
    duration: number = 0
  ) => {
    if (!isTracking || !session) return;

    try {
      // Update session event count
      const updatedSession = {
        ...session,
        events: session.events + 1,
        lastActivity: Date.now()
      };
      setSession(updatedSession);

      // Extend session
      extendSession();

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
  }, [isTracking, session, extendSession]);

  // Track event with session context
  const trackEventWithSession = useCallback(async (eventType: string, eventData: any) => {
    if (!isTracking || !session) return;

    try {
      // Add session context to event data
      const enrichedEventData = {
        ...eventData,
        sessionId: session.sessionId,
        sessionDuration: getSessionDuration(),
        sessionPageViews: session.pageViews,
        sessionEvents: session.events,
        userId: session.userId,
        timestamp: new Date().toISOString()
      };

      // Update session
      const updatedSession = {
        ...session,
        events: session.events + 1,
        lastActivity: Date.now()
      };
      setSession(updatedSession);
      extendSession();

      // Log structured event data
      console.log(`[Analytics] Event: ${eventType}`, enrichedEventData);

      // In a real implementation, this would send to an analytics API
      // For now, we'll use the existing analytics service
      if (eventType === 'page_view') {
        await trackPageView(enrichedEventData);
      } else if (eventType === 'conversion') {
        await trackConversion(eventData.conversionType, enrichedEventData);
      } else {
        // Generic engagement tracking
        await trackEngagement(
          eventData.section || SectionName.HERO,
          eventData.engagementType || EngagementType.VIEW,
          eventData.duration || 0
        );
      }
    } catch (error) {
      console.error('[Analytics] Failed to track event with session:', error);
    }
  }, [isTracking, session, extendSession, getSessionDuration, trackPageView, trackConversion, trackEngagement]);

  // Track performance with session context
  const trackPerformanceWithSession = useCallback(async (metrics: any) => {
    if (!isTracking || !session) return;

    try {
      // Add session context to performance metrics
      const sessionMetrics = {
        ...metrics,
        sessionId: session.sessionId,
        sessionDuration: getSessionDuration(),
        sessionPageViews: session.pageViews,
        sessionEvents: session.events,
        timestamp: new Date().toISOString()
      };

      // Send to performance manager
      performanceManager.updateWebVitals(sessionMetrics);

      // Log performance data
      console.log('[Analytics] Performance with session:', sessionMetrics);

      // Track as page view with performance data
      await trackPageView(sessionMetrics);
    } catch (error) {
      console.error('[Analytics] Failed to track performance with session:', error);
    }
  }, [isTracking, session, getSessionDuration, trackPageView]);

  // Helper function to track session end
  const trackSessionEnd = useCallback(async (endedSession: AnalyticsSession) => {
    try {
      const sessionSummary = {
        sessionId: endedSession.sessionId,
        duration: endedSession.lastActivity - endedSession.startTime,
        pageViews: endedSession.pageViews,
        events: endedSession.events,
        userId: endedSession.userId,
        startTime: new Date(endedSession.startTime).toISOString(),
        endTime: new Date(endedSession.lastActivity).toISOString()
      };

      // Track session end as an engagement event
      await analyticsService.trackEngagement(
        SectionName.HERO,
        EngagementType.VIEW,
        sessionSummary.duration,
        0,
        sessionSummary.events
      );

      console.log('[Analytics] Session summary:', sessionSummary);
    } catch (error) {
      console.error('[Analytics] Failed to track session end:', error);
    }
  }, []);

  // Check for session timeout
  const checkSessionTimeout = useCallback(() => {
    if (!session || !isTracking) return;

    const now = Date.now();
    const timeSinceLastActivity = now - session.lastActivity;

    if (timeSinceLastActivity > SESSION_TIMEOUT) {
      console.log('[Analytics] Session timed out');
      endSession();
    }
  }, [session, isTracking, endSession, SESSION_TIMEOUT]);

  // Recover session from localStorage
  const recoverSession = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedSession = localStorage.getItem('analytics_session');
      if (storedSession) {
        const parsedSession: AnalyticsSession = JSON.parse(storedSession);
        
        // Check if session is still valid (not timed out)
        const now = Date.now();
        const timeSinceLastActivity = now - parsedSession.lastActivity;
        
        if (timeSinceLastActivity < SESSION_TIMEOUT && parsedSession.isActive) {
          // Recover the session
          setSession(parsedSession);
          setSessionId(parsedSession.sessionId);
          setUserId(parsedSession.userId);
          setIsTracking(true);
          
          // Update analytics service
          analyticsService.setUserId(parsedSession.userId);
          
          console.log('[Analytics] Session recovered:', parsedSession.sessionId);
          return true;
        } else {
          // Session expired, clean up
          localStorage.removeItem('analytics_session');
        }
      }
    } catch (error) {
      console.error('[Analytics] Failed to recover session:', error);
      localStorage.removeItem('analytics_session');
    }
    
    return false;
  }, [SESSION_TIMEOUT]);

  // Initialize session on mount
  useEffect(() => {
    if (enabled) {
      // Try to recover existing session first
      const recovered = recoverSession();
      
      if (!recovered) {
        // Start new session
        startSession();
      }
    }

    // Cleanup on unmount
    return () => {
      if (enabled) {
        endSession();
      }
    };
  }, [enabled, startSession, endSession, recoverSession]);

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

  // Set up session timeout checking
  useEffect(() => {
    if (!enabled || !isTracking) return;

    const timeoutInterval = setInterval(checkSessionTimeout, 60000); // Check every minute

    return () => {
      clearInterval(timeoutInterval);
    };
  }, [enabled, isTracking, checkSessionTimeout]);

  // Handle page unload for session cleanup
  useEffect(() => {
    if (!enabled || !isTracking) return;

    const handleBeforeUnload = () => {
      // Flush analytics before page unload
      analyticsService.flush();
      
      // If we have a session, mark the last activity
      if (session) {
        const updatedSession = {
          ...session,
          lastActivity: Date.now()
        };
        localStorage.setItem('analytics_session', JSON.stringify(updatedSession));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, isTracking, session]);

  // Auto-extend session on user activity
  useEffect(() => {
    if (!enabled || !isTracking) return;

    const handleUserActivity = () => {
      extendSession();
    };

    // Listen for various user activities
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [enabled, isTracking, extendSession]);

  const contextValue: AnalyticsContextType = {
    sessionId,
    isTracking,
    userId,
    session,
    startSession,
    endSession,
    extendSession,
    getSessionDuration,
    getSessionSummary,
    trackPageView,
    trackConversion,
    trackEngagement,
    trackEventWithSession,
    trackPerformanceWithSession
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
    // Session information
    sessionId: context.sessionId,
    isTracking: context.isTracking,
    userId: context.userId,
    session: context.session,
    
    // Session management
    startSession: context.startSession,
    endSession: context.endSession,
    extendSession: context.extendSession,
    getSessionDuration: context.getSessionDuration,
    getSessionSummary: context.getSessionSummary,
    
    // Core tracking methods
    trackPageView: context.trackPageView,
    trackConversion: context.trackConversion,
    trackEngagement: context.trackEngagement,
    
    // Enhanced session-aware tracking
    trackEventWithSession: context.trackEventWithSession,
    trackPerformanceWithSession: context.trackPerformanceWithSession,
    
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
    },

    // Session-aware convenience methods
    trackUserJourney: async (step: string, data?: any) => {
      await context.trackEventWithSession('user_journey', {
        step,
        ...data,
        section: SectionName.HERO,
        engagementType: EngagementType.INTERACT
      });
    },

    trackFormInteraction: async (formName: string, action: string, data?: any) => {
      await context.trackEventWithSession('form_interaction', {
        formName,
        action,
        ...data,
        section: SectionName.CTA,
        engagementType: EngagementType.INTERACT
      });
    },

    trackContentEngagement: async (contentType: string, action: string, duration?: number) => {
      await context.trackEngagement(
        SectionName.FEATURES,
        EngagementType.VIEW,
        duration || 0
      );
    },

    // Utility methods
    isSessionActive: () => {
      return context.session?.isActive || false;
    },

    getSessionAge: () => {
      if (!context.session) return 0;
      return Date.now() - context.session.startTime;
    },

    getSessionStats: () => {
      if (!context.session) return null;
      
      return {
        duration: context.getSessionDuration(),
        pageViews: context.session.pageViews,
        events: context.session.events,
        isActive: context.session.isActive
      };
    }
  };
}