/**
 * API Contracts for Aceternity UI Integration
 * Defines the interface contracts between frontend components and backend services
 */

// ============================================================================
// QUIZ GENERATION API CONTRACTS
// ============================================================================

export interface QuizGenerationRequest {
  text: string;
  options: {
    questionCount?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    questionTypes?: QuestionType[];
    subject?: string;
    language?: string;
  };
  metadata?: {
    userId?: string;
    sessionId?: string;
    source?: string;
  };
}

export interface QuizGenerationResponse {
  success: boolean;
  quizId: string;
  questions: GeneratedQuestion[];
  metadata: {
    processingTime: number;
    modelUsed: string;
    confidence: number;
    wordCount: number;
    estimatedDifficulty: string;
  };
  analytics?: {
    textComplexity: number;
    vocabularyLevel: string;
    topicCategories: string[];
  };
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  tags?: string[];
  confidence: number;
}

export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-blank' | 'short-answer';

// ============================================================================
// USER PROGRESS AND ANALYTICS CONTRACTS
// ============================================================================

export interface UserProgressRequest {
  quizId: string;
  answers: UserAnswer[];
  timeSpent: number;
  completed: boolean;
}

export interface UserAnswer {
  questionId: string;
  selectedAnswer: number;
  timeSpent: number;
  confidence?: number;
}

export interface UserProgressResponse {
  success: boolean;
  results: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    timeSpent: number;
  };
  detailedResults: QuestionResult[];
  recommendations?: LearningRecommendation[];
}

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  selectedAnswer: number;
  correctAnswer: number;
  explanation?: string;
  timeSpent: number;
}

export interface LearningRecommendation {
  type: 'review' | 'practice' | 'advance';
  topic: string;
  reason: string;
  suggestedActions: string[];
}

// ============================================================================
// USER HISTORY AND STATISTICS CONTRACTS
// ============================================================================

export interface UserHistoryRequest {
  userId: string;
  pagination?: {
    page: number;
    limit: number;
  };
  filters?: {
    dateRange?: {
      start: Date;
      end: Date;
    };
    difficulty?: string[];
    subject?: string[];
    completed?: boolean;
  };
  sortBy?: 'date' | 'score' | 'difficulty' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

export interface UserHistoryResponse {
  success: boolean;
  history: QuizHistoryEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  statistics: UserStatistics;
}

export interface QuizHistoryEntry {
  id: string;
  title: string;
  createdAt: Date;
  completedAt?: Date;
  questionsTotal: number;
  questionsAnswered: number;
  accuracy: number;
  score: number;
  timeSpent: number;
  difficulty: string;
  subject?: string;
  status: 'completed' | 'in-progress' | 'abandoned';
  tags?: string[];
}

export interface UserStatistics {
  totalQuizzes: number;
  totalQuestions: number;
  averageAccuracy: number;
  totalTimeSpent: number;
  streakCurrent: number;
  streakLongest: number;
  preferredDifficulty: string;
  mostStudiedSubjects: SubjectStatistic[];
  recentActivity: ActivityEntry[];
  achievements: Achievement[];
}

export interface SubjectStatistic {
  subject: string;
  quizCount: number;
  averageScore: number;
  totalTimeSpent: number;
}

export interface ActivityEntry {
  date: Date;
  quizzes: number;
  accuracy: number;
  timeSpent: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// ============================================================================
// AUTHENTICATION API CONTRACTS
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: DeviceInfo;
}

export interface LoginResponse {
  success: boolean;
  user: UserProfile;
  session: SessionInfo;
  preferences: UserPreferences;
  firstLogin?: boolean;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  acceptTerms: boolean;
  preferences?: Partial<UserPreferences>;
  referralCode?: string;
}

export interface SignupResponse {
  success: boolean;
  user: UserProfile;
  session: SessionInfo;
  preferences: UserPreferences;
  verificationRequired: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  joinedAt: Date;
  lastActive: Date;
  emailVerified: boolean;
  accountStatus: 'active' | 'suspended' | 'pending';
  subscription?: SubscriptionInfo;
}

export interface SessionInfo {
  sessionId: string;
  expiresAt: Date;
  refreshToken?: string;
  permissions: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  accessibility: AccessibilitySettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  achievements: boolean;
  reminders: boolean;
  marketing: boolean;
}

export interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  analyticsOptOut: boolean;
  dataExportRequested: boolean;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenResolution: string;
  timezone: string;
}

export interface SubscriptionInfo {
  plan: 'free' | 'premium' | 'pro';
  status: 'active' | 'cancelled' | 'expired';
  expiresAt?: Date;
  features: string[];
}

// ============================================================================
// ERROR HANDLING CONTRACTS
// ============================================================================

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  requestId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  validationErrors?: ValidationError[];
  metadata?: ResponseMetadata;
}

export interface ResponseMetadata {
  timestamp: Date;
  requestId: string;
  version: string;
  processingTime: number;
  rateLimit?: RateLimitInfo;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
}

// ============================================================================
// REAL-TIME COMMUNICATION CONTRACTS
// ============================================================================

export interface WebSocketMessage {
  type: MessageType;
  payload: any;
  timestamp: Date;
  messageId: string;
}

export type MessageType = 
  | 'quiz-progress'
  | 'user-typing'
  | 'quiz-completed'
  | 'achievement-unlocked'
  | 'system-notification'
  | 'connection-status';

export interface QuizProgressMessage {
  type: 'quiz-progress';
  payload: {
    quizId: string;
    currentQuestion: number;
    totalQuestions: number;
    accuracy: number;
    timeElapsed: number;
  };
}

export interface AchievementUnlockedMessage {
  type: 'achievement-unlocked';
  payload: {
    achievement: Achievement;
    triggerEvent: string;
    celebrationLevel: 'low' | 'medium' | 'high';
  };
}

// ============================================================================
// ANALYTICS AND TELEMETRY CONTRACTS
// ============================================================================

export interface AnalyticsEvent {
  eventName: string;
  eventType: 'user-action' | 'system-event' | 'performance' | 'error';
  properties: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  context?: EventContext;
}

export interface EventContext {
  page: string;
  component: string;
  feature: string;
  experiment?: string;
  variant?: string;
}

export interface PerformanceMetric {
  metricName: string;
  value: number;
  unit: string;
  context: string;
  timestamp: Date;
  sessionId: string;
}

export interface UserBehaviorEvent {
  action: string;
  element: string;
  value?: string | number;
  duration?: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// CONTENT MANAGEMENT CONTRACTS
// ============================================================================

export interface ContentRequest {
  type: 'testimonials' | 'announcements' | 'help-articles' | 'feature-flags';
  filters?: Record<string, any>;
  locale?: string;
}

export interface ContentResponse {
  success: boolean;
  content: ContentItem[];
  lastModified: Date;
  version: string;
}

export interface ContentItem {
  id: string;
  type: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  publishedAt: Date;
  expiresAt?: Date;
  status: 'draft' | 'published' | 'archived';
}

// ============================================================================
// FEATURE FLAGS AND CONFIGURATION CONTRACTS
// ============================================================================

export interface FeatureFlagsRequest {
  userId?: string;
  context?: Record<string, any>;
}

export interface FeatureFlagsResponse {
  flags: Record<string, boolean>;
  experiments: ExperimentConfig[];
  config: AppConfig;
}

export interface ExperimentConfig {
  name: string;
  variant: string;
  parameters: Record<string, any>;
  trackingId: string;
}

export interface AppConfig {
  maxQuizLength: number;
  supportedLanguages: string[];
  maintenanceMode: boolean;
  apiVersions: string[];
  cdnUrls: Record<string, string>;
}