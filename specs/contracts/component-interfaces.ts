/**
 * Component Interface Contracts for Aceternity UI Integration
 * These TypeScript interfaces define the contracts for all enhanced components
 */

// ============================================================================
// CORE ACETERNITY COMPONENT CONTRACTS
// ============================================================================

export interface AceternityCardProps {
  className?: string;
  children: React.ReactNode;
  translateZ?: number | string;
  rotateX?: number | string;
  rotateY?: number | string;
  perspective?: number;
}

export interface AceternityBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  color?: string;
}

export interface AceternityAnimationProps {
  duration?: number;
  delay?: number;
  easing?: string;
  trigger?: 'hover' | 'click' | 'viewport' | 'auto';
  reduceMotion?: boolean;
}

// ============================================================================
// ENHANCED QUIZ COMPONENT CONTRACTS
// ============================================================================

export interface EnhancedQuizDisplayProps {
  questions: QuizQuestion[];
  currentIndex: number;
  totalQuestions: number;
  onAnswer: (questionId: string, answerIndex: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  showProgress: boolean;
  enableAnimations: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
}

export interface QuizCardAnimationProps extends AceternityAnimationProps {
  flipDirection?: 'horizontal' | 'vertical';
  showSparkles?: boolean;
  sparkleIntensity?: number;
}

export interface QuizProgressProps {
  current: number;
  total: number;
  accuracy?: number;
  timeElapsed?: number;
  showAnimation: boolean;
  onProgressClick?: (index: number) => void;
}

// ============================================================================
// ENHANCED SUBMISSION COMPONENT CONTRACTS
// ============================================================================

export interface EnhancedSubmissionProps {
  onSubmit: (data: SubmissionFormData) => Promise<void>;
  isLoading: boolean;
  defaultText?: string;
  maxLength?: number;
  enableAnimations: boolean;
  showCharacterCount: boolean;
}

export interface SubmissionFormData {
  text: string;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionCount?: number;
  metadata?: Record<string, any>;
}

export interface AnimatedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  enableAnimation: boolean;
  showCharacterCount: boolean;
}

export interface MovingBorderButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// ENHANCED NAVIGATION COMPONENT CONTRACTS
// ============================================================================

export interface FloatingNavigationProps {
  items: NavItem[];
  className?: string;
  showBlur?: boolean;
  autoHide?: boolean;
  position?: 'top' | 'bottom';
}

export interface NavItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

export interface MobileNavigationProps {
  items: NavItem[];
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

// ============================================================================
// ENHANCED HISTORY COMPONENT CONTRACTS
// ============================================================================

export interface EnhancedHistoryProps {
  entries: HistoryEntry[];
  displayMode: 'cards' | 'timeline' | 'table';
  onEntrySelect: (id: string) => void;
  onEntryDelete?: (id: string) => void;
  enableAnimations: boolean;
  showTestimonials: boolean;
}

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

export interface TimelineProps {
  entries: HistoryEntry[];
  onEntryClick: (id: string) => void;
  enableAnimations: boolean;
  groupBy?: 'day' | 'week' | 'month';
}

// ============================================================================
// ENHANCED AUTHENTICATION COMPONENT CONTRACTS
// ============================================================================

export interface EnhancedAuthProps {
  mode: 'login' | 'signup' | 'forgot-password' | 'reset-password';
  onSubmit: (data: AuthFormData) => Promise<void>;
  onModeChange: (mode: AuthMode) => void;
  isLoading: boolean;
  error?: string;
  success?: string;
  enableAnimations: boolean;
}

export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
  name?: string;
  rememberMe?: boolean;
  acceptTerms?: boolean;
}

export type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password';

export interface GlowingFormContainerProps {
  children: React.ReactNode;
  showStars?: boolean;
  glowIntensity?: number;
  className?: string;
}

export interface AnimatedInputProps {
  type: 'text' | 'email' | 'password';
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  enableAnimation: boolean;
}

// ============================================================================
// FEEDBACK AND NOTIFICATION CONTRACTS
// ============================================================================

export interface EnhancedToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  enableAnimation: boolean;
  onClose?: () => void;
}

export interface ConfettiProps {
  trigger: boolean;
  colors?: string[];
  intensity?: 'low' | 'medium' | 'high';
  duration?: number;
  onComplete?: () => void;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
  type?: 'spinner' | 'meteors' | 'dots' | 'pulse';
}

// ============================================================================
// GLOBAL CONFIGURATION CONTRACTS
// ============================================================================

export interface AceternityUIConfig {
  animations: {
    enabled: boolean;
    performance: 'low' | 'medium' | 'high';
    reduceMotion: boolean;
  };
  theme: {
    mode: 'light' | 'dark' | 'auto';
    primaryColor: string;
    accentColor: string;
  };
  accessibility: {
    highContrast: boolean;
    screenReaderOptimized: boolean;
    keyboardNavigation: boolean;
  };
  performance: {
    lazyLoading: boolean;
    intersectionObserver: boolean;
    maxConcurrentAnimations: number;
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
// ERROR HANDLING CONTRACTS
// ============================================================================

export interface ComponentError {
  type: 'RENDER_ERROR' | 'ANIMATION_ERROR' | 'PERFORMANCE_ERROR';
  message: string;
  componentName: string;
  stack?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: ComponentError }>;
  onError?: (error: ComponentError) => void;
  resetOnPropsChange?: boolean;
}

// ============================================================================
// TESTING CONTRACTS
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
}

export interface AnimationTestMetrics {
  duration: number;
  frameRate: number;
  smoothness: number;
  memoryImpact: number;
}

// ============================================================================
// RESPONSIVE DESIGN CONTRACTS
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
}