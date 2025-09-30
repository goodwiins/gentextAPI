# Enhanced AI Models - Frontend Component Contracts

## Overview
This document defines the React component contracts for the Enhanced AI Models feature, ensuring consistent interfaces and behavior across all frontend components.

## Core Component Interfaces

### ModelSelector Component
```typescript
// src/components/ai-models/ModelSelector.tsx
interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
  loading?: boolean;
  showPerformance?: boolean;
  showCost?: boolean;
  className?: string;
}

interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider: string;
  capabilities: string[];
  performance?: {
    responseTime: number;
    quality: number;
    reliability: number;
  };
  cost?: {
    perToken: number;
    perRequest: number;
  };
  icon?: React.ReactNode;
  badge?: string;
}

interface ModelSelectorState {
  selectedModel: ModelOption | null;
  isOpen: boolean;
  searchQuery: string;
  filteredModels: ModelOption[];
  isLoading: boolean;
}

interface ModelSelectorEvents {
  onModelChange: (model: ModelOption) => void;
  onModelHover?: (model: ModelOption | null) => void;
  onSearch: (query: string) => void;
}
```

### QuestionTypeSelector Component
```typescript
// src/components/ai-models/QuestionTypeSelector.tsx
interface QuestionTypeSelectorProps {
  selectedTypes: QuestionType[];
  onChange: (types: QuestionType[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  maxSelections?: number;
  className?: string;
}

type QuestionType = 
  | 'true-false'
  | 'multiple-choice' 
  | 'fill-in-blank'
  | 'short-answer'
  | 'essay'
  | 'matching'
  | 'ordering'
  | 'classification';

interface QuestionTypeOption {
  id: QuestionType;
  name: string;
  description: string;
  icon: React.ReactNode;
  examples: string[];
  difficultyRange: QuestionDifficulty[];
  estimatedTime: number;
}

interface QuestionTypeSelectorState {
  availableTypes: QuestionTypeOption[];
  showHelp: boolean;
  hoveredType: QuestionTypeOption | null;
}

interface QuestionTypeSelectorEvents {
  onTypeSelect: (type: QuestionType) => void;
  onTypeDeselect: (type: QuestionType) => void;
  onTypeHover?: (type: QuestionTypeOption | null) => void;
}
```

### GenerationOptions Component
```typescript
// src/components/ai-models/GenerationOptions.tsx
interface GenerationOptionsProps {
  options: GenerationOptions;
  onChange: (options: GenerationOptions) => void;
  disabled?: boolean;
  showAdvanced?: boolean;
  className?: string;
}

interface GenerationOptions {
  difficulty: QuestionDifficulty;
  questionCount: number;
  includeExplanations: boolean;
  includeHints: boolean;
  difficultyVariation: boolean;
  questionVariations: number;
  validationLevel: ValidationLevel;
  outputFormat: OutputFormat;
  includeMetadata: boolean;
  customPrompt?: string;
  targetAudience?: AudienceType;
  timeLimit?: number;
  language: string;
}

type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type ValidationLevel = 'basic' | 'strict' | 'comprehensive';
type OutputFormat = 'json' | 'text' | 'structured';
type AudienceType = 'elementary' | 'middle-school' | 'high-school' | 'undergraduate' | 'graduate' | 'professional' | 'general';

interface GenerationOptionsEvents {
  onOptionsChange: (options: GenerationOptions) => void;
  onAdvancedToggle?: (showAdvanced: boolean) => void;
  onPresetLoad?: (preset: GenerationOptions) => void;
}
```

### QuestionPreview Component
```typescript
// src/components/ai-models/QuestionPreview.tsx
interface QuestionPreviewProps {
  question: GeneratedQuestion;
  onEdit?: (question: GeneratedQuestion) => void;
  onDelete?: (questionId: string) => void;
  onRegenerate?: (questionId: string) => void;
  onRate?: (questionId: string, rating: number) => void;
  showActions?: boolean;
  showMetadata?: boolean;
  className?: string;
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
  cost: number;
}

interface QuestionPreviewState {
  isEditing: boolean;
  editedQuestion: GeneratedQuestion;
  showVariations: boolean;
  selectedVariation: number;
  showExplanation: boolean;
  showHints: boolean;
  isRating: boolean;
  userRating?: number;
}

interface QuestionPreviewEvents {
  onQuestionEdit: (question: GeneratedQuestion) => void;
  onQuestionDelete: (questionId: string) => void;
  onQuestionRegenerate: (questionId: string) => void;
  onQuestionRate: (questionId: string, rating: number, feedback?: string) => void;
  onVariationSelect: (variation: GeneratedQuestion) => void;
  onMetadataToggle?: (show: boolean) => void;
}
```

