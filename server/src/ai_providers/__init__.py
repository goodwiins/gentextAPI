"""
Enhanced AI Providers Package

This package provides unified access to multiple AI providers for question generation.
"""

from .base import (
    BaseAIProvider,
    ProviderConfig,
    ProviderCapabilities,
    ProviderMetrics,
    ProviderHealth,
    ProviderRegistry,
    GenerationRequest,
    GenerationResult,
    QuestionType,
    Difficulty,
    ProviderStatus,
    provider_registry,
    get_provider_registry,
    initialize_providers
)

from .openai_provider import OpenAIProvider
from .anthropic_provider import AnthropicProvider
from .google_provider import GoogleProvider
from .cohere_provider import CohereProvider
from .azure_foundry_provider import AzureAIFoundryProvider
from .model_router import ModelRouter, RoutingStrategy, RoutingDecision, get_model_router, initialize_model_router
from .performance_monitor import PerformanceMonitor, get_performance_monitor, initialize_performance_monitoring
from .failover_manager import FailoverManager, get_failover_manager, initialize_failover_system

from .specialized_generators import (
    MultipleChoiceGenerator,
    FillInBlankGenerator,
    ShortAnswerGenerator,
    DistractorStrategy,
    BlankStrategy,
    MultipleChoiceConfig,
    FillInBlankConfig,
    ShortAnswerConfig
)

from .question_generator import (
    EnhancedQuestionGenerator,
    QuestionGenerationConfig,
    ContentAnalyzer,
    DifficultyScaler,
    QualityValidator,
    VariationGenerator,
    QuestionComplexity,
    CognitiveLevel,
    ContentAnalysis,
    QuestionTemplate
)

from .difficulty_scaler import (
    DifficultyScaler as AdvancedDifficultyScaler,
    DifficultyAdjustment,
    BloomLevel,
    DifficultyParameters,
    ScalingTarget
)

from .context_aware_generator import (
    ContextAwareQuestionGenerator,
    ContentAnalyzer as ContextAnalyzer,
    ContentMetadata,
    ContextRequirements,
    QuestionContext,
    ContentDomain,
    ContentType,
    ReadingLevel
)

from .question_validator import (
    QuestionValidator,
    QuestionFilter,
    ValidationCriteria,
    QualityScore,
    ValidationReport,
    QualityMetric,
    ValidationLevel,
    QualityTier
)

from .variation_generator import (
    QuestionVariationGenerator,
    VariationRequest,
    VariationResult,
    VariationMetadata,
    VariationType,
    VariationStrategy,
    VariationQuality
)

from .cache_system import (
    IntelligentCache,
    CacheConfig,
    CacheKey,
    CacheEntry,
    CacheMetrics,
    CacheStrategy,
    CacheLevel,
    get_intelligent_cache,
    initialize_intelligent_cache,
    cache_result
)

from .batch_processor import (
    BatchProcessor,
    BatchJob,
    BatchItem,
    BatchConfig,
    BatchPriority,
    BatchStatus,
    BatchStrategy,
    BatchMetrics,
    get_batch_processor,
    initialize_batch_processor
)

from .prompt_optimizer import (
    PromptOptimizer,
    PromptTemplate,
    PromptTest,
    PromptOptimizationConfig,
    PromptTemplateType,
    OptimizationStrategy,
    PromptComponent,
    get_prompt_optimizer,
    initialize_prompt_optimizer
)

from .quality_filter import (
    ResponseFilter,
    ResponseRanker,
    QualityManager,
    QualityMetrics,
    ResponseMetadata,
    FilterCriteria,
    RankingConfig,
    QualityThreshold,
    FilteringStrategy,
    RankingMethod,
    get_quality_manager,
    initialize_quality_manager
)

from .cost_manager import (
    CostManager,
    CostTransaction,
    ProviderCost,
    CostMetrics,
    BudgetLimit,
    BudgetStatus,
    CostOptimizationConfig,
    BudgetPeriod,
    CostAlertLevel,
    OptimizationStrategy as CostOptimizationStrategy,
    get_cost_manager,
    initialize_cost_manager
)

