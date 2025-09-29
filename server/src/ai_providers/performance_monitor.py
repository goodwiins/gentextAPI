"""
Performance Monitoring for AI Providers

This module provides comprehensive performance monitoring, metrics collection,
and analytics for all AI providers in the system.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import time
from datetime import datetime, timedelta
import json
import statistics
from collections import defaultdict, deque

from .base import BaseAIProvider, ProviderRegistry, ProviderStatus

logger = logging.getLogger(__name__)

class MetricType(Enum):
    """Types of metrics to monitor"""
    RESPONSE_TIME = "response_time"
    SUCCESS_RATE = "success_rate"
    COST_PER_REQUEST = "cost_per_request"
    QUALITY_SCORE = "quality_score"
    TOKEN_EFFICIENCY = "token_efficiency"
    ERROR_RATE = "error_rate"
    THROUGHPUT = "throughput"
    UPTIME = "uptime"

class AlertLevel(Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class PerformanceMetric:
    """Individual performance metric"""
    timestamp: datetime
    provider_id: str
    metric_type: MetricType
    value: float
    unit: str
    metadata: Dict[str, Any] = None

@dataclass
class PerformanceAlert:
    """Performance alert"""
    timestamp: datetime
    provider_id: str
    level: AlertLevel
    message: str
    metric_type: MetricType
    current_value: float
    threshold: float
    metadata: Dict[str, Any] = None

@dataclass
class ProviderPerformanceReport:
    """Comprehensive performance report for a provider"""
    provider_id: str
    reporting_period: Tuple[datetime, datetime]
    total_requests: int
    successful_requests: int
    failed_requests: int
    average_response_time: float
    p95_response_time: float
    p99_response_time: float
    success_rate: float
    total_cost: float
    average_cost_per_request: float
    average_quality_score: float
    token_efficiency: float
    uptime_percentage: float
    error_rate: float
    throughput_rph: float
    alerts: List[PerformanceAlert]

class PerformanceMonitor:
    """Performance monitoring system for AI providers"""
    
    def __init__(self, registry: ProviderRegistry):
        self.registry = registry
        self.metrics_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.alerts: List[PerformanceAlert] = []
        self.alert_rules: Dict[str, Dict[MetricType, Tuple[float, AlertLevel]]] = {}
        self._monitoring_active = False
        self._monitor_task: Optional[asyncio.Task] = None
        
        # Default alert thresholds
        self._setup_default_alert_rules()
        
        # Performance baselines
        self.baselines: Dict[str, Dict[MetricType, float]] = {}
        
        # Recent performance cache
        self.recent_performance: Dict[str, Dict[str, float]] = {}
        
    def _setup_default_alert_rules(self):
        """Setup default alert thresholds"""
        
        default_rules = {
            MetricType.RESPONSE_TIME: [
                (5.0, AlertLevel.WARNING),
                (10.0, AlertLevel.ERROR),
                (30.0, AlertLevel.CRITICAL)
            ],
            MetricType.SUCCESS_RATE: [
                (0.95, AlertLevel.WARNING),
                (0.90, AlertLevel.ERROR),
                (0.80, AlertLevel.CRITICAL)
            ],
            MetricType.COST_PER_REQUEST: [
                (0.10, AlertLevel.WARNING),
                (0.25, AlertLevel.ERROR),
                (0.50, AlertLevel.CRITICAL)
            ],
            MetricType.QUALITY_SCORE: [
                (0.7, AlertLevel.WARNING),
                (0.5, AlertLevel.ERROR),
                (0.3, AlertLevel.CRITICAL)
            ],
            MetricType.ERROR_RATE: [
                (0.05, AlertLevel.WARNING),
                (0.10, AlertLevel.ERROR),
                (0.20, AlertLevel.CRITICAL)
            ],
            MetricType.UPTIME: [
                (0.95, AlertLevel.WARNING),
                (0.90, AlertLevel.ERROR),
                (0.80, AlertLevel.CRITICAL)
            ]
        }
        
        # Apply to all providers
        for provider_id in ["openai-gpt-4", "anthropic-claude", "google-gemini", "cohere-command-r"]:
            self.alert_rules[provider_id] = default_rules.copy()
    
    async def start_monitoring(self, interval_seconds: int = 60):
        """Start continuous performance monitoring"""
        
        if self._monitoring_active:
            logger.warning("Performance monitoring already active")
            return
        
        self._monitoring_active = True
        self._monitor_task = asyncio.create_task(self._monitoring_loop(interval_seconds))
        
        logger.info(f"Performance monitoring started with {interval_seconds}s interval")
    
    async def stop_monitoring(self):
        """Stop performance monitoring"""
        
        if not self._monitoring_active:
            return
        
        self._monitoring_active = False
        
        if self._monitor_task:
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Performance monitoring stopped")
    
    async def _monitoring_loop(self, interval_seconds: int):
        """Main monitoring loop"""
        
        while self._monitoring_active:
            try:
                await self._collect_metrics()
                await self._check_alerts()
                await self._update_performance_cache()
                
                await asyncio.sleep(interval_seconds)
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {str(e)}")
                await asyncio.sleep(interval_seconds)
    
    async def _collect_metrics(self):
        """Collect performance metrics from all providers"""
        
        for provider_id, provider in self.registry.get_all_providers().items():
            try:
                metrics = provider.get_metrics()
                
                # Calculate current metrics
                current_metrics = {
                    MetricType.RESPONSE_TIME: metrics.last_response_time,
                    MetricType.SUCCESS_RATE: metrics.success_rate / 100.0,
                    MetricType.ERROR_RATE: (metrics.failed_requests / max(1, metrics.total_requests)),
                    MetricType.UPTIME: metrics.uptime_percentage / 100.0
                }
                
                # Store metrics
                for metric_type, value in current_metrics.items():
                    if value is not None:
                        metric = PerformanceMetric(
                            timestamp=datetime.now(),
                            provider_id=provider_id,
                            metric_type=metric_type,
                            value=float(value),
                            unit=self._get_unit(metric_type)
                        )
                        self.metrics_history[provider_id].append(metric)
                
            except Exception as e:
                logger.error(f"Error collecting metrics for {provider_id}: {str(e)}")
    
    async def _check_alerts(self):
        """Check for alert conditions"""
        
        for provider_id, metrics_deque in self.metrics_history.items():
            if not metrics_deque:
                continue
            
            # Get recent metrics (last 10 measurements)
            recent_metrics = list(metrics_deque)[-10:]
            
            for metric in recent_metrics:
                if metric.metric_type in self.alert_rules.get(provider_id, {}):
                    rules = self.alert_rules[provider_id][metric.metric_type]
                    
                    for threshold, level in rules:
                        if self._should_trigger_alert(metric.metric_type, metric.value, threshold):
                            alert = PerformanceAlert(
                                timestamp=datetime.now(),
                                provider_id=provider_id,
                                level=level,
                                message=f"{metric.metric_type.value} {metric.value:.3f}{metric.unit} exceeds threshold {threshold}{metric.unit}",
                                metric_type=metric.metric_type,
                                current_value=metric.value,
                                threshold=threshold,
                                metadata={"metric_count": len(recent_metrics)}
                            )
                            
                            self._add_alert(alert)
                            break
    
    def _should_trigger_alert(self, metric_type: MetricType, value: float, threshold: float) -> bool:
        """Determine if an alert should be triggered"""
        
        if metric_type in [MetricType.SUCCESS_RATE, MetricType.QUALITY_SCORE, MetricType.TOKEN_EFFICIENCY, MetricType.UPTIME]:
            return value < threshold
        else:
            return value > threshold
    
    def _add_alert(self, alert: PerformanceAlert):
        """Add an alert to the alerts list"""
        
        # Avoid duplicate alerts for the same condition
        recent_similar_alerts = [
            a for a in self.alerts[-10:] 
            if (a.provider_id == alert.provider_id and 
                a.metric_type == alert.metric_type and
                a.level == alert.level and
                (datetime.now() - a.timestamp).total_seconds() < 300)  # 5 minutes
        ]
        
        if not recent_similar_alerts:
            self.alerts.append(alert)
            
            # Log the alert
            log_method = {
                AlertLevel.INFO: logger.info,
                AlertLevel.WARNING: logger.warning,
                AlertLevel.ERROR: logger.error,
                AlertLevel.CRITICAL: logger.critical
            }[alert.level]
            
            log_method(f"Alert: {alert.message}")
    
    async def _update_performance_cache(self):
        """Update recent performance cache"""
        
        for provider_id in self.registry.get_all_providers().keys():
            try:
                performance = await self.get_provider_performance_summary(provider_id)
                self.recent_performance[provider_id] = performance
            except Exception as e:
                logger.error(f"Error updating performance cache for {provider_id}: {str(e)}")
    
    def record_generation_result(self, result: Dict[str, Any]):
        """Record a generation result for performance tracking"""
        
        provider_id = result.get('provider')
        if not provider_id:
            return
        
        # Extract metrics
        metrics = result.get('metrics', {})
        
        # Record cost metric
        if 'cost' in result:
            cost_metric = PerformanceMetric(
                timestamp=datetime.now(),
                provider_id=provider_id,
                metric_type=MetricType.COST_PER_REQUEST,
                value=float(result['cost']),
                unit="USD"
            )
            self.metrics_history[provider_id].append(cost_metric)
        
        # Record quality score
        if 'quality_score' in result:
            quality_metric = PerformanceMetric(
                timestamp=datetime.now(),
                provider_id=provider_id,
                metric_type=MetricType.QUALITY_SCORE,
                value=float(result['quality_score']),
                unit="score"
            )
            self.metrics_history[provider_id].append(quality_metric)
        
        # Record token efficiency
        if 'metrics' in metrics:
            total_tokens = metrics.get('total_tokens', 0)
            cost = result.get('cost', 0.01)
            if total_tokens > 0 and cost > 0:
                efficiency = total_tokens / cost
                efficiency_metric = PerformanceMetric(
                    timestamp=datetime.now(),
                    provider_id=provider_id,
                    metric_type=MetricType.TOKEN_EFFICIENCY,
                    value=efficiency,
                    unit="tokens/USD"
                )
                self.metrics_history[provider_id].append(efficiency_metric)
    
    async def get_provider_performance_summary(self, provider_id: str) -> Dict[str, float]:
        """Get performance summary for a specific provider"""
        
        if provider_id not in self.metrics_history:
            return {}
        
        metrics_deque = self.metrics_history[provider_id]
        if not metrics_deque:
            return {}
        
        # Group by metric type
        metrics_by_type = defaultdict(list)
        for metric in metrics_deque:
            metrics_by_type[metric.metric_type].append(metric.value)
        
        summary = {}
        
        # Calculate statistics for each metric type
        for metric_type, values in metrics_by_type.items():
            if values:
                summary[f"{metric_type.value}_avg"] = statistics.mean(values)
                summary[f"{metric_type.value}_latest"] = values[-1]
                if len(values) > 1:
                    summary[f"{metric_type.value}_trend"] = (values[-1] - values[0]) / len(values)
        
        return summary
    
    async def generate_performance_report(
        self, 
        provider_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> Dict[str, ProviderPerformanceReport]:
        """Generate comprehensive performance report"""
        
        if end_time is None:
            end_time = datetime.now()
        
        if start_time is None:
            start_time = end_time - timedelta(hours=24)
        
        providers = [provider_id] if provider_id else list(self.registry.get_all_providers().keys())
        reports = {}
        
        for pid in providers:
            try:
                provider = self.registry.get_all_providers()[pid]
                metrics = provider.get_metrics()
                
                # Get filtered metrics for the time period
                filtered_metrics = [
                    m for m in self.metrics_history[pid]
                    if start_time <= m.timestamp <= end_time
                ]
                
                # Calculate statistics
                response_times = [
                    m.value for m in filtered_metrics 
                    if m.metric_type == MetricType.RESPONSE_TIME
                ]
                
                success_rates = [
                    m.value for m in filtered_metrics 
                    if m.metric_type == MetricType.SUCCESS_RATE
                ]
                
                costs = [
                    m.value for m in filtered_metrics 
                    if m.metric_type == MetricType.COST_PER_REQUEST
                ]
                
                quality_scores = [
                    m.value for m in filtered_metrics 
                    if m.metric_type == MetricType.QUALITY_SCORE
                ]
                
                # Calculate percentiles
                p95_response_time = statistics.quantiles(response_times, n=20)[18] if len(response_times) >= 20 else (response_times[-1] if response_times else 0)
                p99_response_time = statistics.quantiles(response_times, n=100)[98] if len(response_times) >= 100 else (response_times[-1] if response_times else 0)
                
                # Calculate throughput (requests per hour)
                hours_in_period = (end_time - start_time).total_seconds() / 3600
                throughput_rph = metrics.total_requests / max(hours_in_period, 1)
                
                # Get alerts for the period
                period_alerts = [
                    a for a in self.alerts
                    if a.provider_id == pid and start_time <= a.timestamp <= end_time
                ]
                
                report = ProviderPerformanceReport(
                    provider_id=pid,
                    reporting_period=(start_time, end_time),
                    total_requests=metrics.total_requests,
                    successful_requests=metrics.successful_requests,
                    failed_requests=metrics.failed_requests,
                    average_response_time=statistics.mean(response_times) if response_times else 0,
                    p95_response_time=p95_response_time,
                    p99_response_time=p99_response_time,
                    success_rate=metrics.success_rate / 100.0,
                    total_cost=sum(costs),
                    average_cost_per_request=statistics.mean(costs) if costs else 0,
                    average_quality_score=statistics.mean(quality_scores) if quality_scores else 0,
                    token_efficiency=sum(m.value for m in filtered_metrics if m.metric_type == MetricType.TOKEN_EFFICIENCY) / max(1, len([m for m in filtered_metrics if m.metric_type == MetricType.TOKEN_EFFICIENCY])),
                    uptime_percentage=metrics.uptime_percentage / 100.0,
                    error_rate=metrics.failed_requests / max(1, metrics.total_requests),
                    throughput_rph=throughput_rph,
                    alerts=period_alerts
                )
                
                reports[pid] = report
                
            except Exception as e:
                logger.error(f"Error generating report for {pid}: {str(e)}")
        
        return reports
    
    def get_system_overview(self) -> Dict[str, Any]:
        """Get system-wide performance overview"""
        
        total_requests = sum(
            provider.get_metrics().total_requests 
            for provider in self.registry.get_all_providers().values()
        )
        
        total_successful = sum(
            provider.get_metrics().successful_requests 
            for provider in self.registry.get_all_providers().values()
        )
        
        total_failed = sum(
            provider.get_metrics().failed_requests 
            for provider in self.registry.get_all_providers().values()
        )
        
        overall_success_rate = total_successful / max(1, total_requests) * 100
        
        # Count alerts by severity
        alert_counts = defaultdict(int)
        for alert in self.alerts[-100:]:  # Last 100 alerts
            alert_counts[alert.level] += 1
        
        # Provider status summary
        provider_status = {}
        for provider_id, provider in self.registry.get_all_providers().items():
            provider_status[provider_id] = {
                "status": provider.health.status.value,
                "uptime": provider.metrics.uptime_percentage,
                "success_rate": provider.metrics.success_rate,
                "response_time": provider.metrics.last_response_time
            }
        
        return {
            "system_status": "healthy" if overall_success_rate > 95 else "degraded" if overall_success_rate > 80 else "critical",
            "total_requests": total_requests,
            "total_successful": total_successful,
            "total_failed": total_failed,
            "overall_success_rate": overall_success_rate,
            "alert_counts": {level.value: count for level, count in alert_counts.items()},
            "provider_status": provider_status,
            "monitoring_active": self._monitoring_active,
            "metrics_collected": sum(len(deque) for deque in self.metrics_history.values())
        }
    
    def _get_unit(self, metric_type: MetricType) -> str:
        """Get unit for metric type"""
        units = {
            MetricType.RESPONSE_TIME: "s",
            MetricType.SUCCESS_RATE: "%",
            MetricType.COST_PER_REQUEST: "USD",
            MetricType.QUALITY_SCORE: "score",
            MetricType.TOKEN_EFFICIENCY: "tokens/USD",
            MetricType.ERROR_RATE: "%",
            MetricType.THROUGHPUT: "req/h",
            MetricType.UPTIME: "%"
        }
        return units.get(metric_type, "")
    
    def set_alert_threshold(
        self, 
        provider_id: str, 
        metric_type: MetricType, 
        threshold: float, 
        level: AlertLevel
    ):
        """Set custom alert threshold"""
        
        if provider_id not in self.alert_rules:
            self.alert_rules[provider_id] = {}
        
        if metric_type not in self.alert_rules[provider_id]:
            self.alert_rules[provider_id][metric_type] = []
        
        # Remove existing threshold for this level
        self.alert_rules[provider_id][metric_type] = [
            (t, l) for t, l in self.alert_rules[provider_id][metric_type] 
            if l != level
        ]
        
        self.alert_rules[provider_id][metric_type].append((threshold, level))
        
        # Sort by threshold
        if metric_type in [MetricType.SUCCESS_RATE, MetricType.QUALITY_SCORE, MetricType.TOKEN_EFFICIENCY, MetricType.UPTIME]:
            self.alert_rules[provider_id][metric_type].sort(key=lambda x: x[0], reverse=True)
        else:
            self.alert_rules[provider_id][metric_type].sort(key=lambda x: x[0])
        
        logger.info(f"Set alert threshold for {provider_id} {metric_type.value}: {threshold} ({level.value})")

# Global performance monitor instance
_performance_monitor = None

async def get_performance_monitor() -> PerformanceMonitor:
    """Get the global performance monitor instance"""
    global _performance_monitor
    if _performance_monitor is None:
        registry = await get_provider_registry()
        _performance_monitor = PerformanceMonitor(registry)
    return _performance_monitor

async def initialize_performance_monitoring():
    """Initialize performance monitoring system"""
    monitor = await get_performance_monitor()
    await monitor.start_monitoring()
    logger.info("Performance monitoring system initialized")