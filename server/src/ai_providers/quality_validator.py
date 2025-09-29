"""
Question Quality Validation and Scoring System

This module provides comprehensive validation and quality scoring for generated questions,
ensuring educational value, accuracy, and appropriateness.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
import re
import json
from datetime import datetime
import string
from collections import Counter

from .base import (
    QuestionType,
    Difficulty,
    CognitiveLevel
)

logger = logging.getLogger(__name__)

class QualityDimension(Enum):
    """Dimensions of question quality"""
    CLARITY = "clarity"
    ACCURACY = "accuracy"
    RELEVANCE = "relevance"
    APPROPRIATENESS = "appropriateness"
    EDUCATIONAL_VALUE = "educational_value"
    STRUCTURAL_INTEGRITY = "structural_integrity"
    BIAS_FREE = "bias_free"
    COGNITIVE_ALIGNMENT = "cognitive_alignment"

class ValidationLevel(Enum):
    """Levels of validation strictness"""
    BASIC = "basic"          # Essential checks only
    STANDARD = "standard"    # Standard educational quality
    STRICT = "strict"        # High-stakes assessment
    EXPERT = "expert"        # Professional/academic level

@dataclass
class QualityScore:
    """Individual quality dimension score"""
    dimension: QualityDimension
    score: float  # 0.0 to 1.0
    confidence: float  # 0.0 to 1.0
    details: str = ""
    issues: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)

@dataclass
class QualityReport:
    """Comprehensive quality report for a question"""
    question_id: str
    overall_score: float
    dimension_scores: List[QualityScore]
    validation_level: ValidationLevel
    passed_validation: bool
    critical_issues: List[str]
    recommendations: List[str]
    validated_at: str
    validator_version: str = "1.0.0"

@dataclass
class ValidationConfig:
    """Configuration for quality validation"""
    validation_level: ValidationLevel = ValidationLevel.STANDARD
    minimum_overall_score: float = 0.7
    minimum_dimension_scores: Dict[QualityDimension, float] = field(default_factory=dict)
    enable_bias_detection: bool = True
    enable_educational_value_assessment: bool = True
    enable_cognitive_alignment_check: bool = True
    custom_validation_rules: List[Dict[str, Any]] = field(default_factory=list)

class QuestionQualityValidator:
    """Comprehensive question quality validator"""
    
    def __init__(self, config: ValidationConfig = None):
        self.config = config or ValidationConfig()
        self.bias_patterns = self._load_bias_patterns()
        self.quality_indicators = self._load_quality_indicators()
        self.cognitive_alignment_patterns = self._load_cognitive_alignment_patterns()
        
        # Set default minimum scores if not provided
        default_min_scores = {
            QualityDimension.CLARITY: 0.6,
            QualityDimension.ACCURACY: 0.8,
            QualityDimension.RELEVANCE: 0.7,
            QualityDimension.APPROPRIATENESS: 0.6,
            QualityDimension.EDUCATIONAL_VALUE: 0.7,
            QualityDimension.STRUCTURAL_INTEGRITY: 0.8,
            QualityDimension.BIAS_FREE: 0.9,
            QualityDimension.COGNITIVE_ALIGNMENT: 0.6
        }
        self.config.minimum_dimension_scores.update(default_min_scores)
    
    async def validate_question(
        self,
        question: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> QualityReport:
        """Validate a single question and generate quality report"""
        
        logger.info(f"Validating question {question.get('id', 'unknown')}")
        
        # Validate all quality dimensions
        dimension_scores = []
        
        # Core dimensions
        clarity_score = await self._validate_clarity(question)
        dimension_scores.append(clarity_score)
        
        accuracy_score = await self._validate_accuracy(question, context)
        dimension_scores.append(accuracy_score)
        
        relevance_score = await self._validate_relevance(question, context)
        dimension_scores.append(relevance_score)
        
        appropriateness_score = await self._validate_appropriateness(question)
        dimension_scores.append(appropriateness_score)
        
        educational_score = await self._validate_educational_value(question)
        dimension_scores.append(educational_score)
        
        structural_score = await self._validate_structural_integrity(question)
        dimension_scores.append(structural_score)
        
        # Optional dimensions based on configuration
        if self.config.enable_bias_detection:
            bias_score = await self._validate_bias_free(question)
            dimension_scores.append(bias_score)
        
        if self.config.enable_cognitive_alignment_check:
            cognitive_score = await self._validate_cognitive_alignment(question)
            dimension_scores.append(cognitive_score)
        
        # Calculate overall score
        overall_score = self._calculate_overall_score(dimension_scores)
        
        # Check validation criteria
        passed_validation = self._check_validation_criteria(overall_score, dimension_scores)
        
        # Generate recommendations
        critical_issues, recommendations = self._generate_recommendations(dimension_scores)
        
        # Create quality report
        report = QualityReport(
            question_id=question.get("id", "unknown"),
            overall_score=overall_score,
            dimension_scores=dimension_scores,
            validation_level=self.config.validation_level,
            passed_validation=passed_validation,
            critical_issues=critical_issues,
            recommendations=recommendations,
            validated_at=datetime.now().isoformat()
        )
        
        logger.info(f"Question validation complete. Score: {overall_score:.2f}, "
                   f"Passed: {passed_validation}")
        
        return report
    
    async def validate_questions(
        self,
        questions: List[Dict[str, Any]],
        context: Optional[Dict[str, Any]] = None
    ) -> List[QualityReport]:
        """Validate multiple questions concurrently"""
        
        logger.info(f"Validating {len(questions)} questions")
        
        # Validate questions in parallel
        validation_tasks = [
            self.validate_question(question, context)
            for question in questions
        ]
        
        reports = await asyncio.gather(*validation_tasks)
        
        # Calculate batch statistics
        passed_count = sum(1 for report in reports if report.passed_validation)
        avg_score = sum(report.overall_score for report in reports) / len(reports)
        
        logger.info(f"Batch validation complete. {passed_count}/{len(questions)} "
                   f"passed validation. Average score: {avg_score:.2f}")
        
        return reports
    
    async def _validate_clarity(self, question: Dict[str, Any]) -> QualityScore:
        """Validate question clarity and comprehensibility"""
        
        score = 0.0
        confidence = 0.8
        issues = []
        suggestions = []
        
        question_text = question.get("question", "")
        
        # Length appropriateness
        if len(question_text) < 10:
            issues.append("Question is too short")
            suggestions.append("Consider expanding the question to provide more context")
            score += 0.2
        elif len(question_text) > 300:
            issues.append("Question is very long")
            suggestions.append("Consider simplifying or breaking down the question")
            score += 0.6
        else:
            score += 1.0
        
        # Sentence structure
        sentences = re.split(r'[.!?]+', question_text)
        avg_sentence_length = sum(len(s.split()) for s in sentences if s.strip()) / max(len([s for s in sentences if s.strip()]), 1)
        
        if avg_sentence_length > 25:
            issues.append("Sentences are too complex")
            suggestions.append("Break down complex sentences for better clarity")
            score *= 0.7
        elif avg_sentence_length < 5:
            issues.append("Sentences are too simple")
            suggestions.append("Add more detail to the question")
            score *= 0.8
        
        # Vocabulary complexity
        complex_words = self._identify_complex_words(question_text)
        complex_ratio = len(complex_words) / max(len(question_text.split()), 1)
        
        if complex_ratio > 0.3:
            issues.append("Too many complex words")
            suggestions.append("Simplify vocabulary for better understanding")
            score *= 0.8
        
        # Ambiguity check
        ambiguity_indicators = ["may", "might", "could", "possibly", "probably"]
        ambiguity_count = sum(1 for word in ambiguity_indicators if word in question_text.lower())
        
        if ambiguity_count > 2:
            issues.append("Question contains ambiguous language")
            suggestions.append("Use more precise language")
            score *= 0.7
        
        # Double negatives
        double_negative_patterns = [
            r"not.*not",
            r"never.*no",
            r"without.*not",
            r"cannot.*no"
        ]
        
        for pattern in double_negative_patterns:
            if re.search(pattern, question_text.lower()):
                issues.append("Question contains double negative")
                suggestions.append("Rewrite to avoid double negatives")
                score *= 0.5
                break
        
        # Normalize score
        final_score = min(1.0, max(0.0, score))
        
        return QualityScore(
            dimension=QualityDimension.CLARITY,
            score=final_score,
            confidence=confidence,
            details=f"Clarity assessment based on length, structure, vocabulary, and ambiguity",
            issues=issues,
            suggestions=suggestions
        )
    
    async def _validate_accuracy(self, question: Dict[str, Any], context: Optional[Dict[str, Any]]) -> QualityScore:
        """Validate factual accuracy and correctness"""
        
        score = 0.8  # Base score (assumed accurate unless issues found)
        confidence = 0.6  # Lower confidence without external fact-checking
        issues = []
        suggestions = []
        
        question_text = question.get("question", "")
        
        # Check for absolute statements that may be inaccurate
        absolute_words = ["always", "never", "all", "none", "every", "only"]
        absolute_count = sum(1 for word in absolute_words if word in question_text.lower())
        
        if absolute_count > 1:
            issues.append("Question contains absolute statements that may be inaccurate")
            suggestions.append("Consider using more qualified language")
            score *= 0.8
        
        # Check for logical consistency
        if question.get("type") == "multiple-choice" and "options" in question:
            options = question["options"]
            correct_answer = question.get("correct_answer", "")
            
            # Check that correct answer is in options
            if correct_answer and correct_answer not in options:
                issues.append("Correct answer not found in options")
                suggestions.append("Ensure correct answer is included in options")
                score *= 0.3
            
            # Check for duplicate options
            if len(set(options)) != len(options):
                issues.append("Duplicate options detected")
                suggestions.append("Ensure all options are unique")
                score *= 0.5
        
        # Check for answer consistency
        if "correct_answer" in question:
            correct_answer = question["correct_answer"]
            if not correct_answer or len(str(correct_answer).strip()) < 2:
                issues.append("Correct answer is missing or too short")
                suggestions.append("Provide a complete correct answer")
                score *= 0.4
        
        # Check explanation quality if present
        if "explanation" in question:
            explanation = question["explanation"]
            if len(explanation) < 20:
                issues.append("Explanation is too brief")
                suggestions.append("Provide more detailed explanation")
                score *= 0.9
        
        # Normalize score
        final_score = min(1.0, max(0.0, score))
        
        return QualityScore(
            dimension=QualityDimension.ACCURACY,
            score=final_score,
            confidence=confidence,
            details="Accuracy assessment based on logical consistency and answer verification",
            issues=issues,
            suggestions=suggestions
        )
    
    async def _validate_relevance(self, question: Dict[str, Any], context: Optional[Dict[str, Any]]) -> QualityScore:
        """Validate question relevance to educational objectives"""
        
        score = 0.7  # Base score
        confidence = 0.7
        issues = []
        suggestions = []
        
        question_text = question.get("question", "")
        
        # Check if question addresses key concepts (if context provided)
        if context and "key_concepts" in context:
            key_concepts = context["key_concepts"]
            concept_overlap = sum(1 for concept in key_concepts if concept.lower() in question_text.lower())
            relevance_ratio = concept_overlap / max(len(key_concepts), 1)
            
            if relevance_ratio < 0.3:
                issues.append("Question does not adequately address key concepts")
                suggestions.append("Ensure question covers important concepts from the material")
                score *= 0.6
            else:
                score *= (1.0 + relevance_ratio * 0.2)  # Bonus for good coverage
        
        # Check educational value
        educational_keywords = [
            "analyze", "evaluate", "compare", "explain", "describe", "identify",
            "discuss", "demonstrate", "apply", "assess", "justify"
        ]
        
        has_educational_value = any(keyword in question_text.lower() for keyword in educational_keywords)
        
        if not has_educational_value:
            issues.append("Question may lack educational value")
            suggestions.append("Consider using action verbs that promote higher-order thinking")
            score *= 0.8
        
        # Check for trivial questions
        trivial_indicators = ["what is", "what are", "who is", "who are", "when did", "where is"]
        is_trivial = any(indicator in question_text.lower() for indicator in trivial_indicators)
        
        if is_trivial and len(question_text.split()) < 8:
            issues.append("Question appears trivial or too simple")
            suggestions.append("Consider making the question more challenging or thought-provoking")
            score *= 0.7
        
        # Normalize score
        final_score = min(1.0, max(0.0, score))
        
        return QualityScore(
            dimension=QualityDimension.RELEVANCE,
            score=final_score,
            confidence=confidence,
            details="Relevance assessment based on concept coverage and educational value",
            issues=issues,
            suggestions=suggestions
        )
    
    async def _validate_appropriateness(self, question: Dict[str, Any]) -> QualityScore:
        """Validate question appropriateness for target audience and difficulty"""
        
        score = 0.8  # Base score
        confidence = 0.7
        issues = []
        suggestions = []
        
        question_text = question.get("question", "")
        stated_difficulty = question.get("difficulty", "intermediate")
        
        # Check vocabulary appropriateness
        complex_words = self._identify_complex_words(question_text)
        complex_ratio = len(complex_words) / max(len(question_text.split()), 1)
        
        difficulty_complexity_map = {
            "beginner": 0.1,
            "intermediate": 0.2,
            "advanced": 0.3,
            "expert": 0.4
        }
        
        expected_complexity = difficulty_complexity_map.get(stated_difficulty, 0.2)
        complexity_diff = abs(complex_ratio - expected_complexity)
        
        if complexity_diff > 0.2:
            issues.append(f"Vocabulary complexity doesn't match stated difficulty level")
            suggestions.append("Adjust vocabulary to match the intended difficulty level")
            score *= (1.0 - complexity_diff)
        
        # Check question length appropriateness
        question_length = len(question_text.split())
        difficulty_length_map = {
            "beginner": (10, 20),
            "intermediate": (15, 30),
            "advanced": (20, 40),
            "expert": (25, 50)
        }
        
        min_length, max_length = difficulty_length_map.get(stated_difficulty, (15, 30))
        
        if question_length < min_length:
            issues.append("Question is too short for the stated difficulty level")
            suggestions.append("Add more detail or complexity to match the difficulty level")
            score *= 0.8
        elif question_length > max_length:
            issues.append("Question is too long for the stated difficulty level")
            suggestions.append("Simplify or shorten the question")
            score *= 0.9
        
        # Check for sensitive content
        sensitive_topics = [
            "violence", "death", "abuse", "discrimination", "politics", "religion",
            "sexuality", "drugs", "alcohol", "mental health", "trauma"
        ]
        
        sensitive_content = any(topic in question_text.lower() for topic in sensitive_topics)
        
        if sensitive_content:
            issues.append("Question contains potentially sensitive content")
            suggestions.append("Consider whether this content is appropriate for the target audience")
            score *= 0.7
        
        # Normalize score
        final_score = min(1.0, max(0.0, score))
        
        return QualityScore(
            dimension=QualityDimension.APPROPRIATENESS,
            score=final_score,
            confidence=confidence,
            details="Appropriateness assessment based on vocabulary, length, and content sensitivity",
            issues=issues,
            suggestions=suggestions
        )
    
    async def _validate_educational_value(self, question: Dict[str, Any]) -> QualityScore:
        """Validate educational value and learning potential"""
        
        score = 0.7  # Base score
        confidence = 0.6
        issues = []
        suggestions = []
        
        question_text = question.get("question", "")
        
        # Check for higher-order thinking skills
        blooms_taxonomy = {
            "remember": ["define", "list", "identify", "name", "recall"],
            "understand": ["explain", "describe", "summarize", "interpret", "give examples"],
            "apply": ["apply", "use", "demonstrate", "implement", "solve"],
            "analyze": ["analyze", "compare", "contrast", "examine", "categorize"],
            "evaluate": ["evaluate", "assess", "judge", "critique", "justify"],
            "create": ["create", "design", "develop", "formulate", "propose"]
        }
        
        cognitive_level = "remember"  # Default lowest level
        max_level_score = 0
        
        for level, verbs in blooms_taxonomy.items():
            if any(verb in question_text.lower() for verb in verbs):
                level_score = ["remember", "understand", "apply", "analyze", "evaluate", "create"].index(level) + 1
                if level_score > max_level_score:
                    max_level_score = level_score
                    cognitive_level = level
        
        # Score based on cognitive level
        cognitive_scores = {"remember": 0.5, "understand": 0.6, "apply": 0.7, "analyze": 0.8, "evaluate": 0.9, "create": 1.0}
        cognitive_score = cognitive_scores.get(cognitive_level, 0.5)
        
        score = cognitive_score
        
        if cognitive_level in ["remember", "understand"]:
            issues.append("Question focuses on lower-order thinking skills")
            suggestions.append("Consider designing questions that promote analysis, evaluation, or creation")
        
        # Check for real-world application
        application_indicators = ["real world", "practical", "application", "scenario", "situation"]
        has_application = any(indicator in question_text.lower() for indicator in application_indicators)
        
        if has_application:
            score *= 1.1  # Bonus for real-world application
        else:
            suggestions.append("Consider adding real-world context or application scenarios")
        
        # Check for critical thinking
        critical_indicators = ["why", "how", "explain why", "what reasons", "what factors", "analyze"]
        has_critical_thinking = any(indicator in question_text.lower() for indicator in critical_indicators)
        
        if has_critical_thinking:
            score *= 1.1  # Bonus for critical thinking
        else:
            suggestions.append("Consider adding elements that require critical thinking")
        
        # Normalize score
        final_score = min(1.0, max(0.0, score))
        
        return QualityScore(
            dimension=QualityDimension.EDUCATIONAL_VALUE,
            score=final_score,
            confidence=confidence,
            details=f"Educational value assessment based on cognitive level ({cognitive_level}) and learning potential",
            issues=issues,
            suggestions=suggestions
        )
    
    async def _validate_structural_integrity(self, question: Dict[str, Any]) -> QualityScore:
        """Validate structural integrity and completeness"""
        
        score = 1.0  # Start with perfect score
        confidence = 0.9
        issues = []
        suggestions = []
        
        # Check required fields based on question type
        question_type = question.get("type", "unknown")
        
        required_fields = {
            "multiple-choice": ["question", "options", "correct_answer"],
            "short-answer": ["question", "correct_answer"],
            "fill-in-blank": ["question", "correct_answer"],
            "essay": ["question"],
            "true-false": ["question", "correct_answer"]
        }
        
        required = required_fields.get(question_type, ["question"])
        
        missing_fields = [field for field in required if field not in question or not question[field]]
        
        if missing_fields:
            issues.append(f"Missing required fields: {', '.join(missing_fields)}")
            suggestions.append(f"Add the missing fields: {', '.join(missing_fields)}")
            score *= 0.3
        
        # Check multiple-choice specific structure
        if question_type == "multiple-choice" and "options" in question:
            options = question["options"]
            
            if len(options) < 3:
                issues.append("Multiple choice question should have at least 3 options")
                suggestions.append("Add more options to make the question more challenging")
                score *= 0.7
            elif len(options) > 6:
                issues.append("Too many options may be overwhelming")
                suggestions.append("Consider reducing to 4-5 options")
                score *= 0.9
            
            # Check option quality
            for i, option in enumerate(options):
                if len(str(option)) < 2:
                    issues.append(f"Option {i+1} is too short or empty")
                    suggestions.append("Ensure all options are meaningful")
                    score *= 0.8
                    break
        
        # Check for question mark
        if "question" in question and not question["question"].strip().endswith("?"):
            issues.append("Question should end with a question mark")
            suggestions.append("Add a question mark at the end of the question")
            score *= 0.95
        
        # Check for proper capitalization
        if "question" in question:
            question_text = question["question"]
            if not question_text[0].isupper():
                issues.append("Question should start with a capital letter")
                suggestions.append("Capitalize the first letter of the question")
                score *= 0.95
        
        # Normalize score
        final_score = min(1.0, max(0.0, score))
        
        return QualityScore(
            dimension=QualityDimension.STRUCTURAL_INTEGRITY,
            score=final_score,
            confidence=confidence,
            details="Structural integrity assessment based on completeness and formatting",
            issues=issues,
            suggestions=suggestions
        )
    
    async def _validate_bias_free(self, question: Dict[str, Any]) -> QualityScore:
        """Validate that question is free from bias and stereotypes"""
        
        score = 1.0  # Start with perfect score
        confidence = 0.7
        issues = []
        suggestions = []
        
        question_text = question.get("question", "").lower()
        
        # Check for gender bias
        gender_patterns = [
            (r"\bhe\b", "gendered language"),
            (r"\bshe\b", "gendered language"),
            (r"\bhis\b", "gendered language"),
            (r"\bher\b", "gendered language"),
            (r"\bhim\b", "gendered language"),
            (r"\bmen\b", "gendered language"),
            (r"\bwomen\b", "gendered language")
        ]
        
        for pattern, issue in gender_patterns:
            if re.search(pattern, question_text):
                issues.append(f"Contains {issue}")
                suggestions.append("Use gender-neutral language (they, them, their)")
                score *= 0.8
                break
        
        # Check for cultural bias
        cultural_indicators = ["american", "western", "european", "christian", "muslim", "jewish"]
        cultural_count = sum(1 for indicator in cultural_indicators if indicator in question_text)
        
        if cultural_count > 1:
            issues.append("May contain cultural bias")
            suggestions.append("Consider using more culturally neutral examples")
            score *= 0.9
        
        # Check for socioeconomic bias
        socioeconomic_indicators = ["rich", "poor", "wealthy", "impoverished", "privileged"]
        socioeconomic_count = sum(1 for indicator in socioeconomic_indicators if indicator in question_text)
        
        if socioeconomic_count > 1:
            issues.append("May contain socioeconomic bias")
            suggestions.append("Be mindful of socioeconomic assumptions")
            score *= 0.9
        
        # Check for accessibility bias
        accessibility_indicators = ["see", "hear", "walk", "read", "write"]
        accessibility_count = sum(1 for indicator in accessibility_indicators if indicator in question_text)
        
        if accessibility_count > 2:
            issues.append("May not be accessible to students with disabilities")
            suggestions.append("Consider alternative ways to present the question")
            score *= 0.9
        
        # Normalize score
        final_score = min(1.0, max(0.0, score))
        
        return QualityScore(
            dimension=QualityDimension.BIAS_FREE,
            score=final_score,
            confidence=confidence,
            details="Bias assessment based on language patterns and inclusivity",
            issues=issues,
            suggestions=suggestions
        )
    
    async def _validate_cognitive_alignment(self, question: Dict[str, Any]) -> QualityScore:
        """Validate alignment with stated cognitive level"""
        
        score = 0.8  # Base score
        confidence = 0.7
        issues = []
        suggestions = []
        
        question_text = question.get("question", "")
        stated_cognitive_level = question.get("cognitive_level", "understand")
        
        # Cognitive level patterns
        cognitive_patterns = {
            "remember": [r"define\b", r"list\b", r"identify\b", r"name\b", r"recall\b", r"state\b"],
            "understand": [r"explain\b", r"describe\b", r"summarize\b", r"interpret\b", r"give examples?\b"],
            "apply": [r"apply\b", r"use\b", r"demonstrate\b", r"implement\b", r"solve\b"],
            "analyze": [r"analyze\b", r"compare\b", r"contrast\b", r"examine\b", r"categorize\b"],
            "evaluate": [r"evaluate\b", r"assess\b", r"judge\b", r"critique\b", r"justify\b"],
            "create": [r"create\b", r"design\b", r"develop\b", r"formulate\b", r"propose\b"]
        }
        
        # Check if question matches stated cognitive level
        expected_patterns = cognitive_patterns.get(stated_cognitive_level, [])
        pattern_matches = sum(1 for pattern in expected_patterns if re.search(pattern, question_text.lower()))
        
        if pattern_matches == 0:
            issues.append(f"Question doesn't appear to align with {stated_cognitive_level} cognitive level")
            suggestions.append(f"Use verbs appropriate for {stated_cognitive_level} level questions")
            score *= 0.6
        
        # Check for mismatch with higher/lower levels
        mismatch_penalty = 0
        for level, patterns in cognitive_patterns.items():
            if level != stated_cognitive_level:
                matches = sum(1 for pattern in patterns if re.search(pattern, question_text.lower()))
                if matches > pattern_matches:  # More matches with different level
                    mismatch_penalty += 0.2
        
        if mismatch_penalty > 0:
            issues.append("Question may better align with a different cognitive level")
            suggestions.append("Consider adjusting the stated cognitive level or question wording")
            score *= (1.0 - mismatch_penalty)
        
        # Normalize score
        final_score = min(1.0, max(0.0, score))
        
        return QualityScore(
            dimension=QualityDimension.COGNITIVE_ALIGNMENT,
            score=final_score,
            confidence=confidence,
            details=f"Cognitive alignment assessment for {stated_cognitive_level} level",
            issues=issues,
            suggestions=suggestions
        )
    
    def _calculate_overall_score(self, dimension_scores: List[QualityScore]) -> float:
        """Calculate overall quality score from dimension scores"""
        
        if not dimension_scores:
            return 0.0
        
        # Weighted average based on validation level
        weights = {
            ValidationLevel.BASIC: {
                QualityDimension.STRUCTURAL_INTEGRITY: 0.5,
                QualityDimension.CLARITY: 0.3,
                QualityDimension.ACCURACY: 0.2
            },
            ValidationLevel.STANDARD: {
                QualityDimension.STRUCTURAL_INTEGRITY: 0.25,
                QualityDimension.CLARITY: 0.2,
                QualityDimension.ACCURACY: 0.2,
                QualityDimension.RELEVANCE: 0.15,
                QualityDimension.APPROPRIATENESS: 0.1,
                QualityDimension.EDUCATIONAL_VALUE: 0.1
            },
            ValidationLevel.STRICT: {
                QualityDimension.STRUCTURAL_INTEGRITY: 0.2,
                QualityDimension.CLARITY: 0.15,
                QualityDimension.ACCURACY: 0.2,
                QualityDimension.RELEVANCE: 0.15,
                QualityDimension.APPROPRIATENESS: 0.1,
                QualityDimension.EDUCATIONAL_VALUE: 0.1,
                QualityDimension.BIAS_FREE: 0.1
            },
            ValidationLevel.EXPERT: {
                QualityDimension.STRUCTURAL_INTEGRITY: 0.15,
                QualityDimension.CLARITY: 0.15,
                QualityDimension.ACCURACY: 0.2,
                QualityDimension.RELEVANCE: 0.15,
                QualityDimension.APPROPRIATENESS: 0.1,
                QualityDimension.EDUCATIONAL_VALUE: 0.15,
                QualityDimension.BIAS_FREE: 0.05,
                QualityDimension.COGNITIVE_ALIGNMENT: 0.05
            }
        }
        
        level_weights = weights.get(self.config.validation_level, weights[ValidationLevel.STANDARD])
        
        weighted_sum = 0.0
        total_weight = 0.0
        
        for dim_score in dimension_scores:
            weight = level_weights.get(dim_score.dimension, 0.0)
            weighted_sum += dim_score.score * weight
            total_weight += weight
        
        return weighted_sum / total_weight if total_weight > 0 else 0.0
    
    def _check_validation_criteria(self, overall_score: float, dimension_scores: List[QualityScore]) -> bool:
        """Check if question meets validation criteria"""
        
        # Check overall score
        if overall_score < self.config.minimum_overall_score:
            return False
        
        # Check dimension scores
        for dim_score in dimension_scores:
            min_score = self.config.minimum_dimension_scores.get(dim_score.dimension, 0.0)
            if dim_score.score < min_score:
                return False
        
        return True
    
    def _generate_recommendations(self, dimension_scores: List[QualityScore]) -> Tuple[List[str], List[str]]:
        """Generate critical issues and recommendations"""
        
        critical_issues = []
        recommendations = []
        
        # Collect critical issues
        for dim_score in dimension_scores:
            min_score = self.config.minimum_dimension_scores.get(dim_score.dimension, 0.0)
            if dim_score.score < min_score:
                critical_issues.extend(dim_score.issues)
        
        # Collect recommendations
        all_suggestions = []
        for dim_score in dimension_scores:
            if dim_score.score < 0.8:  # Only suggest improvements for dimensions that need it
                all_suggestions.extend(dim_score.suggestions)
        
        # Remove duplicates and prioritize
        seen = set()
        unique_suggestions = []
        for suggestion in all_suggestions:
            if suggestion not in seen:
                seen.add(suggestion)
                unique_suggestions.append(suggestion)
        
        # Limit recommendations to top 5
        recommendations = unique_suggestions[:5]
        
        return critical_issues, recommendations
    
    def _identify_complex_words(self, text: str) -> List[str]:
        """Identify complex words in text"""
        
        words = re.findall(r'\b\w+\b', text.lower())
        complex_words = []
        
        # Simple heuristics for complex word detection
        for word in words:
            if (len(word) > 8 or 
                any(suffix in word for suffix in ['tion', 'sion', 'ment', 'ity', 'ness', 'ism', 'ist']) or
                word.count('syllable') > 0):  # Simplified syllable counting
                complex_words.append(word)
        
        return complex_words
    
    def _load_bias_patterns(self) -> Dict[str, List[str]]:
        """Load bias detection patterns"""
        return {
            "gender": ["he", "she", "his", "her", "him", "men", "women"],
            "cultural": ["american", "western", "european", "christian", "muslim", "jewish"],
            "socioeconomic": ["rich", "poor", "wealthy", "impoverished", "privileged"],
            "accessibility": ["see", "hear", "walk", "read", "write"]
        }
    
    def _load_quality_indicators(self) -> Dict[str, List[str]]:
        """Load quality indicator patterns"""
        return {
            "educational": ["analyze", "evaluate", "compare", "explain", "describe", "identify"],
            "higher_order": ["why", "how", "explain why", "what reasons", "analyze"],
            "application": ["apply", "use", "demonstrate", "implement", "solve"],
            "critical_thinking": ["evaluate", "assess", "judge", "critique", "justify"]
        }
    
    def _load_cognitive_alignment_patterns(self) -> Dict[str, List[str]]:
        """Load cognitive level alignment patterns"""
        return {
            "remember": [r"define\b", r"list\b", r"identify\b", r"name\b", r"recall\b"],
            "understand": [r"explain\b", r"describe\b", r"summarize\b", r"interpret\b"],
            "apply": [r"apply\b", r"use\b", r"demonstrate\b", r"implement\b"],
            "analyze": [r"analyze\b", r"compare\b", r"contrast\b", r"examine\b"],
            "evaluate": [r"evaluate\b", r"assess\b", r"judge\b", r"critique\b"],
            "create": [r"create\b", r"design\b", r"develop\b", r"formulate\b"]
        }