"""
Response Quality Filtering and Ranking System

This module provides advanced response quality assessment, filtering, and ranking
capabilities to ensure only high-quality questions are delivered to users.
"""

import asyncio
import logging
import json
import time
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import statistics
import re
import hashlib
import heapq
from collections import defaultdict, deque
import math

logger = logging.getLogger(__name__)

class QualityThreshold(Enum):
    """Quality threshold levels"""
    EXCELLENT = 0.9
    GOOD = 0.8
    ACCEPTABLE = 0.7
    MINIMUM = 0.6
    POOR = 0.5

class FilteringStrategy(Enum):
    """Response filtering strategies"""
    THRESHOLD_BASED = "threshold_based"
    PERCENTILE_BASED = "percentile_based"
    ADAPTIVE = "adaptive"
    CONFIDENCE_BASED = "confidence_based"
    MULTI_CRITERIA = "multi_criteria"

class RankingMethod(Enum):
    """Response ranking methods"""
    WEIGHTED_SCORE = "weighted_score"
    BAYESIAN = "bayesian"
    MACHINE_LEARNING = "machine_learning"
    RULE_BASED = "rule_based"
    HYBRID = "hybrid"

@dataclass
class QualityMetrics:
    """Comprehensive quality metrics"""
    clarity: float = 0.0
    accuracy: float = 0.0
    relevance: float = 0.0
    educational_value: float = 0.0
    structural_integrity: float = 0.0
    bias_fairness: float = 0.0
    accessibility: float = 0.0
    creativity: float = 0.0
    difficulty_appropriateness: float = 0.0
    originality: float = 0.0
    
    def get_overall_score(self, weights: Optional[Dict[str, float]] = None) -> float:
        """Calculate overall quality score"""
        if weights is None:
            weights = {
                "clarity": 0.2,
                "accuracy": 0.2,
                "relevance": 0.15,
                "educational_value": 0.15,
                "structural_integrity": 0.1,
                "bias_fairness": 0.08,
                "accessibility": 0.07,
                "creativity": 0.03,
                "difficulty_appropriateness": 0.01,
                "originality": 0.01
            }
        
        total_score = 0.0
        for metric, weight in weights.items():
            value = getattr(self, metric, 0.0)
            total_score += value * weight
        
        return total_score

@dataclass
class ResponseMetadata:
    """Metadata for generated responses"""
    response_id: str
    timestamp: datetime
    provider: str
    model: str
    generation_time: float
    token_count: int
    cost: float
    confidence_score: float
    quality_metrics: QualityMetrics
    filtering_history: List[str] = field(default_factory=list)
    ranking_position: Optional[int] = None
    user_feedback: Optional[Dict[str, Any]] = None

@dataclass
class FilterCriteria:
    """Criteria for response filtering"""
    min_quality_score: float = QualityThreshold.ACCEPTABLE.value
    min_confidence: float = 0.6
    max_processing_time: float = 30.0
    max_cost: float = 0.1
    required_fields: List[str] = field(default_factory=lambda: ["question", "correct_answer"])
    forbidden_patterns: List[str] = field(default_factory=lambda: ["\\?", "!!", "answer:", "solution:"])
    content_types: Optional[List[str]] = None
    difficulty_range: Optional[Tuple[str, str]] = None
    educational_level: Optional[str] = None

@dataclass
class RankingConfig:
    """Configuration for response ranking"""
    method: RankingMethod = RankingMethod.WEIGHTED_SCORE
    quality_weights: Dict[str, float] = field(default_factory=dict)
    performance_bonus: float = 0.1
    cost_penalty: float = 0.05
    confidence_bonus: float = 0.1
    novelty_bonus: float = 0.05
    recency_bonus: float = 0.02
    user_feedback_weight: float = 0.2
    enable_diversity: bool = True
    diversity_weight: float = 0.1

