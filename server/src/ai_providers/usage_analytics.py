"""
Usage Analytics and Model Performance Tracking System

This module provides comprehensive usage analytics, performance monitoring,
and model tracking capabilities to optimize AI provider usage and performance.
"""

import asyncio
import logging
import json
import time
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import statistics
import uuid
from collections import defaultdict, deque
import threading
from dataclasses import asdict
import hashlib

logger = logging.getLogger(__name__)

class MetricType(Enum):
    """Types of metrics tracked"""
    REQUEST_COUNT = "request_count"
    RESPONSE_TIME = "response_time"
    TOKEN_USAGE = "token_usage"
    COST = "cost"
    QUALITY_SCORE = "quality_score"
    SUCCESS_RATE = "success_rate"
    ERROR_RATE = "error_rate"
    CACHE_HIT_RATE = "cache_hit_rate"
    USER_SATISFACTION = "user_satisfaction"
    THROUGHPUT = "throughput"

class AnalyticsPeriod(Enum):
    """Analytics aggregation periods"""
    REALTIME = "realtime"
    MINUTELY = "minutely"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class AlertSeverity(Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class UsageMetrics:
    """Comprehensive usage metrics"""
    timestamp: datetime
    provider: str
    model: str
    request_id: str
    user_id: Optional[str] = None
    project_id: Optional[str] = None
    session_id: Optional[str] = None
    
    # Performance metrics
    response_time: float = 0.0
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    cost: float = 0.0
    
    # Quality metrics
    quality_score: float = 0.0
    success: bool = True
    error_message: Optional[str] = None
    
    # Content metrics
    content_type: str = "unknown"
    difficulty: str = "intermediate"
    question_type: str = "unknown"
    cognitive_level: str = "understand"
    
    # User interaction metrics
    user_feedback: Optional[Dict[str, Any]] = None
    interaction_time: float = 0.0
    revision_count: int = 0
    
    # System metrics
    cache_hit: bool = False
    batch_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class AggregatedMetrics:
    """Aggregated metrics for analytics"""
    period: AnalyticsPeriod
    start_time: datetime
    end_time: datetime
    
    # Counts
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    
    # Performance averages
    avg_response_time: float = 0.0
    avg_input_tokens: int = 0
    avg_output_tokens: int = 0
    avg_total_tokens: int = 0
    avg_cost: float = 0.0
    avg_quality_score: float = 0.0
    
    # Totals
    total_cost: float = 0.0
    total_tokens: int = 0
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    
    # Rates
    success_rate: float = 0.0
    error_rate: float = 0.0
    cache_hit_rate: float = 0.0
    throughput: float = 0.0  # requests per second
    
    # Extremes
    min_response_time: float = float('inf')
    max_response_time: float = 0.0
    min_cost: float = float('inf')
    max_cost: float = 0.0
    min_quality: float = float('inf')
    max_quality: float = 0.0
    
    # Distribution
    response_time_p95: float = 0.0
    response_time_p99: float = 0.0
    cost_p95: float = 0.0
    quality_p5: float = 0.0
    
    # Provider breakdown
    provider_stats: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    
    def calculate_derived_metrics(self):
        """Calculate derived metrics from base metrics"""
        if self.total_requests > 0:
            self.success_rate = self.successful_requests / self.total_requests
            self.error_rate = self.failed_requests / self.total_requests
        
        if self.end_time > self.start_time:
            duration_seconds = (self.end_time - self.start_time).total_seconds()
            self.throughput = self.total_requests / duration_seconds if duration_seconds > 0 else 0.0

@dataclass
class PerformanceAlert:
    """Performance alert configuration"""
    id: str
    name: str
    description: str
    metric_type: MetricType
    threshold: float
    comparison_operator: str  # ">", "<", ">=", "<=", "==", "!="
    severity: AlertSeverity
    enabled: bool = True
    cooldown_minutes: int = 60
    notification_channels: List[str] = field(default_factory=list)
    last_triggered: Optional[datetime] = None
    trigger_count: int = 0

@dataclass
class ModelPerformanceProfile:
    """Performance profile for AI models"""
    provider: str
    model: str
    content_types: List[str]
    difficulty_range: Tuple[str, str]
    
    # Performance characteristics
    avg_response_time: float
    avg_quality_score: float
    avg_cost_per_request: float
    success_rate: float
    reliability_score: float
    
    # Usage patterns
    optimal_use_cases: List[str]
    suboptimal_use_cases: List[str]
    
    # Recommendations
    recommended_for: List[str]
    not_recommended_for: List[str]
    
    # Performance over time
    performance_trend: str = "stable"  # "improving", "declining", "stable"
    last_updated: datetime = field(default_factory=datetime.now)

class UsageAnalytics:
    """Comprehensive usage analytics system"""
    
    def __init__(self, retention_days: int = 30):
        self.retention_days = retention_days
        self.raw_metrics: deque[UsageMetrics] = deque(maxlen=100000)
        self.aggregated_metrics: Dict[str, AggregatedMetrics] = {}
        self.alerts: Dict[str, PerformanceAlert] = {}
        self.model_profiles: Dict[str, ModelPerformanceProfile] = {}
        self.user_sessions: Dict[str, Dict[str, Any]] = {}
        
        # Analytics state
        self.last_aggregation = datetime.now()
        self.lock = threading.RLock()
        
        # Start background tasks
        self._start_background_tasks()
        
        # Initialize default alerts
        self._initialize_default_alerts()
    
    def _start_background_tasks(self):
        """Start background analytics tasks"""
        asyncio.create_task(self._periodic_aggregation())
        asyncio.create_task(self._periodic_cleanup())
        asyncio.create_task(self._alert_monitoring())
        asyncio.create_task(self._profile_updates())
    
    def _initialize_default_alerts(self):
        """Initialize default performance alerts"""
        
        alerts = [
            PerformanceAlert(
                id="high_response_time",
                name="High Response Time",
                description="Average response time exceeds threshold",
                metric_type=MetricType.RESPONSE_TIME,
                threshold=10.0,
                comparison_operator=">",
                severity=AlertSeverity.WARNING
            ),
            PerformanceAlert(
                id="low_quality_score",
                name="Low Quality Score",
                description="Average quality score below threshold",
                metric_type=MetricType.QUALITY_SCORE,
                threshold=0.6,
                comparison_operator="<",
                severity=AlertSeverity.WARNING
            ),
            PerformanceAlert(
                id="high_error_rate",
                name="High Error Rate",
                description="Error rate exceeds threshold",
                metric_type=MetricType.ERROR_RATE,
                threshold=0.1,
                comparison_operator=">",
                severity=AlertSeverity.ERROR
            ),
            PerformanceAlert(
                id="high_cost",
                name="High Cost Alert",
                description="Average cost per request exceeds threshold",
                metric_type=MetricType.COST,
                threshold=0.05,
                comparison_operator=">",
                severity=AlertSeverity.WARNING
            ),
            PerformanceAlert(
                id="low_cache_hit_rate",
                name="Low Cache Hit Rate",
                description="Cache hit rate below threshold",
                metric_type=MetricType.CACHE_HIT_RATE,
                threshold=0.3,
                comparison_operator="<",
                severity=AlertSeverity.INFO
            )
        ]
        
        for alert in alerts:
            self.alerts[alert.id] = alert
    
    def record_usage(self, metrics: UsageMetrics):
        """Record usage metrics"""
        
        with self.lock:
            self.raw_metrics.append(metrics)
        
        # Update session tracking
        if metrics.session_id:
            self._update_session(metrics.session_id, metrics)
        
        logger.debug(f"Recorded usage: {metrics.provider}/{metrics.model} - {metrics.response_time:.2f}s")
    
    def _update_session(self, session_id: str, metrics: UsageMetrics):
        """Update user session tracking"""
        
        if session_id not in self.user_sessions:
            self.user_sessions[session_id] = {
                "start_time": metrics.timestamp,
                "last_activity": metrics.timestamp,
                "request_count": 0,
                "total_cost": 0.0,
                "total_tokens": 0,
                "providers_used": set(),
                "models_used": set(),
                "content_types": set(),
                "session_duration": 0.0
            }
        
        session = self.user_sessions[session_id]
        session["last_activity"] = metrics.timestamp
        session["request_count"] += 1
        session["total_cost"] += metrics.cost
        session["total_tokens"] += metrics.total_tokens
        session["providers_used"].add(metrics.provider)
        session["models_used"].add(metrics.model)
        session["content_types"].add(metrics.content_type)
        session["session_duration"] = (metrics.timestamp - session["start_time"]).total_seconds()
    
    async def _periodic_aggregation(self):
        """Periodic aggregation of metrics"""
        
        while True:
            try:
                await asyncio.sleep(300)  # Aggregate every 5 minutes
                
                await self._aggregate_metrics()
                self.last_aggregation = datetime.now()
                
                logger.debug("Metrics aggregation completed")
                
            except Exception as e:
                logger.error(f"Metrics aggregation error: {e}")
    
    async def _aggregate_metrics(self):
        """Aggregate raw metrics into time periods"""
        
        with self.lock:
            if not self.raw_metrics:
                return
            
            # Group metrics by time periods
            now = datetime.now()
            
            # Aggregate different periods
            for period in [AnalyticsPeriod.HOURLY, AnalyticsPeriod.DAILY]:
                aggregated = await self._aggregate_for_period(period, now)
                key = f"{period.value}_{now.strftime('%Y%m%d_%H' if period == AnalyticsPeriod.HOURLY else '%Y%m%d')}"
                self.aggregated_metrics[key] = aggregated
    
    async def _aggregate_for_period(self, period: AnalyticsPeriod, end_time: datetime) -> AggregatedMetrics:
        """Aggregate metrics for specific period"""
        
        # Determine time range
        if period == AnalyticsPeriod.HOURLY:
            start_time = end_time.replace(minute=0, second=0, microsecond=0)
            period_end = start_time + timedelta(hours=1)
        elif period == AnalyticsPeriod.DAILY:
            start_time = end_time.replace(hour=0, minute=0, second=0, microsecond=0)
            period_end = start_time + timedelta(days=1)
        else:
            start_time = end_time - timedelta(hours=1)
            period_end = end_time
        
        # Filter metrics for period
        period_metrics = [
            m for m in self.raw_metrics
            if start_time <= m.timestamp <= period_end
        ]
        
        if not period_metrics:
            return AggregatedMetrics(period, start_time, period_end)
        
        # Calculate aggregates
        aggregated = AggregatedMetrics(period, start_time, period_end)
        
        # Basic counts
        aggregated.total_requests = len(period_metrics)
        aggregated.successful_requests = sum(1 for m in period_metrics if m.success)
        aggregated.failed_requests = aggregated.total_requests - aggregated.successful_requests
        
        # Performance averages
        if period_metrics:
            aggregated.avg_response_time = statistics.mean([m.response_time for m in period_metrics])
            aggregated.avg_input_tokens = int(statistics.mean([m.input_tokens for m in period_metrics]))
            aggregated.avg_output_tokens = int(statistics.mean([m.output_tokens for m in period_metrics]))
            aggregated.avg_total_tokens = int(statistics.mean([m.total_tokens for m in period_metrics]))
            aggregated.avg_cost = statistics.mean([m.cost for m in period_metrics])
            aggregated.avg_quality_score = statistics.mean([m.quality_score for m in period_metrics])
        
        # Totals
        aggregated.total_cost = sum(m.cost for m in period_metrics)
        aggregated.total_tokens = sum(m.total_tokens for m in period_metrics)
        aggregated.total_input_tokens = sum(m.input_tokens for m in period_metrics)
        aggregated.total_output_tokens = sum(m.output_tokens for m in period_metrics)
        
        # Extremes
        if period_metrics:
            aggregated.min_response_time = min(m.response_time for m in period_metrics)
            aggregated.max_response_time = max(m.response_time for m in period_metrics)
            aggregated.min_cost = min(m.cost for m in period_metrics)
            aggregated.max_cost = max(m.cost for m in period_metrics)
            aggregated.min_quality = min(m.quality_score for m in period_metrics)
            aggregated.max_quality = max(m.quality_score for m in period_metrics)
        
        # Percentiles
        if len(period_metrics) >= 10:
            response_times = sorted([m.response_time for m in period_metrics])
            costs = sorted([m.cost for m in period_metrics])
            qualities = sorted([m.quality_score for m in period_metrics])
            
            aggregated.response_time_p95 = response_times[int(len(response_times) * 0.95)]
            aggregated.response_time_p99 = response_times[int(len(response_times) * 0.99)]
            aggregated.cost_p95 = costs[int(len(costs) * 0.95)]
            aggregated.quality_p5 = qualities[int(len(qualities) * 0.05)]
        
        # Cache hit rate
        cache_hits = sum(1 for m in period_metrics if m.cache_hit)
        aggregated.cache_hit_rate = cache_hits / len(period_metrics) if period_metrics else 0.0
        
        # Provider breakdown
        provider_stats = defaultdict(lambda: {
            "requests": 0,
            "cost": 0.0,
            "response_time": [],
            "quality_scores": []
        })
        
        for m in period_metrics:
            provider_key = f"{m.provider}_{m.model}"
            provider_stats[provider_key]["requests"] += 1
            provider_stats[provider_key]["cost"] += m.cost
            provider_stats[provider_key]["response_time"].append(m.response_time)
            provider_stats[provider_key]["quality_scores"].append(m.quality_score)
        
        # Calculate provider averages
        for provider_key, stats in provider_stats.items():
            aggregated.provider_stats[provider_key] = {
                "requests": stats["requests"],
                "cost": stats["cost"],
                "avg_response_time": statistics.mean(stats["response_time"]) if stats["response_time"] else 0.0,
                "avg_quality_score": statistics.mean(stats["quality_scores"]) if stats["quality_scores"] else 0.0
            }
        
        # Calculate derived metrics
        aggregated.calculate_derived_metrics()
        
        return aggregated
    
    async def _periodic_cleanup(self):
        """Clean up old metrics data"""
        
        while True:
            try:
                await asyncio.sleep(3600)  # Clean up every hour
                
                cutoff_time = datetime.now() - timedelta(days=self.retention_days)
                
                with self.lock:
                    # Clean up raw metrics
                    while self.raw_metrics and self.raw_metrics[0].timestamp < cutoff_time:
                        self.raw_metrics.popleft()
                    
                    # Clean up aggregated metrics
                    keys_to_remove = []
                    for key, agg in self.aggregated_metrics.items():
                        if agg.end_time < cutoff_time:
                            keys_to_remove.append(key)
                    
                    for key in keys_to_remove:
                        self.aggregated_metrics.pop(key, None)
                    
                    # Clean up old sessions
                    session_keys_to_remove = []
                    for session_id, session in self.user_sessions.items():
                        if session["last_activity"] < cutoff_time:
                            session_keys_to_remove.append(session_id)
                    
                    for key in session_keys_to_remove:
                        self.user_sessions.pop(key, None)
                
                logger.debug(f"Cleanup completed. Raw metrics: {len(self.raw_metrics)}, Aggregated: {len(self.aggregated_metrics)}")
                
            except Exception as e:
                logger.error(f"Cleanup error: {e}")
    
    async def _alert_monitoring(self):
        """Monitor metrics and trigger alerts"""
        
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute
                
                # Get recent metrics for alert evaluation
                recent_metrics = list(self.raw_metrics)[-1000:]  # Last 1000 requests
                
                if not recent_metrics:
                    continue
                
                # Check each alert
                for alert in self.alerts.values():
                    if not alert.enabled:
                        continue
                    
                    # Check cooldown
                    if (alert.last_triggered and 
                        (datetime.now() - alert.last_triggered).total_seconds() < alert.cooldown_minutes * 60):
                        continue
                    
                    # Evaluate alert condition
                    if await self._evaluate_alert(alert, recent_metrics):
                        await self._trigger_alert(alert)
                
            except Exception as e:
                logger.error(f"Alert monitoring error: {e}")
    
    async def _evaluate_alert(self, alert: PerformanceAlert, metrics: List[UsageMetrics]) -> bool:
        """Evaluate if alert condition is met"""
        
        if not metrics:
            return False
        
        # Calculate metric value based on alert type
        if alert.metric_type == MetricType.RESPONSE_TIME:
            value = statistics.mean([m.response_time for m in metrics])
        elif alert.metric_type == MetricType.QUALITY_SCORE:
            value = statistics.mean([m.quality_score for m in metrics])
        elif alert.metric_type == MetricType.ERROR_RATE:
            error_count = sum(1 for m in metrics if not m.success)
            value = error_count / len(metrics)
        elif alert.metric_type == MetricType.COST:
            value = statistics.mean([m.cost for m in metrics])
        elif alert.metric_type == MetricType.CACHE_HIT_RATE:
            cache_hits = sum(1 for m in metrics if m.cache_hit)
            value = cache_hits / len(metrics)
        else:
            return False
        
        # Evaluate condition
        if alert.comparison_operator == ">":
            return value > alert.threshold
        elif alert.comparison_operator == "<":
            return value < alert.threshold
        elif alert.comparison_operator == ">=":
            return value >= alert.threshold
        elif alert.comparison_operator == "<=":
            return value <= alert.threshold
        elif alert.comparison_operator == "==":
            return abs(value - alert.threshold) < 0.001
        elif alert.comparison_operator == "!=":
            return abs(value - alert.threshold) >= 0.001
        
        return False
    
    async def _trigger_alert(self, alert: PerformanceAlert):
        """Trigger an alert"""
        
        alert.last_triggered = datetime.now()
        alert.trigger_count += 1
        
        logger.warning(f"ALERT: {alert.name} - {alert.description}")
        
        # In a real implementation, this would send notifications
        # via configured channels (email, slack, etc.)
    
    async def _profile_updates(self):
        """Update model performance profiles"""
        
        while True:
            try:
                await asyncio.sleep(3600)  # Update every hour
                
                # Analyze recent performance to update profiles
                recent_metrics = list(self.raw_metrics)[-5000:]  # Last 5000 requests
                
                if len(recent_metrics) >= 100:
                    await self._update_model_profiles(recent_metrics)
                
            except Exception as e:
                logger.error(f"Profile update error: {e}")
    
    async def _update_model_profiles(self, metrics: List[UsageMetrics]):
        """Update model performance profiles based on recent data"""
        
        # Group by provider/model
        model_metrics = defaultdict(list)
        for m in metrics:
            key = f"{m.provider}_{m.model}"
            model_metrics[key].append(m)
        
        # Update profiles for each model
        for key, model_data in model_metrics.items():
            if len(model_data) < 10:  # Need minimum data
                continue
            
            provider, model = key.split('_', 1)
            
            # Calculate performance metrics
            avg_response_time = statistics.mean([m.response_time for m in model_data])
            avg_quality_score = statistics.mean([m.quality_score for m in model_data])
            avg_cost = statistics.mean([m.cost for m in model_data])
            success_rate = sum(1 for m in model_data if m.success) / len(model_data)
            reliability_score = 1.0 - (sum(1 for m in model_data if not m.success) / len(model_data))
            
            # Analyze content type performance
            content_performance = defaultdict(list)
            for m in model_data:
                content_performance[m.content_type].append(m.quality_score)
            
            best_content_types = []
            worst_content_types = []
            
            for content_type, scores in content_performance.items():
                avg_score = statistics.mean(scores)
                if avg_score > 0.8:
                    best_content_types.append(content_type)
                elif avg_score < 0.6:
                    worst_content_types.append(content_type)
            
            # Create or update profile
            profile = ModelPerformanceProfile(
                provider=provider,
                model=model,
                content_types=list(set(m.content_type for m in model_data)),
                difficulty_range=("beginner", "expert"),
                avg_response_time=avg_response_time,
                avg_quality_score=avg_quality_score,
                avg_cost_per_request=avg_cost,
                success_rate=success_rate,
                reliability_score=reliability_score,
                optimal_use_cases=best_content_types,
                suboptimal_use_cases=worst_content_types,
                recommended_for=best_content_types,
                not_recommended_for=worst_content_types
            )
            
            self.model_profiles[key] = profile
    
    def get_usage_report(
        self, 
        period: AnalyticsPeriod = AnalyticsPeriod.DAILY,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Generate comprehensive usage report"""
        
        if not start_time:
            start_time = datetime.now() - timedelta(days=1)
        if not end_time:
            end_time = datetime.now()
        
        # Filter metrics for period
        period_metrics = [
            m for m in self.raw_metrics
            if start_time <= m.timestamp <= end_time
        ]
        
        # Basic statistics
        total_requests = len(period_metrics)
        successful_requests = sum(1 for m in period_metrics if m.success)
        total_cost = sum(m.cost for m in period_metrics)
        total_tokens = sum(m.total_tokens for m in period_metrics)
        
        # Provider breakdown
        provider_breakdown = defaultdict(lambda: {"requests": 0, "cost": 0.0, "tokens": 0})
        for m in period_metrics:
            provider_breakdown[m.provider]["requests"] += 1
            provider_breakdown[m.provider]["cost"] += m.cost
            provider_breakdown[m.provider]["tokens"] += m.total_tokens
        
        # Model breakdown
        model_breakdown = defaultdict(lambda: {"requests": 0, "cost": 0.0, "avg_quality": 0.0, "qualities": []})
        for m in period_metrics:
            key = f"{m.provider}_{m.model}"
            model_breakdown[key]["requests"] += 1
            model_breakdown[key]["cost"] += m.cost
            model_breakdown[key]["qualities"].append(m.quality_score)
        
        # Calculate model averages
        for key, stats in model_breakdown.items():
            if stats["qualities"]:
                stats["avg_quality"] = statistics.mean(stats["qualities"])
            del stats["qualities"]
        
        # Performance trends
        if len(period_metrics) >= 10:
            response_times = [m.response_time for m in period_metrics]
            quality_scores = [m.quality_score for m in period_metrics]
            
            performance_trends = {
                "avg_response_time": statistics.mean(response_times),
                "response_time_trend": "stable",  # Simplified
                "avg_quality_score": statistics.mean(quality_scores),
                "quality_trend": "stable"  # Simplified
            }
        else:
            performance_trends = {}
        
        return {
            "report_period": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
                "period_type": period.value
            },
            "summary": {
                "total_requests": total_requests,
                "successful_requests": successful_requests,
                "success_rate": successful_requests / total_requests if total_requests > 0 else 0.0,
                "total_cost": total_cost,
                "total_tokens": total_tokens,
                "avg_cost_per_request": total_cost / total_requests if total_requests > 0 else 0.0,
                "avg_tokens_per_request": total_tokens / total_requests if total_requests > 0 else 0
            },
            "provider_breakdown": dict(provider_breakdown),
            "model_breakdown": dict(model_breakdown),
            "performance_trends": performance_trends,
            "top_performing_models": self._get_top_performing_models(period_metrics),
            "alerts_triggered": len([a for a in self.alerts.values() if a.last_triggered and 
                                   (datetime.now() - a.last_triggered).total_seconds() < 3600])
        }
    
    def _get_top_performing_models(self, metrics: List[UsageMetrics]) -> List[Dict[str, Any]]:
        """Get top performing models based on quality and efficiency"""
        
        model_stats = defaultdict(lambda: {
            "requests": 0,
            "total_quality": 0.0,
            "total_cost": 0.0,
            "total_time": 0.0
        })
        
        for m in metrics:
            key = f"{m.provider}_{m.model}"
            model_stats[key]["requests"] += 1
            model_stats[key]["total_quality"] += m.quality_score
            model_stats[key]["total_cost"] += m.cost
            model_stats[key]["total_time"] += m.response_time
        
        # Calculate scores
        model_scores = []
        for key, stats in model_stats.items():
            if stats["requests"] >= 5:  # Minimum threshold
                avg_quality = stats["total_quality"] / stats["requests"]
                avg_cost = stats["total_cost"] / stats["requests"]
                avg_time = stats["total_time"] / stats["requests"]
                
                # Efficiency score (quality / (cost * time))
                efficiency_score = avg_quality / (avg_cost * avg_time) if (avg_cost * avg_time) > 0 else 0
                
                model_scores.append({
                    "model": key,
                    "requests": stats["requests"],
                    "avg_quality": avg_quality,
                    "avg_cost": avg_cost,
                    "avg_response_time": avg_time,
                    "efficiency_score": efficiency_score
                })
        
        # Sort by efficiency score
        model_scores.sort(key=lambda x: x["efficiency_score"], reverse=True)
        
        return model_scores[:5]  # Top 5
    
    def get_model_performance_profile(self, provider: str, model: str) -> Optional[Dict[str, Any]]:
        """Get performance profile for specific model"""
        
        key = f"{provider}_{model}"
        profile = self.model_profiles.get(key)
        
        if not profile:
            return None
        
        return asdict(profile)
    
    def get_real_time_metrics(self) -> Dict[str, Any]:
        """Get real-time metrics dashboard data"""
        
        # Get last 100 requests for real-time view
        recent_metrics = list(self.raw_metrics)[-100:]
        
        if not recent_metrics:
            return {"message": "No recent metrics available"}
        
        # Calculate real-time metrics
        now = datetime.now()
        last_5_minutes = [m for m in recent_metrics if (now - m.timestamp).total_seconds() <= 300]
        last_hour = [m for m in recent_metrics if (now - m.timestamp).total_seconds() <= 3600]
        
        def calculate_metrics(metrics_list):
            if not metrics_list:
                return {}
            
            return {
                "request_count": len(metrics_list),
                "avg_response_time": statistics.mean([m.response_time for m in metrics_list]),
                "avg_quality_score": statistics.mean([m.quality_score for m in metrics_list]),
                "success_rate": sum(1 for m in metrics_list if m.success) / len(metrics_list),
                "total_cost": sum(m.cost for m in metrics_list),
                "cache_hit_rate": sum(1 for m in metrics_list if m.cache_hit) / len(metrics_list)
            }
        
        return {
            "last_5_minutes": calculate_metrics(last_5_minutes),
            "last_hour": calculate_metrics(last_hour),
            "active_sessions": len([s for s in self.user_sessions.values() if 
                                  (now - s["last_activity"]).total_seconds() <= 1800]),
            "system_health": self._calculate_system_health(recent_metrics),
            "recent_alerts": [asdict(a) for a in self.alerts.values() if a.last_triggered and 
                             (now - a.last_triggered).total_seconds() <= 3600]
        }
    
    def _calculate_system_health(self, metrics: List[UsageMetrics]) -> Dict[str, Any]:
        """Calculate overall system health score"""
        
        if not metrics:
            return {"health_score": 0.0, "status": "unknown"}
        
        # Calculate health components
        success_rate = sum(1 for m in metrics if m.success) / len(metrics)
        avg_quality = statistics.mean([m.quality_score for m in metrics])
        avg_response_time = statistics.mean([m.response_time for m in metrics])
        
        # Health score calculation (0-100)
        health_score = (
            success_rate * 40 +  # 40% weight for reliability
            avg_quality * 40 +    # 40% weight for quality
            max(0, (10 - avg_response_time) / 10) * 20  # 20% weight for speed
        )
        
        # Determine status
        if health_score >= 90:
            status = "excellent"
        elif health_score >= 75:
            status = "good"
        elif health_score >= 60:
            status = "fair"
        else:
            status = "poor"
        
        return {
            "health_score": health_score,
            "status": status,
            "components": {
                "reliability": success_rate * 100,
                "quality": avg_quality * 100,
                "performance": max(0, (10 - avg_response_time) / 10) * 100
            }
        }

# Global usage analytics instance
_global_usage_analytics: Optional[UsageAnalytics] = None

def get_usage_analytics(retention_days: int = 30) -> UsageAnalytics:
    """Get global usage analytics instance"""
    global _global_usage_analytics
    
    if _global_usage_analytics is None:
        _global_usage_analytics = UsageAnalytics(retention_days)
    
    return _global_usage_analytics

def initialize_usage_analytics(retention_days: int = 30) -> UsageAnalytics:
    """Initialize global usage analytics"""
    global _global_usage_analytics
    _global_usage_analytics = UsageAnalytics(retention_days)
    return _global_usage_analytics