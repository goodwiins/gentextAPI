"""
Failover and High Availability Manager

This module provides comprehensive failover mechanisms, circuit breakers,
and high availability features for the AI provider system.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Set, Callable
from dataclasses import dataclass, field
from enum import Enum
import time
from datetime import datetime, timedelta
import json
from collections import defaultdict, deque

from .base import (
    BaseAIProvider, 
    ProviderRegistry, 
    GenerationRequest, 
    GenerationResult,
    ProviderStatus
)
from .model_router import ModelRouter, RoutingStrategy

logger = logging.getLogger(__name__)

class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"        # Provider failed, stop trying
    HALF_OPEN = "half_open"  # Testing if provider recovered

class FailoverReason(Enum):
    """Reasons for failover"""
    TIMEOUT = "timeout"
    RATE_LIMIT = "rate_limit"
    API_ERROR = "api_error"
    HEALTH_CHECK_FAILURE = "health_check_failure"
    QUALITY_THRESHOLD = "quality_threshold"
    COST_THRESHOLD = "cost_threshold"
    MANUAL_OVERRIDE = "manual_override"

@dataclass
class CircuitBreakerConfig:
    """Circuit breaker configuration"""
    failure_threshold: int = 5          # Number of failures before opening
    recovery_timeout: int = 60          # Seconds to wait before trying again
    expected_exception_types: tuple = (Exception,)  # Exception types that trigger breaker
    monitoring_period: int = 300        # Seconds to monitor for failures

@dataclass
class FailoverEvent:
    """Failover event record"""
    timestamp: datetime
    provider_id: str
    reason: FailoverReason
    error_message: str
    request_context: Dict[str, Any] = field(default_factory=dict)
    resolution_time: Optional[datetime] = None
    resolved: bool = False

@dataclass
class HealthCheckResult:
    """Health check result"""
    provider_id: str
    is_healthy: bool
    response_time: float
    error_message: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)

class CircuitBreaker:
    """Circuit breaker for individual providers"""
    
    def __init__(self, provider_id: str, config: CircuitBreakerConfig):
        self.provider_id = provider_id
        self.config = config
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.success_count = 0
        self.state_change_time = datetime.now()
        self.failure_history: deque = deque(maxlen=config.failure_threshold * 2)
        
    def record_success(self):
        """Record a successful operation"""
        self.failure_count = 0
        self.success_count += 1
        
        if self.state == CircuitState.HALF_OPEN:
            # Successful operation in half-open state, close the circuit
            self.state = CircuitState.CLOSED
            self.state_change_time = datetime.now()
            logger.info(f"Circuit breaker CLOSED for provider {self.provider_id}")
    
    def record_failure(self, error: Exception):
        """Record a failed operation"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        self.failure_history.append((datetime.now(), error))
        
        if (self.state == CircuitState.CLOSED and 
            self.failure_count >= self.config.failure_threshold):
            # Open the circuit
            self.state = CircuitState.OPEN
            self.state_change_time = datetime.now()
            logger.warning(f"Circuit breaker OPENED for provider {self.provider_id} after {self.failure_count} failures")
        
        elif self.state == CircuitState.HALF_OPEN:
            # Failed in half-open state, reopen the circuit
            self.state = CircuitState.OPEN
            self.state_change_time = datetime.now()
            logger.warning(f"Circuit breaker REOPENED for provider {self.provider_id}")
    
    def can_attempt(self) -> bool:
        """Check if operation can be attempted"""
        
        if self.state == CircuitState.CLOSED:
            return True
        
        elif self.state == CircuitState.OPEN:
            # Check if recovery timeout has passed
            if (datetime.now() - self.state_change_time).total_seconds() >= self.config.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
                self.state_change_time = datetime.now()
                self.success_count = 0
                logger.info(f"Circuit breaker HALF_OPEN for provider {self.provider_id}")
                return True
            
            return False
        
        elif self.state == CircuitState.HALF_OPEN:
            # Allow limited attempts in half-open state
            return self.success_count < 1  # Allow 1 success to close the circuit
        
        return False
    
    def get_state_info(self) -> Dict[str, Any]:
        """Get circuit breaker state information"""
        return {
            "provider_id": self.provider_id,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "last_failure_time": self.last_failure_time.isoformat() if self.last_failure_time else None,
            "state_change_time": self.state_change_time.isoformat(),
            "can_attempt": self.can_attempt()
        }