### GenerationProgress Component
```typescript
// src/components/ai-models/GenerationProgress.tsx
interface GenerationProgressProps {
  requestId: string;
  progress: GenerationProgress;
  estimatedTime?: number;
  onCancel?: () => void;
  showDetails?: boolean;
  className?: string;
}

interface GenerationProgress {
  totalQuestions: number;
  completedQuestions: number;
  failedQuestions: number;
  inProgressQuestions: number;
  currentProvider: string;
  currentModel: string;
  qualityScore?: number;
  cost?: number;
  errors?: GenerationError[];
}

interface GenerationProgressState {
  isExpanded: boolean;
  showErrors: boolean;
  autoRefresh: boolean;
  lastUpdate: Date;
}

interface GenerationProgressEvents {
  onCancel: () => void;
  onRetry?: (questionId?: string) => void;
  onExpandToggle?: (expanded: boolean) => void;
  onErrorDismiss?: (errorId: string) => void;
}
```

### PerformanceDashboard Component
```typescript
// src/components/ai-models/PerformanceDashboard.tsx
interface PerformanceDashboardProps {
  metrics: PerformanceMetrics;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onExport?: (format: 'csv' | 'json' | 'pdf') => void;
  className?: string;
}

type TimeRange = '1h' | '24h' | '7d' | '30d' | '90d';

interface PerformanceMetrics {
  overview: OverviewMetrics;
  providers: ProviderMetrics[];
  usage: UsageMetrics;
  quality: QualityMetrics;
  costs: CostMetrics;
  trends: TrendMetrics;
}

interface OverviewMetrics {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  totalCost: number;
  averageQualityScore: number;
  activeUsers: number;
}

interface ProviderMetrics {
  providerId: string;
  name: string;
  requests: number;
  successRate: number;
  averageResponseTime: number;
  averageQualityScore: number;
  cost: number;
  uptime: number;
  status: 'online' | 'degraded' | 'offline';
}

interface UsageMetrics {
  requestsByDay: DataPoint[];
  tokensByDay: DataPoint[];
  usersByDay: DataPoint[];
  questionTypes: QuestionTypeDistribution[];
}

interface QualityMetrics {
  qualityScores: QualityDistribution;
  userRatings: RatingDistribution;
  feedbackSummary: FeedbackSummary;
  improvementTrends: TrendData[];
}

interface CostMetrics {
  costsByProvider: ProviderCost[];
  costTrends: TrendData[];
  efficiencyMetrics: EfficiencyMetrics;
}

interface TrendMetrics {
  requestTrends: TrendData[];
  qualityTrends: TrendData[];
  costTrends: TrendData[];
  performanceTrends: TrendData[];
}

interface PerformanceDashboardState {
  selectedTimeRange: TimeRange;
  selectedProviders: string[];
  selectedMetrics: string[];
  isExporting: boolean;
  isLoading: boolean;
  autoRefresh: boolean;
}

interface PerformanceDashboardEvents {
  onTimeRangeChange: (range: TimeRange) => void;
  onProviderSelect: (providerId: string, selected: boolean) => void;
  onMetricToggle: (metricId: string, visible: boolean) => void;
  onExport: (format: 'csv' | 'json' | 'pdf') => void;
  onRefresh: () => void;
  onAutoRefreshToggle: (enabled: boolean) => void;
}
```

