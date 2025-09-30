# Enhanced AI Models Data Models

## Overview

This document defines the data structures and interfaces for the Enhanced AI Models feature, ensuring type safety and consistency across the implementation.

## Core Interfaces

### AI Provider Interface

```typescript
interface AIProvider {
  id: string;
  name: string;
  apiVersion: string;
  endpoint: string;
  apiKey: string;
  model: string;
  config: ProviderConfig;
  capabilities: ProviderCapabilities;
  rateLimits: RateLimits;
  pricing: PricingModel;
  status: ProviderStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface ProviderConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  systemPrompt?: string;
  customParameters?: Record<string, any>;
}

interface ProviderCapabilities {
  supportedQuestionTypes: QuestionType[];
  maxContextLength: number;
  maxOutputTokens: number;
  supportsStreaming: boolean;
  supportsBatch: boolean;
  supportsFunctionCalling: boolean;
  supportsJsonMode: boolean;
  languages: string[];
  domains: string[];
}

interface RateLimits {
  requestsPerMinute: number;
  requestsPerHour: number;
  tokensPerMinute: number;
  tokensPerDay: number;
  concurrentRequests: number;
}

interface PricingModel {
  inputTokenPrice: number; // per 1K tokens
  outputTokenPrice: number; // per 1K tokens
  requestPrice?: number; // per request
  currency: string;
  tierDiscounts?: TierDiscount[];
}

interface TierDiscount {
  minTokens: number;
  discountPercentage: number;
}

interface ProviderStatus {
  isAvailable: boolean;
  lastHealthCheck: Date;
  responseTime: number;
  errorRate: number;
  uptime: number;
  consecutiveFailures: number;
}
```

## Question Generation Models

### Question Generation Request
```typescript
interface QuestionGenerationRequest {
  id: string;
  userId: string;
  content: string;
  questionTypes: QuestionType[];
  difficulty: QuestionDifficulty;
  questionCount: number;
  context?: GenerationContext;
  modelSelection?: ModelSelectionStrategy;
  options?: GenerationOptions;
  priority: Priority;
  createdAt: Date;
}

interface GenerationContext {
  domain?: string;
  topic?: string;
  audience?: AudienceType;
  language: string;
  educationalLevel?: EducationalLevel;
  timeLimit?: number; // in minutes
  specificInstructions?: string;
  keywords?: string[];
  excludeTopics?: string[];
}

interface ModelSelectionStrategy {
  strategy: 'auto' | 'manual' | 'cost' | 'quality' | 'speed';
  preferredProviders?: string[];
  excludedProviders?: string[];
  maxCost?: number;
  minQuality?: number;
  maxResponseTime?: number;
}

interface GenerationOptions {
  includeExplanations: boolean;
  includeHints: boolean;
  difficultyVariation: boolean;
  questionVariations: number;
  validationLevel: 'basic' | 'strict' | 'comprehensive';
  outputFormat: 'json' | 'text' | 'structured';
  includeMetadata: boolean;
}
```

