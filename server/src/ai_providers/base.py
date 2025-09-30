"""
Enhanced AI Provider Abstraction Layer

This module provides a unified interface for multiple AI providers,
enabling seamless integration, failover, and load balancing across
different AI models and providers.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Union, Any, AsyncGenerator
from dataclasses import dataclass
from enum import Enum
import asyncio
import time
import logging
from datetime import datetime, timedelta
import json
import uuid

logger = logging.getLogger(__name__)

class QuestionType(Enum):
    """Supported question types"""
    TRUE_FALSE = "true-false"
    MULTIPLE_CHOICE = "multiple-choice"
    FILL_IN_BLANK = "fill-in-blank"
    SHORT_ANSWER = "short-answer"
    ESSAY = "essay"
    MATCHING = "matching"
    ORDERING = "ordering"
    CLASSIFICATION = "classification"

class Difficulty(Enum):
    """Question difficulty levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class ProviderStatus(Enum):
    """Provider operational status"""
    ONLINE = "online"
    DEGRADED = "degraded"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"

@dataclass
class ProviderConfig:
    """Configuration for AI providers"""
    api_key: str
    base_url: str
    model: str
    max_tokens: int = 1000
    temperature: float = 0.7
    timeout: int = 30
    max_retries: int = 3
    rate_limit_rpm: int = 60
    rate_limit_rph: int = 3600

@dataclass
class ProviderCapabilities:
    """Provider capabilities metadata"""
    supported_question_types: List[QuestionType]
    max_context_length: int
    max_output_tokens: int
    supports_streaming: bool
    supports_batch: bool
    supports_json_mode: bool
    languages: List[str]
    domains: List[str]

