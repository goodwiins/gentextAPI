"""
Question Validation and Quality Scoring System

This module provides comprehensive question validation, quality assessment,
and automated filtering to ensure high educational standards.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
import re
import json
from datetime import datetime
import math
import statistics

from .base import (
    QuestionType,
    Difficulty,
    CognitiveLevel
)

logger = logging.getLogger(__name__)

class QualityMetric(Enum):
    """Quality assessment metrics"""
    CLARITY = "clarity"
    ACCURACY = "accuracy"
    RELEVANCE = "relevance"
    APPROPRIATENESS = "appropriateness"
    EDUCATIONAL_VALUE = "educational_value"
    STRUCTURAL_INTEGRITY = "structural_integrity"
    BIAS_FAIRNESS = "bias_fairness"
    ACCESSIBILITY = "accessibility"

class ValidationLevel(Enum):
    """Validation levels"""
    STRICT = "strict"      # All criteria must pass
    MODERATE = "moderate"  # Most criteria must pass
    LENIENT = "lenient"    # Core criteria must pass

class QualityTier(Enum):
    """Quality tiers for questions"""
    EXCELLENT = "excellent"    # 0.9 - 1.0
    GOOD = "good"             # 0.8 - 0.9
    ACCEPTABLE = "acceptable"  # 0.7 - 0.8
    NEEDS_IMPROVEMENT = "needs_improvement"  # 0.6 - 0.7
    POOR = "poor"             # < 0.6

@dataclass
class ValidationCriteria:
    """Validation criteria for questions"""
    min_question_length: int = 10
    max_question_length: int = 500
    min_answer_length: int = 1
    max_answer_length: int = 200
    required_fields: List[str] = field(default_factory=lambda: ["type", "question", "correct_answer"])
    forbidden_words: List[str] = field(default_factory=lambda: ["?", "??", "!!!", "answer:", "solution:"])
    grammar_threshold: float = 0.8
    clarity_threshold: float = 0.7
    relevance_threshold: float = 0.7
    educational_threshold: float = 0.6

@dataclass
class QualityScore:
    """Quality score breakdown"""
    overall_score: float
    metric_scores: Dict[QualityMetric, float]
    quality_tier: QualityTier
    validation_passed: bool
    issues_identified: List[str]
    improvement_suggestions: List[str]
    assessed_at: datetime
    assessor_version: str = "1.0"

@dataclass
class ValidationReport:
    """Comprehensive validation report"""
    question_id: str
    validation_status: str  # "passed", "failed", "needs_review"
    quality_score: QualityScore
    criteria_checks: Dict[str, bool]
    detailed_feedback: Dict[str, str]
    recommendations: List[str]
    processing_time: float
    validated_at: datetime

class QuestionValidator:
    """Comprehensive question validation and quality assessment"""
    
    def __init__(self, validation_level: ValidationLevel = ValidationLevel.MODERATE):
        self.validation_level = validation_level
        self.criteria = ValidationCriteria()
        self.quality_weights = {
            QualityMetric.CLARITY: 0.25,
            QualityMetric.ACCURACY: 0.20,
            QualityMetric.RELEVANCE: 0.15,
            QualityMetric.APPROPRIATENESS: 0.15,
            QualityMetric.EDUCATIONAL_VALUE: 0.15,
            QualityMetric.STRUCTURAL_INTEGRITY: 0.10
        }
        self.bias_patterns = self._load_bias_patterns()
        self.accessibility_guidelines = self._load_accessibility_guidelines()
    
    async def validate_question(
        self,
        question: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> ValidationReport:
        """Comprehensive question validation"""
        
        start_time = datetime.now()
        question_id = question.get("id", "unknown")
        
        logger.info(f"Validating question {question_id}")
        
        # Perform basic structural validation
        structural_validation = await self._validate_structure(question)
        
        # Assess quality metrics
        quality_assessment = await self._assess_quality(question, context)
        
        # Check for biases and fairness
        bias_assessment = await self._assess_bias_fairness(question)
        
        # Check accessibility
        accessibility_assessment = await self._assess_accessibility(question)
        
        # Generate overall quality score
        quality_score = await self._calculate_quality_score(
            quality_assessment, bias_assessment, accessibility_assessment
        )
        
        # Determine validation status
        validation_status = self._determine_validation_status(quality_score)
        
        # Generate detailed feedback
        feedback = await self._generate_detailed_feedback(
            question, quality_score, structural_validation
        )
        
        # Generate recommendations
        recommendations = await self._generate_recommendations(quality_score, feedback)
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        report = ValidationReport(
            question_id=question_id,
            validation_status=validation_status,
            quality_score=quality_score,
            criteria_checks=structural_validation["criteria_passed"],
            detailed_feedback=feedback,
            recommendations=recommendations,
            processing_time=processing_time,
            validated_at=datetime.now()
        )
        
        logger.info(f"Validation complete for {question_id}: "
                   f"Score={quality_score.overall_score:.2f}, "
                   f"Status={validation_status}")
        
        return report
    
    async def validate_question_batch(
        self,
        questions: List[Dict[str, Any]],
        context: Optional[Dict[str, Any]] = None
    ) -> List[ValidationReport]:
        """Validate a batch of questions"""
        
        logger.info(f"Validating batch of {len(questions)} questions")
        
        # Validate questions in parallel
        tasks = []
        for question in questions:
            task = self.validate_question(question, context)
            tasks.append(task)
        
        reports = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and return successful reports
        valid_reports = []
        for i, result in enumerate(reports):
            if isinstance(result, Exception):
                logger.error(f"Validation failed for question {i}: {str(result)}")
            else:
                valid_reports.append(result)
        
        logger.info(f"Batch validation complete: {len(valid_reports)}/{len(questions)} valid")
        
        return valid_reports
    
    async def _validate_structure(self, question: Dict[str, Any]) -> Dict[str, Any]:
        """Validate basic question structure"""
        
        validation_result = {
            "criteria_passed": {},
            "issues": [],
            "structural_score": 0.0
        }
        
        # Check required fields
        required_fields = self.criteria.required_fields
        for field in required_fields:
            is_present = field in question and question[field] is not None
            validation_result["criteria_passed"][f"has_{field}"] = is_present
            
            if not is_present:
                validation_result["issues"].append(f"Missing required field: {field}")
        
        # Check question length
        if "question" in question:
            question_length = len(question["question"])
            length_valid = (self.criteria.min_question_length <= question_length <= 
                           self.criteria.max_question_length)
            validation_result["criteria_passed"]["question_length_valid"] = length_valid
            
            if not length_valid:
                validation_result["issues"].append(
                    f"Question length ({question_length}) outside valid range "
                    f"({self.criteria.min_question_length}-{self.criteria.max_question_length})"
                )
        
        # Check answer length
        if "correct_answer" in question:
            answer = str(question["correct_answer"])
            answer_length = len(answer)
            length_valid = (self.criteria.min_answer_length <= answer_length <= 
                           self.criteria.max_answer_length)
            validation_result["criteria_passed"]["answer_length_valid"] = length_valid
            
            if not length_valid:
                validation_result["issues"].append(
                    f"Answer length ({answer_length}) outside valid range "
                    f"({self.criteria.min_answer_length}-{self.criteria.max_answer_length})"
                )
        
        # Check for forbidden words
        if "question" in question:
            question_text = question["question"].lower()
            forbidden_found = any(word in question_text for word in self.criteria.forbidden_words)
            validation_result["criteria_passed"]["no_forbidden_words"] = not forbidden_found
            
            if forbidden_found:
                validation_result["issues"].append("Contains forbidden words or patterns")
        
        # Check type-specific structure
        question_type = question.get("type", "unknown")
        type_validation = await self._validate_type_specific_structure(question, question_type)
        validation_result["criteria_passed"].update(type_validation["criteria_passed"])
        validation_result["issues"].extend(type_validation["issues"])
        
        # Calculate structural score
        total_criteria = len(validation_result["criteria_passed"])
        passed_criteria = sum(validation_result["criteria_passed"].values())
        validation_result["structural_score"] = passed_criteria / total_criteria if total_criteria > 0 else 0.0
        
        return validation_result
    
    async def _validate_type_specific_structure(
        self,
        question: Dict[str, Any],
        question_type: str
    ) -> Dict[str, Any]:
        """Validate structure specific to question type"""
        
        result = {"criteria_passed": {}, "issues": []}
        
        if question_type == "multiple-choice":
            # Check options
            if "options" in question:
                options = question["options"]
                has_options = isinstance(options, list) and len(options) >= 3
                result["criteria_passed"]["has_sufficient_options"] = has_options
                
                if not has_options:
                    result["issues"].append("Multiple choice questions need at least 3 options")
                
                # Check option quality
                if has_options:
                    unique_options = len(set(str(opt).lower() for opt in options))
                    options_unique = unique_options == len(options)
                    result["criteria_passed"]["options_unique"] = options_unique
                    
                    if not options_unique:
                        result["issues"].append("Multiple choice options are not unique")
            else:
                result["criteria_passed"]["has_options"] = False
                result["issues"].append("Multiple choice questions require options")
        
        elif question_type == "fill-in-blank":
            # Check for blank indicators
            if "question" in question:
                question_text = question["question"]
                has_blank = "____" in question_text or "..." in question_text
                result["criteria_passed"]["has_blank_indicator"] = has_blank
                
                if not has_blank:
                    result["issues"].append("Fill-in-blank questions need blank indicators")
        
        elif question_type == "short-answer":
            # Check for expected length or scoring criteria
            has_length = "expected_length" in question or "scoring_criteria" in question
            result["criteria_passed"]["has_scoring_info"] = has_length
            
            if not has_length:
                result["issues"].append("Short answer questions should have length or scoring info")
        
        return result
    
    async def _assess_quality(
        self,
        question: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[QualityMetric, float]:
        """Assess quality metrics for the question"""
        
        quality_metrics = {}
        
        # Clarity assessment
        clarity_score = await self._assess_clarity(question)
        quality_metrics[QualityMetric.CLARITY] = clarity_score
        
        # Accuracy assessment
        accuracy_score = await self._assess_accuracy(question, context)
        quality_metrics[QualityMetric.ACCURACY] = accuracy_score
        
        # Relevance assessment
        relevance_score = await self._assess_relevance(question, context)
        quality_metrics[QualityMetric.RELEVANCE] = relevance_score
        
        # Appropriateness assessment
        appropriateness_score = await self._assess_appropriateness(question)
        quality_metrics[QualityMetric.APPROPRIATENESS] = appropriateness_score
        
        # Educational value assessment
        educational_score = await self._assess_educational_value(question)
        quality_metrics[QualityMetric.EDUCATIONAL_VALUE] = educational_score
        
        # Structural integrity assessment
        structural_score = await self._assess_structural_integrity(question)
        quality_metrics[QualityMetric.STRUCTURAL_INTEGRITY] = structural_score
        
        return quality_metrics
    
    async def _assess_clarity(self, question: Dict[str, Any]) -> float:
        """Assess question clarity"""
        
        clarity_factors = []
        
        # Question text clarity
        if "question" in question:
            question_text = question["question"]
            
            # Length appropriateness
            length = len(question_text)
            length_score = 1.0 if 20 <= length <= 200 else max(0.0, 1.0 - abs(length - 100) / 100.0)
            clarity_factors.append(length_score)
            
            # Sentence structure
            sentences = re.split(r'[.!?]+', question_text)
            avg_sentence_length = statistics.mean(len(s.split()) for s in sentences if s.strip())
            sentence_score = 1.0 if 10 <= avg_sentence_length <= 25 else max(0.0, 1.0 - abs(avg_sentence_length - 17.5) / 17.5)
            clarity_factors.append(sentence_score)
            
            # Readability (simplified)
            complex_words = len([w for w in question_text.split() if len(w) > 8])
            complexity_ratio = complex_words / len(question_text.split())
            readability_score = 1.0 - min(1.0, complexity_ratio)
            clarity_factors.append(readability_score)
            
            # Grammar check (simplified)
            grammar_score = self._check_grammar(question_text)
            clarity_factors.append(grammar_score)
        
        # Answer clarity
        if "correct_answer" in question:
            answer = str(question["correct_answer"])
            answer_clarity = 1.0 if 1 <= len(answer) <= 100 else max(0.0, 1.0 - abs(len(answer) - 50) / 50.0)
            clarity_factors.append(answer_clarity)
        
        return statistics.mean(clarity_factors) if clarity_factors else 0.0
    
    def _check_grammar(self, text: str) -> float:
        """Simple grammar checking (simplified)"""
        
        # Basic grammar checks
        grammar_score = 1.0
        
        # Check for capitalization at start
        sentences = re.split(r'[.!?]+', text)
        for sentence in sentences:
            if sentence.strip() and not sentence.strip()[0].isupper():
                grammar_score -= 0.1
        
        # Check for proper ending punctuation
        if sentences and sentences[-1].strip():
            last_sentence = sentences[-1].strip()
            if not last_sentence[-1] in '.!?':
                grammar_score -= 0.1
        
        # Check for repeated words
        words = text.lower().split()
        for i in range(len(words) - 1):
            if words[i] == words[i + 1]:
                grammar_score -= 0.05
        
        return max(0.0, grammar_score)
    
    async def _assess_accuracy(
        self,
        question: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> float:
        """Assess question accuracy"""
        
        accuracy_factors = []
        
        # Check if question is answerable
        if "question" in question and "correct_answer" in question:
            question_text = question["question"]
            answer = question["correct_answer"]
            
            # Check for speculative language in definitive questions
            speculative_words = ["maybe", "perhaps", "might", "could", "possibly"]
            has_speculative = any(word in question_text.lower() for word in speculative_words)
            is_speculative = has_speculative and not any(word in question_text.lower() 
                                                           for word in ["why", "how", "explain"])
            
            if is_speculative:
                accuracy_factors.append(0.7)  # Reduced accuracy for speculative questions
            else:
                accuracy_factors.append(1.0)
            
            # Check answer-question alignment (simplified)
            question_words = set(re.findall(r'\b\w+\b', question_text.lower()))
            answer_words = set(re.findall(r'\b\w+\b', str(answer).lower()))
            
            if question_words and answer_words:
                overlap = len(question_words.intersection(answer_words))
                alignment_score = min(1.0, overlap / max(len(question_words), len(answer_words)))
                accuracy_factors.append(alignment_score)
            else:
                accuracy_factors.append(0.8)
        
        # Check for consistency with context
        if context:
            consistency_score = await self._check_context_consistency(question, context)
            accuracy_factors.append(consistency_score)
        
        return statistics.mean(accuracy_factors) if accuracy_factors else 0.8
    
    async def _check_context_consistency(
        self,
        question: Dict[str, Any],
        context: Dict[str, Any]
    ) -> float:
        """Check question consistency with context"""
        
        # Simplified context consistency check
        question_text = question.get("question", "").lower()
        
        # Check if question addresses key concepts from context
        key_concepts = context.get("key_concepts", [])
        if key_concepts:
            concept_matches = sum(1 for concept in key_concepts if concept in question_text)
            consistency_score = min(1.0, concept_matches / max(len(key_concepts), 1))
        else:
            consistency_score = 0.8  # Default if no context concepts
        
        return consistency_score
    
    async def _assess_relevance(
        self,
        question: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> float:
        """Assess question relevance"""
        
        relevance_factors = []
        
        # Check if question tests important concepts
        if "question" in question:
            question_text = question["question"]
            
            # Look for key question indicators
            relevant_patterns = [
                r"what is", r"describe", r"explain", r"analyze", r"compare",
                r"contrast", r"evaluate", r"why", r"how", r"when", r"where"
            ]
            
            pattern_matches = sum(1 for pattern in relevant_patterns 
                               if re.search(pattern, question_text.lower()))
            pattern_score = min(1.0, pattern_matches / 2.0)
            relevance_factors.append(pattern_score)
            
            # Check educational relevance
            educational_keywords = [
                "important", "significant", "key", "main", "primary", "essential",
                "critical", "fundamental", "core", "central"
            ]
            
            keyword_matches = sum(1 for keyword in educational_keywords 
                                if keyword in question_text.lower())
            keyword_score = min(1.0, keyword_matches / 2.0)
            relevance_factors.append(keyword_score)
        
        # Context relevance
        if context:
            context_relevance = await self._assess_context_relevance(question, context)
            relevance_factors.append(context_relevance)
        
        return statistics.mean(relevance_factors) if relevance_factors else 0.7
    
    async def _assess_context_relevance(
        self,
        question: Dict[str, Any],
        context: Dict[str, Any]
    ) -> float:
        """Assess relevance to provided context"""
        
        question_text = question.get("question", "").lower()
        
        # Check domain alignment
        domain = context.get("domain", "")
        if domain:
            domain_keywords = {
                "science": ["experiment", "theory", "hypothesis", "data"],
                "history": ["historical", "century", "period", "ancient"],
                "literature": ["character", "plot", "theme", "author"],
                "mathematics": ["equation", "calculate", "formula", "solve"]
            }
            
            if domain in domain_keywords:
                matches = sum(1 for keyword in domain_keywords[domain] 
                            if keyword in question_text)
                domain_score = min(1.0, matches / 2.0)
            else:
                domain_score = 0.7
        else:
            domain_score = 0.7
        
        return domain_score
    
    async def _assess_appropriateness(self, question: Dict[str, Any]) -> float:
        """Assess question appropriateness"""
        
        appropriateness_factors = []
        
        # Check language appropriateness
        if "question" in question:
            question_text = question["question"]
            
            # Check for inappropriate language
            inappropriate_patterns = [
                r"\bstupid\b", r"\bdumb\b", r"\bidiotic\b", r"\bfoolish\b",
                r"\bimpossible\b", r"\beasy\b", r"\bobvious\b", r"\bsimple\b"
            ]
            
            inappropriate_matches = sum(1 for pattern in inappropriate_patterns 
                                      if re.search(pattern, question_text.lower()))
            language_score = max(0.0, 1.0 - (inappropriate_matches * 0.3))
            appropriateness_factors.append(language_score)
            
            # Check for leading questions
            leading_patterns = [
                r"don't you agree", r"isn't it true", r"wouldn't you say",
                r"obviously", r"clearly", r"of course"
            ]
            
            leading_matches = sum(1 for pattern in leading_patterns 
                               if re.search(pattern, question_text.lower()))
            leading_score = max(0.0, 1.0 - (leading_matches * 0.2))
            appropriateness_factors.append(leading_score)
        
        # Check difficulty appropriateness
        difficulty = question.get("difficulty", "intermediate")
        question_type = question.get("type", "unknown")
        
        # Some question types have inherent difficulty characteristics
        type_difficulty_mapping = {
            "multiple-choice": "beginner",
            "true-false": "beginner",
            "fill-in-blank": "intermediate",
            "short-answer": "intermediate",
            "essay": "advanced"
        }
        
        expected_difficulty = type_difficulty_mapping.get(question_type, "intermediate")
        difficulty_score = 1.0 if difficulty == expected_difficulty else 0.7
        appropriateness_factors.append(difficulty_score)
        
        return statistics.mean(appropriateness_factors) if appropriateness_factors else 0.8
    
    async def _assess_educational_value(self, question: Dict[str, Any]) -> float:
        """Assess educational value"""
        
        educational_factors = []
        
        if "question" in question:
            question_text = question["question"]
            
            # Check for higher-order thinking
            bloom_keywords = {
                "remember": ["define", "list", "identify", "name", "recall"],
                "understand": ["explain", "describe", "summarize", "interpret", "classify"],
                "apply": ["apply", "use", "implement", "demonstrate", "execute"],
                "analyze": ["analyze", "compare", "contrast", "examine", "categorize"],
                "evaluate": ["evaluate", "assess", "judge", "critique", "justify"],
                "create": ["create", "design", "develop", "produce", "construct"]
            }
            
            bloom_score = 0
            for level, keywords in bloom_keywords.items():
                matches = sum(1 for keyword in keywords if keyword in question_text.lower())
                if matches > 0:
                    # Higher levels get more points
                    level_score = {"remember": 1, "understand": 2, "apply": 3, 
                                 "analyze": 4, "evaluate": 5, "create": 6}[level]
                    bloom_score += level_score * matches
            
            bloom_score_normalized = min(1.0, bloom_score / 10.0)
            educational_factors.append(bloom_score_normalized)
            
            # Check for practical application
            practical_keywords = ["how", "apply", "use", "implement", "solve", "real-world"]
            practical_matches = sum(1 for keyword in practical_keywords 
                                 if keyword in question_text.lower())
            practical_score = min(1.0, practical_matches / 2.0)
            educational_factors.append(practical_score)
            
            # Check for critical thinking
            critical_keywords = ["analyze", "evaluate", "critique", "justify", "assess"]
            critical_matches = sum(1 for keyword in critical_keywords 
                               if keyword in question_text.lower())
            critical_score = min(1.0, critical_matches / 2.0)
            educational_factors.append(critical_score)
        
        return statistics.mean(educational_factors) if educational_factors else 0.6
    
    async def _assess_structural_integrity(self, question: Dict[str, Any]) -> float:
        """Assess structural integrity"""
        
        structural_factors = []
        
        # Check basic structure
        required_fields = ["type", "question", "correct_answer"]
        present_fields = [field for field in required_fields if field in question]
        structure_score = len(present_fields) / len(required_fields)
        structural_factors.append(structure_score)
        
        # Check type-specific structure
        question_type = question.get("type", "unknown")
        
        if question_type == "multiple-choice":
            # Check options
            options = question.get("options", [])
            if isinstance(options, list) and len(options) >= 3:
                options_score = 1.0
                
                # Check option quality
                unique_options = len(set(str(opt).lower() for opt in options))
                if unique_options == len(options):
                    options_score *= 1.0
                else:
                    options_score *= 0.7
                
                structural_factors.append(options_score)
            else:
                structural_factors.append(0.0)
        
        elif question_type == "fill-in-blank":
            # Check blank indicators
            question_text = question.get("question", "")
            has_blank = "____" in question_text or "..." in question_text
            blank_score = 1.0 if has_blank else 0.0
            structural_factors.append(blank_score)
        
        else:
            # Default structure score for other types
            structural_factors.append(0.8)
        
        return statistics.mean(structural_factors)
    
    async def _assess_bias_fairness(self, question: Dict[str, Any]) -> float:
        """Assess bias and fairness"""
        
        if "question" not in question:
            return 0.8  # Default score
        
        question_text = question["question"].lower()
        
        # Check for various bias patterns
        bias_score = 1.0
        
        for bias_type, patterns in self.bias_patterns.items():
            for pattern in patterns:
                if re.search(pattern, question_text):
                    bias_score -= 0.1
        
        return max(0.0, bias_score)
    
    async def _assess_accessibility(self, question: Dict[str, Any]) -> float:
        """Assess accessibility compliance"""
        
        accessibility_factors = []
        
        if "question" in question:
            question_text = question["question"]
            
            # Check for clear language
            complex_words = len([w for w in question_text.split() if len(w) > 10])
            complexity_ratio = complex_words / len(question_text.split())
            language_score = 1.0 - min(1.0, complexity_ratio)
            accessibility_factors.append(language_score)
            
            # Check sentence length
            sentences = re.split(r'[.!?]+', question_text)
            avg_length = statistics.mean(len(s.split()) for s in sentences if s.strip())
            sentence_score = 1.0 if avg_length <= 20 else max(0.0, 1.0 - (avg_length - 20) / 30.0)
            accessibility_factors.append(sentence_score)
        
        return statistics.mean(accessibility_factors) if accessibility_factors else 0.8
    
    async def _calculate_quality_score(
        self,
        quality_metrics: Dict[QualityMetric, float],
        bias_score: float,
        accessibility_score: float
    ) -> QualityScore:
        """Calculate overall quality score"""
        
        # Add bias and accessibility to quality metrics
        quality_metrics[QualityMetric.BIAS_FAIRNESS] = bias_score
        quality_metrics[QualityMetric.ACCESSIBILITY] = accessibility_score
        
        # Calculate weighted overall score
        overall_score = 0.0
        total_weight = 0.0
        
        for metric, score in quality_metrics.items():
            weight = self.quality_weights.get(metric, 0.1)
            overall_score += score * weight
            total_weight += weight
        
        overall_score = overall_score / total_weight if total_weight > 0 else 0.0
        
        # Determine quality tier
        if overall_score >= 0.9:
            quality_tier = QualityTier.EXCELLENT
        elif overall_score >= 0.8:
            quality_tier = QualityTier.GOOD
        elif overall_score >= 0.7:
            quality_tier = QualityTier.ACCEPTABLE
        elif overall_score >= 0.6:
            quality_tier = QualityTier.NEEDS_IMPROVEMENT
        else:
            quality_tier = QualityTier.Poor
        
        # Generate issues and suggestions
        issues_identified = []
        improvement_suggestions = []
        
        for metric, score in quality_metrics.items():
            if score < 0.7:
                issues_identified.append(f"Low {metric.value} score: {score:.2f}")
                
                # Generate improvement suggestions
                if metric == QualityMetric.CLARITY:
                    improvement_suggestions.append("Simplify language and sentence structure")
                elif metric == QualityMetric.ACCURACY:
                    improvement_suggestions.append("Verify factual accuracy and answer consistency")
                elif metric == QualityMetric.RELEVANCE:
                    improvement_suggestions.append("Focus on key concepts and educational objectives")
                elif metric == QualityMetric.EDUCATIONAL_VALUE:
                    improvement_suggestions.append("Incorporate higher-order thinking skills")
                elif metric == QualityMetric.BIAS_FAIRNESS:
                    improvement_suggestions.append("Review for potential biases and inclusive language")
                elif metric == QualityMetric.ACCESSIBILITY:
                    improvement_suggestions.append("Simplify language and reduce sentence complexity")
        
        # Determine validation status
        threshold = 0.7 if self.validation_level == ValidationLevel.MODERATE else 0.6
        validation_passed = overall_score >= threshold
        
        return QualityScore(
            overall_score=overall_score,
            metric_scores=quality_metrics,
            quality_tier=quality_tier,
            validation_passed=validation_passed,
            issues_identified=issues_identified,
            improvement_suggestions=improvement_suggestions,
            assessed_at=datetime.now()
        )
    
    def _determine_validation_status(self, quality_score: QualityScore) -> str:
        """Determine validation status based on quality score and validation level"""
        
        if not quality_score.validation_passed:
            return "failed"
        
        if quality_score.overall_score >= 0.9:
            return "passed"
        elif quality_score.overall_score >= 0.7:
            return "needs_review"
        else:
            return "failed"
    
    async def _generate_detailed_feedback(
        self,
        question: Dict[str, Any],
        quality_score: QualityScore,
        structural_validation: Dict[str, Any]
    ) -> Dict[str, str]:
        """Generate detailed feedback for improvement"""
        
        feedback = {}
        
        # Overall assessment
        feedback["overall"] = f"Quality Score: {quality_score.overall_score:.2f} ({quality_score.quality_tier.value})"
        
        # Metric-specific feedback
        for metric, score in quality_score.metric_scores.items():
            if score >= 0.8:
                feedback[metric.value] = f"Excellent {metric.value.replace('_', ' ')}"
            elif score >= 0.7:
                feedback[metric.value] = f"Good {metric.value.replace('_', ' ')}, with room for improvement"
            elif score >= 0.6:
                feedback[metric.value] = f"{metric.value.replace('_', ' ').title()} needs improvement"
            else:
                feedback[metric.value] = f"Poor {metric.value.replace('_', ' ')} - requires significant improvement"
        
        # Structural feedback
        if structural_validation["issues"]:
            feedback["structure"] = "Structural issues: " + "; ".join(structural_validation["issues"])
        else:
            feedback["structure"] = "Good structural integrity"
        
        return feedback
    
    async def _generate_recommendations(
        self,
        quality_score: QualityScore,
        feedback: Dict[str, str]
    ) -> List[str]:
        """Generate improvement recommendations"""
        
        recommendations = []
        
        # Priority recommendations based on lowest scores
        low_metrics = sorted(
            quality_score.metric_scores.items(),
            key=lambda x: x[1]
        )[:3]
        
        for metric, score in low_metrics:
            if score < 0.7:
                if metric == QualityMetric.CLARITY:
                    recommendations.append("Simplify question language and structure")
                    recommendations.append("Break complex sentences into simpler ones")
                elif metric == QualityMetric.ACCURACY:
                    recommendations.append("Verify factual accuracy of question and answer")
                    recommendations.append("Ensure answer directly addresses the question")
                elif metric == QualityMetric.RELEVANCE:
                    recommendations.append("Focus on key concepts and learning objectives")
                    recommendations.append("Ensure question tests important material")
                elif metric == QualityMetric.EDUCATIONAL_VALUE:
                    recommendations.append("Incorporate higher-order thinking skills")
                    recommendations.append("Add real-world application or critical thinking elements")
                elif metric == QualityMetric.BIAS_FAIRNESS:
                    recommendations.append("Review for cultural and gender biases")
                    recommendations.append("Use inclusive language and examples")
                elif metric == QualityMetric.ACCESSIBILITY:
                    recommendations.append("Simplify vocabulary and sentence structure")
                    recommendations.append("Ensure questions are accessible to diverse learners")
        
        # General recommendations
        if quality_score.overall_score < 0.8:
            recommendations.append("Consider peer review or expert evaluation")
            recommendations.append("Test the question with a sample audience")
        
        return recommendations
    
    def _load_bias_patterns(self) -> Dict[str, List[str]]:
        """Load bias detection patterns"""
        return {
            "gender_bias": [r"\bhe\b", r"\bshe\b", r"\bhis\b", r"\bher\b", r"\bman\b", r"\bwoman\b"],
            "cultural_bias": [r"\bwestern\b", r"\bamerican\b", r"\beuropean\b", r"\bforeign\b"],
            "age_bias": [r"\bold\b", r"\byoung\b", r"\belderly\b", r"\bteenager\b"],
            "socioeconomic_bias": [r"\bpoor\b", r"\brich\b", r"\bwealthy\b", r"\bprivileged\b"]
        }
    
    def _load_accessibility_guidelines(self) -> List[str]:
        """Load accessibility guidelines"""
        return [
            "Use clear and simple language",
            "Keep sentences under 20 words",
            "Avoid jargon and technical terms",
            "Provide clear instructions",
            "Use inclusive language",
            "Ensure questions are culturally appropriate"
        ]

class QuestionFilter:
    """Filter questions based on quality criteria"""
    
    def __init__(self, quality_threshold: float = 0.7):
        self.quality_threshold = quality_threshold
    
    def filter_questions(
        self,
        questions: List[Dict[str, Any]],
        validation_reports: List[ValidationReport]
    ) -> Tuple[List[Dict[str, Any]], List[ValidationReport]]:
        """Filter questions based on quality threshold"""
        
        filtered_questions = []
        filtered_reports = []
        
        for question, report in zip(questions, validation_reports):
            if report.quality_score.overall_score >= self.quality_threshold:
                filtered_questions.append(question)
                filtered_reports.append(report)
        
        return filtered_questions, filtered_reports
    
    def filter_by_quality_tier(
        self,
        questions: List[Dict[str, Any]],
        validation_reports: List[ValidationReport],
        min_tier: QualityTier
    ) -> Tuple[List[Dict[str, Any]], List[ValidationReport]]:
        """Filter questions by minimum quality tier"""
        
        tier_hierarchy = {
            QualityTier.POOR: 1,
            QualityTier.NEEDS_IMPROVEMENT: 2,
            QualityTier.ACCEPTABLE: 3,
            QualityTier.GOOD: 4,
            QualityTier.EXCELLENT: 5
        }
        
        min_level = tier_hierarchy[min_tier]
        filtered_questions = []
        filtered_reports = []
        
        for question, report in zip(questions, validation_reports):
            question_tier = report.quality_score.quality_tier
            question_level = tier_hierarchy[question_tier]
            
            if question_level >= min_level:
                filtered_questions.append(question)
                filtered_reports.append(report)
        
        return filtered_questions, filtered_reports