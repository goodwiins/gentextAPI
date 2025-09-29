"""
Cost Optimization and Budget Management System

This module provides comprehensive cost tracking, budget management, and cost optimization
capabilities for AI provider usage to ensure efficient resource allocation.
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
from collections import defaultdict, deque
import threading
from dataclasses import asdict

logger = logging.getLogger(__name__)

class BudgetPeriod(Enum):
    """Budget period types"""
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class CostAlertLevel(Enum):
    """Cost alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"

class OptimizationStrategy(Enum):
    """Cost optimization strategies"""
    COST_BASED_ROUTING = "cost_based_routing"
    BUDGET_AWARE_ROUTING = "budget_aware_routing"
    QUALITY_COST_BALANCE = "quality_cost_balance"
    ADAPTIVE_COST_CONTROL = "adaptive_cost_control"
    PREDICTIVE_COST_MANAGEMENT = "predictive_cost_management"

@dataclass
class ProviderCost:
    """Cost structure for AI providers"""
    provider: str
    model: str
    input_token_cost: float  # Cost per 1K input tokens
    output_token_cost: float  # Cost per 1K output tokens
    request_cost: float      # Base cost per request
    currency: str = "USD"
    last_updated: datetime = field(default_factory=datetime.now)

@dataclass
class CostMetrics:
    """Cost usage metrics"""
    total_cost: float = 0.0
    total_tokens: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    total_requests: int = 0
    avg_cost_per_request: float = 0.0
    avg_cost_per_token: float = 0.0
    peak_cost: float = 0.0
    min_cost: float = 0.0
    cost_efficiency: float = 0.0

@dataclass
class BudgetLimit:
    """Budget limit configuration"""
    amount: float
    period: BudgetPeriod
    alert_threshold: float = 0.8    # Alert at 80% of budget
    hard_limit: float = 1.0         # Hard limit at 100% of budget
    enforce_hard_limit: bool = True   # Enforce hard limit stopping
    rollover_unused: bool = False   # Rollover unused budget
    auto_adjust: bool = True        # Auto-adjust based on usage

@dataclass
class BudgetStatus:
    """Current budget status"""
    budget_id: str
    current_usage: float
    remaining_budget: float
    usage_percentage: float
    period_start: datetime
    period_end: datetime
    is_over_budget: bool
    alert_triggered: bool
    alert_level: Optional[CostAlertLevel] = None
    projected_usage: float = 0.0
    projected_over_budget: bool = False

@dataclass
class CostTransaction:
    """Individual cost transaction"""
    id: str
    timestamp: datetime
    provider: str
    model: str
    request_id: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost: float
    budget_id: str
    user_id: Optional[str] = None
    project_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class CostOptimizationConfig:
    """Configuration for cost optimization"""
    enable_cost_tracking: bool = True
    enable_budget_management: bool = True
    enable_cost_alerts: bool = True
    enable_auto_optimization: bool = True
    optimization_strategy: OptimizationStrategy = OptimizationStrategy.QUALITY_COST_BALANCE
    quality_cost_weight: float = 0.7  # Weight for quality vs cost
    cost_savings_target: float = 0.2   # Target 20% cost savings
    alert_cooldown_minutes: int = 60   # Cooldown period between alerts
    prediction_horizon_hours: int = 24  # Prediction horizon for cost forecasting
    enable_cost_distribution: bool = True  # Distribute costs across projects/users
    default_currency: str = "USD"

