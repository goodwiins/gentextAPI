"""
Question Difficulty Scaling System

This module provides advanced difficulty scaling algorithms that adapt questions
to different learning levels and cognitive abilities.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
import re
import json
from datetime import datetime
import random
import math

from .base import (
    QuestionType,
    Difficulty,
    CognitiveLevel
)

logger = logging.getLogger(__name__)

class DifficultyAdjustment(Enum):
    """Types of difficulty adjustments"""
    VOCABULARY = "vocabulary"
    SENTENCE_COMPLEXITY = "sentence_complexity"
    CONCEPT_ABSTRACTION = "concept_abstraction"
    ANALYTICAL_DEPTH = "analytical_depth"
    BACKGROUND_KNOWLEDGE = "background_knowledge"
    COGNITIVE_LOAD = "cognitive_load"

class BloomLevel(Enum):
    """Bloom's Taxonomy levels with difficulty mapping"""
    REMEMBER = {"level": 1, "difficulty_range": (Difficulty.BEGINNER, Difficulty.INTERMEDIATE)}
    UNDERSTAND = {"level": 2, "difficulty_range": (Difficulty.BEGINNER, Difficulty.INTERMEDIATE)}
    APPLY = {"level": 3, "difficulty_range": (Difficulty.INTERMEDIATE, Difficulty.ADVANCED)}
    ANALYZE = {"level": 4, "difficulty_range": (Difficulty.INTERMEDIATE, Difficulty.ADVANCED)}
    EVALUATE = {"level": 5, "difficulty_range": (Difficulty.ADVANCED, Difficulty.EXPERT)}
    CREATE = {"level": 6, "difficulty_range": (Difficulty.ADVANCED, Difficulty.EXPERT)}

@dataclass
class DifficultyParameters:
    """Parameters for difficulty scaling"""
    vocabulary_level: float = 0.5  # 0-1, higher = more complex vocabulary
    sentence_complexity: float = 0.5  # 0-1, higher = more complex sentences
    abstraction_level: float = 0.5  # 0-1, higher = more abstract concepts
    analytical_depth: float = 0.5  # 0-1, higher = deeper analysis required
    background_knowledge: float = 0.5  # 0-1, higher = more prior knowledge needed
    cognitive_load: float = 0.5  # 0-1, higher = more mental effort required

@dataclass
class ScalingTarget:
    """Target difficulty for scaling"""
    target_difficulty: Difficulty
    cognitive_level: CognitiveLevel
    audience_level: str  # elementary, middle_school, high_school, undergraduate, graduate
    domain_familiarity: str  # none, basic, intermediate, advanced
    time_constraint: int  # seconds for answering
    
    def to_parameters(self) -> DifficultyParameters:
        """Convert target to difficulty parameters"""
        base_params = self._get_base_parameters()
        
        # Adjust based on audience level
        audience_adjustments = {
            "elementary": -0.3,
            "middle_school": -0.1,
            "high_school": 0.0,
            "undergraduate": 0.2,
            "graduate": 0.4
        }
        
        # Adjust based on domain familiarity
        familiarity_adjustments = {
            "none": -0.2,
            "basic": -0.1,
            "intermediate": 0.0,
            "advanced": 0.2
        }
        
        # Adjust based on time constraint
        time_adjustment = max(-0.2, (self.time_constraint - 60) / 300.0)  # Normalize to 5 minutes
        
        # Apply adjustments
        adjustment = (audience_adjustments.get(self.audience_level, 0) + 
                     familiarity_adjustments.get(self.domain_familiarity, 0) + 
                     time_adjustment)
        
        # Clamp values to 0-1 range
        return DifficultyParameters(
            vocabulary_level=max(0.0, min(1.0, base_params.vocabulary_level + adjustment)),
            sentence_complexity=max(0.0, min(1.0, base_params.sentence_complexity + adjustment)),
            abstraction_level=max(0.0, min(1.0, base_params.abstraction_level + adjustment)),
            analytical_depth=max(0.0, min(1.0, base_params.analytical_depth + adjustment)),
            background_knowledge=max(0.0, min(1.0, base_params.background_knowledge + adjustment)),
            cognitive_load=max(0.0, min(1.0, base_params.cognitive_load + adjustment))
        )
    
    def _get_base_parameters(self) -> DifficultyParameters:
        """Get base parameters for target difficulty"""
        difficulty_mapping = {
            Difficulty.BEGINNER: DifficultyParameters(0.2, 0.2, 0.2, 0.2, 0.2, 0.2),
            Difficulty.INTERMEDIATE: DifficultyParameters(0.5, 0.5, 0.5, 0.5, 0.5, 0.5),
            Difficulty.ADVANCED: DifficultyParameters(0.7, 0.7, 0.7, 0.7, 0.7, 0.7),
            Difficulty.EXPERT: DifficultyParameters(0.9, 0.9, 0.9, 0.9, 0.9, 0.9)
        }
        return difficulty_mapping.get(self.target_difficulty, DifficultyParameters())

