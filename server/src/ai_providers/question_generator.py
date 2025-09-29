"""
Enhanced Question Generation System

This module provides advanced question generation algorithms with 
intelligent prompt engineering, difficulty scaling, and quality optimization.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
import re
import json
from datetime import datetime
import uuid

from .base import (
    BaseAIProvider, 
    ProviderRegistry, 
    GenerationRequest, 
    GenerationResult,
    QuestionType,
    Difficulty,
    get_provider_registry,
    get_model_router,
    RoutingStrategy
)

logger = logging.getLogger(__name__)

class QuestionComplexity(Enum):
    """Question complexity levels"""
    RECALL = "recall"              # Simple recall of facts
    COMPREHENSION = "comprehension"  # Understanding concepts
    APPLICATION = "application"      # Applying knowledge
    ANALYSIS = "analysis"          # Breaking down information
    SYNTHESIS = "synthesis"        # Combining ideas
    EVALUATION = "evaluation"      # Making judgments

class CognitiveLevel(Enum):
    """Bloom's Taxonomy cognitive levels"""
    REMEMBER = "remember"
    UNDERSTAND = "understand"
    APPLY = "apply"
    ANALYZE = "analyze"
    EVALUATE = "evaluate"
    CREATE = "create"

@dataclass
class ContentAnalysis:
    """Analysis of input content"""
    key_concepts: List[str]
    main_topics: List[str]
    vocabulary_terms: List[str]
    difficulty_level: Difficulty
    content_type: str
    reading_level: str
    estimated_tokens: int
    domain: str
    complexity_score: float

@dataclass
class QuestionTemplate:
    """Question generation template"""
    template_id: str
    question_type: QuestionType
    cognitive_level: CognitiveLevel
    difficulty: Difficulty
    prompt_template: str
    constraints: Dict[str, Any]
    quality_criteria: List[str]
    variations: List[str] = field(default_factory=list)

@dataclass
class QuestionGenerationConfig:
    """Configuration for question generation"""
    enable_context_analysis: bool = True
    enable_difficulty_scaling: bool = True
    enable_quality_validation: bool = True
    enable_variation_generation: bool = True
    max_questions_per_batch: int = 20
    quality_threshold: float = 0.7
    diversity_target: float = 0.8
    include_explanations: bool = True
    include_hints: bool = False
    enable_bloom_taxonomy: bool = True

