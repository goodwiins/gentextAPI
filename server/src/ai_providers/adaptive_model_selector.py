"""
Adaptive Model Selection System

This module provides intelligent model selection based on content type,
performance characteristics, and contextual requirements to optimize
AI provider usage for different types of educational content.
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
import random
from collections import defaultdict, deque
import threading
import hashlib

logger = logging.getLogger(__name__)

class ContentType(Enum):
    """Types of educational content"""
    FACTUAL = "factual"                    # Facts, definitions, basic concepts
    CONCEPTUAL = "conceptual"              # Concepts, theories, principles
    PROCEDURAL = "procedural"              # Procedures, methods, processes
    ANALYTICAL = "analytical"              # Analysis, comparison, evaluation
    CREATIVE = "creative"                  # Creative writing, brainstorming
    MATHEMATICAL = "mathematical"          # Math problems, calculations
    SCIENTIFIC = "scientific"              # Scientific concepts, experiments
    HISTORICAL = "historical"              # Historical events, timelines
    LITERARY = "literary"                  # Literature, texts, analysis
    TECHNICAL = "technical"                # Technical documentation, code
    LANGUAGE = "language"                  # Language learning, grammar

class DifficultyLevel(Enum):
    """Difficulty levels for content"""
    BEGINNER = "beginner"
    ELEMENTARY = "elementary"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class CognitiveLevel(Enum):
    """Bloom's taxonomy cognitive levels"""
    REMEMBER = "remember"
    UNDERSTAND = "understand"
    APPLY = "apply"
    ANALYZE = "analyze"
    EVALUATE = "evaluate"
    CREATE = "create"

class SelectionStrategy(Enum):
    """Model selection strategies"""
    PERFORMANCE_BASED = "performance_based"
    COST_OPTIMIZED = "cost_optimized"
    QUALITY_FIRST = "quality_first"
    BALANCED = "balanced"
    ADAPTIVE = "adaptive"
    CONTEXT_AWARE = "context_aware"

@dataclass
class ContentFeatures:
    """Extracted features from content"""
    content_type: ContentType
    difficulty_level: DifficultyLevel
    cognitive_level: CognitiveLevel
    
    # Content characteristics
    length: int
    complexity_score: float
    vocabulary_level: float
    structure_score: float
    
    # Domain-specific features
    domain: str
    subject_area: str
    key_concepts: List[str]
    
    # Requirements
    requires_reasoning: bool
    requires_creativity: bool
    requires_precision: bool
    time_sensitive: bool
    
    # Estimated parameters
    estimated_tokens: int
    expected_complexity: str

@dataclass
class ModelCapability:
    """Model capability profile"""
    provider: str
    model: str
    
    # Content type proficiency
    content_type_scores: Dict[ContentType, float]  # 0.0 - 1.0
    difficulty_range: Tuple[DifficultyLevel, DifficultyLevel]
    cognitive_level_scores: Dict[CognitiveLevel, float]  # 0.0 - 1.0
    
    # Performance characteristics
    avg_response_time: float
    avg_quality_score: float
    avg_cost_per_token: float
    reliability_score: float
    
    # Specializations
    strengths: List[str]
    weaknesses: List[str]
    optimal_use_cases: List[str]
    
    # Constraints
    max_context_length: int
    supports_streaming: bool
    supports_batching: bool
    
    # Performance tracking
    usage_count: int = 0
    success_rate: float = 1.0
    last_updated: datetime = field(default_factory=datetime.now)

@dataclass
class SelectionCriteria:
    """Criteria for model selection"""
    
    # Performance requirements
    min_quality_score: float = 0.7
    max_response_time: float = 10.0
    max_cost: float = 0.05
    
    # Content requirements
    preferred_content_types: List[ContentType] = field(default_factory=list)
    required_difficulty_range: Optional[Tuple[DifficultyLevel, DifficultyLevel]] = None
    required_cognitive_levels: List[CognitiveLevel] = field(default_factory=list)
    
    # System requirements
    enable_fallback: bool = True
    enable_load_balancing: bool = True
    consider_cost: bool = True
    prioritize_quality: bool = True
    
    # Learning preferences
    enable_learning: bool = True
    adaptation_rate: float = 0.1  # How quickly to adapt to new data

@dataclass
class SelectionResult:
    """Model selection result"""
    selected_model: str
    selected_provider: str
    confidence_score: float
    reasoning: List[str]
    alternatives: List[Dict[str, Any]]
    estimated_cost: float
    estimated_time: float
    expected_quality: float
    
    # Learning data
    learning_opportunity: bool = False
    feedback_data: Optional[Dict[str, Any]] = None