### Question Generation Response
```typescript
interface QuestionGenerationResponse {
  id: string;
  requestId: string;
  questions: GeneratedQuestion[];
  provider: AIProvider;
  modelUsed: string;
  metrics: GenerationMetrics;
  cost: CostBreakdown;
  performance: PerformanceMetrics;
  status: GenerationStatus;
  errors?: GenerationError[];
  warnings?: GenerationWarning[];
  createdAt: Date;
}

interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  hints?: string[];
  difficulty: QuestionDifficulty;
  topic?: string;
  domain?: string;
  metadata: QuestionMetadata;
  qualityScore: number;
  confidence: number;
  variations?: GeneratedQuestion[];
}

interface QuestionMetadata {
  tokensUsed: number;
  processingTime: number;
  provider: string;
  model: string;
  promptUsed: string;
  timestamp: Date;
  seed?: number;
  temperature: number;
  contextHash?: string;
}

interface GenerationMetrics {
  totalQuestions: number;
  successfulQuestions: number;
  failedQuestions: number;
  averageResponseTime: number;
  totalTokensUsed: number;
  averageQualityScore: number;
  averageConfidence: number;
  difficultyDistribution: Record<QuestionDifficulty, number>;
  questionTypeDistribution: Record<QuestionType, number>;
}

interface CostBreakdown {
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  requestCost?: number;
  totalCost: number;
  currency: string;
}

interface PerformanceMetrics {
  requestStartTime: Date;
  requestEndTime: Date;
  totalTime: number;
  apiCallTime: number;
  processingTime: number;
  queueTime?: number;
  retryCount: number;
  timeout?: boolean;
}

interface GenerationError {
  code: string;
  message: string;
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

interface GenerationWarning {
  code: string;
  message: string;
  details?: any;
  suggestion?: string;
  timestamp: Date;
}

interface GenerationStatus {
  state: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  estimatedTimeRemaining?: number;
  retryCount: number;
  lastUpdated: Date;
}
```

## Question Type Definitions

### Question Types
```typescript
type QuestionType = 
  | 'true-false'
  | 'multiple-choice'
  | 'fill-in-blank'
  | 'short-answer'
  | 'essay'
  | 'matching'
  | 'ordering'
  | 'classification';

type QuestionDifficulty = 
  | 'beginner'
  | 'intermediate' 
  | 'advanced'
  | 'expert';

type Priority = 'low' | 'normal' | 'high' | 'urgent';

type AudienceType = 
  | 'elementary'
  | 'middle-school'
  | 'high-school'
  | 'undergraduate'
  | 'graduate'
  | 'professional'
  | 'general';

type EducationalLevel = 
  | 'k1' | 'k2' | 'k3' | 'k4' | 'k5' | 'k6'
  | 'k7' | 'k8' | 'k9' | 'k10' | 'k11' | 'k12'
  | 'undergraduate' | 'graduate' | 'doctoral';
```

## Performance and Monitoring Models

### Provider Performance Metrics
```typescript
interface ProviderMetrics {
  providerId: string;
  timestamp: Date;
  requests: RequestMetrics;
  responses: ResponseMetrics;
  errors: ErrorMetrics;
  performance: PerformanceIndicators;
  quality: QualityMetrics;
  cost: CostMetrics;
}

interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageRequestSize: number;
  peakRequestsPerMinute: number;
  retryCount: number;
}

interface ResponseMetrics {
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  averageTokensPerResponse: number;
  totalTokensGenerated: number;
}

interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  timeoutErrors: number;
  rateLimitErrors: number;
  authenticationErrors: number;
  validationErrors: number;
  otherErrors: number;
}

interface PerformanceIndicators {
  uptime: number;
  availability: number;
  throughput: number;
  efficiency: number;
  reliability: number;
}

interface QualityMetrics {
  averageQualityScore: number;
  qualityTrend: 'improving' | 'stable' | 'declining';
  userSatisfaction: number;
  feedbackCount: number;
  averageConfidence: number;
}

interface CostMetrics {
  totalCost: number;
  averageCostPerRequest: number;
  averageCostPerToken: number;
  costVsBudget: number;
  costEfficiency: number;
}
```

## Caching and Optimization Models

### Cache Configuration
```typescript
interface CacheConfig {
  enabled: boolean;
  strategy: 'content-based' | 'semantic' | 'hybrid';
  ttl: number; // time to live in seconds
  maxSize: number; // maximum cache size in MB
  compression: boolean;
  invalidation: CacheInvalidationStrategy;
  warmup: CacheWarmupConfig;
}

interface CacheInvalidationStrategy {
  strategy: 'ttl' | 'lru' | 'lfu' | 'adaptive';
  maxAge?: number;
  maxSize?: number;
  invalidationEvents?: string[];
}

interface CacheWarmupConfig {
  enabled: boolean;
  schedule: string; // cron expression
  topQueries: number;
  refreshInterval: number;
}

interface CacheEntry {
  key: string;
  value: GeneratedQuestion[];
  metadata: CacheMetadata;
  createdAt: Date;
  accessedAt: Date;
  accessCount: number;
  ttl: number;
  size: number;
}

interface CacheMetadata {
  contentHash: string;
  parametersHash: string;
  provider: string;
  model: string;
  qualityScore: number;
  cost: number;
  hitCount: number;
}
```