class ResponseFilter:
    """Advanced response filtering system"""
    
    def __init__(self, criteria: FilterCriteria, strategy: FilteringStrategy = FilteringStrategy.MULTI_CRITERIA):
        self.criteria = criteria
        self.strategy = strategy
        self.filtering_stats = defaultdict(int)
        self.adaptive_thresholds = defaultdict(float)
        self.performance_history = deque(maxlen=1000)
        
    async def filter_responses(
        self, 
        responses: List[Dict[str, Any]], 
        context: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[Dict[str, Any]], List[ResponseMetadata]]:
        """Filter responses based on quality criteria"""
        
        filtered_responses = []
        metadata_list = []
        
        for response in responses:
            # Create metadata
            metadata = self._create_metadata(response)
            
            # Apply filtering
            if await self._passes_filter(response, metadata, context):
                filtered_responses.append(response)
                metadata_list.append(metadata)
                self.filtering_stats["passed"] += 1
            else:
                metadata.filtering_history.append("filtered_out")
                self.filtering_stats["failed"] += 1
        
        # Update adaptive thresholds
        if self.strategy == FilteringStrategy.ADAPTIVE:
            self._update_adaptive_thresholds(filtered_responses, metadata_list)
        
        logger.info(f"Filtered responses: {len(filtered_responses)}/{len(responses)} passed")
        return filtered_responses, metadata_list
    
    def _create_metadata(self, response: Dict[str, Any]) -> ResponseMetadata:
        """Create metadata for response"""
        
        # Generate response ID
        response_hash = hashlib.md5(
            json.dumps(response, sort_keys=True).encode()
        ).hexdigest()[:16]
        
        # Extract or estimate quality metrics
        quality_metrics = self._extract_quality_metrics(response)
        
        return ResponseMetadata(
            response_id=f"resp_{response_hash}",
            timestamp=datetime.now(),
            provider=response.get("provider", "unknown"),
            model=response.get("model", "unknown"),
            generation_time=response.get("generation_time", 0.0),
            token_count=response.get("token_count", 0),
            cost=response.get("cost", 0.0),
            confidence_score=response.get("confidence", 0.5),
            quality_metrics=quality_metrics
        )
    
    def _extract_quality_metrics(self, response: Dict[str, Any]) -> QualityMetrics:
        """Extract quality metrics from response"""
        
        metrics = QualityMetrics()
        
        # Extract individual metrics if available
        if "quality_metrics" in response:
            quality_data = response["quality_metrics"]
            for metric_name in metrics.__dataclass_fields__.keys():
                if metric_name in quality_data:
                    setattr(metrics, metric_name, float(quality_data[metric_name]))
        
        # Calculate missing metrics
        if metrics.clarity == 0.0:
            metrics.clarity = self._calculate_clarity(response)
        
        if metrics.accuracy == 0.0:
            metrics.accuracy = self._calculate_accuracy(response)
        
        if metrics.relevance == 0.0:
            metrics.relevance = self._calculate_relevance(response)
        
        if metrics.educational_value == 0.0:
            metrics.educational_value = self._calculate_educational_value(response)
        
        if metrics.structural_integrity == 0.0:
            metrics.structural_integrity = self._calculate_structural_integrity(response)
        
        if metrics.bias_fairness == 0.0:
            metrics.bias_fairness = self._calculate_bias_fairness(response)
        
        if metrics.accessibility == 0.0:
            metrics.accessibility = self._calculate_accessibility(response)
        
        return metrics
    
    def _calculate_clarity(self, response: Dict[str, Any]) -> float:
        """Calculate clarity score"""
        
        if "question" not in response:
            return 0.0
        
        question_text = response["question"]
        clarity_score = 1.0
        
        # Check question length
        length = len(question_text)
        if length < 20 or length > 500:
            clarity_score *= 0.8
        
        # Check for ambiguous language
        ambiguous_patterns = [
            r"some", r"many", r"few", r"several", r"probably", r"maybe",
            r"might", r"could", r"perhaps", r"sort of", r"kind of"
        ]
        
        for pattern in ambiguous_patterns:
            if re.search(pattern, question_text.lower()):
                clarity_score *= 0.9
        
        # Check sentence structure
        sentences = re.split(r'[.!?]+', question_text)
        if len(sentences) > 3:
            clarity_score *= 0.95
        
        return max(0.0, clarity_score)
    
    def _calculate_accuracy(self, response: Dict[str, Any]) -> float:
        """Calculate accuracy score"""
        
        accuracy_score = 1.0
        
        # Check if question has answer
        if "correct_answer" not in response:
            accuracy_score *= 0.5
        
        # Check for speculative language in definitive questions
        if "question" in response:
            question_text = response["question"].lower()
            speculative_words = ["maybe", "perhaps", "might", "could", "possibly"]
            
            has_speculative = any(word in question_text for word in speculative_words)
            is_definitive = any(word in question_text for word in ["what is", "which is", "who is"])
            
            if has_speculative and is_definitive:
                accuracy_score *= 0.7
        
        return accuracy_score
    
    def _calculate_relevance(self, response: Dict[str, Any]) -> float:
        """Calculate relevance score"""
        
        relevance_score = 1.0
        
        # Check if question is educational
        if "question" in response:
            question_text = response["question"].lower()
            educational_keywords = [
                "explain", "describe", "analyze", "compare", "contrast",
                "evaluate", "why", "how", "what", "which", "when", "where"
            ]
            
            keyword_matches = sum(1 for keyword in educational_keywords if keyword in question_text)
            if keyword_matches == 0:
                relevance_score *= 0.6
        
        return relevance_score
    
    def _calculate_educational_value(self, response: Dict[str, Any]) -> float:
        """Calculate educational value score"""
        
        educational_score = 1.0
        
        # Check for higher-order thinking
        if "question" in response:
            question_text = response["question"].lower()
            
            bloom_keywords = {
                "remember": ["define", "list", "identify", "recall"],
                "understand": ["explain", "describe", "summarize", "interpret"],
                "apply": ["apply", "use", "implement", "demonstrate"],
                "analyze": ["analyze", "compare", "contrast", "examine"],
                "evaluate": ["evaluate", "assess", "judge", "critique"],
                "create": ["create", "design", "develop", "produce"]
            }
            
            max_level = 0
            for level, keywords in bloom_keywords.items():
                if any(keyword in question_text for keyword in keywords):
                    max_level = max(max_level, list(bloom_keywords.keys()).index(level) + 1)
            
            # Higher levels get higher scores
            educational_score = max_level / 6.0
        
        return educational_score
    
    def _calculate_structural_integrity(self, response: Dict[str, Any]) -> float:
        """Calculate structural integrity score"""
        
        structural_score = 1.0
        
        # Check required fields
        required_fields = self.criteria.required_fields
        missing_fields = [field for field in required_fields if field not in response]
        
        if missing_fields:
            structural_score *= (1.0 - len(missing_fields) / len(required_fields))
        
        # Check question type specific structure
        question_type = response.get("type", "unknown")
        
        if question_type == "multiple-choice" and "options" in response:
            options = response["options"]
            if not isinstance(options, list) or len(options) < 3:
                structural_score *= 0.7
        
        return structural_score
    
    def _calculate_bias_fairness(self, response: Dict[str, Any]) -> float:
        """Calculate bias and fairness score"""
        
        bias_score = 1.0
        
        if "question" in response:
            question_text = response["question"].lower()
            
            # Check for biased language
            bias_patterns = [
                r"\bhe\b", r"\bshe\b", r"\bhis\b", r"\bher\b",
                r"\bman\b", r"\bwoman\b", r"\bboys\b", r"\bgirls\b"
            ]
            
            for pattern in bias_patterns:
                if re.search(pattern, question_text):
                    bias_score *= 0.9
        
        return bias_score
    
    def _calculate_accessibility(self, response: Dict[str, Any]) -> float:
        """Calculate accessibility score"""
        
        accessibility_score = 1.0
        
        if "question" in response:
            question_text = response["question"]
            
            # Check sentence length
            sentences = re.split(r'[.!?]+', question_text)
            if sentences:
                avg_length = statistics.mean(len(s.split()) for s in sentences if s.strip())
                if avg_length > 25:
                    accessibility_score *= 0.9
            
            # Check vocabulary complexity
            words = question_text.split()
            complex_words = [w for w in words if len(w) > 12]
            if len(complex_words) / len(words) > 0.1:
                accessibility_score *= 0.9
        
        return accessibility_score
    
    async def _passes_filter(
        self, 
        response: Dict[str, Any], 
        metadata: ResponseMetadata, 
        context: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Check if response passes filtering criteria"""
        
        # Check quality threshold
        overall_score = metadata.quality_metrics.get_overall_score()
        if overall_score < self.criteria.min_quality_score:
            metadata.filtering_history.append(f"quality_score_too_low: {overall_score:.2f}")
            return False
        
        # Check confidence threshold
        if metadata.confidence_score < self.criteria.min_confidence:
            metadata.filtering_history.append(f"confidence_too_low: {metadata.confidence_score:.2f}")
            return False
        
        # Check processing time
        if metadata.generation_time > self.criteria.max_processing_time:
            metadata.filtering_history.append(f"processing_time_too_long: {metadata.generation_time:.2f}s")
            return False
        
        # Check cost
        if metadata.cost > self.criteria.max_cost:
            metadata.filtering_history.append(f"cost_too_high: ${metadata.cost:.4f}")
            return False
        
        # Check required fields
        for field in self.criteria.required_fields:
            if field not in response:
                metadata.filtering_history.append(f"missing_required_field: {field}")
                return False
        
        # Check forbidden patterns
        if "question" in response:
            question_text = response["question"].lower()
            for pattern in self.criteria.forbidden_patterns:
                if re.search(pattern, question_text):
                    metadata.filtering_history.append(f"forbidden_pattern: {pattern}")
                    return False
        
        # Check content types
        if self.criteria.content_types:
            content_type = response.get("content_type", "unknown")
            if content_type not in self.criteria.content_types:
                metadata.filtering_history.append(f"content_type_not_allowed: {content_type}")
                return False
        
        # Check difficulty range
        if self.criteria.difficulty_range:
            difficulty = response.get("difficulty", "intermediate")
            min_diff, max_diff = self.criteria.difficulty_range
            difficulty_levels = ["beginner", "intermediate", "advanced", "expert"]
            
            try:
                diff_index = difficulty_levels.index(difficulty)
                min_index = difficulty_levels.index(min_diff)
                max_index = difficulty_levels.index(max_diff)
                
                if not (min_index <= diff_index <= max_index):
                    metadata.filtering_history.append(f"difficulty_out_of_range: {difficulty}")
                    return False
            except ValueError:
                metadata.filtering_history.append(f"invalid_difficulty: {difficulty}")
                return False
        
        return True
    
    def _update_adaptive_thresholds(
        self, 
        filtered_responses: List[Dict[str, Any]], 
        metadata_list: List[ResponseMetadata]
    ):
        """Update adaptive thresholds based on filtering results"""
        
        if not metadata_list:
            return
        
        # Calculate current quality distribution
        quality_scores = [m.quality_metrics.get_overall_score() for m in metadata_list]
        
        if len(quality_scores) >= 10:
            # Adjust threshold based on 25th percentile
            percentile_25 = sorted(quality_scores)[len(quality_scores) // 4]
            
            # Gradually adjust threshold
            current_threshold = self.criteria.min_quality_score
            adjustment = (percentile_25 - current_threshold) * 0.1
            
            self.criteria.min_quality_score = max(
                QualityThreshold.MINIMUM.value,
                min(QualityThreshold.EXCELLENT.value, current_threshold + adjustment)
            )
    
    def get_filtering_stats(self) -> Dict[str, Any]:
        """Get filtering statistics"""
        total = self.filtering_stats["passed"] + self.filtering_stats["failed"]
        
        return {
            "total_processed": total,
            "passed": self.filtering_stats["passed"],
            "failed": self.filtering_stats["failed"],
            "pass_rate": self.filtering_stats["passed"] / total if total > 0 else 0.0,
            "current_threshold": self.criteria.min_quality_score,
            "adaptive_thresholds": dict(self.adaptive_thresholds)
        }

class ResponseRanker:
    """Advanced response ranking system"""
    
    def __init__(self, config: RankingConfig):
        self.config = config
        self.ranking_history = deque(maxlen=1000)
        self.diversity_index = defaultdict(float)
        
    async def rank_responses(
        self, 
        responses: List[Dict[str, Any]], 
        metadata_list: List[ResponseMetadata],
        context: Optional[Dict[str, Any]] = None
    ) -> List[Tuple[Dict[str, Any], float, int]]:
        """Rank responses by quality and relevance"""
        
        if not responses:
            return []
        
        # Calculate scores for each response
        scored_responses = []
        
        for i, (response, metadata) in enumerate(zip(responses, metadata_list)):
            score = await self._calculate_response_score(response, metadata, context, i)
            scored_responses.append((response, score, i))
        
        # Apply ranking method
        if self.config.method == RankingMethod.WEIGHTED_SCORE:
            ranked_responses = self._rank_by_weighted_score(scored_responses)
        elif self.config.method == RankingMethod.BAYESIAN:
            ranked_responses = await self._rank_by_bayesian(scored_responses, context)
        elif self.config.method == RankingMethod.MACHINE_LEARNING:
            ranked_responses = await self._rank_by_machine_learning(scored_responses, context)
        else:
            ranked_responses = self._rank_by_weighted_score(scored_responses)
        
        # Apply diversity if enabled
        if self.config.enable_diversity:
            ranked_responses = self._apply_diversity(ranked_responses)
        
        # Update ranking positions in metadata
        for rank, (response, score, original_index) in enumerate(ranked_responses):
            metadata_list[original_index].ranking_position = rank + 1
        
        # Record ranking history
        self.ranking_history.append({
            "timestamp": datetime.now(),
            "num_responses": len(responses),
            "ranking_method": self.config.method.value,
            "top_score": ranked_responses[0][1] if ranked_responses else 0.0
        })
        
        return ranked_responses
    
    async def _calculate_response_score(
        self, 
        response: Dict[str, Any], 
        metadata: ResponseMetadata, 
        context: Optional[Dict[str, Any]] = None,
        index: int = 0
    ) -> float:
        """Calculate comprehensive score for response"""
        
        base_score = metadata.quality_metrics.get_overall_score(self.config.quality_weights)
        
        # Apply bonuses and penalties
        score = base_score
        
        # Performance bonus
        if metadata.generation_time < 5.0:  # Fast response
            score += self.config.performance_bonus
        
        # Cost penalty
        if metadata.cost > 0.05:  # Expensive response
            score -= self.config.cost_penalty
        
        # Confidence bonus
        if metadata.confidence_score > 0.8:
            score += self.config.confidence_bonus
        
        # Novelty bonus (simplified)
        if metadata.quality_metrics.originality > 0.8:
            score += self.config.novelty_bonus
        
        # Recency bonus
        if (datetime.now() - metadata.timestamp).total_seconds() < 300:  # Recent
            score += self.config.recency_bonus
        
        # User feedback bonus
        if metadata.user_feedback:
            feedback_score = metadata.user_feedback.get("rating", 0.0)
            score += feedback_score * self.config.user_feedback_weight
        
        return max(0.0, min(1.0, score))
    
    def _rank_by_weighted_score(
        self, 
        scored_responses: List[Tuple[Dict[str, Any], float, int]]
    ) -> List[Tuple[Dict[str, Any], float, int]]:
        """Rank responses by weighted score"""
        
        # Sort by score descending
        ranked = sorted(scored_responses, key=lambda x: x[1], reverse=True)
        return ranked
    
    async def _rank_by_bayesian(
        self, 
        scored_responses: List[Tuple[Dict[str, Any], float, int]],
        context: Optional[Dict[str, Any]] = None
    ) -> List[Tuple[Dict[str, Any], float, int]]:
        """Rank responses using Bayesian approach"""
        
        # Simplified Bayesian ranking
        # In practice, this would use historical data and probabilistic models
        
        ranked_responses = []
        
        for response, base_score, index in scored_responses:
            # Apply Bayesian adjustment based on historical performance
            provider = response.get("provider", "unknown")
            model = response.get("model", "unknown")
            
            # Get historical performance for this provider/model
            historical_score = self._get_historical_performance(provider, model)
            
            # Combine current score with historical belief
            alpha = 0.7  # Weight for current score
            beta = 0.3   # Weight for historical performance
            
            bayesian_score = alpha * base_score + beta * historical_score
            
            ranked_responses.append((response, bayesian_score, index))
        
        # Sort by Bayesian score
        ranked_responses.sort(key=lambda x: x[1], reverse=True)
        return ranked_responses
    
    def _get_historical_performance(self, provider: str, model: str) -> float:
        """Get historical performance score for provider/model"""
        
        # Simplified - in practice, this would query actual historical data
        key = f"{provider}_{model}"
        
        # Return default performance score
        default_scores = {
            "openai_gpt-4": 0.85,
            "anthropic_claude": 0.82,
            "google_gemini": 0.80,
            "cohere_command": 0.78
        }
        
        return default_scores.get(key.lower(), 0.75)
    
    async def _rank_by_machine_learning(
        self, 
        scored_responses: List[Tuple[Dict[str, Any], float, int]],
        context: Optional[Dict[str, Any]] = None
    ) -> List[Tuple[Dict[str, Any], float, int]]:
        """Rank responses using machine learning model"""
        
        # Placeholder for ML-based ranking
        # In practice, this would use a trained model
        
        # For now, fall back to weighted scoring with additional features
        ranked_responses = []
        
        for response, base_score, index in scored_responses:
            # Extract features
            features = self._extract_ranking_features(response)
            
            # Apply ML model (simplified)
            ml_score = base_score * self._apply_ml_model(features)
            
            ranked_responses.append((response, ml_score, index))
        
        ranked_responses.sort(key=lambda x: x[1], reverse=True)
        return ranked_responses
    
    def _extract_ranking_features(self, response: Dict[str, Any]) -> Dict[str, float]:
        """Extract features for ML ranking"""
        
        features = {}
        
        # Basic features
        features["question_length"] = len(response.get("question", ""))
        features["has_options"] = 1.0 if "options" in response else 0.0
        features["has_explanation"] = 1.0 if "explanation" in response else 0.0
        features["difficulty_numeric"] = self._difficulty_to_numeric(response.get("difficulty", "intermediate"))
        
        # Quality features
        if "quality_metrics" in response:
            metrics = response["quality_metrics"]
            for key, value in metrics.items():
                features[f"quality_{key}"] = float(value)
        
        return features
    
    def _difficulty_to_numeric(self, difficulty: str) -> float:
        """Convert difficulty to numeric value"""
        difficulty_map = {
            "beginner": 0.25,
            "elementary": 0.5,
            "intermediate": 0.75,
            "advanced": 1.0,
            "expert": 1.25
        }
        return difficulty_map.get(difficulty.lower(), 0.75)
    
    def _apply_ml_model(self, features: Dict[str, float]) -> float:
        """Apply ML model to features (simplified)"""
        
        # Simplified linear model
        # In practice, this would use a trained ML model
        
        weights = {
            "question_length": 0.1,
            "has_options": 0.2,
            "has_explanation": 0.15,
            "difficulty_numeric": 0.05,
            "quality_clarity": 0.15,
            "quality_accuracy": 0.15,
            "quality_relevance": 0.1,
            "quality_educational_value": 0.1
        }
        
        score = 0.0
        for feature, weight in weights.items():
            if feature in features:
                score += features[feature] * weight
        
        return max(0.5, min(1.5, score))  # Normalize
    
    def _apply_diversity(
        self, 
        ranked_responses: List[Tuple[Dict[str, Any], float, int]]
    ) -> List[Tuple[Dict[str, Any], float, int]]:
        """Apply diversity ranking to ensure variety"""
        
        if len(ranked_responses) <= 3:
            return ranked_responses
        
        # Select top responses with diversity
        diverse_responses = []
        used_content_types = set()
        used_difficulties = set()
        
        for response, score, index in ranked_responses:
            content_type = response.get("content_type", "unknown")
            difficulty = response.get("difficulty", "intermediate")
            
            # Check if this adds diversity
            if (content_type not in used_content_types or 
                difficulty not in used_difficulties or
                len(diverse_responses) < 3):
                
                # Apply diversity bonus
                diversity_bonus = 0.0
                if content_type not in used_content_types:
                    diversity_bonus += self.config.diversity_weight
                    used_content_types.add(content_type)
                
                if difficulty not in used_difficulties:
                    diversity_bonus += self.config.diversity_weight * 0.5
                    used_difficulties.add(difficulty)
                
                diverse_responses.append((response, score + diversity_bonus, index))
        
        return diverse_responses
    
    def get_ranking_stats(self) -> Dict[str, Any]:
        """Get ranking statistics"""
        
        if not self.ranking_history:
            return {"message": "No ranking history available"}
        
        recent_rankings = list(self.ranking_history)[-50:]
        
        return {
            "total_rankings": len(self.ranking_history),
            "recent_rankings": len(recent_rankings),
            "ranking_method": self.config.method.value,
            "avg_top_score": statistics.mean([r["top_score"] for r in recent_rankings]),
            "avg_response_count": statistics.mean([r["num_responses"] for r in recent_rankings]),
            "diversity_enabled": self.config.enable_diversity
        }

class QualityManager:
    """Main quality management system combining filtering and ranking"""
    
    def __init__(
        self, 
        filter_criteria: FilterCriteria,
        ranking_config: RankingConfig,
        filtering_strategy: FilteringStrategy = FilteringStrategy.MULTI_CRITERIA
    ):
        self.filter = ResponseFilter(filter_criteria, filtering_strategy)
        self.ranker = ResponseRanker(ranking_config)
        self.overall_stats = defaultdict(int)
    
    async def process_responses(
        self, 
        responses: List[Dict[str, Any]], 
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process responses through filtering and ranking pipeline"""
        
        start_time = time.time()
        
        # Step 1: Filter responses
        filtered_responses, metadata_list = await self.filter.filter_responses(responses, context)
        
        # Step 2: Rank filtered responses
        ranked_responses = await self.ranker.rank_responses(filtered_responses, metadata_list, context)
        
        # Step 3: Prepare results
        processing_time = time.time() - start_time
        
        result = {
            "original_count": len(responses),
            "filtered_count": len(filtered_responses),
            "ranked_responses": ranked_responses,
            "metadata_list": metadata_list,
            "processing_time": processing_time,
            "filtering_stats": self.filter.get_filtering_stats(),
            "ranking_stats": self.ranker.get_ranking_stats()
        }
        
        # Update overall stats
        self.overall_stats["total_processed"] += len(responses)
        self.overall_stats["total_filtered"] += len(filtered_responses)
        self.overall_stats["total_processing_time"] += processing_time
        
        logger.info(f"Quality processing complete: {len(filtered_responses)}/{len(responses)} responses in {processing_time:.2f}s")
        
        return result
    
    async def get_top_responses(
        self, 
        responses: List[Dict[str, Any]], 
        top_n: int = 5,
        context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Get top N responses after quality processing"""
        
        result = await self.process_responses(responses, context)
        
        top_responses = [response for response, score, index in result["ranked_responses"][:top_n]]
        
        return top_responses
    
    def get_overall_stats(self) -> Dict[str, Any]:
        """Get overall quality management statistics"""
        
        total_processed = self.overall_stats.get("total_processed", 0)
        
        return {
            "total_processed": total_processed,
            "total_filtered": self.overall_stats.get("total_filtered", 0),
            "filter_rate": 1.0 - (self.overall_stats.get("total_filtered", 0) / max(total_processed, 1)),
            "avg_processing_time": self.overall_stats.get("total_processing_time", 0) / max(total_processed, 1),
            "filtering_strategy": self.filter.strategy.value,
            "ranking_method": self.ranker.config.method.value
        }

# Global quality manager instance
_global_quality_manager: Optional[QualityManager] = None

def get_quality_manager(
    filter_criteria: Optional[FilterCriteria] = None,
    ranking_config: Optional[RankingConfig] = None,
    filtering_strategy: Optional[FilteringStrategy] = None
) -> QualityManager:
    """Get global quality manager instance"""
    global _global_quality_manager
    
    if _global_quality_manager is None:
        if filter_criteria is None:
            filter_criteria = FilterCriteria()
        if ranking_config is None:
            ranking_config = RankingConfig()
        if filtering_strategy is None:
            filtering_strategy = FilteringStrategy.MULTI_CRITERIA
        
        _global_quality_manager = QualityManager(filter_criteria, ranking_config, filtering_strategy)
    
    return _global_quality_manager

def initialize_quality_manager(
    filter_criteria: FilterCriteria,
    ranking_config: RankingConfig,
    filtering_strategy: FilteringStrategy = FilteringStrategy.MULTI_CRITERIA
) -> QualityManager:
    """Initialize global quality manager"""
    global _global_quality_manager
    _global_quality_manager = QualityManager(filter_criteria, ranking_config, filtering_strategy)
    return _global_quality_manager