class DifficultyScaler:
    """Advanced difficulty scaling system"""
    
    def __init__(self):
        self.vocabulary_levels = self._load_vocabulary_levels()
        self.complexity_patterns = self._load_complexity_patterns()
        self.cognitive_indicators = self._load_cognitive_indicators()
    
    async def scale_question(
        self,
        question: Dict[str, Any],
        target: ScalingTarget,
        content_analysis: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Scale a question to the target difficulty"""
        
        logger.info(f"Scaling question to {target.target_difficulty.value} difficulty")
        
        # Analyze current difficulty
        current_analysis = await self._analyze_question_difficulty(question)
        
        # Get target parameters
        target_params = target.to_parameters()
        
        # Apply scaling transformations
        scaled_question = await self._apply_scaling_transformations(
            question, current_analysis, target_params
        )
        
        # Validate and adjust
        validated_question = await self._validate_scaled_question(
            scaled_question, target, current_analysis
        )
        
        # Add scaling metadata
        validated_question["scaling_metadata"] = {
            "original_difficulty": current_analysis["difficulty_score"],
            "target_difficulty": target.target_difficulty.value,
            "scaling_applied": True,
            "scaling_parameters": target_params.__dict__,
            "scaled_at": datetime.now().isoformat(),
            "audience_level": target.audience_level,
            "domain_familiarity": target.domain_familiarity
        }
        
        return validated_question
    
    async def _analyze_question_difficulty(self, question: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze current question difficulty"""
        
        analysis = {
            "difficulty_score": 0.0,
            "vocabulary_complexity": 0.0,
            "sentence_complexity": 0.0,
            "conceptual_abstraction": 0.0,
            "analytical_depth": 0.0,
            "background_knowledge_required": 0.0,
            "cognitive_load": 0.0
        }
        
        # Analyze question text
        if "question" in question:
            question_text = question["question"]
            
            # Vocabulary complexity
            analysis["vocabulary_complexity"] = self._analyze_vocabulary_complexity(question_text)
            
            # Sentence complexity
            analysis["sentence_complexity"] = self._analyze_sentence_complexity(question_text)
            
            # Conceptual abstraction
            analysis["conceptual_abstraction"] = self._analyze_conceptual_abstraction(question_text)
            
            # Analytical depth
            analysis["analytical_depth"] = self._analyze_analytical_depth(question_text)
        
        # Analyze based on question type
        question_type = question.get("type", "unknown")
        if question_type == "multiple-choice" and "options" in question:
            analysis["cognitive_load"] = self._analyze_multiple_choice_load(question["options"])
        elif question_type == "short-answer":
            analysis["cognitive_load"] = self._analyze_short_answer_load(question)
        elif question_type == "fill-in-blank":
            analysis["cognitive_load"] = self._analyze_fill_blank_load(question)
        
        # Calculate overall difficulty score
        factors = [
            analysis["vocabulary_complexity"],
            analysis["sentence_complexity"],
            analysis["conceptual_abstraction"],
            analysis["analytical_depth"],
            analysis["background_knowledge_required"],
            analysis["cognitive_load"]
        ]
        analysis["difficulty_score"] = sum(factors) / len(factors)
        
        return analysis
    
    def _analyze_vocabulary_complexity(self, text: str) -> float:
        """Analyze vocabulary complexity"""
        
        words = re.findall(r'\b\w+\b', text.lower())
        if not words:
            return 0.0
        
        complex_words = 0
        for word in words:
            # Check against vocabulary levels
            word_complexity = self.vocabulary_levels.get(word, 0.5)
            if word_complexity > 0.6:
                complex_words += 1
        
        return min(1.0, complex_words / len(words))
    
    def _analyze_sentence_complexity(self, text: str) -> float:
        """Analyze sentence complexity"""
        
        sentences = re.split(r'[.!?]+', text)
        if not sentences:
            return 0.0
        
        total_complexity = 0.0
        for sentence in sentences:
            if not sentence.strip():
                continue
            
            words = sentence.split()
            
            # Sentence length factor
            length_factor = min(1.0, len(words) / 30.0)
            
            # Subordinate clauses factor
            subordinating_conjunctions = [
                "because", "although", "while", "since", "if", "unless", "until", "when"
            ]
            clause_count = sum(1 for word in words if word.lower() in subordinating_conjunctions)
            clause_factor = min(1.0, clause_count / 3.0)
            
            # Punctuation complexity
            punctuation = sentence.count(',') + sentence.count(';') + sentence.count(':')
            punctuation_factor = min(1.0, punctuation / 3.0)
            
            sentence_complexity = (length_factor + clause_factor + punctuation_factor) / 3.0
            total_complexity += sentence_complexity
        
        return total_complexity / len([s for s in sentences if s.strip()])
    
    def _analyze_conceptual_abstraction(self, text: str) -> float:
        """Analyze conceptual abstraction level"""
        
        abstraction_indicators = {
            "high": ["concept", "principle", "theory", "abstract", "metaphor", "symbolic"],
            "medium": ["idea", "notion", "conceptual", "theoretical", "philosophical"],
            "low": ["fact", "example", "instance", "specific", "concrete"]
        }
        
        words = text.lower().split()
        abstraction_score = 0.0
        
        for word in words:
            if word in abstraction_indicators["high"]:
                abstraction_score += 1.0
            elif word in abstraction_indicators["medium"]:
                abstraction_score += 0.5
            elif word in abstraction_indicators["low"]:
                abstraction_score += 0.1
        
        return min(1.0, abstraction_score / len(words) * 10)
    
    def _analyze_analytical_depth(self, text: str) -> float:
        """Analyze analytical depth required"""
        
        analytical_words = [
            "analyze", "compare", "contrast", "evaluate", "critique", "assess",
            "examine", "investigate", "determine", "justify", "explain why",
            "what reasons", "how does", "what factors", "what effects"
        ]
        
        text_lower = text.lower()
        analytical_count = sum(1 for word in analytical_words if word in text_lower)
        
        return min(1.0, analytical_count / 3.0)
    
    def _analyze_multiple_choice_load(self, options: List[str]) -> float:
        """Analyze cognitive load for multiple choice questions"""
        
        if not options:
            return 0.0
        
        # Base load from number of options
        base_load = min(1.0, (len(options) - 2) / 4.0)
        
        # Similarity between options increases load
        similarity_load = 0.0
        for i, opt1 in enumerate(options):
            for j, opt2 in enumerate(options[i+1:], i+1):
                similarity = self._calculate_text_similarity(opt1, opt2)
                similarity_load += similarity
        
        similarity_load = min(1.0, similarity_load / (len(options) * (len(options) - 1) / 2))
        
        return (base_load + similarity_load) / 2.0
    
    def _analyze_short_answer_load(self, question: Dict[str, Any]) -> float:
        """Analyze cognitive load for short answer questions"""
        
        base_load = 0.6  # Short answer inherently requires more cognitive load
        
        # Adjust based on expected length
        expected_length = question.get("expected_length", {})
        if isinstance(expected_length, dict):
            max_length = expected_length.get("max", 100)
            length_factor = min(1.0, max_length / 200.0)
        else:
            length_factor = 0.5
        
        # Adjust based on analytical requirements
        question_text = question.get("question", "")
        analytical_factor = self._analyze_analytical_depth(question_text)
        
        return (base_load + length_factor + analytical_factor) / 3.0
    
    def _analyze_fill_blank_load(self, question: Dict[str, Any]) -> float:
        """Analyze cognitive load for fill-in-blank questions"""
        
        base_load = 0.4
        
        # Check if word bank is provided (reduces load)
        word_bank = question.get("word_bank", [])
        if word_bank:
            bank_factor = 0.2  # Word bank reduces cognitive load
        else:
            bank_factor = 0.8  # No word bank increases load
        
        # Check for hints
        hint = question.get("hint")
        hint_factor = 0.3 if hint else 1.0
        
        return base_load * bank_factor * hint_factor
    
    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts (simplified)"""
        
        # Simple word overlap similarity
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union)
    
    async def _apply_scaling_transformations(
        self,
        question: Dict[str, Any],
        current_analysis: Dict[str, Any],
        target_params: DifficultyParameters
    ) -> Dict[str, Any]:
        """Apply scaling transformations to question"""
        
        scaled_question = question.copy()
        
        # Apply vocabulary scaling
        scaled_question = await self._scale_vocabulary(
            scaled_question, current_analysis["vocabulary_complexity"], target_params.vocabulary_level
        )
        
        # Apply sentence complexity scaling
        scaled_question = await self._scale_sentence_complexity(
            scaled_question, current_analysis["sentence_complexity"], target_params.sentence_complexity
        )
        
        # Apply analytical depth scaling
        scaled_question = await self._scale_analytical_depth(
            scaled_question, current_analysis["analytical_depth"], target_params.analytical_depth
        )
        
        # Apply question type specific scaling
        question_type = question.get("type", "unknown")
        if question_type == "multiple-choice":
            scaled_question = await self._scale_multiple_choice(
                scaled_question, current_analysis, target_params
            )
        elif question_type == "short-answer":
            scaled_question = await self._scale_short_answer(
                scaled_question, current_analysis, target_params
            )
        elif question_type == "fill-in-blank":
            scaled_question = await self._scale_fill_blank(
                scaled_question, current_analysis, target_params
            )
        
        return scaled_question
    
    async def _scale_vocabulary(
        self,
        question: Dict[str, Any],
        current_level: float,
        target_level: float
    ) -> Dict[str, Any]:
        """Scale vocabulary complexity"""
        
        if abs(current_level - target_level) < 0.1:
            return question  # No significant change needed
        
        if "question" in question:
            question_text = question["question"]
            
            if target_level > current_level:
                # Increase vocabulary complexity
                question_text = self._increase_vocabulary_complexity(question_text)
            else:
                # Decrease vocabulary complexity
                question_text = self._decrease_vocabulary_complexity(question_text)
            
            question["question"] = question_text
        
        return question
    
    def _increase_vocabulary_complexity(self, text: str) -> str:
        """Increase vocabulary complexity"""
        
        # Simple word substitution (in production, use thesaurus API)
        substitutions = {
            "important": "crucial",
            "big": "substantial",
            "good": "optimal",
            "bad": "detrimental",
            "show": "demonstrate",
            "tell": "articulate",
            "help": "facilitate",
            "use": "utilize",
            "make": "fabricate",
            "get": "acquire"
        }
        
        for simple, complex_word in substitutions.items():
            text = re.sub(r'\b' + simple + r'\b', complex_word, text, flags=re.IGNORECASE)
        
        return text
    
    def _decrease_vocabulary_complexity(self, text: str) -> str:
        """Decrease vocabulary complexity"""
        
        # Simple word substitution to simpler terms
        substitutions = {
            "utilize": "use",
            "demonstrate": "show",
            "articulate": "tell",
            "facilitate": "help",
            "substantial": "big",
            "crucial": "important",
            "optimal": "best",
            "detrimental": "bad",
            "fabricate": "make",
            "acquire": "get"
        }
        
        for complex_word, simple in substitutions.items():
            text = re.sub(r'\b' + complex_word + r'\b', simple, text, flags=re.IGNORECASE)
        
        return text
    
    async def _scale_sentence_complexity(
        self,
        question: Dict[str, Any],
        current_level: float,
        target_level: float
    ) -> Dict[str, Any]:
        """Scale sentence complexity"""
        
        if abs(current_level - target_level) < 0.1:
            return question
        
        if "question" in question:
            question_text = question["question"]
            
            if target_level > current_level:
                # Increase sentence complexity
                question_text = self._increase_sentence_complexity(question_text)
            else:
                # Decrease sentence complexity
                question_text = self._decrease_sentence_complexity(question_text)
            
            question["question"] = question_text
        
        return question
    
    def _increase_sentence_complexity(self, text: str) -> str:
        """Increase sentence complexity"""
        
        # Add subordinate clauses
        complex_patterns = [
            (r"(\w+)", r"\1, which is essential,"),
            (r"(\w+ is)", r"\1 not only important but also"),
            (r"(\w+ can)", r"\1 can effectively")
        ]
        
        for pattern, replacement in complex_patterns:
            if random.random() < 0.3:  # Apply some patterns randomly
                text = re.sub(pattern, replacement, text, count=1)
        
        return text
    
    def _decrease_sentence_complexity(self, text: str) -> str:
        """Decrease sentence complexity"""
        
        # Break complex sentences
        text = re.sub(r',\s*which\s+\w+,\s*', ', ', text)
        text = re.sub(r'\s+not only\s+\w+\s+but also\s+\w+', '', text)
        
        # Ensure proper punctuation
        text = re.sub(r'\s+', ' ', text)  # Remove extra spaces
        text = text.strip()
        
        return text
    
    async def _scale_analytical_depth(
        self,
        question: Dict[str, Any],
        current_level: float,
        target_level: float
    ) -> Dict[str, Any]:
        """Scale analytical depth"""
        
        if abs(current_level - target_level) < 0.1:
            return question
        
        if "question" in question:
            question_text = question["question"]
            
            if target_level > current_level:
                # Increase analytical depth
                question_text = self._increase_analytical_depth(question_text)
            else:
                # Decrease analytical depth
                question_text = self._decrease_analytical_depth(question_text)
            
            question["question"] = question_text
        
        return question
    
    def _increase_analytical_depth(self, text: str) -> str:
        """Increase analytical depth"""
        
        analytical_prefixes = [
            "Analyze the relationship between ",
            "Evaluate the importance of ",
            "Compare and contrast ",
            "Examine the factors that influence ",
            "Critically assess ",
            "Investigate the mechanisms behind "
        ]
        
        # Replace simple questions with analytical ones
        simple_patterns = [
            (r"What is (\w+)", random.choice(analytical_prefixes) + r"\1"),
            (r"Describe (\w+)", "Analyze the characteristics and significance of \1"),
            (r"Explain (\w+)", "Explain the underlying principles of \1 and its implications")
        ]
        
        for pattern, replacement in simple_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                text = re.sub(pattern, replacement, text, flags=re.IGNORECASE, count=1)
                break
        
        return text
    
    def _decrease_analytical_depth(self, text: str) -> str:
        """Decrease analytical depth"""
        
        # Simplify analytical questions
        simplification_patterns = [
            (r"Analyze the relationship between (\w+)", r"What is \1"),
            (r"Evaluate the importance of (\w+)", r"Why is \1 important"),
            (r"Compare and contrast (\w+)", r"What are the differences between \1"),
            (r"Examine the factors that influence (\w+)", r"What affects \1"),
            (r"Critically assess (\w+)", r"Is \1 good or bad")
        ]
        
        for pattern, replacement in simplification_patterns:
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        
        return text
    
    async def _scale_multiple_choice(
        self,
        question: Dict[str, Any],
        current_analysis: Dict[str, Any],
        target_params: DifficultyParameters
    ) -> Dict[str, Any]:
        """Scale multiple choice question difficulty"""
        
        if "options" in question:
            options = question["options"]
            
            # Adjust option similarity based on cognitive load target
            if target_params.cognitive_load > current_analysis["cognitive_load"]:
                # Make options more similar to increase difficulty
                options = self._increase_option_similarity(options)
            else:
                # Make options more distinct to decrease difficulty
                options = self._decrease_option_similarity(options)
            
            question["options"] = options
        
        return question
    
    def _increase_option_similarity(self, options: List[str]) -> List[str]:
        """Make multiple choice options more similar"""
        
        # Add similar prefixes or suffixes
        similar_patterns = [
            "The process of {}",
            "{} involves",
            "{} results in",
            "{} is characterized by"
        ]
        
        pattern = random.choice(similar_patterns)
        return [pattern.format(opt) for opt in options]
    
    def _decrease_option_similarity(self, options: List[str]) -> List[str]:
        """Make multiple choice options more distinct"""
        
        # Ensure options are clearly different
        return [opt.split()[0] if " " in opt else opt for opt in options]
    
    async def _scale_short_answer(
        self,
        question: Dict[str, Any],
        current_analysis: Dict[str, Any],
        target_params: DifficultyParameters
    ) -> Dict[str, Any]:
        """Scale short answer question difficulty"""
        
        # Adjust expected length
        if "expected_length" in question:
            expected_length = question["expected_length"]
            if isinstance(expected_length, dict):
                if target_params.cognitive_load > current_analysis["cognitive_load"]:
                    # Increase expected length
                    expected_length["max"] = min(300, expected_length["max"] + 50)
                    expected_length["min"] = min(200, expected_length["min"] + 30)
                else:
                    # Decrease expected length
                    expected_length["max"] = max(50, expected_length["max"] - 30)
                    expected_length["min"] = max(20, expected_length["min"] - 20)
        
        return question
    
    async def _scale_fill_blank(
        self,
        question: Dict[str, Any],
        current_analysis: Dict[str, Any],
        target_params: DifficultyParameters
    ) -> Dict[str, Any]:
        """Scale fill-in-blank question difficulty"""
        
        # Adjust word bank
        if target_params.cognitive_load > current_analysis["cognitive_load"]:
            # Remove word bank to increase difficulty
            if "word_bank" in question:
                del question["word_bank"]
            if "hint" in question:
                del question["hint"]
        else:
            # Add word bank to decrease difficulty
            if "word_bank" not in question and "correct_answer" in question:
                # Create simple word bank
                correct_answer = question["correct_answer"]
                question["word_bank"] = [correct_answer, "alternative", "option", "choice"]
        
        return question
    
    async def _validate_scaled_question(
        self,
        question: Dict[str, Any],
        target: ScalingTarget,
        current_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate scaled question meets target requirements"""
        
        # Re-analyze difficulty
        new_analysis = await self._analyze_question_difficulty(question)
        
        # Check if scaling was effective
        target_difficulty_value = {
            Difficulty.BEGINNER: 0.25,
            Difficulty.INTERMEDIATE: 0.5,
            Difficulty.ADVANCED: 0.75,
            Difficulty.EXPERT: 0.9
        }[target.target_difficulty]
        
        tolerance = 0.15  # Allow 15% tolerance
        
        if abs(new_analysis["difficulty_score"] - target_difficulty_value) > tolerance:
            # If scaling wasn't effective, apply additional adjustments
            question = await self._apply_additional_adjustments(question, target, new_analysis)
        
        return question
    
    async def _apply_additional_adjustments(
        self,
        question: Dict[str, Any],
        target: ScalingTarget,
        analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply additional adjustments if scaling wasn't sufficient"""
        
        target_difficulty_value = {
            Difficulty.BEGINNER: 0.25,
            Difficulty.INTERMEDIATE: 0.5,
            Difficulty.ADVANCED: 0.75,
            Difficulty.EXPERT: 0.9
        }[target.target_difficulty]
        
        if analysis["difficulty_score"] < target_difficulty_value:
            # Need to increase difficulty further
            question = await self._increase_difficulty_further(question)
        else:
            # Need to decrease difficulty further
            question = await self._decrease_difficulty_further(question)
        
        return question
    
    async def _increase_difficulty_further(self, question: Dict[str, Any]) -> Dict[str, Any]:
        """Apply additional difficulty increases"""
        
        if "question" in question:
            question_text = question["question"]
            
            # Add complexity modifiers
            complexity_modifiers = [
                "Considering multiple factors, ",
                "From a comprehensive perspective, ",
                "Taking into account various aspects, ",
                "In the context of advanced understanding, "
            ]
            
            modifier = random.choice(complexity_modifiers)
            question["question"] = modifier + question_text.lower()
        
        return question
    
    async def _decrease_difficulty_further(self, question: Dict[str, Any]) -> Dict[str, Any]:
        """Apply additional difficulty decreases"""
        
        if "question" in question:
            question_text = question["question"]
            
            # Remove complex modifiers
            question_text = re.sub(r'Considering multiple factors,\s*', '', question_text)
            question_text = re.sub(r'From a comprehensive perspective,\s*', '', question_text)
            question_text = re.sub(r'Taking into account various aspects,\s*', '', question_text)
            
            question["question"] = question_text
        
        return question
    
    def _load_vocabulary_levels(self) -> Dict[str, float]:
        """Load vocabulary complexity levels"""
        # Simplified vocabulary complexity mapping
        return {
            "simple": 0.1, "basic": 0.2, "easy": 0.1, "hard": 0.8, "difficult": 0.9,
            "complex": 0.9, "analyze": 0.7, "evaluate": 0.8, "synthesize": 0.9,
            "understand": 0.4, "remember": 0.2, "apply": 0.5, "create": 0.8
        }
    
    def _load_complexity_patterns(self) -> Dict[str, Any]:
        """Load linguistic complexity patterns"""
        return {
            "subordinating_conjunctions": [
                "because", "although", "while", "since", "if", "unless", "until", "when"
            ],
            "coordinating_conjunctions": ["and", "but", "or", "so", "for", "yet", "nor"],
            "punctuation_complexity": [",", ";", ":", "(", ")", "[", "]"]
        }
    
    def _load_cognitive_indicators(self) -> Dict[str, List[str]]:
        """Load cognitive level indicators"""
        return {
            "analytical": ["analyze", "compare", "contrast", "evaluate", "critique"],
            "conceptual": ["concept", "principle", "theory", "abstract", "metaphor"],
            "procedural": ["process", "procedure", "steps", "method", "algorithm"],
            "factual": ["fact", "example", "instance", "specific", "concrete"]
        }