class FailoverManager:
    """Comprehensive failover management system"""
    
    def __init__(self, registry: ProviderRegistry, router: ModelRouter):
        self.registry = registry
        self.router = router
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.failover_history: List[FailoverEvent] = []
        self.health_check_results: Dict[str, HealthCheckResult] = {}
        
        # Configuration
        self.circuit_breaker_config = CircuitBreakerConfig()
        self.failover_chain: List[str] = []
        self.quality_threshold: float = 0.7
        self.cost_threshold: float = 0.50  # Max cost per request in USD
        
        # Health monitoring
        self.health_check_interval: int = 30  # Seconds
        self.health_monitor_active: bool = False
        self.health_monitor_task: Optional[asyncio.Task] = None
        
        # Callbacks
        self.failover_callbacks: List[Callable[[FailoverEvent], None]] = []
        
        # Statistics
        self.failover_stats: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        
        # Initialize circuit breakers for all providers
        self._initialize_circuit_breakers()
        
        # Set up default failover chain
        self._setup_default_failover_chain()
    
    def _initialize_circuit_breakers(self):
        """Initialize circuit breakers for all registered providers"""
        
        for provider_id in self.registry.get_all_providers().keys():
            self.circuit_breakers[provider_id] = CircuitBreaker(
                provider_id, 
                self.circuit_breaker_config
            )
    
    def _setup_default_failover_chain(self):
        """Setup default failover chain based on provider capabilities"""
        
        # Priority order based on research and capabilities
        self.failover_chain = [
            "openai-gpt-4",      # Highest quality
            "anthropic-claude",   # Large context, good quality
            "cohere-command-r",   # Good for professional content
            "google-gemini"       # Cost-effective
        ]
        
        logger.info(f"Default failover chain: {' -> '.join(self.failover_chain)}")
    
    async def generate_with_failover(
        self, 
        request: GenerationRequest,
        preferred_provider: str = None,
        max_attempts: int = 3
    ) -> GenerationResult:
        """Generate questions with comprehensive failover handling"""
        
        attempts = []
        last_error = None
        
        # Try preferred provider first
        if preferred_provider:
            result = await self._try_provider(preferred_provider, request)
            if result:
                return result
            attempts.append(preferred_provider)
        
        # Try failover chain
        for provider_id in self.failover_chain:
            if provider_id not in attempts:
                result = await self._try_provider(provider_id, request)
                if result:
                    return result
                attempts.append(provider_id)
        
        # Try any available provider
        available_providers = [
            pid for pid, provider in self.registry.get_all_providers().items()
            if await provider.is_available() and pid not in attempts
        ]
        
        for provider_id in available_providers:
            result = await self._try_provider(provider_id, request)
            if result:
                return result
            attempts.append(provider_id)
        
        # All attempts failed
        error_msg = f"All providers failed after {len(attempts)} attempts. Last error: {str(last_error)}"
        logger.error(error_msg)
        
        # Record comprehensive failover event
        failover_event = FailoverEvent(
            timestamp=datetime.now(),
            provider_id="system",
            reason=FailoverReason.API_ERROR,
            error_message=error_msg,
            request_context={
                "request_id": request.id,
                "attempts": attempts,
                "max_attempts": max_attempts
            }
        )
        self._record_failover_event(failover_event)
        
        raise Exception(error_msg)
    
    async def _try_provider(self, provider_id: str, request: GenerationRequest) -> Optional[GenerationResult]:
        """Try to generate with a specific provider with failover protection"""
        
        provider = self.registry.get_all_providers().get(provider_id)
        if not provider:
            logger.warning(f"Provider {provider_id} not found in registry")
            return None
        
        circuit_breaker = self.circuit_breakers.get(provider_id)
        if not circuit_breaker:
            logger.warning(f"No circuit breaker for provider {provider_id}")
            return None
        
        # Check if circuit breaker allows attempt
        if not circuit_breaker.can_attempt():
            logger.debug(f"Circuit breaker prevents attempt for provider {provider_id}")
            return None
        
        try:
            # Check if provider is available
            if not await provider.is_available():
                raise Exception(f"Provider {provider_id} is not available")
            
            # Perform health check if needed
            if not await self._perform_health_check(provider_id):
                raise Exception(f"Health check failed for provider {provider_id}")
            
            # Generate questions
            start_time = time.time()
            result = await provider.generate_questions(request)
            processing_time = time.time() - start_time
            
            # Check quality threshold
            if result.quality_score < self.quality_threshold:
                raise Exception(f"Quality score {result.quality_score} below threshold {self.quality_threshold}")
            
            # Check cost threshold
            if result.cost > self.cost_threshold:
                raise Exception(f"Cost ${result.cost:.4f} exceeds threshold ${self.cost_threshold}")
            
            # Check timeout
            if processing_time > 30:  # 30 seconds timeout
                raise Exception(f"Request timeout after {processing_time:.2f}s")
            
            # Record success
            circuit_breaker.record_success()
            self.failover_stats[provider_id]["successes"] += 1
            
            logger.info(f"Successfully generated {len(result.questions)} questions using {provider_id}")
            return result
            
        except Exception as e:
            # Record failure
            circuit_breaker.record_failure(e)
            self.failover_stats[provider_id]["failures"] += 1
            
            # Determine failover reason
            reason = self._determine_failover_reason(e)
            
            # Record failover event
            failover_event = FailoverEvent(
                timestamp=datetime.now(),
                provider_id=provider_id,
                reason=reason,
                error_message=str(e),
                request_context={
                    "request_id": request.id,
                    "processing_time": time.time() - start_time if 'start_time' in locals() else 0
                }
            )
            self._record_failover_event(failover_event)
            
            logger.warning(f"Provider {provider_id} failed: {str(e)}")
            return None
    
    def _determine_failover_reason(self, error: Exception) -> FailoverReason:
        """Determine the reason for failover based on error"""
        
        error_message = str(error).lower()
        
        if "timeout" in error_message:
            return FailoverReason.TIMEOUT
        elif "rate limit" in error_message or "too many requests" in error_message:
            return FailoverReason.RATE_LIMIT
        elif "health check" in error_message:
            return FailoverReason.HEALTH_CHECK_FAILURE
        elif "quality" in error_message:
            return FailoverReason.QUALITY_THRESHOLD
        elif "cost" in error_message:
            return FailoverReason.COST_THRESHOLD
        else:
            return FailoverReason.API_ERROR
    
    async def _perform_health_check(self, provider_id: str) -> bool:
        """Perform health check for a provider"""
        
        provider = self.registry.get_all_providers().get(provider_id)
        if not provider:
            return False
        
        try:
            start_time = time.time()
            is_healthy = await provider._health_check_impl()
            response_time = time.time() - start_time
            
            result = HealthCheckResult(
                provider_id=provider_id,
                is_healthy=is_healthy,
                response_time=response_time
            )
            
            self.health_check_results[provider_id] = result
            
            return is_healthy
            
        except Exception as e:
            result = HealthCheckResult(
                provider_id=provider_id,
                is_healthy=False,
                response_time=0,
                error_message=str(e)
            )
            
            self.health_check_results[provider_id] = result
            return False
    
    def _record_failover_event(self, event: FailoverEvent):
        """Record a failover event"""
        
        self.failover_history.append(event)
        
        # Keep only recent events (last 1000)
        if len(self.failover_history) > 1000:
            self.failover_history = self.failover_history[-1000:]
        
        # Notify callbacks
        for callback in self.failover_callbacks:
            try:
                callback(event)
            except Exception as e:
                logger.error(f"Error in failover callback: {str(e)}")
        
        # Update statistics
        self.failover_stats[event.provider_id][event.reason.value] += 1
    
    async def start_health_monitoring(self):
        """Start continuous health monitoring"""
        
        if self.health_monitor_active:
            logger.warning("Health monitoring already active")
            return
        
        self.health_monitor_active = True
        self.health_monitor_task = asyncio.create_task(self._health_monitoring_loop())
        
        logger.info("Health monitoring started")
    
    async def stop_health_monitoring(self):
        """Stop health monitoring"""
        
        if not self.health_monitor_active:
            return
        
        self.health_monitor_active = False
        
        if self.health_monitor_task:
            self.health_monitor_task.cancel()
            try:
                await self.health_monitor_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Health monitoring stopped")
    
    async def _health_monitoring_loop(self):
        """Main health monitoring loop"""
        
        while self.health_monitor_active:
            try:
                # Perform health checks for all providers
                health_check_tasks = []
                for provider_id in self.registry.get_all_providers().keys():
                    health_check_tasks.append(self._perform_health_check(provider_id))
                
                await asyncio.gather(*health_check_tasks, return_exceptions=True)
                
                await asyncio.sleep(self.health_check_interval)
                
            except Exception as e:
                logger.error(f"Error in health monitoring loop: {str(e)}")
                await asyncio.sleep(self.health_check_interval)
    
    def add_failover_callback(self, callback: Callable[[FailoverEvent], None]):
        """Add a callback to be called on failover events"""
        self.failover_callbacks.append(callback)
    
    def remove_failover_callback(self, callback: Callable[[FailoverEvent], None]):
        """Remove a failover callback"""
        if callback in self.failover_callbacks:
            self.failover_callbacks.remove(callback)
    
    def get_circuit_breaker_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all circuit breakers"""
        return {
            provider_id: breaker.get_state_info()
            for provider_id, breaker in self.circuit_breakers.items()
        }
    
    def get_failover_statistics(self) -> Dict[str, Any]:
        """Get failover statistics"""
        
        # Calculate overall statistics
        total_failovers = len(self.failover_history)
        recent_failovers = [
            event for event in self.failover_history
            if (datetime.now() - event.timestamp).total_seconds() < 3600  # Last hour
        ]
        
        # Failover reasons distribution
        reason_distribution = defaultdict(int)
        for event in self.failover_history:
            reason_distribution[event.reason.value] += 1
        
        # Provider failover counts
        provider_failovers = defaultdict(int)
        for event in self.failover_history:
            provider_failovers[event.provider_id] += 1
        
        return {
            "total_failovers": total_failovers,
            "recent_failovers": len(recent_failovers),
            "failover_rate_per_hour": len(recent_failovers),
            "reason_distribution": dict(reason_distribution),
            "provider_failovers": dict(provider_failovers),
            "provider_stats": dict(self.failover_stats),
            "unresolved_events": len([e for e in self.failover_history if not e.resolved])
        }
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get health status of all providers"""
        
        health_status = {}
        
        for provider_id in self.registry.get_all_providers().keys():
            health_result = self.health_check_results.get(provider_id)
            circuit_breaker = self.circuit_breakers.get(provider_id)
            
            health_status[provider_id] = {
                "health_check": {
                    "is_healthy": health_result.is_healthy if health_result else False,
                    "response_time": health_result.response_time if health_result else 0,
                    "error_message": health_result.error_message if health_result else None,
                    "last_check": health_result.timestamp.isoformat() if health_result else None
                },
                "circuit_breaker": circuit_breaker.get_state_info() if circuit_breaker else None,
                "failover_count": self.failover_stats[provider_id].get("total_failovers", 0)
            }
        
        return health_status
    
    def manual_failover(self, provider_id: str, reason: str = "manual_override"):
        """Manually trigger failover for a provider"""
        
        circuit_breaker = self.circuit_breakers.get(provider_id)
        if circuit_breaker:
            # Force open the circuit breaker
            circuit_breaker.state = CircuitState.OPEN
            circuit_breaker.state_change_time = datetime.now()
            
            # Record manual failover event
            failover_event = FailoverEvent(
                timestamp=datetime.now(),
                provider_id=provider_id,
                reason=FailoverReason.MANUAL_OVERRIDE,
                error_message=reason
            )
            self._record_failover_event(failover_event)
            
            logger.info(f"Manual failover triggered for provider {provider_id}: {reason}")
    
    def reset_circuit_breaker(self, provider_id: str):
        """Reset circuit breaker for a provider"""
        
        circuit_breaker = self.circuit_breakers.get(provider_id)
        if circuit_breaker:
            circuit_breaker.state = CircuitState.CLOSED
            circuit_breaker.failure_count = 0
            circuit_breaker.success_count = 0
            circuit_breaker.state_change_time = datetime.now()
            
            logger.info(f"Circuit breaker reset for provider {provider_id}")
    
    def set_quality_threshold(self, threshold: float):
        """Set quality threshold for failover"""
        self.quality_threshold = threshold
        logger.info(f"Quality threshold set to {threshold}")
    
    def set_cost_threshold(self, threshold: float):
        """Set cost threshold for failover"""
        self.cost_threshold = threshold
        logger.info(f"Cost threshold set to ${threshold:.4f}")

# Global failover manager instance
_failover_manager = None

async def get_failover_manager() -> FailoverManager:
    """Get the global failover manager instance"""
    global _failover_manager
    if _failover_manager is None:
        registry = await get_provider_registry()
        router = await get_model_router()
        _failover_manager = FailoverManager(registry, router)
    return _failover_manager

async def initialize_failover_system():
    """Initialize the failover system"""
    manager = await get_failover_manager()
    await manager.start_health_monitoring()
    logger.info("Failover system initialized")