@dataclass
class ProviderMetrics:
    """Performance metrics for providers"""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    average_response_time: float = 0.0
    last_response_time: float = 0.0
    uptime_start: datetime = None
    consecutive_failures: int = 0
    last_health_check: datetime = None
    
    def __post_init__(self):
        if self.uptime_start is None:
            self.uptime_start = datetime.now()
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate percentage"""
        if self.total_requests == 0:
            return 100.0
        return (self.successful_requests / self.total_requests) * 100
    
    @property
    def uptime_percentage(self) -> float:
        """Calculate uptime percentage"""
        if not self.uptime_start:
            return 0.0
        total_time = (datetime.now() - self.uptime_start).total_seconds()
        # For now, assume 100% uptime - this could be enhanced with actual downtime tracking
        return 100.0

@dataclass
class GenerationRequest:
    """Question generation request"""
    id: str
    content: str
    question_types: List[QuestionType]
    difficulty: Difficulty
    question_count: int
    context: Optional[Dict[str, Any]] = None
    options: Optional[Dict[str, Any]] = None
    priority: str = "normal"
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.context is None:
            self.context = {}
        if self.options is None:
            self.options = {}

@dataclass
class GenerationResult:
    """Question generation result"""
    request_id: str
    questions: List[Dict[str, Any]]
    provider: str
    model: str
    metrics: Dict[str, Any]
    cost: float
    quality_score: float
    processing_time: float
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

@dataclass
class ProviderHealth:
    """Provider health status"""
    status: ProviderStatus
    response_time: float
    error_rate: float
    last_check: datetime
    next_check: datetime
    
class BaseAIProvider(ABC):
    """Abstract base class for AI providers"""
    
    def __init__(self, provider_id: str, config: ProviderConfig):
        self.provider_id = provider_id
        self.config = config
        self.metrics = ProviderMetrics()
        self.capabilities = self._get_capabilities()
        self.health = ProviderHealth(
            status=ProviderStatus.OFFLINE,
            response_time=0.0,
            error_rate=0.0,
            last_check=datetime.now(),
            next_check=datetime.now()
        )
        self._request_lock = asyncio.Lock()
        self._health_lock = asyncio.Lock()
    
    @abstractmethod
    def _get_capabilities(self) -> ProviderCapabilities:
        """Get provider-specific capabilities"""
        pass
    
    @abstractmethod
    async def _generate_questions_impl(
        self, 
        request: GenerationRequest
    ) -> GenerationResult:
        """Provider-specific question generation implementation"""
        pass
    
    @abstractmethod
    async def _health_check_impl(self) -> bool:
        """Provider-specific health check implementation"""
        pass
    
    async def generate_questions(
        self, 
        request: GenerationRequest
    ) -> GenerationResult:
        """Generate questions with error handling and metrics tracking"""
        start_time = time.time()
        
        async with self._request_lock:
            try:
                # Update metrics
                self.metrics.total_requests += 1
                
                # Check if provider is available
                if not await self.is_available():
                    raise Exception(f"Provider {self.provider_id} is not available")
                
                # Generate questions
                result = await self._generate_questions_impl(request)
                
                # Update success metrics
                self.metrics.successful_requests += 1
                self.metrics.last_response_time = time.time() - start_time
                self.metrics.consecutive_failures = 0
                
                logger.info(f"Successfully generated {len(result.questions)} questions using {self.provider_id}")
                return result
                
            except Exception as e:
                # Update failure metrics
                self.metrics.failed_requests += 1
                self.metrics.consecutive_failures += 1
                self.metrics.last_response_time = time.time() - start_time
                
                logger.error(f"Failed to generate questions using {self.provider_id}: {str(e)}")
                raise
    
    async def health_check(self) -> ProviderHealth:
        """Perform health check and update health status"""
        async with self._health_lock:
            try:
                start_time = time.time()
                is_healthy = await self._health_check_impl()
                response_time = time.time() - start_time
                
                if is_healthy:
                    self.health.status = ProviderStatus.ONLINE
                    self.health.error_rate = (self.metrics.failed_requests / max(1, self.metrics.total_requests)) * 100
                else:
                    self.health.status = ProviderStatus.DEGRADED
                
                self.health.response_time = response_time
                self.health.last_check = datetime.now()
                self.health.next_check = datetime.now() + timedelta(minutes=5)
                
                logger.debug(f"Health check completed for {self.provider_id}: {self.health.status.value}")
                
            except Exception as e:
                logger.error(f"Health check failed for {self.provider_id}: {str(e)}")
                self.health.status = ProviderStatus.OFFLINE
                self.health.last_check = datetime.now()
                self.health.next_check = datetime.now() + timedelta(minutes=1)
            
            return self.health
    
    async def is_available(self) -> bool:
        """Check if provider is available for requests"""
        if self.health.status == ProviderStatus.OFFLINE:
            return False
        
        # If health check is overdue, run it
        if datetime.now() >= self.health.next_check:
            await self.health_check()
        
        return self.health.status == ProviderStatus.ONLINE
    
    def get_metrics(self) -> ProviderMetrics:
        """Get provider metrics"""
        return self.metrics
    
    def reset_metrics(self):
        """Reset provider metrics"""
        self.metrics = ProviderMetrics()
        logger.info(f"Reset metrics for provider {self.provider_id}")

class ProviderRegistry:
    """Registry for managing multiple AI providers"""
    
    def __init__(self):
        self._providers: Dict[str, BaseAIProvider] = {}
        self._fallback_chain: List[str] = []
        self._load_balancing_strategy = "round_robin"
        self._current_provider_index = 0
        self._lock = asyncio.Lock()
    
    def register_provider(self, provider: BaseAIProvider):
        """Register a new AI provider"""
        self._providers[provider.provider_id] = provider
        logger.info(f"Registered provider: {provider.provider_id}")
    
    def unregister_provider(self, provider_id: str):
        """Unregister an AI provider"""
        if provider_id in self._providers:
            del self._providers[provider_id]
            logger.info(f"Unregistered provider: {provider_id}")
    
    def set_fallback_chain(self, chain: List[str]):
        """Set the provider fallback chain"""
        self._fallback_chain = chain
        logger.info(f"Set fallback chain: {' -> '.join(chain)}")
    
    def set_load_balancing_strategy(self, strategy: str):
        """Set load balancing strategy"""
        valid_strategies = ["round_robin", "weighted", "least_connections", "fastest_response"]
        if strategy not in valid_strategies:
            raise ValueError(f"Invalid strategy. Must be one of: {valid_strategies}")
        self._load_balancing_strategy = strategy
        logger.info(f"Set load balancing strategy: {strategy}")
    
    async def get_provider(self, preferred_provider: str = None) -> BaseAIProvider:
        """Get an available provider using the configured strategy"""
        async with self._lock:
            # Try preferred provider first
            if preferred_provider and preferred_provider in self._providers:
                provider = self._providers[preferred_provider]
                if await provider.is_available():
                    return provider
            
            # Try fallback chain
            for provider_id in self._fallback_chain:
                if provider_id in self._providers:
                    provider = self._providers[provider_id]
                    if await provider.is_available():
                        return provider
            
            # Use load balancing strategy
            return await self._load_balance_provider()
    
    async def _load_balance_provider(self) -> BaseAIProvider:
        """Select provider using load balancing strategy"""
        available_providers = []
        
        for provider in self._providers.values():
            if await provider.is_available():
                available_providers.append(provider)
        
        if not available_providers:
            raise Exception("No available providers")
        
        if self._load_balancing_strategy == "round_robin":
            provider = available_providers[self._current_provider_index % len(available_providers)]
            self._current_provider_index += 1
            return provider
        
        elif self._load_balancing_strategy == "least_connections":
            return min(available_providers, key=lambda p: p.metrics.total_requests)
        
        elif self._load_balancing_strategy == "fastest_response":
            return min(available_providers, key=lambda p: p.metrics.last_response_time)
        
        else:
            # Default to first available
            return available_providers[0]
    
    async def generate_with_fallback(
        self, 
        request: GenerationRequest,
        preferred_provider: str = None
    ) -> GenerationResult:
        """Generate questions with automatic failover"""
        last_error = None
        
        # Try preferred provider first
        if preferred_provider and preferred_provider in self._providers:
            try:
                provider = self._providers[preferred_provider]
                if await provider.is_available():
                    return await provider.generate_questions(request)
            except Exception as e:
                last_error = e
                logger.warning(f"Preferred provider {preferred_provider} failed: {str(e)}")
        
        # Try fallback chain
        for provider_id in self._fallback_chain:
            if provider_id in self._providers:
                try:
                    provider = self._providers[provider_id]
                    if await provider.is_available():
                        return await provider.generate_questions(request)
                except Exception as e:
                    last_error = e
                    logger.warning(f"Fallback provider {provider_id} failed: {str(e)}")
        
        # Try any available provider
        for provider in self._providers.values():
            if await provider.is_available():
                try:
                    return await provider.generate_questions(request)
                except Exception as e:
                    last_error = e
                    logger.warning(f"Provider {provider.provider_id} failed: {str(e)}")
        
        # All providers failed
        error_msg = f"All providers failed. Last error: {str(last_error)}"
        logger.error(error_msg)
        raise Exception(error_msg)
    
    def get_all_providers(self) -> Dict[str, BaseAIProvider]:
        """Get all registered providers"""
        return self._providers.copy()
    
    def get_provider_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all providers"""
        status = {}
        for provider_id, provider in self._providers.items():
            status[provider_id] = {
                "status": provider.health.status.value,
                "metrics": {
                    "total_requests": provider.metrics.total_requests,
                    "successful_requests": provider.metrics.successful_requests,
                    "failed_requests": provider.metrics.failed_requests,
                    "success_rate": provider.metrics.success_rate,
                    "average_response_time": provider.metrics.last_response_time,
                    "uptime_percentage": provider.metrics.uptime_percentage
                },
                "capabilities": {
                    "supported_question_types": [qt.value for qt in provider.capabilities.supported_question_types],
                    "max_context_length": provider.capabilities.max_context_length,
                    "max_output_tokens": provider.capabilities.max_output_tokens,
                    "supports_streaming": provider.capabilities.supports_streaming,
                    "supports_batch": provider.capabilities.supports_batch
                },
                "health": {
                    "response_time": provider.health.response_time,
                    "error_rate": provider.health.error_rate,
                    "last_check": provider.health.last_check.isoformat(),
                    "next_check": provider.health.next_check.isoformat()
                }
            }
        return status

# Global provider registry instance
provider_registry = ProviderRegistry()

async def get_provider_registry() -> ProviderRegistry:
    """Get the global provider registry instance"""
    return provider_registry

async def initialize_providers():
    """Initialize all registered providers"""
    registry = await get_provider_registry()
    
    # Perform initial health checks
    health_check_tasks = []
    for provider in registry.get_all_providers().values():
        health_check_tasks.append(provider.health_check())
    
    await asyncio.gather(*health_check_tasks, return_exceptions=True)
    
    logger.info(f"Initialized {len(registry.get_all_providers())} providers")