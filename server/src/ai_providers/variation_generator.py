"""
Question Variation Generation System

This module provides advanced question variation generation capabilities,
creating multiple versions of questions that test the same concepts in different ways.
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
import string

from .base import (
    QuestionType,
    Difficulty,
    CognitiveLevel
)

logger = logging.getLogger(__name__)

class VariationType(Enum):
    """Types of question variations"""
    ANGLE_CHANGE = "angle_change"              # Different perspective/approach
    DEPTH_ADJUSTMENT = "depth_adjustment"      # Different depth/complexity
    CONTEXT_SHIFT = "context_shift"            # Different context/scenario
    FORMAT_CHANGE = "format_change"            # Different question format
    SCOPE_MODIFICATION = "scope_modification"  # Broader or narrower scope
    COGNITIVE_LEVEL_SHIFT = "cognitive_shift" # Different Bloom's level
    APPLICATION_FOCUS = "application_focus"    # Focus on real-world application
    ANALYTICAL_FOCUS = "analytical_focus"      # Focus on analysis and evaluation

class VariationStrategy(Enum):
    """Strategies for generating variations"""
    SYNONYM_REPLACEMENT = "synonym_replacement"
    STRUCTURE_RESTRUCTURING = "structure_restructuring"
    PERSPECTIVE_CHANGING = "perspective_changing"
    CONTEXTUAL_ADAPTATION = "contextual_adaptation"
    COGNITIVE_LEVEL_MAPPING = "cognitive_level_mapping"
    DOMAIN_SPECIFIC_VARIATION = "domain_specific_variation"

@dataclass
class VariationConstraint:
    """Constraints for variation generation"""
    preserve_core_concept: bool = True
    maintain_difficulty: bool = True
    keep_question_type: bool = False
    maximum_variation_distance: float = 0.7
    semantic_similarity_threshold: float = 0.6
    allow_cognitive_level_change: bool = True
    domain_consistency: bool = True

@dataclass
class VariationMetadata:
    """Metadata for generated variations"""
    variation_id: str
    original_question_id: str
    variation_type: VariationType
    variation_strategy: VariationStrategy
    transformation_applied: str
    semantic_similarity: float
    difficulty_change: float
    cognitive_level_change: Optional[str] = None
    quality_score: float = 0.0
    generated_at: str = field(default_factory=lambda: datetime.now().isoformat())

@dataclass
class VariationGenerationConfig:
    """Configuration for variation generation"""
    max_variations_per_question: int = 5
    variation_types: List[VariationType] = field(default_factory=lambda: [
        VariationType.ANGLE_CHANGE,
        VariationType.DEPTH_ADJUSTMENT,
        VariationType.CONTEXT_SHIFT,
        VariationType.COGNITIVE_LEVEL_SHIFT
    ])
    strategies: List[VariationStrategy] = field(default_factory=lambda: [
        VariationStrategy.SYNONYM_REPLACEMENT,
        VariationStrategy.STRUCTURE_RESTRUCTURING,
        VariationStrategy.PERSPECTIVE_CHANGING
    ])
    constraints: VariationConstraint = field(default_factory=VariationConstraint)
    quality_threshold: float = 0.7
    enable_diversity_scoring: bool = True
    preserve_learning_objectives: bool = True

class QuestionVariationGenerator:
    """Advanced question variation generator"""
    
    def __init__(self, config: VariationGenerationConfig = None):
        self.config = config or VariationGenerationConfig()
        self.variation_templates = self._load_variation_templates()
        self.cognitive_level_mappings = self._load_cognitive_level_mappings()
        self.synonym_maps = self._load_synonym_maps()
        self.perspective_patterns = self._load_perspective_patterns()
        
    async def generate_variations(
        self,
        question: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
        variation_count: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Generate multiple variations of a question"""
        
        question_id = question.get("id", "unknown")
        logger.info(f"Generating variations for question {question_id}")
        
        if variation_count is None:
            variation_count = self.config.max_variations_per_question
        
        variations = []
        used_types = set()
        
        # Generate variations using different strategies
        for i in range(min(variation_count, len(self.config.variation_types))):
            variation_type = self.config.variation_types[i]
            
            if variation_type in used_types:
                continue  # Avoid duplicate variation types
            
            try:
                variation = await self._generate_single_variation(
                    question, variation_type, context
                )
                
                if variation:
                    variations.append(variation)
                    used_types.add(variation_type)
                    
            except Exception as e:
                logger.warning(f"Failed to generate {variation_type.value} variation: {e}")
                continue
        
        # If we need more variations, generate additional ones
        while len(variations) < variation_count:
            additional_variation = await self._generate_additional_variation(
                question, variations, context
            )
            if additional_variation:
                variations.append(additional_variation)
            else:
                break
        
        logger.info(f"Generated {len(variations)} variations for question {question_id}")
        return variations
    
    async def _generate_single_variation(
        self,
        question: Dict[str, Any],
        variation_type: VariationType,
        context: Optional[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Generate a single variation using specific type"""
        
        question_id = question.get("id", "unknown")
        original_text = question.get("question", "")
        
        # Select appropriate strategy for variation type
        strategy = self._select_strategy_for_type(variation_type)
        
        # Generate variation
        if variation_type == VariationType.ANGLE_CHANGE:
            variation_text = await self._generate_angle_variation(original_text, strategy)
        elif variation_type == VariationType.DEPTH_ADJUSTMENT:
            variation_text = await self._generate_depth_variation(original_text, strategy)
        elif variation_type == VariationType.CONTEXT_SHIFT:
            variation_text = await self._generate_context_variation(original_text, strategy, context)
        elif variation_type == VariationType.COGNITIVE_LEVEL_SHIFT:
            variation_text = await self._generate_cognitive_variation(original_text, strategy, question)
        else:
            variation_text = await self._generate_generic_variation(original_text, strategy)
        
        if not variation_text:
            return None
        
        # Create variation question
        variation_question = question.copy()
        variation_question["id"] = f"{question_id}_var_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{random.randint(1000, 9999)}"
        variation_question["question"] = variation_text
        variation_question["is_variation"] = True
        variation_question["original_question_id"] = question_id
        
        # Add variation metadata
        semantic_similarity = self._calculate_semantic_similarity(original_text, variation_text)
        difficulty_change = self._calculate_difficulty_change(question, variation_question)
        
        variation_metadata = VariationMetadata(
            variation_id=variation_question["id"],
            original_question_id=question_id,
            variation_type=variation_type,
            variation_strategy=strategy,
            transformation_applied=self._describe_transformation(variation_type),
            semantic_similarity=semantic_similarity,
            difficulty_change=difficulty_change,
            cognitive_level_change=self._get_cognitive_level_change(question, variation_question)
        )
        
        variation_question["variation_metadata"] = variation_metadata.__dict__
        
        # Validate variation quality
        quality_score = await self._validate_variation_quality(variation_question, question)
        if quality_score < self.config.quality_threshold:
            logger.info(f"Variation quality score {quality_score:.2f} below threshold {self.config.quality_threshold}")
            return None
        
        variation_metadata.quality_score = quality_score
        
        return variation_question
    
    async def _generate_angle_variation(self, original_text: str, strategy: VariationStrategy) -> Optional[str]:
        """Generate variation with different angle/perspective"""
        
        angle_patterns = {
            VariationStrategy.SYNONYM_REPLACEMENT: [
                (r"What is (\w+)", r"Define the concept of {}"),
                (r"Describe (\w+)", r"Explain the characteristics of {}"),
                (r"Explain (\w+)", r"Elaborate on the principles of {}"),
                (r"How does (\w+) work", r"What is the mechanism behind {}")
            ],
            VariationStrategy.STRUCTURE_RESTRUCTURING: [
                (r"What are the (\w+) of (\w+)", r"How do {} relate to {}"),
                (r"Describe the (\w+)", r"What are the key features of {}"),
                (r"Explain why (\w+)", r"What are the reasons for {}"),
                (r"How to (\w+)", r"What is the process for {}")
            ],
            VariationStrategy.PERSPECTIVE_CHANGING: [
                (r"What is (\w+)", r"From a practical standpoint, what is {}"),
                (r"Describe (\w+)", r"From an analytical perspective, describe {}"),
                (r"Explain (\w+)", r"In the context of real-world applications, explain {}"),
                (r"Why is (\w+) important", r"From an educational viewpoint, why is {} important")
            ]
        }
        
        patterns = angle_patterns.get(strategy, angle_patterns[VariationStrategy.SYNONYM_REPLACEMENT])
        
        for pattern, replacement in patterns:
            if re.search(pattern, original_text, re.IGNORECASE):
                try:
                    # Extract the matched group
                    match = re.search(pattern, original_text, re.IGNORECASE)
                    if match:
                        # Apply the transformation
                        if "{}" in replacement:
                            variation_text = replacement.format(match.group(1))
                        else:
                            variation_text = replacement + " " + match.group(1)
                        
                        # Ensure question ends with question mark
                        if not variation_text.endswith("?"):
                            variation_text += "?"
                        
                        return variation_text
                except Exception as e:
                    logger.warning(f"Failed to apply angle pattern {pattern}: {e}")
                    continue
        
        # Fallback to generic variation
        return await self._generate_generic_variation(original_text, strategy)
    
    async def _generate_depth_variation(self, original_text: str, strategy: VariationStrategy) -> Optional[str]:
        """Generate variation with different depth/complexity"""
        
        depth_patterns = {
            VariationStrategy.SYNONYM_REPLACEMENT: [
                (r"What is (\w+)", r"What are the fundamental principles of {}"),
                (r"Describe (\w+)", r"Provide a detailed analysis of {}"),
                (r"Explain (\w+)", r"Explain the underlying mechanisms of {}"),
                (r"How does (\w+) work", r"Explain the step-by-step process of how {} works")
            ],
            VariationStrategy.STRUCTURE_RESTRUCTURING: [
                (r"What is (\w+)", r"Considering multiple factors, what is {}"),
                (r"Describe (\w+)", r"Analyze and describe the various aspects of {}"),
                (r"Explain (\w+)", r"Provide a comprehensive explanation of {} including its components"),
                (r"Why (\w+)", r"What are the primary and secondary reasons for {}")
            ]
        }
        
        patterns = depth_patterns.get(strategy, depth_patterns[VariationStrategy.SYNONYM_REPLACEMENT])
        
        for pattern, replacement in patterns:
            if re.search(pattern, original_text, re.IGNORECASE):
                try:
                    match = re.search(pattern, original_text, re.IGNORECASE)
                    if match:
                        if "{}" in replacement:
                            variation_text = replacement.format(match.group(1))
                        else:
                            variation_text = replacement + " " + match.group(1)
                        
                        if not variation_text.endswith("?"):
                            variation_text += "?"
                        
                        return variation_text
                except Exception as e:
                    logger.warning(f"Failed to apply depth pattern {pattern}: {e}")
                    continue
        
        return await self._generate_generic_variation(original_text, strategy)
    
    async def _generate_context_variation(
        self, 
        original_text: str, 
        strategy: VariationStrategy,
        context: Optional[Dict[str, Any]]
    ) -> Optional[str]:
        """Generate variation with different context/scenario"""
        
        if not context:
            return await self._generate_generic_variation(original_text, strategy)
        
        # Extract domain or topic from context
        domain = context.get("domain", "general")
        topic = context.get("topic", "this subject")
        
        context_patterns = {
            VariationStrategy.CONTEXTUAL_ADAPTATION: [
                (r"What is (\w+)", f"In the context of {domain}, what is {{}}"),
                (r"Describe (\w+)", f"Within the field of {domain}, describe {{}}"),
                (r"Explain (\w+)", f"Considering principles of {domain}, explain {{}}"),
                (r"How does (\w+) work", f"In practical applications within {domain}, how does {{}} work")
            ],
            VariationStrategy.PERSPECTIVE_CHANGING: [
                (r"What is (\w+)", f"From the perspective of a {domain} professional, what is {{}}"),
                (r"Describe (\w+)", f"As someone studying {domain}, describe {{}}"),
                (r"Explain (\w+)", f"In real-world {domain} scenarios, explain {{}}"),
                (r"Why is (\w+) important", f"Why is {{}} particularly important in {domain}")
            ]
        }
        
        patterns = context_patterns.get(strategy, context_patterns[VariationStrategy.CONTEXTUAL_ADAPTATION])
        
        for pattern, replacement in patterns:
            if re.search(pattern, original_text, re.IGNORECASE):
                try:
                    match = re.search(pattern, original_text, re.IGNORECASE)
                    if match:
                        if "{}" in replacement:
                            variation_text = replacement.format(match.group(1))
                        else:
                            variation_text = replacement + " " + match.group(1)
                        
                        if not variation_text.endswith("?"):
                            variation_text += "?"
                        
                        return variation_text
                except Exception as e:
                    logger.warning(f"Failed to apply context pattern {pattern}: {e}")
                    continue
        
        return await self._generate_generic_variation(original_text, strategy)
    
    async def _generate_cognitive_variation(
        self,
        original_text: str,
        strategy: VariationStrategy,
        original_question: Dict[str, Any]
    ) -> Optional[str]:
        """Generate variation with different cognitive level"""
        
        current_level = original_question.get("cognitive_level", "understand")
        
        # Get target cognitive levels (different from current)
        target_levels = [level for level in ["remember", "understand", "apply", "analyze", "evaluate", "create"] 
                        if level != current_level]
        
        if not target_levels:
            return None
        
        target_level = random.choice(target_levels)
        
        cognitive_patterns = self.cognitive_level_mappings.get(target_level, [])
        
        for pattern, replacement in cognitive_patterns:
            if re.search(pattern, original_text, re.IGNORECASE):
                try:
                    match = re.search(pattern, original_text, re.IGNORECASE)
                    if match and match.groups():
                        # Apply the cognitive level transformation
                        if "{}" in replacement:
                            variation_text = replacement.format(*match.groups())
                        else:
                            variation_text = replacement + " " + match.group(0)
                        
                        if not variation_text.endswith("?"):
                            variation_text += "?"
                        
                        return variation_text
                except Exception as e:
                    logger.warning(f"Failed to apply cognitive pattern {pattern}: {e}")
                    continue
        
        # Fallback: use generic variation with cognitive level prefix
        cognitive_prefixes = {
            "remember": "Recall and identify: ",
            "understand": "Explain in your own words: ",
            "apply": "Apply this knowledge: ",
            "analyze": "Analyze the components of: ",
            "evaluate": "Evaluate and assess: ",
            "create": "Design or create: "
        }
        
        prefix = cognitive_prefixes.get(target_level, "")
        variation_text = prefix + original_text
        
        # Remove duplicate question marks
        variation_text = re.sub(r'\?+\?', '?', variation_text)
        
        return variation_text
    
    async def _generate_generic_variation(self, original_text: str, strategy: VariationStrategy) -> Optional[str]:
        """Generate generic variation using specified strategy"""
        
        if strategy == VariationStrategy.SYNONYM_REPLACEMENT:
            return self._apply_synonym_replacement(original_text)
        elif strategy == VariationStrategy.STRUCTURE_RESTRUCTURING:
            return self._apply_structure_restructuring(original_text)
        elif strategy == VariationStrategy.PERSPECTIVE_CHANGING:
            return self._apply_perspective_changing(original_text)
        else:
            return original_text  # Return original as fallback
    
    def _apply_synonym_replacement(self, text: str) -> str:
        """Apply synonym replacement to create variation"""
        
        variation_text = text
        
        # Apply synonym mappings
        for original, synonyms in self.synonym_maps.items():
            if original.lower() in variation_text.lower():
                # Select random synonym
                if synonyms:
                    synonym = random.choice(synonyms)
                    # Replace with proper capitalization
                    pattern = re.compile(r'\b' + re.escape(original) + r'\b', re.IGNORECASE)
                    variation_text = pattern.sub(synonym, variation_text)
        
        return variation_text
    
    def _apply_structure_restructuring(self, text: str) -> str:
        """Apply structure restructuring to create variation"""
        
        # Common restructuring patterns
        restructuring_patterns = [
            (r"What is (\w+)", r"Define the concept of {}"),
            (r"Describe (\w+)", r"What are the main characteristics of {}"),
            (r"Explain (\w+)", r"How would you describe {}"),
            (r"Why is (\w+)", r"What are the reasons that {} is important"),
            (r"How does (\w+) work", r"What is the process by which {} works"),
            (r"What are the (\w+) of (\w+)", r"How do {} relate to {}"),
            (r"Compare (\w+) and (\w+)", r"What are the similarities and differences between {} and {}")
        ]
        
        for pattern, replacement in restructuring_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                try:
                    match = re.search(pattern, text, re.IGNORECASE)
                    if match:
                        if "{}" in replacement:
                            variation_text = replacement.format(*match.groups())
                        else:
                            variation_text = replacement + " " + match.group(0)
                        
                        if not variation_text.endswith("?"):
                            variation_text += "?"
                        
                        return variation_text
                except Exception:
                    continue
        
        return text  # Return original if no pattern matches
    
    def _apply_perspective_changing(self, text: str) -> str:
        """Apply perspective changing to create variation"""
        
        perspective_prefixes = [
            "From a practical perspective, ",
            "In real-world applications, ",
            "Considering the theoretical framework, ",
            "From an analytical viewpoint, ",
            "In the context of everyday life, ",
            "From an educational standpoint, "
        ]
        
        prefix = random.choice(perspective_prefixes)
        variation_text = prefix + text
        
        # Ensure proper capitalization
        if variation_text.strip():
            variation_text = variation_text[0].upper() + variation_text[1:]
        
        return variation_text
    
    def _select_strategy_for_type(self, variation_type: VariationType) -> VariationStrategy:
        """Select appropriate strategy for variation type"""
        
        strategy_mapping = {
            VariationType.ANGLE_CHANGE: VariationStrategy.PERSPECTIVE_CHANGING,
            VariationType.DEPTH_ADJUSTMENT: VariationStrategy.STRUCTURE_RESTRUCTURING,
            VariationType.CONTEXT_SHIFT: VariationStrategy.CONTEXTUAL_ADAPTATION,
            VariationType.COGNITIVE_LEVEL_SHIFT: VariationStrategy.COGNITIVE_LEVEL_MAPPING,
            VariationType.FORMAT_CHANGE: VariationStrategy.STRUCTURE_RESTRUCTURING,
            VariationType.APPLICATION_FOCUS: VariationStrategy.PERSPECTIVE_CHANGING,
            VariationType.ANALYTICAL_FOCUS: VariationStrategy.STRUCTURE_RESTRUCTURING
        }
        
        return strategy_mapping.get(variation_type, VariationStrategy.SYNONYM_REPLACEMENT)
    
    def _calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity between two texts (simplified)"""
        
        # Simple word overlap similarity
        words1 = set(re.findall(r'\b\w+\b', text1.lower()))
        words2 = set(re.findall(r'\b\w+\b', text2.lower()))
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union)
    
    def _calculate_difficulty_change(self, original: Dict[str, Any], variation: Dict[str, Any]) -> float:
        """Calculate change in difficulty between original and variation"""
        
        # Simplified difficulty calculation based on text complexity
        original_text = original.get("question", "")
        variation_text = variation.get("question", "")
        
        original_complexity = self._calculate_text_complexity(original_text)
        variation_complexity = self._calculate_text_complexity(variation_text)
        
        return variation_complexity - original_complexity
    
    def _calculate_text_complexity(self, text: str) -> float:
        """Calculate text complexity score"""
        
        words = text.split()
        sentences = re.split(r'[.!?]+', text)
        
        # Average sentence length
        avg_sentence_length = len(words) / max(len([s for s in sentences if s.strip()]), 1)
        
        # Complex word ratio
        complex_words = len([w for w in words if len(w) > 7])
        complex_ratio = complex_words / max(len(words), 1)
        
        # Normalize to 0-1 scale
        complexity_score = (avg_sentence_length / 20.0 + complex_ratio) / 2.0
        return min(1.0, max(0.0, complexity_score))
    
    def _get_cognitive_level_change(self, original: Dict[str, Any], variation: Dict[str, Any]) -> Optional[str]:
        """Get the cognitive level change between original and variation"""
        
        original_level = original.get("cognitive_level")
        variation_level = variation.get("cognitive_level")
        
        if original_level and variation_level and original_level != variation_level:
            return f"{original_level} → {variation_level}"
        
        return None
    
    def _describe_transformation(self, variation_type: VariationType) -> str:
        """Describe the transformation applied"""
        
        descriptions = {
            VariationType.ANGLE_CHANGE: "Changed question angle and perspective",
            VariationType.DEPTH_ADJUSTMENT: "Adjusted question depth and complexity",
            VariationType.CONTEXT_SHIFT: "Shifted question context and scenario",
            VariationType.FORMAT_CHANGE: "Changed question format and structure",
            VariationType.SCOPE_MODIFICATION: "Modified question scope and focus",
            VariationType.COGNITIVE_LEVEL_SHIFT: "Shifted cognitive level requirements",
            VariationType.APPLICATION_FOCUS: "Focused on real-world application",
            VariationType.ANALYTICAL_FOCUS: "Emphasized analytical thinking"
        }
        
        return descriptions.get(variation_type, "Applied variation transformation")
    
    async def _validate_variation_quality(self, variation: Dict[str, Any], original: Dict[str, Any]) -> float:
        """Validate variation quality and return score"""
        
        score = 0.0
        
        # Check semantic similarity (should be similar but not identical)
        original_text = original.get("question", "")
        variation_text = variation.get("question", "")
        
        similarity = self._calculate_semantic_similarity(original_text, variation_text)
        
        if 0.3 <= similarity <= 0.8:  # Good range for variation
            score += 0.4
        elif 0.2 <= similarity <= 0.9:  # Acceptable range
            score += 0.2
        
        # Check text length appropriateness
        if 10 <= len(variation_text) <= 300:
            score += 0.2
        
        # Check for question structure
        if variation_text.endswith("?"):
            score += 0.2
        
        # Check that variation is different from original
        if variation_text.lower() != original_text.lower():
            score += 0.2
        
        return min(1.0, score)
    
    async def _generate_additional_variation(
        self,
        question: Dict[str, Any],
        existing_variations: List[Dict[str, Any]],
        context: Optional[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Generate additional variation when specific types are exhausted"""
        
        # Try a random variation type
        available_types = [vt for vt in VariationType if vt not in 
                          [v.get("variation_metadata", {}).get("variation_type") for v in existing_variations]]
        
        if not available_types:
            return None
        
        variation_type = random.choice(available_types)
        
        try:
            return await self._generate_single_variation(question, variation_type, context)
        except Exception as e:
            logger.warning(f"Failed to generate additional variation: {e}")
            return None
    
    def _load_variation_templates(self) -> Dict[str, List[str]]:
        """Load variation templates"""
        return {
            "angle_change": [
                "From a different perspective, {original}",
                "Considering another viewpoint, {original}",
                "Looking at it differently, {original}"
            ],
            "depth_adjustment": [
                "In more detail, {original}",
                "Expanding on the concept, {original}",
                "With greater complexity, {original}"
            ],
            "context_shift": [
                "In a different context, {original}",
                "Applied to a new scenario, {original}",
                "In a different setting, {original}"
            ]
        }
    
    def _load_cognitive_level_mappings(self) -> Dict[str, List[Tuple[str, str]]]:
        """Load cognitive level transformation mappings"""
        return {
            "remember": [
                (r"explain (\w+)", r"list the key facts about {}"),
                (r"describe (\w+)", r"identify the main components of {}"),
                (r"analyze (\w+)", r"name the characteristics of {}")
            ],
            "understand": [
                (r"list (\w+)", r"explain what {} means"),
                (r"identify (\w+)", r"describe the concept of {}"),
                (r"name (\w+)", r"explain what {} refers to")
            ],
            "apply": [
                (r"explain (\w+)", r"how would you apply {} in practice"),
                (r"describe (\w+)", r"demonstrate how you would use {}"),
                (r"what is (\w+)", r"how would you implement {}")
            ],
            "analyze": [
                (r"what is (\w+)", r"analyze the components of {}"),
                (r"describe (\w+)", r"compare and contrast the elements of {}"),
                (r"explain (\w+)", r"break down the structure of {}")
            ],
            "evaluate": [
                (r"what is (\w+)", r"evaluate the effectiveness of {}"),
                (r"describe (\w+)", r"assess the strengths and weaknesses of {}"),
                (r"explain (\w+)", r"judge the value of {}")
            ],
            "create": [
                (r"what is (\w+)", r"design a new approach to {}"),
                (r"describe (\w+)", r"develop an improved version of {}"),
                (r"explain (\w+)", r"propose an innovative solution for {}")
            ]
        }
    
    def _load_synonym_maps(self) -> Dict[str, List[str]]:
        """Load synonym mapping dictionaries"""
        return {
            "important": ["significant", "crucial", "vital", "essential", "critical"],
            "process": ["procedure", "method", "system", "approach", "technique"],
            "analyze": ["examine", "investigate", "study", "explore", "inspect"],
            "explain": ["describe", "clarify", "elaborate", "detail", "interpret"],
            "concept": ["idea", "notion", "principle", "theory", "framework"],
            "function": ["purpose", "role", "operation", "mechanism", "process"],
            "structure": ["organization", "arrangement", "framework", "system", "format"],
            "develop": ["create", "build", "form", "establish", "construct"]
        }
    
    def _load_perspective_patterns(self) -> Dict[str, List[str]]:
        """Load perspective changing patterns"""
        return {
            "practical": [
                "In practical terms, ",
                "From a practical standpoint, ",
                "In real-world situations, ",
                "Applied to everyday life, "
            ],
            "theoretical": [
                "From a theoretical perspective, ",
                "In theoretical terms, ",
                "Conceptually speaking, ",
                "Based on the theory, "
            ],
            "analytical": [
                "From an analytical viewpoint, ",
                "Analyzing the situation, ",
                "Breaking it down analytically, ",
                "Through analytical lens, "
            ]
        }