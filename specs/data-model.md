# Data Model: Aceternity UI Integration

## Component Interface Definitions

### Core Aceternity Components

#### 3D Card System
```typescript
interface CardContainerProps {
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}

interface CardItemProps {
  as?: React.ElementType;
  className?: string;
  translateX?: number | string;
  translateY?: number | string; 
  translateZ?: number | string;
  rotateX?: number | string;
  rotateY?: number | string;
  rotateZ?: number | string;
  children: React.ReactNode;
}
```

#### Background Effects
```typescript
interface BackgroundBeamsProps {
  className?: string;
  children?: React.ReactNode;
}

interface AuroraBackgroundProps {
  className?: string;
  children: React.ReactNode;
  showRadialGradient?: boolean;
}

interface MeteorsProps {
  number?: number;
  className?: string;
}

interface SparklesCoreProps {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  particleColor?: string;
}
```

#### Navigation Components
```typescript
interface FloatingNavProps {
  navItems: NavItem[];
  className?: string;
}

interface NavItem {
  name: string;
  link: string;
  icon?: React.ReactNode;
}
```

#### Moving Elements
```typescript
interface InfiniteMovingCardsProps {
  items: MovingCardItem[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}

interface MovingCardItem {
  quote: string;
  name: string;
  title: string;
}
```

## Application-Specific Data Models

### Enhanced Quiz Display Models
```typescript
interface QuizCardData {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface QuizDisplayProps {
  questions: QuizCardData[];
  currentIndex: number;
  onAnswer: (answer: number) => void;
  showProgress: boolean;
}

interface AnimatedQuizCardProps extends QuizCardData {
  isFlipped?: boolean;
  onFlip: () => void;
  showSparkles?: boolean;
}
```

### Enhanced Submission Models
```typescript
interface SubmissionFormData {
  text: string;
  subject?: string;
  difficulty?: string;
  questionCount?: number;
}

interface AnimatedSubmissionProps {
  onSubmit: (data: SubmissionFormData) => void;
  isLoading: boolean;
  placeholder?: string;
  maxLength?: number;
}

interface TextAnimationConfig {
  typeSpeed?: number;
  deleteSpeed?: number;
  loop?: boolean;
  placeholders?: string[];
}
```

### Enhanced History Models
```typescript
interface HistoryEntry {
  id: string;
  title: string;
  createdAt: Date;
  questionsGenerated: number;
  accuracy?: number;
  timeSpent?: number;
}

interface AnimatedHistoryProps {
  entries: HistoryEntry[];
  displayMode: 'cards' | 'timeline' | 'infinite';
  onEntryClick: (id: string) => void;
}

interface TestimonialData {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
  rating?: number;
}
```

### Enhanced Authentication Models
```typescript
interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
  rememberMe?: boolean;
}

interface AnimatedAuthProps {
  mode: 'login' | 'signup' | 'forgot';
  onSubmit: (data: AuthFormData) => void;
  onModeChange: (mode: string) => void;
  isLoading: boolean;
  error?: string;
}

interface GlowingFormConfig {
  showStars?: boolean;
  glowIntensity?: number;
  backgroundOpacity?: number;
}
```

## Animation Configuration Models

### Global Animation Settings
```typescript
interface AnimationConfig {
  duration: number;
  delay?: number;
  easing?: string;
  trigger?: 'hover' | 'click' | 'viewport' | 'auto';
}

interface PerformanceSettings {
  enableGPUAcceleration: boolean;
  maxFrameRate: number;
  reduceMotion?: boolean;
  lazyLoad?: boolean;
}

interface ResponsiveAnimations {
  mobile: Partial<AnimationConfig>;
  tablet: Partial<AnimationConfig>;
  desktop: AnimationConfig;
}
```

### Component-Specific Configurations
```typescript
interface CardAnimationConfig extends AnimationConfig {
  rotationRange: number;
  perspectiveDepth: number;
  shadowIntensity: number;
}

interface BackgroundAnimationConfig extends AnimationConfig {
  particleCount?: number;
  colorScheme?: string[];
  intensity?: number;
}

interface TextAnimationConfig extends AnimationConfig {
  typewriterSpeed?: number;
  cursorBlink?: boolean;
  highlightColor?: string;
}
```

## State Management Models

### Global UI State
```typescript
interface UIState {
  theme: 'light' | 'dark';
  animations: {
    enabled: boolean;
    performance: 'low' | 'medium' | 'high';
  };
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
  };
}

interface AceternityUIContext {
  uiState: UIState;
  updateUIState: (updates: Partial<UIState>) => void;
  registerAnimation: (id: string, config: AnimationConfig) => void;
  unregisterAnimation: (id: string) => void;
}
```

### Component State Management
```typescript
interface ComponentRegistry {
  activeAnimations: Map<string, AnimationConfig>;
  intersectionObserver?: IntersectionObserver;
  performanceMetrics: {
    averageFrameRate: number;
    droppedFrames: number;
    loadTime: number;
  };
}
```

## Integration Points

### Existing Application Interfaces
```typescript
// Quiz Service Integration
interface QuizService {
  generateQuiz: (text: string) => Promise<QuizCardData[]>;
  saveProgress: (quizId: string, progress: number) => Promise<void>;
  getHistory: () => Promise<HistoryEntry[]>;
}

// Auth Context Integration
interface AuthContextType {
  authState: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isUserAuthenticated: () => boolean;
  clearAuthError: () => void;
  refreshAuth: () => Promise<void>;
}

// Enhanced with animations
interface EnhancedAuthContextType extends AuthContextType {
  animationState: {
    isLoading: boolean;
    showSuccess: boolean;
    showError: boolean;
  };
}
```

### API Response Models
```typescript
interface QuizGenerationResponse {
  success: boolean;
  quizId: string;
  questions: QuizCardData[];
  metadata: {
    processingTime: number;
    difficulty: string;
    sourceLength: number;
  };
}

interface UserStatsResponse {
  totalQuizzes: number;
  averageScore: number;
  timeSpent: number;
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: Date;
  icon: string;
}
```

## Validation Schemas

### Form Validation
```typescript
interface ValidationRules {
  text: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
  email: {
    pattern: RegExp;
    required: boolean;
  };
  password: {
    minLength: number;
    requireSpecialChars: boolean;
    required: boolean;
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings?: Record<string, string[]>;
}
```

### Animation Validation
```typescript
interface AnimationValidation {
  maxDuration: number;
  allowedEasings: string[];
  performanceThresholds: {
    maxMemoryUsage: number;
    minFrameRate: number;
  };
}
```

## Error Handling Models

### Animation Error Types
```typescript
interface AnimationError {
  type: 'PERFORMANCE' | 'COMPATIBILITY' | 'CONFIGURATION';
  message: string;
  componentId: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
}

interface ErrorRecovery {
  fallbackComponent?: React.ComponentType;
  retryable: boolean;
  userMessage?: string;
}
```

This data model provides a comprehensive foundation for implementing Aceternity UI components while maintaining type safety and clear interfaces for all enhanced functionality.