/**
 * Enhanced TypeScript Definitions for Aceternity UI Integration
 * Comprehensive type definitions for all enhanced components and features
 */

import { ReactNode, ComponentType, RefObject } from 'react';

// ============================================================================
// CORE ACETERNITY COMPONENT TYPES
// ============================================================================

export interface AceternityCardProps {
  className?: string;
  children: ReactNode;
  translateZ?: number | string;
  rotateX?: number | string;
  rotateY?: number | string;
  perspective?: number;
  containerClassName?: string;
}

export interface AceternityBackgroundProps {
  className?: string;
  children?: ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  color?: string;
  showRadialGradient?: boolean;
}

export interface AceternityAnimationProps {
  duration?: number;
  delay?: number;
  easing?: string;
  trigger?: 'hover' | 'click' | 'viewport' | 'auto';
  reduceMotion?: boolean;
}

// ============================================================================
// ENHANCED QUIZ COMPONENT TYPES
// ============================================================================

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  tags?: string[];
  confidence?: number;
}

export interface EnhancedQuizDisplayProps {
  questions: QuizQuestion[];
  currentIndex: number;
  totalQuestions: number;
  onAnswer: (questionId: string, answerIndex: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  showProgress: boolean;
  enableAnimations: boolean;
  className?: string;
}

export interface QuizCardAnimationProps extends AceternityAnimationProps {
  flipDirection?: 'horizontal' | 'vertical';
  showSparkles?: boolean;
  sparkleIntensity?: number;
  cardType?: '3d' | 'flip' | 'stack';
}

export interface QuizProgressProps {
  current: number;
  total: number;
  accuracy?: number;
  timeElapsed?: number;
  showAnimation: boolean;
  onProgressClick?: (index: number) => void;
  variant?: 'linear' | 'circular' | 'stepped';
  className?: string;
}

// ============================================================================
// ENHANCED SUBMISSION COMPONENT TYPES
// ============================================================================

export interface SubmissionFormData {
  text: string;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionCount?: number;
  metadata?: Record<string, any>;
}

export interface EnhancedSubmissionProps {
  onSubmit: (data: SubmissionFormData) => Promise<void>;
  isLoading: boolean;
  defaultText?: string;
  maxLength?: number;
  enableAnimations: boolean;
  showCharacterCount: boolean;
  className?: string;
}

export interface AnimatedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  enableAnimation: boolean;
  showCharacterCount: boolean;
  className?: string;
  error?: string;
  required?: boolean;
}

export interface MovingBorderButtonProps {
  children: ReactNode;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  borderRadius?: string;
  duration?: number;
}

export interface PlaceholdersAndVanishInputProps {
  placeholders: string[];
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  className?: string;
  animationDuration?: number;
}

// ============================================================================
// ENHANCED NAVIGATION COMPONENT TYPES
// ============================================================================

export interface NavItem {
  name: string;
  href: string;
  icon?: ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  badge?: string | number;
}

export interface FloatingNavigationProps {
  items: NavItem[];
  className?: string;
  showBlur?: boolean;
  autoHide?: boolean;
  position?: 'top' | 'bottom';
  variant?: 'default' | 'minimal' | 'glass';
}

export interface MobileNavigationProps {
  items: NavItem[];
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
  variant?: 'drawer' | 'modal' | 'accordion';
}

export interface FloatingDockProps {
  items: NavItem[];
  desktopClassName?: string;
  mobileClassName?: string;
  magnification?: number;
  distance?: number;
}

// ============================================================================
// ENHANCED HISTORY COMPONENT TYPES
// ============================================================================

export interface HistoryEntry {
  id: string;
  title: string;
  createdAt: Date;
  questionsGenerated: number;
  accuracy?: number;
  timeSpent?: number;
  difficulty: string;
  category?: string;
  status: 'completed' | 'in-progress' | 'abandoned';
  tags?: string[];
}

export interface EnhancedHistoryProps {
  entries: HistoryEntry[];
  displayMode: 'cards' | 'timeline' | 'table' | 'infinite';
  onEntrySelect: (id: string) => void;
  onEntryDelete?: (id: string) => void;
  enableAnimations: boolean;
  showTestimonials: boolean;
  className?: string;
}

export interface TestimonialData {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatar?: string;
  rating?: number;
  date?: Date;
}

export interface InfiniteMovingCardsProps {
  items: TestimonialData[];
  direction?: 'left' | 'right';
  speed?: 'fast' | 'normal' | 'slow';
  pauseOnHover?: boolean;
  className?: string;
  itemClassName?: string;
}

export interface TimelineProps {
  entries: HistoryEntry[];
  onEntryClick: (id: string) => void;
  enableAnimations: boolean;
  groupBy?: 'day' | 'week' | 'month';
  variant?: 'left' | 'center' | 'right';
  className?: string;
}

export interface ExpandableCardProps {
  title: string;
  description: string;
  expandedContent: ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  className?: string;
  animationDuration?: number;
}

// ============================================================================
// ENHANCED AUTHENTICATION COMPONENT TYPES
// ============================================================================

export type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password';

export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
  name?: string;
  rememberMe?: boolean;
  acceptTerms?: boolean;
}

export interface EnhancedAuthProps {
  mode: AuthMode;
  onSubmit: (data: AuthFormData) => Promise<void>;
  onModeChange: (mode: AuthMode) => void;
  isLoading: boolean;
  error?: string;
  success?: string;
  enableAnimations: boolean;
  className?: string;
}