## User Feedback and Analytics Models

### User Feedback
```typescript
interface UserFeedback {
  id: string;
  userId: string;
  questionId: string;
  rating: number; // 1-5 stars
  feedback: string;
  feedbackType: 'quality' | 'accuracy' | 'clarity' | 'difficulty' | 'other';
  helpful: boolean;
  suggestions?: string;
  timestamp: Date;
}

interface QuestionAnalytics {
  questionId: string;
  totalViews: number;
  totalUses: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  feedbackCount: number;
  improvementSuggestions: string[];
  commonIssues: string[];
  lastUpdated: Date;
}
```

## Batch Processing Models

### Batch Request
```typescript
interface BatchGenerationRequest {
  id: string;
  userId: string;
  requests: QuestionGenerationRequest[];
  priority: Priority;
  maxConcurrentRequests?: number;
  timeout?: number;
  callbackUrl?: string;
  notificationSettings: NotificationSettings;
  createdAt: Date;
}

interface BatchGenerationResponse {
  id: string;
  batchId: string;
  status: BatchStatus;
  progress: BatchProgress;
  results: BatchResult[];
  errors: BatchError[];
  metrics: BatchMetrics;
  createdAt: Date;
  completedAt?: Date;
}

interface BatchProgress {
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  inProgressRequests: number;
  pendingRequests: number;
  percentageComplete: number;
  estimatedTimeRemaining?: number;
}

interface BatchResult {
  requestId: string;
  status: 'success' | 'failed';
  response?: QuestionGenerationResponse;
  error?: GenerationError;
  processingTime: number;
  completedAt: Date;
}

interface BatchError {
  requestId: string;
  error: GenerationError;
  timestamp: Date;
}

interface BatchMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  totalCost: number;
  averageQualityScore: number;
  startTime: Date;
  endTime?: Date;
}

interface NotificationSettings {
  email: boolean;
  webhook: boolean;
  inApp: boolean;
  onProgress: boolean;
  onComplete: boolean;
  onError: boolean;
}

type BatchStatus = 
  | 'pending'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'partial';
```

## Configuration and Settings Models

### System Configuration
```typescript
interface SystemConfig {
  providers: ProviderConfig[];
  defaultProvider: string;
  fallbackChain: string[];
  routingStrategy: RoutingStrategy;
  caching: CacheConfig;
  monitoring: MonitoringConfig;
  security: SecurityConfig;
  limits: SystemLimits;
}

interface RoutingStrategy {
  strategy: 'round-robin' | 'weighted' | 'performance' | 'cost' | 'quality';
  weights?: Record<string, number>;
  thresholds?: RoutingThresholds;
}

interface RoutingThresholds {
  maxResponseTime: number;
  minQualityScore: number;
  maxCost: number;
  minAvailability: number;
}

interface MonitoringConfig {
  enabled: boolean;
  metricsCollectionInterval: number;
  healthCheckInterval: number;
  alertingEnabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  retentionPeriod: number; // days
}

interface SecurityConfig {
  apiKeyEncryption: boolean;
  requestSigning: boolean;
  rateLimiting: boolean;
  inputValidation: boolean;
  outputFiltering: boolean;
  auditLogging: boolean;
}

interface SystemLimits {
  maxConcurrentRequests: number;
  maxRequestsPerUser: number;
  maxBatchSize: number;
  maxContentLength: number;
  maxQuestionsPerRequest: number;
  dailyBudget?: number;
  userTimeout: number;
}
```