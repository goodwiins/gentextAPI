/**
 * Analytics Type Definitions for Homepage SAAS
 * Based on data-model.md specifications
 */

// ================================
// CORE DATA MODELS
// ================================

export interface HomepageMetrics {
  id: string;
  sessionId: string;
  userId?: string;
  timestamp: string;
  pageView: PageViewMetrics;
  userAgent: string;
  viewport: ViewportData;
  referrer?: string;
  createdAt: string;
}

export interface PageViewMetrics {
  loadTime: number;    // Page load time in ms
  lcp: number;         // Largest Contentful Paint
  fcp: number;         // First Contentful Paint
  cls: number;         // Cumulative Layout Shift
  fid: number;         // First Input Delay
  ttfb?: number;       // Time to First Byte
}

export interface ViewportData {
  width: number;
  height: number;
}

export interface ConversionEvent {
  id: string;
  sessionId: string;
  userId?: string;
  eventType: ConversionType;
  eventData: ConversionEventData;
  timestamp: string;
  successful: boolean;
  errorMessage?: string;
  createdAt: string;
}

export interface ConversionEventData {
  ctaText: string;
  ctaPosition: SectionName;
  scrollDepth: number;  // Percentage 0-100
  timeOnPage: number;   // Time in ms
}

export interface FeatureEngagement {
  id: string;
  sessionId: string;
  sectionName: SectionName;
  engagementType: EngagementType;
  duration: number;     // Time spent in section (ms)
  scrollDepth: number;  // Percentage of section viewed (0-100)
  interactions: number; // Number of clicks/taps
  timestamp: string;
  createdAt: string;
}

// ================================
// ENUMS
// ================================

export enum ConversionType {
  SIGNUP_CLICKED = 'signup_clicked',
  LOGIN_CLICKED = 'login_clicked',
  GENERATE_CLICKED = 'generate_clicked',
  LEARN_MORE_CLICKED = 'learn_more_clicked',
  CONTACT_CLICKED = 'contact_clicked'
}

export enum EngagementType {
  VIEW = 'view',                 // Section entered viewport
  INTERACT = 'interact',         // User clicked/tapped in section
  COMPLETE_VIEW = 'complete_view' // User scrolled through entire section
}

export enum SectionName {
  HERO = 'hero',
  FEATURES = 'features',
  HOW_IT_WORKS = 'how-it-works',
  TESTIMONIALS = 'testimonials',
  CTA = 'cta',
  FOOTER = 'footer'
}

export type ConversionAction = ConversionType;

// Component props types for homepage components
export interface CtaSectionProps {
  variant: 'primary' | 'secondary' | 'minimal';
  user: any; // AuthUser | null
  onCtaClick: (action: ConversionAction) => void;
  showSocialProof?: boolean;
  backgroundColor?: 'default' | 'gradient' | 'solid';
}

export interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  animationDelay?: number;
  onView: (featureId: string) => void;
  onInteraction: (featureId: string, interactionType: string) => void;
}

export interface HomepageHeroProps {
  user: any; // AuthUser | null
  onCtaClick: (action: ConversionAction) => void;
  performanceMode?: 'high' | 'standard' | 'minimal';
}

export interface ProcessStepProps {
  stepNumber: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isLast?: boolean;
  animationDirection?: 'left' | 'right' | 'up' | 'down';
}

export interface TestimonialCardProps {
  name: string;
  role: string;
  company?: string;
  content: string;
  avatar?: string;
  rating?: number;
  verified?: boolean;
}

export interface HomepageLayoutProps {
  children: React.ReactNode;
  user: any; // AuthUser | null
  performanceMode?: 'high' | 'standard' | 'minimal';
  analyticsEnabled?: boolean;
}

export interface AuthUser {
  $id: string;
  name: string;
  email: string;
  prefs: {
    firstName?: string;
    lastName?: string;
    [key: string]: any;
  };
}

// ================================
// API REQUEST/RESPONSE TYPES
// ================================

export interface AnalyticsApiResponse {
  id: string;
  status: 'success' | 'error';
  message?: string;
  timestamp: string;
}

export interface AnalyticsSummaryResponse {
  dateRange: {
    from: string;
    to: string;
  };
  totalPageViews: number;
  uniqueVisitors: number;
  averageLoadTime: number;
  conversionRate: number;
  topConversionEvents: {
    eventType: ConversionType;
    count: number;
    conversionRate: number;
  }[];
  performanceMetrics: {
    averageLCP: number;
    averageFCP: number;
    averageCLS: number;
    averageFID: number;
  };
  sectionEngagement: {
    sectionName: SectionName;
    viewRate: number;
    averageDuration: number;
    interactionRate: number;
  }[];
}

// ================================
// ANALYTICS SERVICE TYPES
// ================================

export interface AnalyticsServiceConfig {
  endpoint: string;
  projectId: string;
  enabledInDevelopment?: boolean;
  batchSize?: number;
  flushInterval?: number;
}