export interface GlowingFormContainerProps {
  children: ReactNode;
  showStars?: boolean;
  glowIntensity?: number;
  className?: string;
  variant?: 'default' | 'glass' | 'minimal';
}

export interface AnimatedInputProps {
  type: 'text' | 'email' | 'password' | 'tel' | 'url';
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  enableAnimation: boolean;
  className?: string;
  placeholder?: string;
  icon?: ReactNode;
}

export interface TabSwitchProps {
  tabs: Array<{
    id: string;
    label: string;
    content: ReactNode;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

// ============================================================================
// BACKGROUND EFFECTS TYPES
// ============================================================================

export interface BackgroundBeamsProps {
  className?: string;
  children?: ReactNode;
  pathOpacity?: number;
  gradientOpacity?: number;
}

export interface AuroraBackgroundProps {
  className?: string;
  children: ReactNode;
  showRadialGradient?: boolean;
  colors?: string[];
}

export interface MeteorsProps {
  number?: number;
  className?: string;
  meteorColor?: string;
  meteorSize?: number;
}

export interface SparklesCoreProps {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  particleColor?: string;
  speed?: number;
}

// ============================================================================
// FEEDBACK AND NOTIFICATION TYPES
// ============================================================================

export interface EnhancedToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  enableAnimation: boolean;
  onClose?: () => void;
  className?: string;
}

export interface ConfettiProps {
  trigger: boolean;
  colors?: string[];
  intensity?: 'low' | 'medium' | 'high';
  duration?: number;
  onComplete?: () => void;
  className?: string;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  text?: string;
  type?: 'spinner' | 'meteors' | 'dots' | 'pulse' | 'skeleton';
  className?: string;
}

export interface ShimmerButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  shimmerColor?: string;
  shimmerSize?: number;
  variant?: 'default' | 'outline' | 'ghost';
}

// ============================================================================
// GLOBAL CONFIGURATION TYPES
// ============================================================================

export interface AceternityUIConfig {
  animations: {
    enabled: boolean;
    performance: 'low' | 'medium' | 'high';
    reduceMotion: boolean;
    defaultDuration: number;
    defaultEasing: string;
  };
  theme: {
    mode: 'light' | 'dark' | 'auto';
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
  accessibility: {
    highContrast: boolean;
    screenReaderOptimized: boolean;
    keyboardNavigation: boolean;
    focusVisible: boolean;
  };
  performance: {
    lazyLoading: boolean;
    intersectionObserver: boolean;
    maxConcurrentAnimations: number;
    bundleOptimization: boolean;
  };
}

export interface PerformanceMetrics {
  frameRate: number;
  droppedFrames: number;
  memoryUsage: number;
  loadTime: number;
  animationLatency: number;
}

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

export interface ComponentError {
  type: 'RENDER_ERROR' | 'ANIMATION_ERROR' | 'PERFORMANCE_ERROR' | 'ACCESSIBILITY_ERROR';
  message: string;
  componentName: string;
  stack?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ComponentType<{ error: ComponentError; reset: () => void }>;
  onError?: (error: ComponentError) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export interface ErrorRecoveryOptions {
  retryable: boolean;
  fallbackComponent?: ComponentType;
  userMessage?: string;
  autoRetry?: boolean;
  maxRetries?: number;
}

// ============================================================================
// RESPONSIVE DESIGN TYPES
// ============================================================================

export interface ResponsiveConfig {
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
    largeDesktop: number;
  };
  animations: {
    mobile: Partial<AceternityAnimationProps>;
    tablet: Partial<AceternityAnimationProps>;
    desktop: AceternityAnimationProps;
  };
}

export interface ViewportConfig {
  width: number;
  height: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  touchSupport: boolean;
  pixelRatio: number;
}

// ============================================================================
// COMPONENT FACTORY TYPES
// ============================================================================

export interface ComponentFactory<T = {}> {
  create: (props: T) => ReactNode;
  displayName: string;
  defaultProps?: Partial<T>;
}

export interface EnhancedComponentProps<T = {}> {
  ref?: RefObject<any>;
  'data-testid'?: string;
  'aria-label'?: string;
  enablePerformanceTracking?: boolean;
  performanceId?: string;
}

// ============================================================================
// ANIMATION UTILITY TYPES
// ============================================================================

export interface AnimationSequence {
  steps: Array<{
    duration: number;
    delay?: number;
    easing?: string;
    properties: Record<string, any>;
  }>;
  loop?: boolean;
  direction?: 'normal' | 'reverse' | 'alternate';
}

export interface IntersectionAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  animation: AceternityAnimationProps;
}

// ============================================================================
// TESTING AND DEVELOPMENT TYPES
// ============================================================================

export interface ComponentTestConfig {
  enableAnimationTesting: boolean;
  performanceThresholds: {
    maxRenderTime: number;
    maxMemoryUsage: number;
    minFrameRate: number;
  };
  accessibilityTests: {
    screenReaderCompatibility: boolean;
    keyboardNavigation: boolean;
    colorContrast: boolean;
  };
  mockAnimations: boolean;
}

export interface MockAnimationProps {
  skipAnimations: boolean;
  instantTransitions: boolean;
  debugMode: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type PolymorphicComponentProps<T extends React.ElementType, P = {}> = {
  as?: T;
} & P &
  Omit<React.ComponentPropsWithoutRef<T>, 'as' | keyof P>;

export type EventHandler<T = Event> = (event: T) => void;

export type AnimationState = 'idle' | 'running' | 'paused' | 'finished' | 'error';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ComponentVariant = 'default' | 'outline' | 'ghost' | 'link' | 'destructive';