### CostMonitor Component
```typescript
// src/components/ai-models/CostMonitor.tsx
interface CostMonitorProps {
  costs: CostData;
  budget?: BudgetData;
  onBudgetUpdate?: (budget: BudgetData) => void;
  onAlertCreate?: (alert: CostAlert) => void;
  className?: string;
}

interface CostData {
  today: number;
  thisMonth: number;
  thisWeek: number;
  byProvider: ProviderCost[];
  byUser: UserCost[];
  byQuestionType: QuestionTypeCost[];
  trends: TrendData[];
  forecast: CostForecast;
}

interface BudgetData {
  daily: number;
  monthly: number;
  alerts: BudgetAlert[];
  notifications: BudgetNotification[];
}

interface ProviderCost {
  providerId: string;
  providerName: string;
  cost: number;
  tokens: number;
  requests: number;
  averageCostPerToken: number;
  averageCostPerRequest: number;
}

interface CostForecast {
  projectedDaily: number;
  projectedMonthly: number;
  estimatedOverrun?: number;
  recommendations: string[];
}

interface CostAlert {
  id: string;
  type: 'threshold' | 'trend' | 'forecast';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  action?: CostAlertAction;
}

interface CostMonitorState {
  selectedTimeframe: 'daily' | 'weekly' | 'monthly';
  showForecast: boolean;
  showBreakdown: boolean;
  selectedBreakdown: 'provider' | 'user' | 'type';
  isEditingBudget: boolean;
  tempBudget: BudgetData;
}

interface CostMonitorEvents {
  onBudgetChange: (budget: BudgetData) => void;
  onAlertAcknowledge: (alertId: string) => void;
  onExportData: (format: 'csv' | 'json') => void;
  onTimeframeChange: (timeframe: 'daily' | 'weekly' | 'monthly') => void;
  onBreakdownChange: (breakdown: 'provider' | 'user' | 'type') => void;
}
```

## Batch Generation Components

### BatchUploader Component
```typescript
// src/components/ai-models/BatchUploader.tsx
interface BatchUploaderProps {
  onFileUpload: (file: File, config: BatchConfig) => void;
  onTextUpload: (text: string, config: BatchConfig) => void;
  supportedFormats: string[];
  maxSize: number; // in MB
  className?: string;
}

interface BatchConfig {
  questionTypes: QuestionType[];
  difficulty: QuestionDifficulty;
  questionCount: number;
  options: GenerationOptions;
  priority: Priority;
  callbackUrl?: string;
  notificationSettings: NotificationSettings;
}

interface BatchUploaderState {
  uploadMethod: 'file' | 'text' | 'url';
  selectedFile: File | null;
  textContent: string;
  urlContent: string;
  uploadProgress: number;
  isUploading: boolean;
  validationErrors: ValidationError[];
}

interface BatchUploaderEvents {
  onFileSelect: (file: File) => void;
  onTextChange: (text: string) => void;
  onUrlChange: (url: string) => void;
  onUploadStart: () => void;
  onUploadProgress: (progress: number) => void;
  onUploadComplete: (batchId: string) => void;
  onUploadError: (error: string) => void;
}
```

### BatchStatus Component
```typescript
// src/components/ai-models/BatchStatus.tsx
interface BatchStatusProps {
  batchId: string;
  status: BatchStatus;
  onRefresh?: () => void;
  onCancel?: () => void;
  onDownload?: (format: 'json' | 'csv' | 'xlsx') => void;
  className?: string;
}

interface BatchStatus {
  id: string;
  userId: string;
  state: BatchState;
  progress: BatchProgress;
  results: BatchResult[];
  errors: BatchError[];
  metrics: BatchMetrics;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

type BatchState = 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'partial';

interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  percentage: number;
  estimatedTimeRemaining?: number;
  currentOperation?: string;
}

interface BatchStatusState {
  isRefreshing: boolean;
  autoRefresh: boolean;
  refreshInterval?: number;
  expanded: boolean;
  selectedResult: BatchResult | null;
  showErrorDetails: boolean;
}

interface BatchStatusEvents {
  onRefresh: () => void;
  onCancel: () => void;
  onDownload: (format: 'json' | 'csv' | 'xlsx') => void;
  onResultSelect: (result: BatchResult) => void;
  onErrorRetry?: (errorId: string) => void;
  onExpandToggle: (expanded: boolean) => void;
}
```

## Feedback and Rating Components

### QuestionRating Component
```typescript
// src/components/ai-models/QuestionRating.tsx
interface QuestionRatingProps {
  questionId: string;
  currentRating?: number;
  onRate: (rating: number, feedback?: string) => void;
  showFeedback?: boolean;
  className?: string;
}

interface QuestionRatingState {
  isRating: boolean;
  selectedRating: number;
  feedback: string;
  showFeedbackForm: boolean;
  isSubmitting: boolean;
}

interface QuestionRatingEvents {
  onRatingChange: (rating: number) => void;
  onFeedbackChange: (feedback: string) => void;
  onSubmit: (rating: number, feedback?: string) => void;
  onCancel: () => void;
}
```