class EnhancedQuestionGenerator:
    """Enhanced question generation system with advanced algorithms"""
    
    def __init__(self, config: QuestionGenerationConfig = None):
        self.config = config or QuestionGenerationConfig()
        self.registry: ProviderRegistry = None
        self.content_analyzer = ContentAnalyzer()
        self.difficulty_scaler = DifficultyScaler()
        self.quality_validator = QualityValidator()
        self.variation_generator = VariationGenerator()
        
        # Load question templates
        self.templates: Dict[str, QuestionTemplate] = {}
        self._load_templates()
    
    async def initialize(self):
        """Initialize the question generator"""
        
        self.registry = await get_provider_registry()
        logger.info("Enhanced Question Generator initialized")
    
    async def generate_questions(
        self,
        content: str,
        question_types: List[QuestionType],
        difficulty: Difficulty = Difficulty.INTERMEDIATE,
        question_count: int = 5,
        context: Optional[Dict[str, Any]] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> GenerationResult:
        """Generate enhanced questions with advanced algorithms"""
        
        if context is None:
            context = {}
        
        if options is None:
            options = {}
        
        logger.info(f"Generating {question_count} questions with enhanced algorithms")
        
        # Step 1: Analyze content
        content_analysis = None
        if self.config.enable_context_analysis:
            content_analysis = await self.content_analyzer.analyze_content(content)
            logger.info(f"Content analysis completed: {len(content_analysis.key_concepts)} concepts identified")
        
        # Step 2: Determine optimal generation strategy
        generation_strategy = await self._determine_generation_strategy(
            content, question_types, difficulty, content_analysis
        )
        
        # Step 3: Create generation request
        request = GenerationRequest(
            id=f"enhanced_gen_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            content=content,
            question_types=question_types,
            difficulty=difficulty,
            question_count=question_count,
            context=context,
            options=options
        )
        
        # Step 4: Generate with enhanced prompts
        result = await self._generate_with_enhanced_prompts(
            request, content_analysis, generation_strategy
        )
        
        # Step 5: Apply post-processing
        enhanced_questions = await self._apply_post_processing(
            result.questions, content_analysis, generation_strategy
        )
        
        # Step 6: Quality validation
        if self.config.enable_quality_validation:
            validated_questions = await self.quality_validator.validate_questions(
                enhanced_questions, content_analysis
            )
            quality_score = self._calculate_overall_quality_score(validated_questions)
        else:
            validated_questions = enhanced_questions
            quality_score = 0.8  # Default score
        
        # Update result
        result.questions = validated_questions
        result.quality_score = quality_score
        
        logger.info(f"Generated {len(validated_questions)} validated questions with quality score: {quality_score:.2f}")
        
        return result
    
    async def _determine_generation_strategy(
        self,
        content: str,
        question_types: List[QuestionType],
        difficulty: Difficulty,
        content_analysis: Optional[ContentAnalysis]
    ) -> Dict[str, Any]:
        """Determine optimal generation strategy based on content and requirements"""
        
        strategy = {
            "prompt_strategy": "standard",
            "complexity_target": "balanced",
            "diversity_approach": "topic_based",
            "optimization_focus": "quality"
        }
        
        # Adjust strategy based on content analysis
        if content_analysis:
            if content_analysis.complexity_score > 0.7:
                strategy["complexity_target"] = "high"
                strategy["prompt_strategy"] = "detailed"
            elif content_analysis.complexity_score < 0.3:
                strategy["complexity_target"] = "low"
                strategy["prompt_strategy"] = "simplified"
            
            # Adjust for domain
            if content_analysis.domain in ["technical", "scientific"]:
                strategy["optimization_focus"] = "accuracy"
            elif content_analysis.domain in ["humanities", "arts"]:
                strategy["optimization_focus"] = "creativity"
        
        # Adjust for question types
        if QuestionType.ESSAY in question_types:
            strategy["prompt_strategy"] = "analytical"
        elif QuestionType.MULTIPLE_CHOICE in question_types:
            strategy["diversity_approach"] "cognitive_level"
        
        return strategy
    
    async def _generate_with_enhanced_prompts(
        self,
        request: GenerationRequest,
        content_analysis: Optional[ContentAnalysis],
        strategy: Dict[str, Any]
    ) -> GenerationResult:
        """Generate questions using enhanced prompts"""
        
        # Get model router
        router = await get_model_router()
        
        # Determine optimal routing strategy
        routing_strategy = self._select_routing_strategy(strategy)
        
        # Get routing decision
        routing_decision = await router.route_request(
            request,
            strategy=routing_strategy
        )
        
        # Get provider and generate
        provider = self.registry.get_all_providers()[routing_decision.provider_id]
        
        # Create enhanced request with additional context
        enhanced_request = self._create_enhanced_request(
            request, content_analysis, strategy
        )
        
        # Generate questions
        result = await provider.generate_questions(enhanced_request)
        
        return result
    
    def _select_routing_strategy(self, generation_strategy: Dict[str, Any]) -> RoutingStrategy:
        """Select appropriate routing strategy based on generation strategy"""
        
        optimization_focus = generation_strategy.get("optimization_focus", "quality")
        
        if optimization_focus == "quality":
            return RoutingStrategy.QUALITY_FIRST
        elif optimization_focus == "cost":
            return RoutingStrategy.COST_EFFECTIVE
        elif optimization_focus == "speed":
            return RoutingStrategy.FASTEST
        else:
            return RoutingStrategy.BALANCED
    
    def _create_enhanced_request(
        self,
        request: GenerationRequest,
        content_analysis: Optional[ContentAnalysis],
        strategy: Dict[str, Any]
    ) -> GenerationRequest:
        """Create enhanced generation request with additional context"""
        
        # Add strategy information to context
        enhanced_context = request.context.copy()
        enhanced_context.update({
            "generation_strategy": strategy,
            "content_analysis": content_analysis.__dict__ if content_analysis else None,
            "enable_bloom_taxonomy": self.config.enable_bloom_taxonomy
        })
        
        # Add quality requirements to options
        enhanced_options = request.options.copy()
        enhanced_options.update({
            "quality_threshold": self.config.quality_threshold,
            "include_explanations": self.config.include_explanations,
            "include_hints": self.config.include_hints,
            "enable_difficulty_scaling": self.config.enable_difficulty_scaling
        })
        
        return GenerationRequest(
            id=request.id,
            content=request.content,
            question_types=request.question_types,
            difficulty=request.difficulty,
            question_count=request.question_count,
            context=enhanced_context,
            options=enhanced_options,
            priority=request.priority,
            created_at=request.created_at
        )
    
    async def _apply_post_processing(
        self,
        questions: List[Dict[str, Any]],
        content_analysis: Optional[ContentAnalysis],
        strategy: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Apply post-processing to generated questions"""
        
        processed_questions = []
        
        for question in questions:
            # Apply difficulty scaling if enabled
            if self.config.enable_difficulty_scaling and content_analysis:
                question = await self.difficulty_scaler.scale_question(
                    question, content_analysis, strategy
                )
            
            # Add metadata
            question["metadata"] = question.get("metadata", {})
            question["metadata"].update({
                "generation_strategy": strategy,
                "processed_at": datetime.now().isoformat(),
                "post_processing_applied": True
            })
            
            # Generate variations if enabled
            if self.config.enable_variation_generation:
                variations = await self.variation_generator.generate_variations(
                    question, content_analysis
                )
                question["metadata"]["variations"] = variations
            
            processed_questions.append(question)
        
        return processed_questions
    
    def _calculate_overall_quality_score(self, questions: List[Dict[str, Any]]) -> float:
        """Calculate overall quality score for question set"""
        
        if not questions:
            return 0.0
        
        total_score = 0.0
        valid_questions = 0
        
        for question in questions:
            quality_score = question.get("quality_score", 0.0)
            if quality_score > 0:
                total_score += quality_score
                valid_questions += 1
        
        return total_score / max(valid_questions, 1)
    
    def _load_templates(self):
        """Load question generation templates"""
        
        # Multiple choice template
        self.templates["multiple_choice_standard"] = QuestionTemplate(
            template_id="multiple_choice_standard",
            question_type=QuestionType.MULTIPLE_CHOICE,
            cognitive_level=CognitiveLevel.UNDERSTAND,
            difficulty=Difficulty.INTERMEDIATE,
            prompt_template="""Generate a multiple-choice question that tests understanding of key concepts.

Content: {content}

Requirements:
- Question should focus on: {focus_area}
- Create exactly 4 options (A, B, C, D)
- Only one correct answer
- Make distractors plausible but clearly incorrect
- Question type: {cognitive_level}
- Difficulty: {difficulty}

Output format:
Question: [question text]
A) [option A]
B) [option B]  
C) [option C]
D) [option D]
Correct: [letter] [answer]
Explanation: [explanation]""",
            constraints={
                "min_options": 4,
                "max_options": 4,
                "require_explanation": True
            },
            quality_criteria=[
                "clarity",
                "unambiguous",
                "plausible_distractors",
                "correct_answer_accuracy"
            ]
        )
        
        # Add more templates as needed
        logger.info(f"Loaded {len(self.templates)} question generation templates")
    
    async def generate_by_cognitive_level(
        self,
        content: str,
        cognitive_level: CognitiveLevel,
        question_count: int = 5,
        difficulty: Difficulty = Difficulty.INTERMEDIATE
    ) -> List[Dict[str, Any]]:
        """Generate questions targeting specific cognitive levels"""
        
        # Map cognitive levels to question types
        cognitive_mapping = {
            CognitiveLevel.REMEMBER: [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE],
            CognitiveLevel.UNDERSTAND: [QuestionType.MULTIPLE_CHOICE, QuestionType.SHORT_ANSWER],
            CognitiveLevel.APPLY: [QuestionType.SHORT_ANSWER, QuestionType.FILL_IN_BLANK],
            CognitiveLevel.ANALYZE: [QuestionType.SHORT_ANSWER, QuestionType.ESSAY],
            CognitiveLevel.EVALUATE: [QuestionType.ESSAY, QuestionType.MULTIPLE_CHOICE],
            CognitiveLevel.CREATE: [QuestionType.ESSAY, QuestionType.SHORT_ANSWER]
        }
        
        question_types = cognitive_mapping.get(cognitive_level, [QuestionType.MULTIPLE_CHOICE])
        
        # Generate with cognitive level emphasis
        context = {
            "target_cognitive_level": cognitive_level.value,
            "bloom_taxonomy_focus": True
        }
        
        result = await self.generate_questions(
            content=content,
            question_types=question_types,
            difficulty=difficulty,
            question_count=question_count,
            context=context
        )
        
        return result.questions
    
    async def generate_difficulty_spectrum(
        self,
        content: str,
        question_types: List[QuestionType],
        questions_per_level: int = 3
    ) -> Dict[Difficulty, List[Dict[str, Any]]]:
        """Generate questions across all difficulty levels"""
        
        results = {}
        
        for difficulty in Difficulty:
            result = await self.generate_questions(
                content=content,
                question_types=question_types,
                difficulty=difficulty,
                question_count=questions_per_level
            )
            
            results[difficulty] = result.questions
        
        return results

# Component classes for enhanced generation
class ContentAnalyzer:
    """Analyzes content to optimize question generation"""
    
    async def analyze_content(self, content: str) -> ContentAnalysis:
        """Analyze content for key concepts and structure"""
        
        # Extract key concepts (simplified implementation)
        key_concepts = self._extract_key_concepts(content)
        
        # Identify main topics
        main_topics = self._identify_topics(content)
        
        # Extract vocabulary terms
        vocabulary_terms = self._extract_vocabulary(content)
        
        # Determine difficulty level
        difficulty = self._assess_difficulty(content)
        
        # Analyze content type
        content_type = self._determine_content_type(content)
        
        # Estimate reading level
        reading_level = self._estimate_reading_level(content)
        
        # Calculate complexity score
        complexity_score = self._calculate_complexity(content)
        
        # Determine domain
        domain = self._identify_domain(content)
        
        # Estimate tokens
        estimated_tokens = len(content.split()) * 1.3
        
        return ContentAnalysis(
            key_concepts=key_concepts,
            main_topics=main_topics,
            vocabulary_terms=vocabulary_terms,
            difficulty_level=difficulty,
            content_type=content_type,
            reading_level=reading_level,
            estimated_tokens=estimated_tokens,
            domain=domain,
            complexity_score=complexity_score
        )
    
    def _extract_key_concepts(self, content: str) -> List[str]:
        """Extract key concepts from content"""
        # Simple keyword extraction (in production, use NLP libraries)
        sentences = re.split(r'[.!?]+', content)
        concepts = []
        
        for sentence in sentences:
            if len(sentence.strip()) > 20:  # Ignore very short sentences
                # Extract noun phrases (simplified)
                words = sentence.split()
                for i, word in enumerate(words):
                    if len(word) > 4 and word.isalpha():  # Likely important words
                        concepts.append(word.lower())
        
        # Return unique concepts, limited to top 20
        return list(set(concepts))[:20]
    
    def _identify_topics(self, content: str) -> List[str]:
        """Identify main topics in content"""
        # Simple topic identification based on frequency
        words = re.findall(r'\b[a-zA-Z]{4,}\b', content.lower())
        word_freq = {}
        
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Return top 5 most frequent words
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, count in sorted_words[:5]]
    
    def _extract_vocabulary(self, content: str) -> List[str]:
        """Extract key vocabulary terms"""
        # Extract technical terms and important words
        technical_terms = re.findall(r'\b[a-zA-Z]{6,}\b', content)
        return list(set(technical_terms))[:15]
    
    def _assess_difficulty(self, content: str) -> Difficulty:
        """Assess content difficulty level"""
        # Simple heuristic based on sentence length and vocabulary
        sentences = re.split(r'[.!?]+', content)
        avg_sentence_length = sum(len(s.split()) for s in sentences if s.strip()) / max(len(sentences), 1)
        
        if avg_sentence_length < 15:
            return Difficulty.BEGINNER
        elif avg_sentence_length < 25:
            return Difficulty.INTERMEDIATE
        elif avg_sentence_length < 35:
            return Difficulty.ADVANCED
        else:
            return Difficulty.EXPERT
    
    def _determine_content_type(self, content: str) -> str:
        """Determine type of content"""
        # Simple content type detection
        if any(word in content.lower() for word in ["experiment", "study", "research", "data"]):
            return "scientific"
        elif any(word in content.lower() for word in ["history", "war", "century", "ancient"]):
            return "historical"
        elif any(word in content.lower() for word in ["formula", "equation", "calculate", "mathematics"]):
            return "mathematical"
        else:
            return "general"
    
    def _estimate_reading_level(self, content: str) -> str:
        """Estimate reading level of content"""
        # Simplified reading level estimation
        words = content.split()
        sentences = re.split(r'[.!?]+', content)
        avg_words_per_sentence = len(words) / max(len(sentences), 1)
        
        if avg_words_per_sentence < 15:
            return "elementary"
        elif avg_words_per_sentence < 20:
            return "intermediate"
        else:
            return "advanced"
    
    def _calculate_complexity(self, content: str) -> float:
        """Calculate complexity score (0-1)"""
        # Multi-factor complexity calculation
        factors = []
        
        # Sentence complexity
        sentences = re.split(r'[.!?]+', content)
        avg_sentence_length = sum(len(s.split()) for s in sentences if s.strip()) / max(len(sentences), 1)
        sentence_complexity = min(avg_sentence_length / 30.0, 1.0)
        factors.append(sentence_complexity)
        
        # Vocabulary complexity
        long_words = len([w for w in content.split() if len(w) > 6])
        vocabulary_complexity = min(long_words / len(content.split()), 1.0)
        factors.append(vocabulary_complexity)
        
        # Structural complexity
        complex_punctuation = len(re.findall(r'[;:()\[\]{}]', content))
        structural_complexity = min(complex_punctuation / 50.0, 1.0)
        factors.append(structural_complexity)
        
        return sum(factors) / len(factors)
    
    def _identify_domain(self, content: str) -> str:
        """Identify content domain"""
        content_lower = content.lower()
        
        domain_keywords = {
            "technical": ["algorithm", "code", "system", "software", "data"],
            "scientific": ["research", "experiment", "hypothesis", "analysis", "theory"],
            "business": ["market", "strategy", "management", "revenue", "customer"],
            "medical": ["patient", "treatment", "diagnosis", "symptoms", "therapy"],
            "educational": ["learning", "curriculum", "assessment", "pedagogy", "student"],
            "legal": ["law", "legal", "court", "regulation", "compliance"]
        }
        
        domain_scores = {}
        for domain, keywords in domain_keywords.items():
            score = sum(content_lower.count(keyword) for keyword in keywords)
            domain_scores[domain] = score
        
        if domain_scores:
            return max(domain_scores, key=domain_scores.get)
        else:
            return "general"

class DifficultyScaler:
    """Scales question difficulty appropriately"""
    
    async def scale_question(
        self,
        question: Dict[str, Any],
        content_analysis: ContentAnalysis,
        strategy: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Scale question difficulty based on content and strategy"""
        
        # Apply difficulty scaling logic
        target_difficulty = strategy.get("complexity_target", "balanced")
        
        # Adjust question complexity based on target
        if target_difficulty == "high":
            question = self._increase_complexity(question)
        elif target_difficulty == "low":
            question = self._decrease_complexity(question)
        
        # Add difficulty metadata
        question["metadata"]["scaled_difficulty"] = target_difficulty
        question["metadata"]["scaling_applied"] = True
        
        return question
    
    def _increase_complexity(self, question: Dict[str, Any]) -> Dict[str, Any]:
        """Increase question complexity"""
        
        # Add analytical elements
        if "question" in question:
            question_text = question["question"]
            if not any(word in question_text.lower() for word in ["analyze", "compare", "evaluate", "why", "how"]):
                # Add analytical prefix
                question["question"] = f"Analyze: {question_text}"
        
        # Add more challenging options for multiple choice
        if question.get("type") == "multiple-choice" and "options" in question:
            options = question["options"]
            if len(options) == 4:
                # Make distractors more challenging
                question["options"] = self._enhance_distractors(options)
        
        return question
    
    def _decrease_complexity(self, question: Dict[str, Any]) -> Dict[str, Any]:
        """Decrease question complexity"""
        
        # Simplify question language
        if "question" in question:
            question_text = question["question"]
            # Remove complex prefixes
            for prefix in ["Analyze:", "Evaluate:", "Compare:", "Examine:"]:
                if question_text.startswith(prefix):
                    question["question"] = question_text[len(prefix):].strip()
        
        return question
    
    def _enhance_distractors(self, options: List[str]) -> List[str]:
        """Enhance distractors to be more challenging"""
        # This would use more sophisticated logic in production
        return options  # Placeholder implementation

