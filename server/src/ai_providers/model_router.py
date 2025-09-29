"""
Model Selection and Routing Logic

This module provides intelligent routing of question generation requests
to the most appropriate AI provider based on various criteria.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import time
import json
from datetime import datetime, timedelta

from .base import (
    BaseAIProvider, 
    ProviderRegistry, 
    GenerationRequest, 
    GenerationResult,
    QuestionType,
    Difficulty,
    ProviderStatus
)
from .openai_provider import OpenAIProvider
from .anthropic_provider import AnthropicProvider
from .google_provider import GoogleProvider
from .cohere_provider import CohereProvider

logger = logging.getLogger(__name__)

class RoutingStrategy(Enum):
    """Available routing strategies"""
    QUALITY_FIRST = "quality_first"      # Prioritize highest quality
    COST_EFFECTIVE = "cost_effective"    # Prioritize lowest cost
    BALANCED = "balanced"                # Balance quality and cost
    FASTEST = "fastest"                  # Prioritize speed
    LOAD_BALANCED = "load_balanced"      # Distribute load evenly
    PROVIDER_SPECIFIC = "provider_specific"  # Use specific provider

@dataclass
class RoutingDecision:
    """Represents a routing decision"""
    provider_id: str
    strategy: RoutingStrategy
    confidence: float
    reasoning: str
    estimated_cost: float
    estimated_time: float
    fallback_providers: List[str]

class ModelRouter:
    """Intelligent model router for AI providers"""
    
    def __init__(self, registry: ProviderRegistry):
        self.registry = registry
        self.routing_history: List[Dict[str, Any]] = []
        self.performance_cache: Dict[str, Dict[str, float]] = {}
        self.cost_cache: Dict[str, Dict[str, float]] = {}
        self._cache_lock = asyncio.Lock()
        
        # Provider quality scores (based on research)
        self.quality_scores = {
            "openai-gpt-4": 9.2,
            "anthropic-claude": 8.8,
            "google-gemini": 7.5,
            "cohere-command-r": 7.8
        }
        
        # Provider cost factors (tokens per dollar, higher is better)
        self.cost_efficiency = {
            "openai-gpt-4": 0.5,      # $0.09/1K tokens = ~11 tokens/$
            "anthropic-claude": 0.7,  # $0.09/1K tokens = ~11 tokens/$
            "google-gemini": 1.5,     # $0.0025/1K tokens = ~400 tokens/$
            "cohere-command-r": 1.2   # $0.018/1K tokens = ~55 tokens/$
        }
        
        # Provider speed scores (lower is better)
        self.speed_scores = {
            "openai-gpt-4": 0.7,
            "anthropic-claude": 0.8,
            "google-gemini": 0.9,
            "cohere-command-r": 0.85
        }
    
    async def route_request(
        self, 
        request: GenerationRequest,
        strategy: RoutingStrategy = RoutingStrategy.BALANCED,
        preferred_provider: str = None,
        excluded_providers: List[str] = None
    ) -> RoutingDecision:
        """Route a generation request to the best provider"""
        
        excluded_providers = excluded_providers or []
        
        # Get available providers
        available_providers = await self._get_available_providers(excluded_providers)
        
        if not available_providers:
            raise Exception("No available providers for routing")
        
        # Apply routing strategy
        if strategy == RoutingStrategy.PROVIDER_SPECIFIC and preferred_provider:
            if preferred_provider in available_providers:
                return await self._create_provider_decision(
                    preferred_provider, strategy, 1.0, f"Specific provider requested: {preferred_provider}", request
                )
            else:
                logger.warning(f"Preferred provider {preferred_provider} not available, falling back to other strategies")
                strategy = RoutingStrategy.BALANCED
        
        decision = await self._apply_routing_strategy(request, strategy, available_providers)
        
        # Log routing decision
        await self._log_routing_decision(request, decision)
        
        return decision
    
    async def _get_available_providers(self, excluded_providers: List[str]) -> List[str]:
        """Get list of available provider IDs"""
        available = []
        
        for provider_id, provider in self.registry.get_all_providers().items():
            if provider_id not in excluded_providers and await provider.is_available():
                available.append(provider_id)
        
        return available
    
    async def _apply_routing_strategy(
        self, 
        request: GenerationRequest,
        strategy: RoutingStrategy,
        available_providers: List[str]
    ) -> RoutingDecision:
        """Apply specific routing strategy"""
        
        if strategy == RoutingStrategy.QUALITY_FIRST:
            return await self._route_quality_first(request, available_providers)
        elif strategy == RoutingStrategy.COST_EFFECTIVE:
            return await self._route_cost_effective(request, available_providers)
        elif strategy == RoutingStrategy.BALANCED:
            return await self._route_balanced(request, available_providers)
        elif strategy == RoutingStrategy.FASTEST:
            return await self._route_fastest(request, available_providers)
        elif strategy == RoutingStrategy.LOAD_BALANCED:
            return await self._route_load_balanced(request, available_providers)
        else:
            # Default to balanced
            return await self._route_balanced(request, available_providers)
    
    async def _route_quality_first(self, request: GenerationRequest, available_providers: List[str]) -> RoutingDecision:
        """Route to highest quality provider"""
        
        # Sort by quality score
        sorted_providers = sorted(
            available_providers,
            key=lambda p: self.quality_scores.get(p, 0),
            reverse=True
        )
        
        best_provider = sorted_providers[0]
        
        # Check if best provider can handle the request
        provider = self.registry.get_all_providers()[best_provider]
        if not self._can_handle_request(provider, request):
            # Try next best
            for provider_id in sorted_providers[1:]:
                provider = self.registry.get_all_providers()[provider_id]
                if self._can_handle_request(provider, request):
                    return await self._create_provider_decision(
                        provider_id, RoutingStrategy.QUALITY_FIRST, 0.9,
                        f"Best quality provider that can handle request", request
                    )
        
        return await self._create_provider_decision(
            best_provider, RoutingStrategy.QUALITY_FIRST, 1.0,
            "Highest quality provider selected", request
        )
    
    async def _route_cost_effective(self, request: GenerationRequest, available_providers: List[str]) -> RoutingDecision:
        """Route to most cost-effective provider"""
        
        # Sort by cost efficiency
        sorted_providers = sorted(
            available_providers,
            key=lambda p: self.cost_efficiency.get(p, 0),
            reverse=True
        )
        
        best_provider = sorted_providers[0]
        
        # Check if best provider can handle the request
        provider = self.registry.get_all_providers()[best_provider]
        if not self._can_handle_request(provider, request):
            # Try next best
            for provider_id in sorted_providers[1:]:
                provider = self.registry.get_all_providers()[provider_id]
                if self._can_handle_request(provider, request):
                    return await self._create_provider_decision(
                        provider_id, RoutingStrategy.COST_EFFECTIVE, 0.9,
                        f"Most cost-effective provider that can handle request", request
                    )
        
        return await self._create_provider_decision(
            best_provider, RoutingStrategy.COST_EFFECTIVE, 1.0,
            "Most cost-effective provider selected", request
        )
    
    async def _route_balanced(self, request: GenerationRequest, available_providers: List[str]) -> RoutingDecision:
        """Route using balanced approach (quality + cost + speed)"""
        
        provider_scores = {}
        
        for provider_id in available_providers:
            # Calculate weighted score
            quality_weight = 0.5
            cost_weight = 0.3
            speed_weight = 0.2
            
            quality_score = self.quality_scores.get(provider_id, 0) / 10.0  # Normalize to 0-1
            cost_score = self.cost_efficiency.get(provider_id, 0) / 2.0  # Normalize to 0-1
            speed_score = 1.0 - self.speed_scores.get(provider_id, 0)  # Invert so higher is better
            
            weighted_score = (
                quality_score * quality_weight +
                cost_score * cost_weight +
                speed_score * speed_weight
            )
            
            provider_scores[provider_id] = weighted_score
        
        # Sort by weighted score
        sorted_providers = sorted(
            available_providers,
            key=lambda p: provider_scores.get(p, 0),
            reverse=True
        )
        
        best_provider = sorted_providers[0]
        
        return await self._create_provider_decision(
            best_provider, RoutingStrategy.BALANCED, provider_scores[best_provider],
            f"Balanced routing (quality: {quality_score:.2f}, cost: {cost_score:.2f}, speed: {speed_score:.2f})", request
        )
    
    async def _route_fastest(self, request: GenerationRequest, available_providers: List[str]) -> RoutingDecision:
        """Route to fastest provider"""
        
        # Sort by speed score (lower is better)
        sorted_providers = sorted(
            available_providers,
            key=lambda p: self.speed_scores.get(p, 1.0)
        )
        
        best_provider = sorted_providers[0]
        
        return await self._create_provider_decision(
            best_provider, RoutingStrategy.FASTEST, 1.0,
            "Fastest provider selected", request
        )
    
    async def _route_load_balanced(self, request: GenerationRequest, available_providers: List[str]) -> RoutingDecision:
        """Route using load balancing strategy"""
        
        # Get current load metrics
        load_metrics = {}
        for provider_id in available_providers:
            provider = self.registry.get_all_providers()[provider_id]
            metrics = provider.get_metrics()
            
            # Calculate load based on recent requests and response time
            load_score = (
                metrics.total_requests * 0.1 +
                metrics.last_response_time * 0.5 +
                (metrics.consecutive_failures * 2.0)
            )
            
            load_metrics[provider_id] = load_score
        
        # Sort by load (lowest first)
        sorted_providers = sorted(
            available_providers,
            key=lambda p: load_metrics.get(p, 0)
        )
        
        best_provider = sorted_providers[0]
        
        return await self._create_provider_decision(
            best_provider, RoutingStrategy.LOAD_BALANCED, 1.0,
            f"Load balanced (current load: {load_metrics[best_provider]:.2f})", request
        )
    
    def _can_handle_request(self, provider: BaseAIProvider, request: GenerationRequest) -> bool:
        """Check if provider can handle the request"""
        
        # Check if provider supports requested question types
        supported_types = set(provider.capabilities.supported_question_types)
        requested_types = set(request.question_types)
        
        if not requested_types.issubset(supported_types):
            logger.debug(f"Provider {provider.provider_id} doesn't support all requested question types")
            return False
        
        # Check if content length is within provider's context limit
        estimated_tokens = len(request.content.split()) * 1.5  # Rough token estimate
        if estimated_tokens > provider.capabilities.max_context_length:
            logger.debug(f"Provider {provider.provider_id} context limit exceeded")
            return False
        
        # Check if requested question count is reasonable
        if request.question_count > 20:  # Arbitrary limit
            logger.debug(f"Provider {provider.provider_id} question count too high")
            return False
        
        return True
    
    async def _create_provider_decision(
        self, 
        provider_id: str,
        strategy: RoutingStrategy,
        confidence: float,
        reasoning: str,
        request: GenerationRequest
    ) -> RoutingDecision:
        """Create a routing decision"""
        
        # Get fallback providers
        fallback_providers = await self._get_fallback_providers(provider_id)
        
        # Estimate cost and time
        estimated_cost = self._estimate_cost(provider_id, request)
        estimated_time = self._estimate_time(provider_id, request)
        
        return RoutingDecision(
            provider_id=provider_id,
            strategy=strategy,
            confidence=confidence,
            reasoning=reasoning,
            estimated_cost=estimated_cost,
            estimated_time=estimated_time,
            fallback_providers=fallback_providers
        )
    
    async def _get_fallback_providers(self, primary_provider: str) -> List[str]:
        """Get list of fallback providers"""
        
        # Priority fallback chain based on research
        fallback_chain = [
            "openai-gpt-4",
            "anthropic-claude", 
            "google-gemini",
            "cohere-command-r"
        ]
        
        # Remove primary provider and unavailable providers
        fallbacks = []
        for provider_id in fallback_chain:
            if provider_id != primary_provider:
                provider = self.registry.get_all_providers().get(provider_id)
                if provider and await provider.is_available():
                    fallbacks.append(provider_id)
        
        return fallbacks[:2]  # Limit to 2 fallbacks
    
    def _estimate_cost(self, provider_id: str, request: GenerationRequest) -> float:
        """Estimate cost for request"""
        
        # Rough token estimation
        input_tokens = len(request.content.split()) * 1.5
        output_tokens = request.question_count * 100  # Rough estimate
        
        # Provider-specific pricing (per 1K tokens)
        pricing = {
            "openai-gpt-4": {"input": 0.03, "output": 0.06},
            "anthropic-claude": {"input": 0.015, "output": 0.075},
            "google-gemini": {"input": 0.001, "output": 0.002},
            "cohere-command-r": {"input": 0.003, "output": 0.015}
        }
        
        if provider_id in pricing:
            cost = (input_tokens * pricing[provider_id]["input"] / 1000) + \
                   (output_tokens * pricing[provider_id]["output"] / 1000)
            return max(cost, 0.001)  # Minimum cost
        
        return 0.01  # Default cost estimate
    
    def _estimate_time(self, provider_id: str, request: GenerationRequest) -> float:
        """Estimate processing time"""
        
        base_time = self.speed_scores.get(provider_id, 1.0)
        complexity_factor = len(request.question_types) * 0.5
        content_factor = len(request.content) / 1000.0
        
        return base_time + complexity_factor + content_factor
    
    async def _log_routing_decision(self, request: GenerationRequest, decision: RoutingDecision):
        """Log routing decision for analytics"""
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "request_id": request.id,
            "question_count": request.question_count,
            "question_types": [qt.value for qt in request.question_types],
            "difficulty": request.difficulty.value,
            "provider_id": decision.provider_id,
            "strategy": decision.strategy.value,
            "confidence": decision.confidence,
            "estimated_cost": decision.estimated_cost,
            "estimated_time": decision.estimated_time,
            "fallback_providers": decision.fallback_providers
        }
        
        self.routing_history.append(log_entry)
        
        # Keep only last 1000 entries
        if len(self.routing_history) > 1000:
            self.routing_history = self.routing_history[-1000:]
        
        logger.debug(f"Routing decision: {decision.provider_id} for request {request.id}")
    
    def get_routing_stats(self) -> Dict[str, Any]:
        """Get routing statistics"""
        
        if not self.routing_history:
            return {"total_requests": 0}
        
        # Provider usage stats
        provider_usage = {}
        for entry in self.routing_history:
            provider_id = entry["provider_id"]
            provider_usage[provider_id] = provider_usage.get(provider_id, 0) + 1
        
        # Strategy usage stats
        strategy_usage = {}
        for entry in self.routing_history:
            strategy = entry["strategy"]
            strategy_usage[strategy] = strategy_usage.get(strategy, 0) + 1
        
        # Cost and time averages
        total_cost = sum(entry["estimated_cost"] for entry in self.routing_history)
        total_time = sum(entry["estimated_time"] for entry in self.routing_history)
        
        return {
            "total_requests": len(self.routing_history),
            "provider_usage": provider_usage,
            "strategy_usage": strategy_usage,
            "average_cost": total_cost / len(self.routing_history),
            "average_time": total_time / len(self.routing_history),
            "recent_requests": self.routing_history[-10:]  # Last 10 requests
        }
    
    def update_performance_cache(self, provider_id: str, metrics: Dict[str, float]):
        """Update performance cache with recent metrics"""
        
        async def _update_cache():
            async with self._cache_lock:
                if provider_id not in self.performance_cache:
                    self.performance_cache[provider_id] = {}
                
                # Update with moving average
                for key, value in metrics.items():
                    if key in self.performance_cache[provider_id]:
                        current = self.performance_cache[provider_id][key]
                        self.performance_cache[provider_id][key] = current * 0.8 + value * 0.2
                    else:
                        self.performance_cache[provider_id][key] = value
        
        asyncio.create_task(_update_cache())

# Global model router instance
_model_router = None

async def get_model_router() -> ModelRouter:
    """Get the global model router instance"""
    global _model_router
    if _model_router is None:
        registry = await get_provider_registry()
        _model_router = ModelRouter(registry)
    return _model_router

async def initialize_model_router():
    """Initialize the model router with default configuration"""
    registry = await get_provider_registry()
    
    # Set up fallback chain based on research recommendations
    fallback_chain = ["openai-gpt-4", "anthropic-claude", "google-gemini", "cohere-command-r"]
    registry.set_fallback_chain(fallback_chain)
    
    # Set default load balancing strategy
    registry.set_load_balancing_strategy("round_robin")
    
    logger.info("Model router initialized with fallback chain and load balancing")