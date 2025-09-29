/**
 * Frontend Component Contracts for Homepage SAAS
 * Defines TypeScript interfaces and component specifications
 */

// ================================
// CORE COMPONENT INTERFACES
// ================================

export interface HomepageHeroProps {
  user: AuthUser | null;
  onCtaClick: (action: ConversionAction) => void;
  performanceMode?: 'high' | 'standard' | 'minimal';
}

export interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  animationDelay?: number;
  onView: (featureId: string) => void;
  onInteraction: (featureId: string, interactionType: string) => void;
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

export interface CtaSectionProps {
  variant: 'primary' | 'secondary' | 'minimal';
  user: AuthUser | null;
  onCtaClick: (action: ConversionAction) => void;
  showSocialProof?: boolean;
  backgroundColor?: 'default' | 'gradient' | 'solid';
}

// ================================
// ANALYTICS & TRACKING INTERFACES
// ================================

export interface AnalyticsEvent {
  sessionId: string;
  userId?: string;
  eventType: ConversionAction;
  eventData: {
    ctaText: string;
    ctaPosition: SectionName;
    scrollDepth: number;
    timeOnPage: number;
  };
  timestamp: string;
}

export interface SectionEngagement {
  sectionName: SectionName;
  engagementType: 'view' | 'interact' | 'complete_view';
  duration: number;
  scrollDepth: number;
  interactions: number;
}

export interface PerformanceMetrics {
  loadTime: number;
  lcp: number; // Largest Contentful Paint
  fcp: number; // First Contentful Paint
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  ttfb?: number; // Time to First Byte
}

// ================================
// UTILITY TYPES & ENUMS
// ================================

export type ConversionAction = 
  | 'signup_clicked'
  | 'login_clicked'
  | 'generate_clicked'
  | 'learn_more_clicked'
  | 'contact_clicked';

export type SectionName = 
  | 'hero'
  | 'features'
  | 'how-it-works'
  | 'testimonials'
  | 'cta'
  | 'footer';

export type AnimationPreference = 'full' | 'reduced' | 'none';

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
// HOOK CONTRACTS
// ================================

export interface UseHomepageAnalyticsReturn {
  trackPageView: (metrics: PerformanceMetrics) => Promise<void>;
  trackConversion: (event: Omit<AnalyticsEvent, 'sessionId' | 'timestamp'>) => Promise<void>;
  trackEngagement: (engagement: Omit<SectionEngagement, 'sessionId'>) => Promise<void>;
  sessionId: string;
  isTracking: boolean;
}

export interface UseIntersectionObserverReturn {
  isIntersecting: boolean;
  hasBeenVisible: boolean;
  entry: IntersectionObserverEntry | null;
}

export interface UseScrollProgressReturn {
  scrollProgress: number;
  scrollDirection: 'up' | 'down' | 'none';
  isAtTop: boolean;
  isAtBottom: boolean;
}

export interface UsePerformanceMonitorReturn {
  metrics: PerformanceMetrics | null;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => PerformanceMetrics | null;
  reportMetrics: () => Promise<void>;
}

// ================================
// COMPONENT COMPOSITION CONTRACTS
// ================================

export interface HomepageLayoutProps {
  children: React.ReactNode;
  user: AuthUser | null;
  performanceMode?: 'high' | 'standard' | 'minimal';
  analyticsEnabled?: boolean;
}

export interface HomepageSectionProps {
  id: SectionName;
  className?: string;
  children: React.ReactNode;
  onView?: (sectionId: SectionName) => void;
  onEngagement?: (engagement: SectionEngagement) => void;
}

export interface AnimatedElementProps {
  children: React.ReactNode;
  animation: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scale' | 'rotate';
  delay?: number;
  duration?: number;
  triggerOnce?: boolean;
  threshold?: number;
  disabled?: boolean;
}

// ================================
// FORM & INTERACTION CONTRACTS
// ================================

export interface CtaButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg' | 'xl';
  action: ConversionAction;
  text: string;
  position: SectionName;
  onClick: (action: ConversionAction) => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export interface NewsletterSignupProps {
  onSubmit: (email: string) => Promise<boolean>;
  placeholder?: string;
  buttonText?: string;
  showPrivacyNote?: boolean;
  variant?: 'inline' | 'modal' | 'sidebar';
}

// ================================
// ACCESSIBILITY CONTRACTS
// ================================

export interface A11yProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  role?: string;
  tabIndex?: number;
}

export interface ReducedMotionProps {
  respectsReducedMotion: boolean;
  fallbackComponent?: React.ComponentType<any>;
  staticAlternative?: React.ReactNode;
}

// ================================
// ERROR HANDLING CONTRACTS
// ================================

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface LoadingStateProps {
  isLoading: boolean;
  skeleton?: React.ComponentType;
  spinner?: React.ComponentType;
  text?: string;
  delay?: number;
}

// ================================
// TESTING CONTRACTS
// ================================

export interface TestableComponentProps {
  'data-testid'?: string;
  'data-test-section'?: SectionName;
  'data-test-action'?: ConversionAction;
}

export interface MockAnalyticsProvider {
  trackPageView: jest.MockedFunction<(metrics: PerformanceMetrics) => Promise<void>>;
  trackConversion: jest.MockedFunction<(event: any) => Promise<void>>;
  trackEngagement: jest.MockedFunction<(engagement: any) => Promise<void>>;
}

// ================================
// CONFIGURATION CONTRACTS
// ================================

export interface HomepageConfig {
  features: {
    id: string;
    title: string;
    description: string;
    icon: string;
    order: number;
  }[];
  testimonials: {
    id: string;
    name: string;
    role: string;
    company?: string;
    content: string;
    avatar?: string;
    rating: number;
    featured: boolean;
  }[];
  processSteps: {
    id: string;
    title: string;
    description: string;
    icon: string;
    order: number;
  }[];
  cta: {
    primary: {
      text: string;
      action: ConversionAction;
    };
    secondary: {
      text: string;
      action: ConversionAction;
    };
  };
  performance: {
    animationsEnabled: boolean;
    preloadImages: boolean;
    lazyLoadThreshold: number;
    maxBundleSize: number;
  };
}

export interface SeoConfig {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  canonicalUrl: string;
  structuredData: object;
}

// ================================
// API RESPONSE CONTRACTS
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
    eventType: ConversionAction;
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