class CostManager:
    """Comprehensive cost management system"""
    
    def __init__(self, config: CostOptimizationConfig):
        self.config = config
        self.provider_costs: Dict[str, ProviderCost] = {}
        self.budgets: Dict[str, BudgetLimit] = {}
        self.cost_transactions: deque[CostTransaction] = deque(maxlen=10000)
        self.cost_metrics: Dict[str, CostMetrics] = defaultdict(CostMetrics)
        self.budget_status: Dict[str, BudgetStatus] = {}
        self.cost_alerts: deque = deque(maxlen=1000)
        self.optimization_stats = defaultdict(int)
        
        # Initialize default provider costs
        self._initialize_provider_costs()
        
        # Start background tasks
        if config.enable_cost_tracking:
            self._start_background_tasks()
    
    def _initialize_provider_costs(self):
        """Initialize default provider cost structures"""
        
        # OpenAI costs (as of 2024)
        self.provider_costs["openai_gpt-4"] = ProviderCost(
            provider="openai",
            model="gpt-4",
            input_token_cost=0.03,
            output_token_cost=0.06,
            request_cost=0.0
        )
        
        self.provider_costs["openai_gpt-3.5"] = ProviderCost(
            provider="openai",
            model="gpt-3.5-turbo",
            input_token_cost=0.0015,
            output_token_cost=0.002,
            request_cost=0.0
        )
        
        # Anthropic costs
        self.provider_costs["anthropic_claude"] = ProviderCost(
            provider="anthropic",
            model="claude-3-opus",
            input_token_cost=0.015,
            output_token_cost=0.075,
            request_cost=0.0
        )
        
        # Google costs
        self.provider_costs["google_gemini"] = ProviderCost(
            provider="google",
            model="gemini-pro",
            input_token_cost=0.00125,
            output_token_cost=0.005,
            request_cost=0.0
        )
        
        # Cohere costs
        self.provider_costs["cohere_command"] = ProviderCost(
            provider="cohere",
            model="command",
            input_token_cost=0.001,
            output_token_cost=0.002,
            request_cost=0.0
        )
        
        logger.info(f"Initialized {len(self.provider_costs)} provider cost structures")
    
    def _start_background_tasks(self):
        """Start background cost management tasks"""
        asyncio.create_task(self._periodic_budget_checking())
        asyncio.create_task(self._cost_optimization_loop())
        asyncio.create_task(self._cost_prediction_update())
        asyncio.create_task(self._cleanup_old_transactions())
    
    def add_budget(
        self,
        budget_id: str,
        amount: float,
        period: BudgetPeriod,
        alert_threshold: float = 0.8,
        hard_limit: float = 1.0
    ) -> bool:
        """Add a new budget limit"""
        
        try:
            budget = BudgetLimit(
                amount=amount,
                period=period,
                alert_threshold=alert_threshold,
                hard_limit=hard_limit
            )
            
            self.budgets[budget_id] = budget
            
            # Initialize budget status
            self._initialize_budget_status(budget_id)
            
            logger.info(f"Added budget: {budget_id} - ${amount:.2f} per {period.value}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add budget {budget_id}: {e}")
            return False
    
    def _initialize_budget_status(self, budget_id: str):
        """Initialize budget status tracking"""
        
        budget = self.budgets[budget_id]
        period_start, period_end = self._get_period_dates(budget.period)
        
        status = BudgetStatus(
            budget_id=budget_id,
            current_usage=0.0,
            remaining_budget=budget.amount,
            usage_percentage=0.0,
            period_start=period_start,
            period_end=period_end,
            is_over_budget=False,
            alert_triggered=False
        )
        
        self.budget_status[budget_id] = status
    
    def _get_period_dates(self, period: BudgetPeriod) -> Tuple[datetime, datetime]:
        """Get start and end dates for budget period"""
        
        now = datetime.now()
        
        if period == BudgetPeriod.HOURLY:
            start = now.replace(minute=0, second=0, microsecond=0)
            end = start + timedelta(hours=1)
        elif period == BudgetPeriod.DAILY:
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1)
        elif period == BudgetPeriod.WEEKLY:
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            start = start - timedelta(days=start.weekday())
            end = start + timedelta(days=7)
        elif period == BudgetPeriod.MONTHLY:
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if start.month == 12:
                end = start.replace(year=start.year + 1, month=1)
            else:
                end = start.replace(month=start.month + 1)
        elif period == BudgetPeriod.QUARTERLY:
            quarter = (now.month - 1) // 3 + 1
            quarter_start_month = (quarter - 1) * 3 + 1
            start = now.replace(month=quarter_start_month, day=1, hour=0, minute=0, second=0, microsecond=0)
            if quarter == 4:
                end = start.replace(year=start.year + 1, month=1)
            else:
                end = start.replace(month=start.month + 3)
        else:  # YEARLY
            start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end = start.replace(year=start.year + 1)
        
        return start, end
    
    def record_cost(
        self,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        request_id: str,
        budget_id: str,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> float:
        """Record a cost transaction"""
        
        try:
            # Calculate cost
            cost = self._calculate_cost(provider, model, input_tokens, output_tokens)
            
            # Create transaction
            transaction = CostTransaction(
                id=f"cost_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}",
                timestamp=datetime.now(),
                provider=provider,
                model=model,
                request_id=request_id,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=input_tokens + output_tokens,
                cost=cost,
                budget_id=budget_id,
                user_id=user_id,
                project_id=project_id,
                metadata=metadata or {}
            )
            
            # Store transaction
            self.cost_transactions.append(transaction)
            
            # Update metrics
            self._update_cost_metrics(transaction)
            
            # Update budget status
            self._update_budget_status(budget_id, cost)
            
            logger.debug(f"Recorded cost: ${cost:.4f} for {provider}/{model} ({input_tokens + output_tokens} tokens)")
            
            return cost
            
        except Exception as e:
            logger.error(f"Failed to record cost: {e}")
            return 0.0
    
    def _calculate_cost(self, provider: str, model: str, input_tokens: int, output_tokens: int) -> float:
        """Calculate cost for API usage"""
        
        cost_key = f"{provider}_{model}"
        
        if cost_key not in self.provider_costs:
            logger.warning(f"No cost structure found for {provider}/{model}")
            return 0.0
        
        provider_cost = self.provider_costs[cost_key]
        
        # Calculate token costs
        input_cost = (input_tokens / 1000) * provider_cost.input_token_cost
        output_cost = (output_tokens / 1000) * provider_cost.output_token_cost
        total_cost = input_cost + output_cost + provider_cost.request_cost
        
        return total_cost
    
    def _update_cost_metrics(self, transaction: CostTransaction):
        """Update cost metrics"""
        
        budget_id = transaction.budget_id
        metrics = self.cost_metrics[budget_id]
        
        metrics.total_cost += transaction.cost
        metrics.total_tokens += transaction.total_tokens
        metrics.input_tokens += transaction.input_tokens
        metrics.output_tokens += transaction.output_tokens
        metrics.total_requests += 1
        
        # Update averages
        metrics.avg_cost_per_request = metrics.total_cost / metrics.total_requests
        metrics.avg_cost_per_token = metrics.total_cost / metrics.total_tokens if metrics.total_tokens > 0 else 0.0
        
        # Update peaks
        metrics.peak_cost = max(metrics.peak_cost, metrics.total_cost)
        
        # Calculate cost efficiency
        if metrics.total_requests > 0:
            metrics.cost_efficiency = 1.0 - (metrics.total_cost / (metrics.total_requests * 0.01))  # Normalize against $0.01 per request
    
    def _update_budget_status(self, budget_id: str, cost: float):
        """Update budget status"""
        
        if budget_id not in self.budget_status:
            return
        
        status = self.budget_status[budget_id]
        
        # Check if we're in the correct period
        now = datetime.now()
        if now > status.period_end:
            # Reset for new period
            self._initialize_budget_status(budget_id)
            status = self.budget_status[budget_id]
        
        # Update usage
        status.current_usage += cost
        status.remaining_budget = max(0.0, self.budgets[budget_id].amount - status.current_usage)
        status.usage_percentage = status.current_usage / self.budgets[budget_id].amount
        
        # Check budget status
        status.is_over_budget = status.current_usage > self.budgets[budget_id].amount
        
        # Check alerts
        budget = self.budgets[budget_id]
        if not status.alert_triggered and status.usage_percentage >= budget.alert_threshold:
            status.alert_triggered = True
            status.alert_level = self._determine_alert_level(status.usage_percentage)
            
            # Create alert
            alert = {
                "timestamp": datetime.now(),
                "budget_id": budget_id,
                "level": status.alert_level.value,
                "usage_percentage": status.usage_percentage,
                "current_usage": status.current_usage,
                "budget_limit": budget.amount,
                "message": f"Budget alert: {budget_id} at {status.usage_percentage:.1%} usage"
            }
            
            self.cost_alerts.append(alert)
            logger.warning(f"Budget alert triggered: {alert['message']}")
    
    def _determine_alert_level(self, usage_percentage: float) -> CostAlertLevel:
        """Determine alert level based on usage percentage"""
        
        if usage_percentage >= 1.0:
            return CostAlertLevel.EMERGENCY
        elif usage_percentage >= 0.95:
            return CostAlertLevel.CRITICAL
        elif usage_percentage >= 0.85:
            return CostAlertLevel.WARNING
        else:
            return CostAlertLevel.INFO
    
    async def _periodic_budget_checking(self):
        """Periodic budget status checking"""
        
        while True:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes
                
                for budget_id, status in self.budget_status.items():
                    # Update projections
                    await self._update_cost_projections(budget_id)
                    
                    # Check for emergency conditions
                    if status.is_over_budget and self.budgets[budget_id].enforce_hard_limit:
                        await self._handle_budget_overage(budget_id)
                
            except Exception as e:
                logger.error(f"Budget checking error: {e}")
    
    async def _update_cost_projections(self, budget_id: str):
        """Update cost projections for budget"""
        
        if budget_id not in self.budget_status:
            return
        
        status = self.budget_status[budget_id]
        budget = self.budgets[budget_id]
        
        # Calculate time remaining in period
        now = datetime.now()
        time_remaining = (status.period_end - now).total_seconds()
        period_duration = (status.period_end - status.period_start).total_seconds()
        time_elapsed = period_duration - time_remaining
        
        if time_elapsed > 0:
            # Project usage based on current rate
            usage_rate = status.current_usage / time_elapsed
            projected_usage = status.current_usage + (usage_rate * time_remaining)
            
            status.projected_usage = projected_usage
            status.projected_over_budget = projected_usage > budget.amount
    
    async def _handle_budget_overage(self, budget_id: str):
        """Handle budget overage situations"""
        
        logger.critical(f"Budget overage detected: {budget_id}")
        
        # Implement emergency measures
        # This could include:
        # - Stopping all requests for this budget
        # - Switching to cheapest available provider
        # - Notifying administrators
        
        self.optimization_stats["budget_overages"] += 1
    
    async def _cost_optimization_loop(self):
        """Continuous cost optimization loop"""
        
        while True:
            try:
                await asyncio.sleep(600)  # Run every 10 minutes
                
                if self.config.enable_auto_optimization:
                    await self._optimize_costs()
                
            except Exception as e:
                logger.error(f"Cost optimization error: {e}")
    
    async def _optimize_costs(self):
        """Execute cost optimization strategies"""
        
        strategy = self.config.optimization_strategy
        
        if strategy == OptimizationStrategy.COST_BASED_ROUTING:
            await self._optimize_cost_based_routing()
        elif strategy == OptimizationStrategy.BUDGET_AWARE_ROUTING:
            await self._optimize_budget_aware_routing()
        elif strategy == OptimizationStrategy.QUALITY_COST_BALANCE:
            await self._optimize_quality_cost_balance()
        elif strategy == OptimizationStrategy.ADAPTIVE_COST_CONTROL:
            await self._optimize_adaptive_cost_control()
        elif strategy == OptimizationStrategy.PREDICTIVE_COST_MANAGEMENT:
            await self._optimize_predictive_management()
    
    async def _optimize_cost_based_routing(self):
        """Optimize based on pure cost considerations"""
        
        # Analyze current provider costs
        provider_costs = {}
        for provider_cost in self.provider_costs.values():
            avg_cost_per_token = (provider_cost.input_token_cost + provider_cost.output_token_cost) / 2
            provider_costs[provider_cost.provider] = avg_cost_per_token
        
        # Find cheapest provider
        cheapest_provider = min(provider_costs, key=provider_costs.get)
        
        logger.info(f"Cost optimization: Cheapest provider is {cheapest_provider}")
        
        # Could implement provider switching logic here
        self.optimization_stats["cost_based_optimizations"] += 1
    
    async def _optimize_budget_aware_routing(self):
        """Optimize based on budget constraints"""
        
        for budget_id, status in self.budget_status.items():
            if status.usage_percentage > 0.7:  # High usage
                # Implement cost-saving measures for this budget
                logger.info(f"Budget-aware optimization triggered for {budget_id}")
                
                # Could implement:
                # - Switch to cheaper providers
                # - Reduce request frequency
                # - Use cached responses
                
                self.optimization_stats["budget_aware_optimizations"] += 1
    
    async def _optimize_quality_cost_balance(self):
        """Optimize balance between quality and cost"""
        
        # Analyze cost-effectiveness of providers
        for provider_cost in self.provider_costs.values():
            # Get quality metrics for this provider
            quality_score = self._get_provider_quality_score(provider_cost.provider)
            cost_score = 1.0 / (provider_cost.input_token_cost + provider_cost.output_token_cost)
            
            # Calculate quality-cost ratio
            quality_cost_ratio = quality_score * cost_score
            
            logger.debug(f"Provider {provider_cost.provider}: Quality-Cost ratio = {quality_cost_ratio:.2f}")
        
        self.optimization_stats["quality_cost_optimizations"] += 1
    
    def _get_provider_quality_score(self, provider: str) -> float:
        """Get quality score for provider (simplified)"""
        
        # In practice, this would query actual quality metrics
        quality_scores = {
            "openai": 0.85,
            "anthropic": 0.82,
            "google": 0.80,
            "cohere": 0.78
        }
        
        return quality_scores.get(provider, 0.75)
    
    async def _optimize_adaptive_cost_control(self):
        """Adaptive cost control based on usage patterns"""
        
        # Analyze usage patterns
        recent_transactions = list(self.cost_transactions)[-100:]
        
        if len(recent_transactions) >= 10:
            # Calculate usage trends
            costs = [t.cost for t in recent_transactions]
            avg_cost = statistics.mean(costs)
            cost_trend = costs[-5:] - costs[-10:-5] if len(costs) >= 10 else [0]
            
            # Adapt to trends
            if sum(cost_trend) > 0:  # Increasing costs
                logger.info("Adaptive cost control: Cost increasing, implementing savings")
                # Implement cost-saving measures
                
                self.optimization_stats["adaptive_optimizations"] += 1
    
    async def _optimize_predictive_management(self):
        """Predictive cost management"""
        
        # Use historical data to predict future costs
        if len(self.cost_transactions) >= 50:
            # Simple moving average prediction
            recent_costs = [t.cost for t in list(self.cost_transactions)[-20:]]
            predicted_next_cost = statistics.mean(recent_costs)
            
            # Project monthly costs
            daily_cost_estimate = predicted_next_cost * 24  # Assuming hourly requests
            monthly_projection = daily_cost_estimate * 30
            
            logger.info(f"Predictive management: Monthly cost projection = ${monthly_projection:.2f}")
            
            # Implement preventive measures if projection is high
            for budget_id, budget in self.budgets.items():
                if monthly_projection > budget.amount * 0.8:
                    logger.warning(f"Predictive cost alert for {budget_id}: High projection")
                    
                    self.optimization_stats["predictive_optimizations"] += 1
    
    async def _cost_prediction_update(self):
        """Update cost predictions"""
        
        while True:
            try:
                await asyncio.sleep(3600)  # Update every hour
                
                # Update predictions for all budgets
                for budget_id in self.budgets.keys():
                    await self._update_cost_projections(budget_id)
                
            except Exception as e:
                logger.error(f"Cost prediction update error: {e}")
    
    async def _cleanup_old_transactions(self):
        """Clean up old cost transactions"""
        
        while True:
            try:
                await asyncio.sleep(86400)  # Clean up daily
                
                # Keep only last 30 days of transactions
                cutoff_time = datetime.now() - timedelta(days=30)
                
                while self.cost_transactions and self.cost_transactions[0].timestamp < cutoff_time:
                    self.cost_transactions.popleft()
                
                logger.debug(f"Cleaned up old transactions, {len(self.cost_transactions)} remaining")
                
            except Exception as e:
                logger.error(f"Transaction cleanup error: {e}")
    
    def get_cost_report(self, budget_id: Optional[str] = None) -> Dict[str, Any]:
        """Generate comprehensive cost report"""
        
        report = {
            "generated_at": datetime.now().isoformat(),
            "currency": self.config.default_currency,
            "budgets": {},
            "provider_costs": {},
            "optimization_stats": dict(self.optimization_stats),
            "recent_alerts": []
        }
        
        # Budget-specific reports
        if budget_id:
            if budget_id in self.budget_status:
                status = self.budget_status[budget_id]
                metrics = self.cost_metrics[budget_id]
                
                report["budgets"][budget_id] = {
                    "status": asdict(status),
                    "metrics": asdict(metrics),
                    "budget_limit": asdict(self.budgets[budget_id])
                }
        else:
            # All budgets
            for bid, status in self.budget_status.items():
                metrics = self.cost_metrics[bid]
                
                report["budgets"][bid] = {
                    "status": asdict(status),
                    "metrics": asdict(metrics),
                    "budget_limit": asdict(self.budgets[bid])
                }
        
        # Provider cost summary
        for key, provider_cost in self.provider_costs.items():
            report["provider_costs"][key] = {
                "provider": provider_cost.provider,
                "model": provider_cost.model,
                "input_cost_per_1k": provider_cost.input_token_cost,
                "output_cost_per_1k": provider_cost.output_token_cost,
                "request_cost": provider_cost.request_cost
            }
        
        # Recent alerts
        recent_alerts = list(self.cost_alerts)[-10:]
        report["recent_alerts"] = recent_alerts
        
        return report
    
    def get_cost_savings_report(self) -> Dict[str, Any]:
        """Generate cost savings report"""
        
        # Calculate potential savings
        total_cost = sum(metrics.total_cost for metrics in self.cost_metrics.values())
        
        # Estimate savings from optimizations
        estimated_savings = total_cost * self.config.cost_savings_target
        
        # Calculate actual savings from provider comparisons
        most_expensive = max(self.provider_costs.values(), key=lambda pc: pc.input_token_cost + pc.output_token_cost)
        least_expensive = min(self.provider_costs.values(), key=lambda pc: pc.input_token_cost + pc.output_cost_cost)
        
        potential_provider_savings = (most_expensive.input_token_cost + most_expensive.output_token_cost) - \
                                   (least_expensive.input_token_cost + least_expensive.output_token_cost)
        
        return {
            "total_cost": total_cost,
            "estimated_savings_target": estimated_savings,
            "potential_provider_savings_per_1k_tokens": potential_provider_savings,
            "optimization_stats": dict(self.optimization_stats),
            "savings_recommendations": self._generate_savings_recommendations()
        }
    
    def _generate_savings_recommendations(self) -> List[str]:
        """Generate cost savings recommendations"""
        
        recommendations = []
        
        # Analyze current usage patterns
        if self.cost_transactions:
            recent_costs = [t.cost for t in list(self.cost_transactions)[-50:]]
            avg_cost = statistics.mean(recent_costs)
            
            # High usage recommendations
            if avg_cost > 0.05:
                recommendations.append("Consider switching to more cost-effective providers for high-cost requests")
                recommendations.append("Implement caching to reduce repeated requests")
            
            # Provider-specific recommendations
            most_used_provider = max(
                set(t.provider for t in self.cost_transactions),
                key=lambda p: sum(1 for t in self.cost_transactions if t.provider == p)
            )
            
            recommendations.append(f"Most used provider: {most_used_provider} - review cost structure")
        
        # Budget-specific recommendations
        for budget_id, status in self.budget_status.items():
            if status.usage_percentage > 0.8:
                recommendations.append(f"Budget {budget_id} is over 80% utilized - monitor closely")
            
            if status.projected_over_budget:
                recommendations.append(f"Budget {budget_id} projected to exceed limit - implement cost controls")
        
        return recommendations
    
    def get_provider_cost_comparison(self) -> Dict[str, Any]:
        """Get cost comparison between providers"""
        
        comparison = {}
        
        for key, provider_cost in self.provider_costs.items():
            avg_cost_per_1k = (provider_cost.input_token_cost + provider_cost.output_token_cost) / 2
            
            comparison[key] = {
                "provider": provider_cost.provider,
                "model": provider_cost.model,
                "avg_cost_per_1k_tokens": avg_cost_per_1k,
                "input_cost_per_1k": provider_cost.input_token_cost,
                "output_cost_per_1k": provider_cost.output_token_cost,
                "cost_efficiency_rank": self._get_cost_efficiency_rank(provider_cost)
            }
        
        # Sort by cost efficiency
        sorted_comparison = dict(sorted(
            comparison.items(),
            key=lambda x: x[1]["avg_cost_per_1k_tokens"]
        ))
        
        return sorted_comparison
    
    def _get_cost_efficiency_rank(self, provider_cost: ProviderCost) -> int:
        """Get cost efficiency rank for provider"""
        
        costs = [(pc.input_token_cost + pc.output_token_cost) / 2 for pc in self.provider_costs.values()]
        sorted_costs = sorted(costs)
        
        current_cost = (provider_cost.input_token_cost + provider_cost.output_token_cost) / 2
        rank = sorted_costs.index(current_cost) + 1
        
        return rank
    
    def set_budget_alert_handler(self, handler: callable):
        """Set custom budget alert handler"""
        self.alert_handler = handler
    
    async def simulate_cost_scenario(
        self,
        provider: str,
        model: str,
        estimated_requests_per_day: int,
        estimated_tokens_per_request: int,
        duration_days: int = 30
    ) -> Dict[str, Any]:
        """Simulate cost scenario for planning"""
        
        # Calculate daily costs
        daily_input_tokens = estimated_requests_per_day * estimated_tokens_per_request * 0.6  # 60% input
        daily_output_tokens = estimated_requests_per_day * estimated_tokens_per_request * 0.4  # 40% output
        
        daily_cost = self._calculate_cost(provider, model, daily_input_tokens, daily_output_tokens)
        
        # Calculate total costs
        total_cost = daily_cost * duration_days
        total_input_tokens = daily_input_tokens * duration_days
        total_output_tokens = daily_output_tokens * duration_days
        
        return {
            "provider": provider,
            "model": model,
            "duration_days": duration_days,
            "estimated_requests_per_day": estimated_requests_per_day,
            "estimated_tokens_per_request": estimated_tokens_per_request,
            "daily_cost": daily_cost,
            "total_cost": total_cost,
            "total_input_tokens": total_input_tokens,
            "total_output_tokens": total_output_tokens,
            "cost_efficiency": estimated_requests_per_day / max(daily_cost, 0.01)
        }

# Global cost manager instance
_global_cost_manager: Optional[CostManager] = None

def get_cost_manager(config: Optional[CostOptimizationConfig] = None) -> CostManager:
    """Get global cost manager instance"""
    global _global_cost_manager
    
    if _global_cost_manager is None:
        if config is None:
            config = CostOptimizationConfig()
        _global_cost_manager = CostManager(config)
    
    return _global_cost_manager

def initialize_cost_manager(config: CostOptimizationConfig) -> CostManager:
    """Initialize global cost manager"""
    global _global_cost_manager
    _global_cost_manager = CostManager(config)
    return _global_cost_manager