export interface AnalyticsEvent {
  type: 'pageView' | 'conversion' | 'engagement';
  data: HomepageMetrics | ConversionEvent | FeatureEngagement;
  timestamp: string;
}

export interface AnalyticsQueue {
  events: AnalyticsEvent[];
  maxSize: number;
  flushCallback: (events: AnalyticsEvent[]) => Promise<void>;
}

// ================================
// HOOK TYPES
// ================================

export interface UseAnalyticsReturn {
  trackPageView: (metrics: PageViewMetrics) => Promise<void>;
  trackConversion: (event: Omit<ConversionEvent, 'id' | 'sessionId' | 'timestamp' | 'createdAt'>) => Promise<void>;
  trackEngagement: (engagement: Omit<FeatureEngagement, 'id' | 'sessionId' | 'timestamp' | 'createdAt'>) => Promise<void>;
  sessionId: string;
  isTracking: boolean;
  flush: () => Promise<void>;
}

export interface UseIntersectionObserverReturn {
  isIntersecting: boolean;
  hasBeenVisible: boolean;
  entry: IntersectionObserverEntry | null;
}

export interface UseScrollProgressReturn {
  scrollProgress: number;        // 0-100 percentage
  scrollDirection: 'up' | 'down' | 'none';
  isAtTop: boolean;
  isAtBottom: boolean;
  elementProgress?: number;      // Progress within specific element
}

export interface UsePerformanceMonitorReturn {
  metrics: PageViewMetrics | null;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => PageViewMetrics | null;
  reportMetrics: () => Promise<void>;
  webVitals: WebVitalsMetrics;
}

export interface WebVitalsMetrics {
  lcp?: number;
  fcp?: number;
  cls?: number;
  fid?: number;
  ttfb?: number;
  inp?: number; // Interaction to Next Paint
}

// ================================
// VALIDATION TYPES
// ================================

export interface ValidationRule<T> {
  field: keyof T;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ================================
// PERFORMANCE TYPES
// ================================

export interface PerformanceBudget {
  maxBundleSize: number;    // KB
  minFrameRate: number;     // FPS
  maxMemoryUsage: number;   // MB
  maxLoadTime: number;      // ms
  maxLCP: number;           // ms
  maxFCP: number;           // ms
  maxCLS: number;           // score
  maxFID: number;           // ms
}

export interface PerformanceThresholds {
  lcp: {
    good: number;    // ≤ 2500ms
    poor: number;    // > 4000ms
  };
  fcp: {
    good: number;    // ≤ 1800ms
    poor: number;    // > 3000ms
  };
  cls: {
    good: number;    // ≤ 0.1
    poor: number;    // > 0.25
  };
  fid: {
    good: number;    // ≤ 100ms
    poor: number;    // > 300ms
  };
}

// ================================
// ERROR HANDLING TYPES
// ================================

export interface AnalyticsError {
  code: string;
  message: string;
  timestamp: string;
  context?: {
    sessionId?: string;
    userId?: string;
    eventType?: string;
    stackTrace?: string;
  };
}

export interface ErrorBoundaryInfo {
  error: Error;
  errorInfo: {
    componentStack: string;
  };
  timestamp: string;
  sessionId: string;
  userId?: string;
}

// ================================
// TESTING TYPES
// ================================

export interface MockAnalyticsService {
  trackPageView: jest.MockedFunction<(metrics: PageViewMetrics) => Promise<void>>;
  trackConversion: jest.MockedFunction<(event: any) => Promise<void>>;
  trackEngagement: jest.MockedFunction<(engagement: any) => Promise<void>>;
  flush: jest.MockedFunction<() => Promise<void>>;
  reset: () => void;
}

export interface AnalyticsTestData {
  sampleMetrics: HomepageMetrics;
  sampleConversion: ConversionEvent;
  sampleEngagement: FeatureEngagement;
  invalidData: Record<string, any>;
}

// ================================
// CONSTANTS
// ================================

export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  maxBundleSize: 500,      // 500KB
  minFrameRate: 60,        // 60 FPS
  maxMemoryUsage: 50,      // 50MB
  maxLoadTime: 3000,       // 3 seconds
  maxLCP: 1500,            // 1.5 seconds
  maxFCP: 1500,            // 1.5 seconds
  maxCLS: 0.1,             // 0.1 score
  maxFID: 100              // 100ms
};

export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  lcp: { good: 2500, poor: 4000 },
  fcp: { good: 1800, poor: 3000 },
  cls: { good: 0.1, poor: 0.25 },
  fid: { good: 100, poor: 300 }
};

export const VALID_SECTION_NAMES = Object.values(SectionName);
export const VALID_CONVERSION_TYPES = Object.values(ConversionType);
export const VALID_ENGAGEMENT_TYPES = Object.values(EngagementType);