class QualityValidator:
    """Validates question quality and scores it"""
    
    async def validate_questions(
        self,
        questions: List[Dict[str, Any]],
        content_analysis: ContentAnalysis
    ) -> List[Dict[str, Any]]:
        """Validate and score question quality"""
        
        validated_questions = []
        
        for question in questions:
            # Calculate quality score
            quality_score = self._calculate_quality_score(question, content_analysis)
            
            # Add quality metadata
            question["quality_score"] = quality_score
            question["quality_validated"] = True
            question["validated_at"] = datetime.now().isoformat()
            
            # Include if meets threshold
            if quality_score >= 0.6:  # Minimum quality threshold
                validated_questions.append(question)
        
        return validated_questions
    
    def _calculate_quality_score(
        self,
        question: Dict[str, Any],
        content_analysis: ContentAnalysis
    ) -> float:
        """Calculate quality score for a question"""
        
        score = 0.0
        factors = 0.0
        
        # Check structural completeness
        required_fields = ["type", "question", "correct_answer"]
        completeness = sum(1 for field in required_fields if field in question) / len(required_fields)
        score += completeness * 0.3
        factors += 0.3
        
        # Check question clarity
        if "question" in question:
            clarity_score = self._assess_clarity(question["question"])
            score += clarity_score * 0.2
            factors += 0.2
        
        # Check answer appropriateness
        if "correct_answer" in question:
            answer_score = self._assess_answer_quality(question)
            score += answer_score * 0.2
            factors += 0.2
        
        # Check for multiple choice quality
        if question.get("type") == "multiple-choice" and "options" in question:
            mc_score = self._assess_multiple_choice_quality(question)
            score += mc_score * 0.2
            factors += 0.2
        
        # Check explanation quality
        if "explanation" in question:
            explanation_score = self._assess_explanation_quality(question["explanation"])
            score += explanation_score * 0.1
            factors += 0.1
        
        return score / factors if factors > 0 else 0.0
    
    def _assess_clarity(self, question_text: str) -> float:
        """Assess question clarity"""
        # Simple clarity assessment based on length and structure
        if len(question_text) < 10:
            return 0.3  # Too short
        elif len(question_text) > 500:
            return 0.5  # Too long
        else:
            return 0.8  # Good length
    
    def _assess_answer_quality(self, question: Dict[str, Any]) -> float:
        """Assess answer quality"""
        answer = question.get("correct_answer", "")
        if len(answer) < 3:
            return 0.4
        elif len(answer) > 200:
            return 0.7
        else:
            return 0.9
    
    def _assess_multiple_choice_quality(self, question: Dict[str, Any]) -> float:
        """Assess multiple choice question quality"""
        options = question.get("options", [])
        if len(options) != 4:
            return 0.5
        
        # Check that options are sufficiently different
        unique_options = len(set(opt.lower().strip() for opt in options))
        if unique_options < 4:
            return 0.6
        
        return 0.9
    
    def _assess_explanation_quality(self, explanation: str) -> float:
        """Assess explanation quality"""
        if len(explanation) < 20:
            return 0.3
        elif len(explanation) > 500:
            return 0.8
        else:
            return 0.9