__all__ = [
    'BaseAIProvider',
    'ProviderConfig',
    'ProviderCapabilities',
    'ProviderMetrics',
    'ProviderHealth',
    'ProviderRegistry',
    'GenerationRequest',
    'GenerationResult',
    'QuestionType',
    'Difficulty',
    'ProviderStatus',
    'provider_registry',
    'get_provider_registry',
    'initialize_providers',
    'OpenAIProvider',
    'AnthropicProvider',
    'GoogleProvider',
    'CohereProvider',
    'ModelRouter',
    'RoutingStrategy',
    'RoutingDecision',
    'get_model_router',
    'initialize_model_router',
    'PerformanceMonitor',
    'get_performance_monitor',
    'initialize_performance_monitoring',
    'FailoverManager',
    'get_failover_manager',
    'initialize_failover_system',
    # Specialized Generators
    'MultipleChoiceGenerator',
    'FillInBlankGenerator',
    'ShortAnswerGenerator',
    'DistractorStrategy',
    'BlankStrategy',
    'MultipleChoiceConfig',
    'FillInBlankConfig',
    'ShortAnswerConfig',
    # Enhanced Question Generation
    'EnhancedQuestionGenerator',
    'QuestionGenerationConfig',
    'ContentAnalyzer',
    'DifficultyScaler',
    'QualityValidator',
    'VariationGenerator',
    'QuestionComplexity',
    'CognitiveLevel',
    'ContentAnalysis',
    'QuestionTemplate',
    # Advanced Difficulty Scaling
    'AdvancedDifficultyScaler',
    'DifficultyAdjustment',
    'BloomLevel',
    'DifficultyParameters',
    'ScalingTarget',
    # Context-Aware Generation
    'ContextAwareQuestionGenerator',
    'ContextAnalyzer',
    'ContentMetadata',
    'ContextRequirements',
    'QuestionContext',
    'ContentDomain',
    'ContentType',
    'ReadingLevel',
    # Question Validation
    'QuestionValidator',
    'QuestionFilter',
    'ValidationCriteria',
    'QualityScore',
    'ValidationReport',
    'QualityMetric',
    'ValidationLevel',
    'QualityTier',
    # Variation Generation
    'QuestionVariationGenerator',
    'VariationRequest',
    'VariationResult',
    'VariationMetadata',
    'VariationType',
    'VariationStrategy',
    'VariationQuality',
    # Performance Optimization
    'IntelligentCache',
    'CacheConfig',
    'CacheKey',
    'CacheEntry',
    'CacheMetrics',
    'CacheStrategy',
    'CacheLevel',
    'get_intelligent_cache',
    'initialize_intelligent_cache',
    'cache_result',
    'BatchProcessor',
    'BatchJob',
    'BatchItem',
    'BatchConfig',
    'BatchPriority',
    'BatchStatus',
    'BatchStrategy',
    'BatchMetrics',
    'get_batch_processor',
    'initialize_batch_processor',
    'PromptOptimizer',
    'PromptTemplate',
    'PromptTest',
    'PromptOptimizationConfig',
    'PromptTemplateType',
    'OptimizationStrategy',
    'PromptComponent',
    'get_prompt_optimizer',
    'initialize_prompt_optimizer',
    'ResponseFilter',
    'ResponseRanker',
    'QualityManager',
    'QualityMetrics',
    'ResponseMetadata',
    'FilterCriteria',
    'RankingConfig',
    'QualityThreshold',
    'FilteringStrategy',
    'RankingMethod',
    'get_quality_manager',
    'initialize_quality_manager',
    'CostManager',
    'CostTransaction',
    'ProviderCost',
    'CostMetrics',
    'BudgetLimit',
    'BudgetStatus',
    'CostOptimizationConfig',
    'BudgetPeriod',
    'CostAlertLevel',
    'CostOptimizationStrategy',
    'get_cost_manager',
    'initialize_cost_manager'
]