### FeedbackSummary Component
```typescript
// src/components/ai-models/FeedbackSummary.tsx
interface FeedbackSummaryProps {
  questionId: string;
  feedback: FeedbackData;
  onFeedbackFilter?: (filter: FeedbackFilter) => void;
  className?: string;
}

interface FeedbackData {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: RatingDistribution;
  comments: FeedbackComment[];
  commonIssues: string[];
  improvementSuggestions: string[];
  lastUpdated: Date;
}

interface FeedbackFilter {
  rating?: number;
  type?: 'quality' | 'accuracy' | 'clarity' | 'difficulty' | 'other';
  helpful?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface FeedbackSummaryState {
  selectedFilter: FeedbackFilter;
  sortBy: 'newest' | 'oldest' | 'rating' | 'helpful';
  showAllComments: boolean;
  expandedIssues: string[];
}

interface FeedbackSummaryEvents {
  onFilterChange: (filter: FeedbackFilter) => void;
  onSortChange: (sortBy: 'newest' | 'oldest' | 'rating' | 'helpful') => void;
  onCommentHelpful: (commentId: string, helpful: boolean) => void;
  onIssueToggle: (issue: string) => void;
}
```

## Common Utility Types

### Common Types
```typescript
// src/types/ai-models/common.ts
type Priority = 'low' | 'normal' | 'high' | 'urgent';

type Status = 'idle' | 'loading' | 'success' | 'error' | 'warning';

type NotificationSettings = {
  email: boolean;
  webhook: boolean;
  inApp: boolean;
  onProgress: boolean;
  onComplete: boolean;
  onError: boolean;
};

interface ValidationError {
  field: string;
  message: string;
  severity: 'warning' | 'error';
}

interface DataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

interface TrendData {
  period: Date;
  value: number;
  change: number;
  changePercentage: number;
}

interface QuestionTypeDistribution {
  type: QuestionType;
  count: number;
  percentage: number;
}

interface QualityDistribution {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

interface RatingDistribution {
  [key: number]: number; // 1-5 star ratings
}

interface FeedbackSummary {
  averageRating: number;
  totalComments: number;
  positiveComments: number;
  negativeComments: number;
  commonThemes: string[];
}

interface FeedbackComment {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  type: string;
  helpful: boolean;
  helpfulCount: number;
  timestamp: Date;
}

interface EfficiencyMetrics {
  costPerQuestion: number;
  tokensPerQuestion: number;
  timePerQuestion: number;
  qualityScorePerCost: number;
}
```

## Hook Contracts

### Custom Hooks
```typescript
// src/hooks/useModelSelection.ts
interface UseModelSelectionReturn {
  selectedModel: ModelOption | null;
  availableModels: ModelOption[];
  isLoading: boolean;
  error: string | null;
  selectModel: (modelId: string) => void;
  refreshModels: () => Promise<void>;
  getModelPerformance: (modelId: string) => PerformanceData | null;
}

// src/hooks/useQuestionGeneration.ts
interface UseQuestionGenerationReturn {
  isGenerating: boolean;
  progress: GenerationProgress | null;
  questions: GeneratedQuestion[];
  error: string | null;
  generateQuestions: (request: QuestionGenerationRequest) => Promise<void>;
  regenerateQuestion: (questionId: string) => Promise<void>;
  cancelGeneration: () => void;
  clearResults: () => void;
}

// src/hooks/usePerformanceMetrics.ts
interface UsePerformanceMetricsReturn {
  metrics: PerformanceMetrics | null;
  isLoading: boolean;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  refreshMetrics: () => Promise<void>;
  exportMetrics: (format: 'csv' | 'json') => Promise<Blob>;
}

// src/hooks/useBatchGeneration.ts
interface UseBatchGenerationReturn {
  batches: BatchStatus[];
  currentBatch: BatchStatus | null;
  isUploading: boolean;
  uploadBatch: (config: BatchConfig, content: File | string) => Promise<string>;
  cancelBatch: (batchId: string) => Promise<void>;
  downloadBatch: (batchId: string, format: 'json' | 'csv' | 'xlsx') => Promise<Blob>;
  refreshBatches: () => Promise<void>;
}
```