class VariationGenerator:
    """Generates variations of questions"""
    
    async def generate_variations(
        self,
        question: Dict[str, Any],
        content_analysis: Optional[ContentAnalysis]
    ) -> List[Dict[str, Any]]:
        """Generate question variations"""
        
        variations = []
        
        # Generate different angle variations
        angle_variations = self._generate_angle_variations(question)
        variations.extend(angle_variations)
        
        # Generate depth variations
        depth_variations = self._generate_depth_variations(question)
        variations.extend(depth_variations)
        
        return variations[:3]  # Limit to 3 variations
    
    def _generate_angle_variations(self, question: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate variations from different angles"""
        variations = []
        
        if "question" in question:
            original = question["question"]
            
            # Angle 1: Focus on application
            app_variation = original.replace("What is", "How would you apply")
            app_variation = app_variation.replace("Describe", "How would you use")
            
            # Angle 2: Focus on comparison
            comp_variation = "Compare and contrast: " + original
            
            # Angle 3: Focus on evaluation
            eval_variation = "Evaluate the importance of: " + original
            
            variations = [
                {"type": "angle_application", "question": app_variation},
                {"type": "angle_comparison", "question": comp_variation},
                {"type": "angle_evaluation", "question": eval_variation}
            ]
        
        return variations
    
    def _generate_depth_variations(self, question: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate variations with different depth"""
        variations = []
        
        if "question" in question:
            original = question["question"]
            
            # Depth 1: Add specific context
            context_variation = f"In the context of the provided material, {original.lower()}"
            
            # Depth 2: Add requirement for examples
            example_variation = f"{original} Provide specific examples."
            
            variations = [
                {"type": "depth_contextual", "question": context_variation},
                {"type": "depth_exemplified", "question": example_variation}
            ]
        
        return variations