class AdaptiveModelSelector:
    """Intelligent adaptive model selection system"""
    
    def __init__(self, criteria: SelectionCriteria):
        self.criteria = criteria
        self.model_capabilities: Dict[str, ModelCapability] = {}
        self.selection_history: deque = deque(maxlen=10000)
        self.performance_feedback: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.content_patterns: Dict[str, Dict[str, Any]] = {}
        self.learning_weights: Dict[str, float] = defaultdict(float)
        
        # Selection state
        self.lock = threading.RLock()
        
        # Initialize model capabilities
        self._initialize_model_capabilities()
        
        # Start background learning
        if criteria.enable_learning:
            self._start_background_learning()
    
    def _initialize_model_capabilities(self):
        """Initialize capability profiles for all models"""
        
        # OpenAI GPT-4
        self.model_capabilities["openai_gpt-4"] = ModelCapability(
            provider="openai",
            model="gpt-4",
            content_type_scores={
                ContentType.ANALYTICAL: 0.95,
                ContentType.CONCEPTUAL: 0.90,
                ContentType.CREATIVE: 0.85,
                ContentType.SCIENTIFIC: 0.90,
                ContentType.TECHNICAL: 0.88,
                ContentType.FACTUAL: 0.85,
                ContentType.PROCEDURAL: 0.80,
                ContentType.LITERARY: 0.82,
                ContentType.MATHEMATICAL: 0.78,
                ContentType.HISTORICAL: 0.85,
                ContentType.LANGUAGE: 0.80
            },
            difficulty_range=(DifficultyLevel.INTERMEDIATE, DifficultyLevel.EXPERT),
            cognitive_level_scores={
                CognitiveLevel.ANALYZE: 0.95,
                CognitiveLevel.EVALUATE: 0.90,
                CognitiveLevel.CREATE: 0.85,
                CognitiveLevel.APPLY: 0.85,
                CognitiveLevel.UNDERSTAND: 0.90,
                CognitiveLevel.REMEMBER: 0.80
            },
            avg_response_time=3.5,
            avg_quality_score=0.88,
            avg_cost_per_token=0.000045,  # ~$0.045 per 1K tokens
            reliability_score=0.95,
            strengths=["Complex reasoning", "Analysis", "Creative tasks", "High-quality output"],
            weaknesses=["Higher cost", "Slower response"],
            optimal_use_cases=["Complex questions", "Creative tasks", "High-stakes assessments"],
            max_context_length=8192,
            supports_streaming=True,
            supports_batching=True
        )
        
        # Anthropic Claude
        self.model_capabilities["anthropic_claude"] = ModelCapability(
            provider="anthropic",
            model="claude-3-opus",
            content_type_scores={
                ContentType.CONCEPTUAL: 0.95,
                ContentType.ANALYTICAL: 0.90,
                ContentType.SCIENTIFIC: 0.92,
                ContentType.LITERARY: 0.88,
                ContentType.FACTUAL: 0.85,
                ContentType.CREATIVE: 0.90,
                ContentType.PROCEDURAL: 0.82,
                ContentType.TECHNICAL: 0.85,
                ContentType.HISTORICAL: 0.87,
                ContentType.MATHEMATICAL: 0.75,
                ContentType.LANGUAGE: 0.85
            },
            difficulty_range=(DifficultyLevel.INTERMEDIATE, DifficultyLevel.EXPERT),
            cognitive_level_scores={
                CognitiveLevel.ANALYZE: 0.95,
                CognitiveLevel.EVALUATE: 0.92,
                CognitiveLevel.CREATE: 0.90,
                CognitiveLevel.UNDERSTAND: 0.95,
                CognitiveLevel.APPLY: 0.85,
                CognitiveLevel.REMEMBER: 0.85
            },
            avg_response_time=2.8,
            avg_quality_score=0.90,
            avg_cost_per_token=0.000015,  # ~$0.015 per 1K input tokens
            reliability_score=0.93,
            strengths=["Nuanced understanding", "Conceptual analysis", "Long-context reasoning"],
            weaknesses=["Cost varies significantly", "Less optimal for simple tasks"],
            optimal_use_cases=["Conceptual questions", "Long-form analysis", "Educational content"],
            max_context_length=200000,
            supports_streaming=True,
            supports_batching=True
        )
        
        # Google Gemini
        self.model_capabilities["google_gemini"] = ModelCapability(
            provider="google",
            model="gemini-pro",
            content_type_scores={
                ContentType.FACTUAL: 0.90,
                ContentType.CONCEPTUAL: 0.85,
                ContentType.SCIENTIFIC: 0.88,
                ContentType.TECHNICAL: 0.85,
                ContentType.MATHEMATICAL: 0.82,
                ContentType.PROCEDURAL: 0.80,
                ContentType.ANALYTICAL: 0.82,
                ContentType.CREATIVE: 0.78,
                ContentType.LITERARY: 0.75,
                ContentType.HISTORICAL: 0.85,
                ContentType.LANGUAGE: 0.80
            },
            difficulty_range=(DifficultyLevel.BEGINNER, DifficultyLevel.ADVANCED),
            cognitive_level_scores={
                CognitiveLevel.UNDERSTAND: 0.90,
                CognitiveLevel.APPLY: 0.85,
                CognitiveLevel.ANALYZE: 0.80,
                CognitiveLevel.REMEMBER: 0.95,
                CognitiveLevel.EVALUATE: 0.75,
                CognitiveLevel.CREATE: 0.70
            },
            avg_response_time=1.5,
            avg_quality_score=0.82,
            avg_cost_per_token=0.000001,  # ~$0.001 per 1K tokens
            reliability_score=0.90,
            strengths=["Fast response", "Cost-effective", "Good for factual content"],
            weaknesses=["Less creative", "Lower quality for complex tasks"],
            optimal_use_cases=["Factual questions", "Simple explanations", "Cost-sensitive applications"],
            max_context_length=32768,
            supports_streaming=True,
            supports_batching=True
        )
        
        # Cohere Command
        self.model_capabilities["cohere_command"] = ModelCapability(
            provider="cohere",
            model="command",
            content_type_scores={
                ContentType.FACTUAL: 0.88,
                ContentType.CONCEPTUAL: 0.82,
                ContentType.PROCEDURAL: 0.85,
                ContentType.TECHNICAL: 0.80,
                ContentType.ANALYTICAL: 0.78,
                ContentType.LANGUAGE: 0.85,
                ContentType.SCIENTIFIC: 0.80,
                ContentType.CREATIVE: 0.75,
                ContentType.LITERARY: 0.72,
                ContentType.MATHEMATICAL: 0.70,
                ContentType.HISTORICAL: 0.80
            },
            difficulty_range=(DifficultyLevel.BEGINNER, DifficultyLevel.ADVANCED),
            cognitive_level_scores={
                CognitiveLevel.UNDERSTAND: 0.88,
                CognitiveLevel.APPLY: 0.85,
                CognitiveLevel.REMEMBER: 0.90,
                CognitiveLevel.ANALYZE: 0.75,
                CognitiveLevel.EVALUATE: 0.70,
                CognitiveLevel.CREATE: 0.65
            },
            avg_response_time=1.2,
            avg_quality_score=0.80,
            avg_cost_per_token=0.000001,  # ~$0.001 per 1K tokens
            reliability_score=0.88,
            strengths=["Very fast", "Cost-effective", "Good for straightforward tasks"],
            weaknesses=["Limited creative ability", "Lower quality for complex reasoning"],
            optimal_use_cases=["Simple questions", "Quick generation", "High-volume applications"],
            max_context_length=4000,
            supports_streaming=True,
            supports_batching=True
        )
        
        logger.info(f"Initialized {len(self.model_capabilities)} model capability profiles")
    
    def _start_background_learning(self):
        """Start background learning processes"""
        asyncio.create_task(self._periodic_learning_update())
        asyncio.create_task(self._pattern_discovery())
    
    async def analyze_content(
        self, 
        content: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> ContentFeatures:
        """Analyze content and extract features for model selection"""
        
        # Basic content analysis
        content_lower = content.lower()
        words = content.split()
        
        # Determine content type
        content_type = self._classify_content_type(content_lower, words)
        
        # Determine difficulty level
        difficulty_level = self._assess_difficulty(content, words)
        
        # Determine cognitive level
        cognitive_level = self._determine_cognitive_level(content_lower, context)
        
        # Calculate complexity metrics
        complexity_score = self._calculate_complexity(content, words)
        vocabulary_level = self._assess_vocabulary_level(words)
        structure_score = self._assess_structure(content)
        
        # Extract domain and subject area
        domain = context.get("domain", "general") if context else "general"
        subject_area = context.get("subject_area", "general") if context else "general"
        
        # Extract key concepts
        key_concepts = self._extract_key_concepts(content, words)
        
        # Determine requirements
        requires_reasoning = self._requires_reasoning(content_lower)
        requires_creativity = self._requires_creativity(content_lower)
        requires_precision = self._requires_precision(content_lower, domain)
        time_sensitive = context.get("time_sensitive", False) if context else False
        
        # Estimate tokens
        estimated_tokens = len(content) // 4  # Rough estimate: 4 chars per token
        
        # Expected complexity
        expected_complexity = self._estimate_complexity(
            content_type, difficulty_level, cognitive_level
        )
        
        return ContentFeatures(
            content_type=content_type,
            difficulty_level=difficulty_level,
            cognitive_level=cognitive_level,
            length=len(content),
            complexity_score=complexity_score,
            vocabulary_level=vocabulary_level,
            structure_score=structure_score,
            domain=domain,
            subject_area=subject_area,
            key_concepts=key_concepts,
            requires_reasoning=requires_reasoning,
            requires_creativity=requires_creativity,
            requires_precision=requires_precision,
            time_sensitive=time_sensitive,
            estimated_tokens=estimated_tokens,
            expected_complexity=expected_complexity
        )
    
    def _classify_content_type(self, content: str, words: List[str]) -> ContentType:
        """Classify content type based on text analysis"""
        
        type_keywords = {
            ContentType.FACTUAL: ["what is", "define", "who", "when", "where", "fact", "definition"],
            ContentType.CONCEPTUAL: ["concept", "theory", "principle", "understand", "explain", "meaning"],
            ContentType.PROCEDURAL: ["how to", "steps", "process", "procedure", "method", "algorithm"],
            ContentType.ANALYTICAL: ["analyze", "compare", "contrast", "examine", "break down"],
            ContentType.CREATIVE: ["create", "design", "imagine", "brainstorm", "invent", "story"],
            ContentType.MATHEMATICAL: ["calculate", "equation", "formula", "solve", "math", "number"],
            ContentType.SCIENTIFIC: ["experiment", "hypothesis", "scientific", "research", "study"],
            ContentType.HISTORICAL: ["history", "historical", "past", "timeline", "century", "war"],
            ContentType.LITERARY: ["literature", "novel", "poem", "story", "character", "theme"],
            ContentType.TECHNICAL: ["technical", "code", "programming", "system", "architecture"],
            ContentType.LANGUAGE: ["language", "grammar", "vocabulary", "translate", "sentence"]
        }
        
        scores = {}
        for content_type, keywords in type_keywords.items():
            score = sum(1 for keyword in keywords if keyword in content)
            scores[content_type] = score
        
        # Return type with highest score
        if scores:
            return max(scores, key=scores.get)
        
        return ContentType.FACTUAL  # Default
    
    def _assess_difficulty(self, content: str, words: List[str]) -> DifficultyLevel:
        """Assess difficulty level of content"""
        
        # Simple heuristics for difficulty assessment
        avg_word_length = statistics.mean(len(word) for word in words) if words else 0
        complex_words = [word for word in words if len(word) > 8]
        complex_word_ratio = len(complex_words) / len(words) if words else 0
        
        # Sentence complexity
        sentences = [s.strip() for s in content.split('.') if s.strip()]
        avg_sentence_length = statistics.mean(len(s.split()) for s in sentences) if sentences else 0
        
        # Calculate difficulty score
        difficulty_score = (
            avg_word_length * 0.3 +
            complex_word_ratio * 0.4 +
            min(avg_sentence_length / 20, 1) * 0.3
        )
        
        if difficulty_score < 0.3:
            return DifficultyLevel.BEGINNER
        elif difficulty_score < 0.5:
            return DifficultyLevel.ELEMENTARY
        elif difficulty_score < 0.7:
            return DifficultyLevel.INTERMEDIATE
        elif difficulty_score < 0.9:
            return DifficultyLevel.ADVANCED
        else:
            return DifficultyLevel.EXPERT
    
    def _determine_cognitive_level(self, content: str, context: Optional[Dict[str, Any]]) -> CognitiveLevel:
        """Determine Bloom's taxonomy cognitive level"""
        
        # Check for explicit cognitive level in context
        if context and "cognitive_level" in context:
            try:
                return CognitiveLevel(context["cognitive_level"])
            except ValueError:
                pass
        
        # Analyze content for cognitive level indicators
        cognitive_keywords = {
            CognitiveLevel.REMEMBER: ["define", "list", "identify", "recall", "name", "state"],
            CognitiveLevel.UNDERSTAND: ["explain", "describe", "summarize", "interpret", "classify"],
            CognitiveLevel.APPLY: ["apply", "use", "implement", "demonstrate", "solve"],
            CognitiveLevel.ANALYZE: ["analyze", "compare", "contrast", "examine", "break down"],
            CognitiveLevel.EVALUATE: ["evaluate", "assess", "judge", "critique", "recommend"],
            CognitiveLevel.CREATE: ["create", "design", "develop", "produce", "compose"]
        }
        
        scores = {}
        for level, keywords in cognitive_keywords.items():
            score = sum(1 for keyword in keywords if keyword in content)
            scores[level] = score
        
        # Return level with highest score
        if scores:
            return max(scores, key=scores.get)
        
        return CognitiveLevel.UNDERSTAND  # Default
    
    def _calculate_complexity(self, content: str, words: List[str]) -> float:
        """Calculate overall complexity score"""
        
        factors = []
        
        # Length complexity
        if len(content) > 2000:
            factors.append(0.8)
        elif len(content) > 1000:
            factors.append(0.6)
        elif len(content) > 500:
            factors.append(0.4)
        else:
            factors.append(0.2)
        
        # Vocabulary complexity
        complex_words = [word for word in words if len(word) > 8]
        complex_ratio = len(complex_words) / len(words) if words else 0
        factors.append(min(complex_ratio * 2, 1.0))
        
        # Sentence complexity
        sentences = [s.strip() for s in content.split('.') if s.strip()]
        if sentences:
            avg_length = statistics.mean(len(s.split()) for s in sentences)
            factors.append(min(avg_length / 25, 1.0))
        
        return statistics.mean(factors) if factors else 0.5
    
    def _assess_vocabulary_level(self, words: List[str]) -> float:
        """Assess vocabulary complexity level"""
        
        if not words:
            return 0.5
        
        # Simple assessment based on word length and complexity
        long_words = [word for word in words if len(word) > 10]
        very_long_words = [word for word in words if len(word) > 15]
        
        long_ratio = len(long_words) / len(words)
        very_long_ratio = len(very_long_words) / len(words)
        
        # Calculate vocabulary score (0-1)
        vocab_score = long_ratio * 0.7 + very_long_ratio * 0.3
        return min(vocab_score * 2, 1.0)  # Normalize to 0-1
    
    def _assess_structure(self, content: str) -> float:
        """Assess content structure and organization"""
        
        # Check for structured elements
        has_numbers = any(char.isdigit() for char in content)
        has_lists = any(marker in content for marker in ['-', '•', '*', '1.', '2.', '3.'])
        has_paragraphs = len([p for p in content.split('\n') if p.strip()]) > 1
        
        structure_score = 0.0
        if has_numbers:
            structure_score += 0.3
        if has_lists:
            structure_score += 0.3
        if has_paragraphs:
            structure_score += 0.4
        
        return structure_score
    
    def _extract_key_concepts(self, content: str, words: List[str]) -> List[str]:
        """Extract key concepts from content"""
        
        # Simple keyword extraction
        # Remove common stop words
        stop_words = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
            "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", "did",
            "will", "would", "could", "should", "may", "might", "must", "can", "this", "that", "these", "those"
        }
        
        # Get meaningful words (longer than 3 characters, not stop words)
        meaningful_words = [
            word.lower() for word in words 
            if len(word) > 3 and word.lower() not in stop_words
        ]
        
        # Count word frequencies
        word_freq = defaultdict(int)
        for word in meaningful_words:
            word_freq[word] += 1
        
        # Return most frequent words as key concepts
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in sorted_words[:10]]
    
    def _requires_reasoning(self, content: str) -> bool:
        """Check if content requires reasoning"""
        
        reasoning_indicators = [
            "why", "how", "explain", "analyze", "compare", "contrast",
            "evaluate", "assess", "justify", "reason", "because"
        ]
        
        return any(indicator in content for indicator in reasoning_indicators)
    
    def _requires_creativity(self, content: str) -> bool:
        """Check if content requires creativity"""
        
        creativity_indicators = [
            "create", "design", "imagine", "brainstorm", "invent", "develop",
            "compose", "write", "story", "poem", "creative", "original"
        ]
        
        return any(indicator in content for indicator in creativity_indicators)
    
    def _requires_precision(self, content: str, domain: str) -> bool:
        """Check if content requires precision"""
        
        precision_domains = ["mathematics", "science", "technical", "programming", "medical"]
        precision_indicators = ["calculate", "exact", "precise", "accurate", "specific"]
        
        return (domain.lower() in precision_domains or 
                any(indicator in content for indicator in precision_indicators))
    
    def _estimate_complexity(self, content_type: ContentType, difficulty: DifficultyLevel, cognitive: CognitiveLevel) -> str:
        """Estimate overall complexity"""
        
        complexity_score = 0.0
        
        # Content type complexity
        type_complexity = {
            ContentType.FACTUAL: 1,
            ContentType.CONCEPTUAL: 2,
            ContentType.PROCEDURAL: 2,
            ContentType.ANALYTICAL: 3,
            ContentType.CREATIVE: 3,
            ContentType.MATHEMATICAL: 3,
            ContentType.SCIENTIFIC: 3,
            ContentType.TECHNICAL: 3,
            ContentType.LITERARY: 2,
            ContentType.HISTORICAL: 2,
            ContentType.LANGUAGE: 1
        }
        complexity_score += type_complexity.get(content_type, 2)
        
        # Difficulty complexity
        difficulty_complexity = {
            DifficultyLevel.BEGINNER: 1,
            DifficultyLevel.ELEMENTARY: 2,
            DifficultyLevel.INTERMEDIATE: 3,
            DifficultyLevel.ADVANCED: 4,
            DifficultyLevel.EXPERT: 5
        }
        complexity_score += difficulty_complexity.get(difficulty, 3)
        
        # Cognitive level complexity
        cognitive_complexity = {
            CognitiveLevel.REMEMBER: 1,
            CognitiveLevel.UNDERSTAND: 2,
            CognitiveLevel.APPLY: 3,
            CognitiveLevel.ANALYZE: 4,
            CognitiveLevel.EVALUATE: 5,
            CognitiveLevel.CREATE: 6
        }
        complexity_score += cognitive_complexity.get(cognitive, 2)
        
        # Normalize to complexity string
        if complexity_score <= 4:
            return "low"
        elif complexity_score <= 8:
            return "medium"
        else:
            return "high"
    
    async def select_model(
        self, 
        content: str, 
        context: Optional[Dict[str, Any]] = None,
        strategy: SelectionStrategy = SelectionStrategy.ADAPTIVE
    ) -> SelectionResult:
        """Select optimal model for given content"""
        
        # Analyze content features
        features = await self.analyze_content(content, context)
        
        # Get model candidates
        candidates = await self._get_model_candidates(features, strategy)
        
        # Score and rank candidates
        ranked_candidates = await self._score_candidates(candidates, features, strategy)
        
        # Select best model
        if not ranked_candidates:
            raise ValueError("No suitable models found")
        
        best_candidate = ranked_candidates[0]
        
        # Create selection result
        result = SelectionResult(
            selected_model=best_candidate["model"],
            selected_provider=best_candidate["provider"],
            confidence_score=best_candidate["score"],
            reasoning=best_candidate["reasoning"],
            alternatives=ranked_candidates[1:4] if len(ranked_candidates) > 1 else [],
            estimated_cost=best_candidate["estimated_cost"],
            estimated_time=best_candidate["estimated_time"],
            expected_quality=best_candidate["expected_quality"]
        )
        
        # Record selection for learning
        self._record_selection(features, result, strategy)
        
        logger.info(f"Selected model: {best_candidate['provider']}/{best_candidate['model']} "
                   f"with confidence {best_candidate['score']:.2f}")
        
        return result
    
    async def _get_model_candidates(
        self, 
        features: ContentFeatures, 
        strategy: SelectionStrategy
    ) -> List[Dict[str, Any]]:
        """Get candidate models that meet basic requirements"""
        
        candidates = []
        
        for key, capability in self.model_capabilities.items():
            provider, model = key.split('_', 1)
            
            # Check basic requirements
            if (capability.avg_quality_score >= self.criteria.min_quality_score and
                capability.avg_response_time <= self.criteria.max_response_time):
                
                # Check content type compatibility
                content_score = capability.content_type_scores.get(features.content_type, 0.0)
                if content_score >= 0.5:  # Minimum compatibility threshold
                    
                    # Check difficulty range
                    difficulty_ok = self._check_difficulty_compatibility(
                        features.difficulty_level, capability.difficulty_range
                    )
                    
                    # Check cognitive level compatibility
                    cognitive_score = capability.cognitive_level_scores.get(features.cognitive_level, 0.0)
                    
                    if difficulty_ok and cognitive_score >= 0.5:
                        candidates.append({
                            "key": key,
                            "provider": provider,
                            "model": model,
                            "capability": capability,
                            "content_score": content_score,
                            "cognitive_score": cognitive_score,
                            "difficulty_compatible": difficulty_ok
                        })
        
        return candidates
    
    def _check_difficulty_compatibility(
        self, 
        required_level: DifficultyLevel, 
        model_range: Tuple[DifficultyLevel, DifficultyLevel]
    ) -> bool:
        """Check if difficulty level is within model's range"""
        
        difficulty_order = [
            DifficultyLevel.BEGINNER,
            DifficultyLevel.ELEMENTARY,
            DifficultyLevel.INTERMEDIATE,
            DifficultyLevel.ADVANCED,
            DifficultyLevel.EXPERT
        ]
        
        min_index = difficulty_order.index(model_range[0])
        max_index = difficulty_order.index(model_range[1])
        required_index = difficulty_order.index(required_level)
        
        return min_index <= required_index <= max_index
    
    async def _score_candidates(
        self, 
        candidates: List[Dict[str, Any]], 
        features: ContentFeatures,
        strategy: SelectionStrategy
    ) -> List[Dict[str, Any]]:
        """Score and rank candidate models"""
        
        scored_candidates = []
        
        for candidate in candidates:
            capability = candidate["capability"]
            
            # Calculate base score
            if strategy == SelectionStrategy.PERFORMANCE_BASED:
                score = self._calculate_performance_score(candidate, features)
            elif strategy == SelectionStrategy.COST_OPTIMIZED:
                score = self._calculate_cost_score(candidate, features)
            elif strategy == SelectionStrategy.QUALITY_FIRST:
                score = self._calculate_quality_score(candidate, features)
            elif strategy == SelectionStrategy.BALANCED:
                score = self._calculate_balanced_score(candidate, features)
            else:  # ADAPTIVE or CONTEXT_AWARE
                score = await self._calculate_adaptive_score(candidate, features)
            
            # Apply learning adjustments
            adjusted_score = self._apply_learning_adjustments(candidate["key"], score)
            
            # Calculate estimates
            estimated_cost = capability.avg_cost_per_token * features.estimated_tokens
            estimated_time = capability.avg_response_time * (1 + features.complexity_score * 0.5)
            expected_quality = capability.avg_quality_score * (0.8 + 0.2 * adjusted_score)
            
            # Generate reasoning
            reasoning = self._generate_reasoning(candidate, features, adjusted_score)
            
            scored_candidates.append({
                "key": candidate["key"],
                "provider": candidate["provider"],
                "model": candidate["model"],
                "score": adjusted_score,
                "reasoning": reasoning,
                "estimated_cost": estimated_cost,
                "estimated_time": estimated_time,
                "expected_quality": expected_quality,
                "capability": capability
            })
        
        # Sort by score descending
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        
        return scored_candidates
    
    def _calculate_performance_score(self, candidate: Dict[str, Any], features: ContentFeatures) -> float:
        """Calculate performance-focused score"""
        
        capability = candidate["capability"]
        
        # Performance factors
        quality_weight = 0.5
        speed_weight = 0.3
        reliability_weight = 0.2
        
        quality_score = candidate["content_score"] * capability.avg_quality_score
        speed_score = 1.0 / (1.0 + capability.avg_response_time / 5.0)  # Normalize
        reliability_score = capability.reliability_score
        
        total_score = (
            quality_score * quality_weight +
            speed_score * speed_weight +
            reliability_score * reliability_weight
        )
        
        return total_score
    
    def _calculate_cost_score(self, candidate: Dict[str, Any], features: ContentFeatures) -> float:
        """Calculate cost-optimized score"""
        
        capability = candidate["capability"]
        
        # Cost factors
        cost_efficiency = 1.0 / (1.0 + capability.avg_cost_per_token * 1000)  # Normalize
        quality_score = candidate["content_score"] * capability.avg_quality_score
        speed_score = 1.0 / (1.0 + capability.avg_response_time / 5.0)
        
        total_score = (
            cost_efficiency * 0.5 +
            quality_score * 0.3 +
            speed_score * 0.2
        )
        
        return total_score
    
    def _calculate_quality_score(self, candidate: Dict[str, Any], features: ContentFeatures) -> float:
        """Calculate quality-focused score"""
        
        capability = candidate["capability"]
        
        # Quality factors
        content_match = candidate["content_score"]
        cognitive_match = candidate["cognitive_score"]
        base_quality = capability.avg_quality_score
        
        total_score = (
            content_match * 0.4 +
            cognitive_match * 0.3 +
            base_quality * 0.3
        )
        
        return total_score
    
    def _calculate_balanced_score(self, candidate: Dict[str, Any], features: ContentFeatures) -> float:
        """Calculate balanced score considering all factors"""
        
        capability = candidate["capability"]
        
        # Balanced weights
        quality_weight = 0.4
        cost_weight = 0.3
        speed_weight = 0.2
        reliability_weight = 0.1
        
        quality_score = candidate["content_score"] * capability.avg_quality_score
        cost_score = 1.0 / (1.0 + capability.avg_cost_per_token * 1000)
        speed_score = 1.0 / (1.0 + capability.avg_response_time / 5.0)
        reliability_score = capability.reliability_score
        
        total_score = (
            quality_score * quality_weight +
            cost_score * cost_weight +
            speed_score * speed_weight +
            reliability_score * reliability_weight
        )
        
        return total_score
    
    async def _calculate_adaptive_score(self, candidate: Dict[str, Any], features: ContentFeatures) -> float:
        """Calculate adaptive score based on historical performance"""
        
        # Start with balanced score
        base_score = self._calculate_balanced_score(candidate, features)
        
        # Apply historical performance adjustments
        model_key = candidate["key"]
        historical_performance = self.performance_feedback.get(model_key, [])
        
        if historical_performance:
            recent_performance = historical_performance[-50:]  # Last 50 interactions
            avg_success_rate = statistics.mean([
                p.get("success", 1.0) for p in recent_performance
            ])
            avg_quality = statistics.mean([
                p.get("quality_score", 0.8) for p in recent_performance
            ])
            
            # Adjust score based on historical performance
            performance_bonus = (avg_success_rate + avg_quality) / 2
            adjusted_score = base_score * (0.8 + 0.2 * performance_bonus)
        else:
            adjusted_score = base_score
        
        return adjusted_score
    
    def _apply_learning_adjustments(self, model_key: str, base_score: float) -> float:
        """Apply learning-based adjustments to score"""
        
        learning_weight = self.learning_weights.get(model_key, 0.0)
        
        # Apply learning adjustment (limited influence)
        adjusted_score = base_score * (1.0 + learning_weight * 0.1)
        
        return min(1.0, adjusted_score)  # Cap at 1.0
    
    def _generate_reasoning(
        self, 
        candidate: Dict[str, Any], 
        features: ContentFeatures, 
        score: float
    ) -> List[str]:
        """Generate reasoning for model selection"""
        
        reasoning = []
        
        # Content type match
        if candidate["content_score"] > 0.8:
            reasoning.append(f"Excellent match for {features.content_type.value} content")
        elif candidate["content_score"] > 0.6:
            reasoning.append(f"Good match for {features.content_type.value} content")
        
        # Quality score
        capability = candidate["capability"]
        if capability.avg_quality_score > 0.85:
            reasoning.append("High-quality output expected")
        elif capability.avg_quality_score > 0.75:
            reasoning.append("Good quality output expected")
        
        # Performance considerations
        if capability.avg_response_time < 2.0:
            reasoning.append("Fast response time")
        elif capability.avg_response_time > 5.0:
            reasoning.append("Slower but higher quality")
        
        # Cost considerations
        if capability.avg_cost_per_token < 0.000005:
            reasoning.append("Cost-effective option")
        
        # Difficulty compatibility
        if candidate["difficulty_compatible"]:
            reasoning.append(f"Suitable for {features.difficulty_level.value} difficulty level")
        
        return reasoning
    
    def _record_selection(
        self, 
        features: ContentFeatures, 
        result: SelectionResult,
        strategy: SelectionStrategy
    ):
        """Record selection for learning and analytics"""
        
        selection_record = {
            "timestamp": datetime.now(),
            "features": {
                "content_type": features.content_type.value,
                "difficulty_level": features.difficulty_level.value,
                "cognitive_level": features.cognitive_level.value,
                "complexity_score": features.complexity_score,
                "estimated_tokens": features.estimated_tokens
            },
            "selection": {
                "provider": result.selected_provider,
                "model": result.selected_model,
                "confidence_score": result.confidence_score,
                "strategy": strategy.value
            }
        }
        
        with self.lock:
            self.selection_history.append(selection_record)
    
    def record_selection_feedback(
        self, 
        selection_key: str,
        actual_quality: float,
        actual_response_time: float,
        actual_cost: float,
        success: bool = True,
        user_feedback: Optional[Dict[str, Any]] = None
    ):
        """Record feedback on selection performance"""
        
        feedback = {
            "timestamp": datetime.now(),
            "actual_quality": actual_quality,
            "actual_response_time": actual_response_time,
            "actual_cost": actual_cost,
            "success": success,
            "user_feedback": user_feedback
        }
        
        with self.lock:
            self.performance_feedback[selection_key].append(feedback)
            
            # Keep only recent feedback (last 1000 entries per model)
            if len(self.performance_feedback[selection_key]) > 1000:
                self.performance_feedback[selection_key] = self.performance_feedback[selection_key][-1000:]
    
    async def _periodic_learning_update(self):
        """Periodic learning and model updates"""
        
        while True:
            try:
                await asyncio.sleep(3600)  # Update every hour
                
                await self._update_learning_weights()
                await self._update_model_capabilities()
                
                logger.debug("Learning update completed")
                
            except Exception as e:
                logger.error(f"Learning update error: {e}")
    
    async def _update_learning_weights(self):
        """Update learning weights based on performance feedback"""
        
        with self.lock:
            for model_key, feedback_list in self.performance_feedback.items():
                if len(feedback_list) < 10:  # Need minimum data
                    continue
                
                recent_feedback = feedback_list[-100:]  # Last 100 interactions
                
                # Calculate performance metrics
                avg_quality = statistics.mean([f["actual_quality"] for f in recent_feedback])
                avg_efficiency = statistics.mean([
                    f["actual_quality"] / max(f["actual_cost"] * f["actual_response_time"], 0.001)
                    for f in recent_feedback
                ])
                success_rate = statistics.mean([f["success"] for f in recent_feedback])
                
                # Update learning weight based on performance
                performance_score = (avg_quality + avg_efficiency + success_rate) / 3
                
                # Adjust learning weight (positive for good performance, negative for poor)
                if performance_score > 0.8:
                    adjustment = 0.05
                elif performance_score > 0.6:
                    adjustment = 0.0
                else:
                    adjustment = -0.05
                
                self.learning_weights[model_key] += adjustment * self.criteria.adaptation_rate
                
                # Keep weights in reasonable range
                self.learning_weights[model_key] = max(-0.5, min(0.5, self.learning_weights[model_key]))
    
    async def _update_model_capabilities(self):
        """Update model capabilities based on recent performance"""
        
        with self.lock:
            for model_key, feedback_list in self.performance_feedback.items():
                if len(feedback_list) < 20:  # Need more data for capability updates
                    continue
                
                # Find model capability entry
                if model_key in self.model_capabilities:
                    capability = self.model_capabilities[model_key]
                    
                    recent_feedback = feedback_list[-200:]  # Last 200 interactions
                    
                    # Update performance metrics
                    capability.avg_quality_score = statistics.mean([
                        f["actual_quality"] for f in recent_feedback
                    ])
                    capability.avg_response_time = statistics.mean([
                        f["actual_response_time"] for f in recent_feedback
                    ])
                    capability.reliability_score = statistics.mean([
                        f["success"] for f in recent_feedback
                    ])
                    capability.usage_count += 1
                    capability.last_updated = datetime.now()
    
    async def _pattern_discovery(self):
        """Discover patterns in selection performance"""
        
        while True:
            try:
                await asyncio.sleep(86400)  # Run daily
                
                await self._analyze_selection_patterns()
                
                logger.debug("Pattern discovery completed")
                
            except Exception as e:
                logger.error(f"Pattern discovery error: {e}")
    
    async def _analyze_selection_patterns(self):
        """Analyze patterns in model selection performance"""
        
        with self.lock:
            if len(self.selection_history) < 100:
                return
            
            recent_selections = list(self.selection_history)[-1000:]
            
            # Analyze success patterns by content type
            type_patterns = defaultdict(list)
            for selection in recent_selections:
                content_type = selection["features"]["content_type"]
                type_patterns[content_type].append(selection)
            
            # Update content patterns
            for content_type, selections in type_patterns.items():
                if len(selections) >= 10:
                    # Find best performing model for this content type
                    model_performance = defaultdict(list)
                    
                    for selection in selections:
                        model_key = f"{selection['selection']['provider']}_{selection['selection']['model']}"
                        confidence = selection["selection"]["confidence_score"]
                        model_performance[model_key].append(confidence)
                    
                    # Calculate average performance per model
                    avg_performance = {}
                    for model_key, scores in model_performance.items():
                        avg_performance[model_key] = statistics.mean(scores)
                    
                    # Store best model for this content type
                    if avg_performance:
                        best_model = max(avg_performance, key=avg_performance.get)
                        self.content_patterns[content_type] = {
                            "best_model": best_model,
                            "avg_performance": avg_performance[best_model],
                            "sample_size": len(selections)
                        }
    
    def get_selection_insights(self) -> Dict[str, Any]:
        """Get insights about model selection performance"""
        
        with self.lock:
            # Basic statistics
            total_selections = len(self.selection_history)
            if total_selections == 0:
                return {"message": "No selection data available"}
            
            # Model usage statistics
            model_usage = defaultdict(int)
            for selection in self.selection_history:
                model_key = f"{selection['selection']['provider']}_{selection['selection']['model']}"
                model_usage[model_key] += 1
            
            # Performance by content type
            content_type_performance = defaultdict(list)
            for selection in self.selection_history:
                content_type = selection["features"]["content_type"]
                confidence = selection["selection"]["confidence_score"]
                content_type_performance[content_type].append(confidence)
            
            # Calculate averages
            content_type_avg = {}
            for content_type, scores in content_type_performance.items():
                content_type_avg[content_type] = {
                    "avg_confidence": statistics.mean(scores),
                    "selections_count": len(scores)
                }
            
            # Learning effectiveness
            learning_stats = {}
            for model_key, weight in self.learning_weights.items():
                learning_stats[model_key] = {
                    "learning_weight": weight,
                    "feedback_count": len(self.performance_feedback.get(model_key, []))
                }
            
            return {
                "total_selections": total_selections,
                "model_usage": dict(model_usage),
                "content_type_performance": content_type_avg,
                "learning_stats": learning_stats,
                "discovered_patterns": dict(self.content_patterns),
                "selection_strategies_used": list(set(
                    s["selection"]["strategy"] for s in self.selection_history
                ))
            }

# Global adaptive model selector instance
_global_adaptive_selector: Optional[AdaptiveModelSelector] = None

def get_adaptive_model_selector(criteria: Optional[SelectionCriteria] = None) -> AdaptiveModelSelector:
    """Get global adaptive model selector instance"""
    global _global_adaptive_selector
    
    if _global_adaptive_selector is None:
        if criteria is None:
            criteria = SelectionCriteria()
        _global_adaptive_selector = AdaptiveModelSelector(criteria)
    
    return _global_adaptive_selector

def initialize_adaptive_model_selector(criteria: SelectionCriteria) -> AdaptiveModelSelector:
    """Initialize global adaptive model selector"""
    global _global_adaptive_selector
    _global_adaptive_selector = AdaptiveModelSelector(criteria)
    return _global_adaptive_selector