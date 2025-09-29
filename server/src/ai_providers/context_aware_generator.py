"""
Context-Aware Question Generation System

This module provides advanced content analysis and context-aware question generation
that understands domain, complexity, and educational requirements.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
import re
import json
from datetime import datetime
import collections
import math

from .base import (
    QuestionType,
    Difficulty,
    CognitiveLevel
)

logger = logging.getLogger(__name__)

class ContentDomain(Enum):
    """Content domain classification"""
    SCIENCE = "science"
    MATHEMATICS = "mathematics"
    LITERATURE = "literature"
    HISTORY = "history"
    GEOGRAPHY = "geography"
    ARTS = "arts"
    PHILOSOPHY = "philosophy"
    TECHNOLOGY = "technology"
    BUSINESS = "business"
    MEDICINE = "medicine"
    LAW = "law"
    PSYCHOLOGY = "psychology"
    SOCIOLOGY = "sociology"
    GENERAL = "general"

class ContentType(Enum):
    """Content type classification"""
    FACTUAL = "factual"
    CONCEPTUAL = "conceptual"
    PROCEDURAL = "procedural"
    ANALYTICAL = "analytical"
    NARRATIVE = "narrative"
    DESCRIPTIVE = "descriptive"
    ARGUMENTATIVE = "argumentative"
    INSTRUCTIONAL = "instructional"

class ReadingLevel(Enum):
    """Reading level classification"""
    ELEMENTARY = "elementary"
    MIDDLE_SCHOOL = "middle_school"
    HIGH_SCHOOL = "high_school"
    UNDERGRADUATE = "undergraduate"
    GRADUATE = "graduate"
    PROFESSIONAL = "professional"

@dataclass
class ContentMetadata:
    """Comprehensive content analysis metadata"""
    domain: ContentDomain
    content_type: ContentType
    reading_level: ReadingLevel
    complexity_score: float
    key_concepts: List[str]
    main_topics: List[str]
    vocabulary_terms: List[str]
    technical_terms: List[str]
    relationships: List[Dict[str, Any]]
    difficulty_assessment: Difficulty
    estimated_tokens: int
    educational_level: str
    language_complexity: float
    structural_complexity: float
    conceptual_density: float

@dataclass
class ContextRequirements:
    """Requirements for context-aware question generation"""
    target_audience: str
    educational_level: str
    prior_knowledge_assumed: str
    learning_objectives: List[str]
    time_constraint: int
    assessment_focus: str
    domain_specificity: str
    cultural_context: Optional[str] = None
    accessibility_requirements: List[str] = field(default_factory=list)

@dataclass
class QuestionContext:
    """Context for individual question generation"""
    content_metadata: ContentMetadata
    requirements: ContextRequirements
    target_difficulty: Difficulty
    cognitive_level: CognitiveLevel
    focus_area: str
    contextual_constraints: Dict[str, Any]
    relevance_threshold: float = 0.7

class ContentAnalyzer:
    """Advanced content analyzer for context-aware question generation"""
    
    def __init__(self):
        self.domain_keywords = self._load_domain_keywords()
        self.content_type_patterns = self._load_content_type_patterns()
        self.reading_level_indicators = self._load_reading_level_indicators()
        self.complexity_weights = {
            "vocabulary": 0.3,
            "structure": 0.3,
            "conceptual": 0.25,
            "density": 0.15
        }
    
    async def analyze_content(
        self,
        content: str,
        context_requirements: Optional[ContextRequirements] = None
    ) -> ContentMetadata:
        """Comprehensive content analysis"""
        
        logger.info("Starting comprehensive content analysis")
        
        # Extract basic text statistics
        text_stats = self._extract_text_statistics(content)
        
        # Identify domain
        domain = self._identify_content_domain(content)
        
        # Determine content type
        content_type = self._determine_content_type(content)
        
        # Assess reading level
        reading_level = self._assess_reading_level(content, text_stats)
        
        # Extract key concepts
        key_concepts = await self._extract_key_concepts(content)
        
        # Identify main topics
        main_topics = self._identify_main_topics(content, key_concepts)
        
        # Extract vocabulary and technical terms
        vocabulary_terms, technical_terms = self._extract_vocabulary(content, domain)
        
        # Analyze relationships
        relationships = await self._analyze_relationships(content, key_concepts)
        
        # Calculate complexity score
        complexity_score = self._calculate_complexity_score(
            content, text_stats, key_concepts, technical_terms
        )
        
        # Assess difficulty
        difficulty_assessment = self._assess_content_difficulty(
            complexity_score, reading_level
        )
        
        # Estimate tokens
        estimated_tokens = self._estimate_tokens(content)
        
        # Determine educational level
        educational_level = self._determine_educational_level(reading_level)
        
        # Calculate detailed complexity metrics
        language_complexity = self._calculate_language_complexity(content, text_stats)
        structural_complexity = self._calculate_structural_complexity(content)
        conceptual_density = self._calculate_conceptual_density(content, key_concepts)
        
        metadata = ContentMetadata(
            domain=domain,
            content_type=content_type,
            reading_level=reading_level,
            complexity_score=complexity_score,
            key_concepts=key_concepts,
            main_topics=main_topics,
            vocabulary_terms=vocabulary_terms,
            technical_terms=technical_terms,
            relationships=relationships,
            difficulty_assessment=difficulty_assessment,
            estimated_tokens=estimated_tokens,
            educational_level=educational_level,
            language_complexity=language_complexity,
            structural_complexity=structural_complexity,
            conceptual_density=conceptual_density
        )
        
        logger.info(f"Content analysis complete. Domain: {domain.value}, "
                   f"Type: {content_type.value}, Complexity: {complexity_score:.2f}")
        
        return metadata
    
    def _extract_text_statistics(self, content: str) -> Dict[str, Any]:
        """Extract basic text statistics"""
        
        sentences = re.split(r'[.!?]+', content)
        words = re.findall(r'\b\w+\b', content)
        
        stats = {
            "character_count": len(content),
            "word_count": len(words),
            "sentence_count": len([s for s in sentences if s.strip()]),
            "avg_words_per_sentence": len(words) / max(len([s for s in sentences if s.strip()]), 1),
            "avg_chars_per_word": len(content) / max(len(words), 1),
            "unique_words": len(set(w.lower() for w in words)),
            "long_words": len([w for w in words if len(w) > 6]),
            "complex_words": len([w for w in words if self._is_complex_word(w)])
        }
        
        return stats
    
    def _identify_content_domain(self, content: str) -> ContentDomain:
        """Identify the primary domain of the content"""
        
        content_lower = content.lower()
        domain_scores = {}
        
        for domain, keywords in self.domain_keywords.items():
            score = 0
            for keyword, weight in keywords.items():
                score += content_lower.count(keyword) * weight
            domain_scores[domain] = score
        
        if domain_scores:
            best_domain = max(domain_scores, key=domain_scores.get)
            if domain_scores[best_domain] > 0:
                return ContentDomain(best_domain)
        
        return ContentDomain.GENERAL
    
    def _determine_content_type(self, content: str) -> ContentType:
        """Determine the primary type of content"""
        
        content_lower = content.lower()
        type_scores = {}
        
        for content_type, patterns in self.content_type_patterns.items():
            score = 0
            for pattern, weight in patterns.items():
                if pattern in content_lower:
                    score += weight
            type_scores[content_type] = score
        
        if type_scores:
            best_type = max(type_scores, key=type_scores.get)
            if type_scores[best_type] > 0:
                return ContentType(best_type)
        
        return ContentType.FACTUAL
    
    def _assess_reading_level(self, content: str, text_stats: Dict[str, Any]) -> ReadingLevel:
        """Assess reading level using multiple metrics"""
        
        # Flesch Reading Ease approximation
        avg_sentence_length = text_stats["avg_words_per_sentence"]
        avg_syllables_per_word = text_stats["avg_chars_per_word"] / 3.0  # Approximation
        
        flesch_score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)
        
        # Map Flesch score to reading level
        if flesch_score >= 90:
            return ReadingLevel.ELEMENTARY
        elif flesch_score >= 80:
            return ReadingLevel.MIDDLE_SCHOOL
        elif flesch_score >= 70:
            return ReadingLevel.HIGH_SCHOOL
        elif flesch_score >= 60:
            return ReadingLevel.UNDERGRADUATE
        elif flesch_score >= 50:
            return ReadingLevel.GRADUATE
        else:
            return ReadingLevel.PROFESSIONAL
    
    async def _extract_key_concepts(self, content: str) -> List[str]:
        """Extract key concepts using frequency and importance analysis"""
        
        # Preprocess content
        sentences = re.split(r'[.!?]+', content)
        words = re.findall(r'\b\w+\b', content.lower())
        
        # Calculate word frequencies
        word_freq = collections.Counter(words)
        
        # Remove common words
        common_words = {
            "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
            "is", "are", "was", "were", "be", "been", "have", "has", "had", "do",
            "does", "did", "will", "would", "could", "should", "may", "might", "can",
            "this", "that", "these", "those", "a", "an", "some", "many", "much"
        }
        
        # Filter and score concepts
        concept_scores = {}
        for word, freq in word_freq.items():
            if len(word) > 3 and word not in common_words and freq >= 2:
                # Calculate importance score
                importance = self._calculate_concept_importance(word, sentences, freq)
                concept_scores[word] = importance
        
        # Sort by importance and return top concepts
        sorted_concepts = sorted(concept_scores.items(), key=lambda x: x[1], reverse=True)
        return [concept for concept, score in sorted_concepts[:15]]
    
    def _calculate_concept_importance(self, word: str, sentences: List[str], frequency: int) -> float:
        """Calculate importance score for a concept"""
        
        # Base score from frequency
        base_score = frequency
        
        # Position importance (concepts at beginning of sentences are often more important)
        position_score = 0
        for sentence in sentences:
            if word in sentence.lower():
                words_in_sentence = sentence.split()
                if words_in_sentence and words_in_sentence[0].lower() == word:
                    position_score += 2
                elif len(words_in_sentence) > 1 and words_in_sentence[1].lower() == word:
                    position_score += 1
        
        # Length importance (longer words are often more specific/technical)
        length_score = min(1.0, len(word) / 10.0)
        
        # Capitalization importance (proper nouns and technical terms)
        capital_score = 0
        for sentence in sentences:
            if word.capitalize() in sentence:
                capital_score += 1
        
        total_score = base_score + position_score + (length_score * 5) + (capital_score * 2)
        return total_score
    
    def _identify_main_topics(self, content: str, key_concepts: List[str]) -> List[str]:
        """Identify main topics from key concepts and content structure"""
        
        # Look for topic indicators in content
        topic_indicators = [
            r"the main topic is (\w+)",
            r"focuses on (\w+)",
            r"discusses (\w+)",
            r"explores (\w+)",
            r"examines (\w+)"
        ]
        
        topics = []
        content_lower = content.lower()
        
        for pattern in topic_indicators:
            matches = re.findall(pattern, content_lower)
            topics.extend(matches)
        
        # Add key concepts as topics
        topics.extend(key_concepts[:5])
        
        # Remove duplicates and return
        return list(set([topic for topic in topics if len(topic) > 3]))[:8]
    
    def _extract_vocabulary(self, content: str, domain: ContentDomain) -> Tuple[List[str], List[str]]:
        """Extract vocabulary and technical terms"""
        
        words = re.findall(r'\b\w+\b', content.lower())
        
        # Domain-specific technical terms
        domain_technical_terms = {
            ContentDomain.SCIENCE: ["hypothesis", "experiment", "theory", "molecule", "cell"],
            ContentDomain.MATHEMATICS: ["equation", "theorem", "formula", "algorithm", "proof"],
            ContentDomain.TECHNOLOGY: ["algorithm", "software", "hardware", "network", "database"],
            ContentDomain.MEDICINE: ["diagnosis", "treatment", "symptom", "therapy", "patient"],
            ContentDomain.BUSINESS: ["strategy", "market", "revenue", "management", "investment"]
        }
        
        technical_terms = []
        general_vocabulary = []
        
        for word in set(words):
            if len(word) > 5:  # Focus on longer words
                if domain in domain_technical_terms and word in domain_technical_terms[domain]:
                    technical_terms.append(word)
                elif self._is_technical_term(word, domain):
                    technical_terms.append(word)
                else:
                    general_vocabulary.append(word)
        
        return general_vocabulary[:20], technical_terms[:15]
    
    def _is_technical_term(self, word: str, domain: ContentDomain) -> bool:
        """Check if a word is a technical term for the given domain"""
        
        # Use heuristics to identify technical terms
        technical_indicators = {
            ContentDomain.SCIENCE: r"ology$|ic$|al$|ical$",
            ContentDomain.MATHEMATICS: r"tion$|ment$|ance$|ence$",
            ContentDomain.TECHNOLOGY: r"er$|or$|ware$|net$",
            ContentDomain.MEDICINE: r"itis$|osis$|pathy$|gram$",
            ContentDomain.BUSINESS: r"ship$|hood$|ment$|ity$"
        }
        
        if domain in technical_indicators:
            pattern = technical_indicators[domain]
            return bool(re.search(pattern, word))
        
        return False
    
    async def _analyze_relationships(self, content: str, key_concepts: List[str]) -> List[Dict[str, Any]]:
        """Analyze relationships between key concepts"""
        
        relationships = []
        
        # Find co-occurrence patterns
        sentences = re.split(r'[.!?]+', content)
        
        for i, concept1 in enumerate(key_concepts):
            for j, concept2 in enumerate(key_concepts[i+1:], i+1):
                # Check co-occurrence in sentences
                co_occurrences = 0
                for sentence in sentences:
                    if (concept1 in sentence.lower() and 
                        concept2 in sentence.lower()):
                        co_occurrences += 1
                
                if co_occurrences > 0:
                    # Determine relationship type
                    relationship_type = self._determine_relationship_type(
                        concept1, concept2, content
                    )
                    
                    relationships.append({
                        "concept1": concept1,
                        "concept2": concept2,
                        "relationship": relationship_type,
                        "strength": min(1.0, co_occurrences / 3.0),
                        "co_occurrences": co_occurrences
                    })
        
        return relationships[:20]  # Limit to top relationships
    
    def _determine_relationship_type(self, concept1: str, concept2: str, content: str) -> str:
        """Determine the type of relationship between two concepts"""
        
        relationship_patterns = {
            "causal": [r"causes?", r"results in", r"leads to", r"affects"],
            "hierarchical": [r"part of", r"type of", r"form of", r"kind of"],
            "sequential": [r"follows?", r"after", r"before", r"then", r"next"],
            "comparative": [r"similar to", r"like", r"unlike", r"different from"],
            "explanatory": [r"means?", r"defined as", r"refers to", r"is a"],
            "functional": [r"uses?", r"used for", r"function of", r"purpose of"]
        }
        
        content_lower = content.lower()
        pattern_scores = {}
        
        for rel_type, patterns in relationship_patterns.items():
            score = 0
            for pattern in patterns:
                # Check for patterns connecting the two concepts
                connection_pattern = f"{concept1}.*{pattern}.*{concept2}|{concept2}.*{pattern}.*{concept1}"
                if re.search(connection_pattern, content_lower):
                    score += 1
            pattern_scores[rel_type] = score
        
        if pattern_scores:
            return max(pattern_scores, key=pattern_scores.get)
        
        return "related"
    
    def _calculate_complexity_score(
        self,
        content: str,
        text_stats: Dict[str, Any],
        key_concepts: List[str],
        technical_terms: List[str]
    ) -> float:
        """Calculate overall content complexity score"""
        
        # Vocabulary complexity
        vocab_complexity = text_stats["complex_words"] / max(text_stats["word_count"], 1)
        
        # Structural complexity
        structural_complexity = min(1.0, text_stats["avg_words_per_sentence"] / 25.0)
        
        # Conceptual complexity
        conceptual_complexity = min(1.0, len(key_concepts) / 20.0)
        
        # Technical complexity
        technical_complexity = min(1.0, len(technical_terms) / 15.0)
        
        # Calculate weighted score
        complexity_score = (
            vocab_complexity * self.complexity_weights["vocabulary"] +
            structural_complexity * self.complexity_weights["structure"] +
            conceptual_complexity * self.complexity_weights["conceptual"] +
            technical_complexity * self.complexity_weights["density"]
        )
        
        return min(1.0, complexity_score)
    
    def _assess_content_difficulty(self, complexity_score: float, reading_level: ReadingLevel) -> Difficulty:
        """Assess content difficulty based on complexity and reading level"""
        
        # Base difficulty from reading level
        reading_level_difficulty = {
            ReadingLevel.ELEMENTARY: Difficulty.BEGINNER,
            ReadingLevel.MIDDLE_SCHOOL: Difficulty.BEGINNER,
            ReadingLevel.HIGH_SCHOOL: Difficulty.INTERMEDIATE,
            ReadingLevel.UNDERGRADUATE: Difficulty.INTERMEDIATE,
            ReadingLevel.GRADUATE: Difficulty.ADVANCED,
            ReadingLevel.PROFESSIONAL: Difficulty.EXPERT
        }[reading_level]
        
        # Adjust based on complexity score
        if complexity_score > 0.7:
            # Increase difficulty by one level
            difficulty_levels = [Difficulty.BEGINNER, Difficulty.INTERMEDIATE, 
                              Difficulty.ADVANCED, Difficulty.EXPERT]
            current_index = difficulty_levels.index(reading_level_difficulty)
            if current_index < len(difficulty_levels) - 1:
                return difficulty_levels[current_index + 1]
        elif complexity_score < 0.3:
            # Decrease difficulty by one level
            difficulty_levels = [Difficulty.BEGINNER, Difficulty.INTERMEDIATE, 
                              Difficulty.ADVANCED, Difficulty.EXPERT]
            current_index = difficulty_levels.index(reading_level_difficulty)
            if current_index > 0:
                return difficulty_levels[current_index - 1]
        
        return reading_level_difficulty
    
    def _estimate_tokens(self, content: str) -> int:
        """Estimate token count for the content"""
        words = content.split()
        return int(len(words) * 1.3)  # Rough estimate
    
    def _determine_educational_level(self, reading_level: ReadingLevel) -> str:
        """Determine educational level from reading level"""
        
        mapping = {
            ReadingLevel.ELEMENTARY: "K-5",
            ReadingLevel.MIDDLE_SCHOOL: "6-8",
            ReadingLevel.HIGH_SCHOOL: "9-12",
            ReadingLevel.UNDERGRADUATE: "Undergraduate",
            ReadingLevel.GRADUATE: "Graduate",
            ReadingLevel.PROFESSIONAL: "Professional"
        }
        
        return mapping[reading_level]
    
    def _calculate_language_complexity(self, content: str, text_stats: Dict[str, Any]) -> float:
        """Calculate language complexity score"""
        
        # Word complexity
        word_complexity = text_stats["complex_words"] / max(text_stats["word_count"], 1)
        
        # Sentence complexity
        sentence_complexity = min(1.0, text_stats["avg_words_per_sentence"] / 20.0)
        
        # Lexical diversity
        lexical_diversity = text_stats["unique_words"] / max(text_stats["word_count"], 1)
        
        return (word_complexity + sentence_complexity + lexical_diversity) / 3.0
    
    def _calculate_structural_complexity(self, content: str) -> float:
        """Calculate structural complexity score"""
        
        # Paragraph complexity
        paragraphs = content.split('\n\n')
        paragraph_complexity = min(1.0, len(paragraphs) / 10.0)
        
        # Punctuation complexity
        complex_punctuation = len(re.findall(r'[;:()\[\]{}"\'`]', content))
        punctuation_complexity = min(1.0, complex_punctuation / 50.0)
        
        # Subordination complexity
        subordinators = [
            "because", "although", "while", "since", "if", "unless", "until", "when",
            "after", "before", "though", "although", "even though", "so that"
        ]
        subordination_count = sum(content.lower().count(sub) for sub in subordinators)
        subordination_complexity = min(1.0, subordination_count / 20.0)
        
        return (paragraph_complexity + punctuation_complexity + subordination_complexity) / 3.0
    
    def _calculate_conceptual_density(self, content: str, key_concepts: List[str]) -> float:
        """Calculate conceptual density score"""
        
        # Concept density
        concept_density = min(1.0, len(key_concepts) / 20.0)
        
        # Information density
        sentences = re.split(r'[.!?]+', content)
        info_density = sum(len(sentence.split()) for sentence in sentences) / max(len(sentences), 1)
        info_density_score = min(1.0, info_density / 25.0)
        
        return (concept_density + info_density_score) / 2.0
    
    def _is_complex_word(self, word: str) -> bool:
        """Check if a word is considered complex"""
        # Simple heuristics for complex word detection
        return len(word) > 8 or any(syllable in word for syllable in ['tion', 'sion', 'ment', 'ity'])

class ContextAwareQuestionGenerator:
    """Context-aware question generation system"""
    
    def __init__(self):
        self.content_analyzer = ContentAnalyzer()
        self.prompt_templates = self._load_context_aware_templates()
    
    async def generate_context_aware_questions(
        self,
        content: str,
        question_count: int,
        question_types: List[QuestionType],
        difficulty: Difficulty,
        context_requirements: ContextRequirements,
        cognitive_level: CognitiveLevel = CognitiveLevel.UNDERSTAND
    ) -> List[Dict[str, Any]]:
        """Generate questions with full context awareness"""
        
        logger.info("Starting context-aware question generation")
        
        # Step 1: Analyze content
        content_metadata = await self.content_analyzer.analyze_content(content, context_requirements)
        
        # Step 2: Create question context
        question_context = QuestionContext(
            content_metadata=content_metadata,
            requirements=context_requirements,
            target_difficulty=difficulty,
            cognitive_level=cognitive_level,
            focus_area=self._determine_focus_area(content_metadata, context_requirements),
            contextual_constraints=self._generate_contextual_constraints(content_metadata, context_requirements)
        )
        
        # Step 3: Generate context-aware prompts
        prompts = await self._generate_context_aware_prompts(question_context, question_count, question_types)
        
        # Step 4: Generate questions using prompts
        questions = await self._generate_questions_from_prompts(prompts, question_context)
        
        # Step 5: Apply context-aware validation
        validated_questions = await self._validate_context_aware_questions(questions, question_context)
        
        logger.info(f"Generated {len(validated_questions)} context-aware questions")
        
        return validated_questions
    
    def _determine_focus_area(
        self,
        content_metadata: ContentMetadata,
        requirements: ContextRequirements
    ) -> str:
        """Determine focus area based on content and requirements"""
        
        # Use learning objectives to determine focus
        if requirements.learning_objectives:
            return requirements.learning_objectives[0]
        
        # Use assessment focus
        if requirements.assessment_focus:
            return requirements.assessment_focus
        
        # Default to main topic
        if content_metadata.main_topics:
            return content_metadata.main_topics[0]
        
        return "general understanding"
    
    def _generate_contextual_constraints(
        self,
        content_metadata: ContentMetadata,
        requirements: ContextRequirements
    ) -> Dict[str, Any]:
        """Generate contextual constraints for question generation"""
        
        constraints = {
            "domain_specificity": requirements.domain_specificity,
            "audience_level": requirements.target_audience,
            "time_constraint": requirements.time_constraint,
            "prior_knowledge": requirements.prior_knowledge_assumed,
            "accessibility_requirements": requirements.accessibility_requirements,
            "content_domain": content_metadata.domain.value,
            "reading_level": content_metadata.reading_level.value,
            "complexity_tolerance": 0.2,  # Allow 20% complexity variation
            "concept_alignment": True,
            "educational_relevance": True
        }
        
        return constraints
    
    async def _generate_context_aware_prompts(
        self,
        question_context: QuestionContext,
        question_count: int,
        question_types: List[QuestionType]
    ) -> List[str]:
        """Generate context-aware prompts for question generation"""
        
        prompts = []
        
        for question_type in question_types:
            template = self.prompt_templates.get(question_type.value, 
                                               self.prompt_templates["default"])
            
            # Customize template based on context
            context_aware_prompt = await self._customize_prompt_template(
                template, question_context, question_count
            )
            
            prompts.append(context_aware_prompt)
        
        return prompts
    
    async def _customize_prompt_template(
        self,
        template: str,
        question_context: QuestionContext,
        question_count: int
    ) -> str:
        """Customize prompt template based on question context"""
        
        # Extract context information
        metadata = question_context.content_metadata
        requirements = question_context.requirements
        
        # Build context information string
        context_info = f"""
CONTEXT ANALYSIS:
- Domain: {metadata.domain.value}
- Content Type: {metadata.content_type.value}
- Reading Level: {metadata.reading_level.value}
- Educational Level: {metadata.educational_level}
- Complexity Score: {metadata.complexity_score:.2f}
- Key Concepts: {', '.join(metadata.key_concepts[:5])}
- Main Topics: {', '.join(metadata.main_topics[:3])}

REQUIREMENTS:
- Target Audience: {requirements.target_audience}
- Educational Level: {requirements.educational_level}
- Prior Knowledge: {requirements.prior_knowledge_assumed}
- Time Constraint: {requirements.time_constraint} seconds
- Assessment Focus: {requirements.assessment_focus}
- Domain Specificity: {requirements.domain_specificity}

QUESTION REQUIREMENTS:
- Difficulty: {question_context.target_difficulty.value}
- Cognitive Level: {question_context.cognitive_level.value}
- Focus Area: {question_context.focus_area}
- Question Count: {question_count}
"""
        
        # Customize template
        customized_prompt = template.format(
            context_info=context_info,
            question_count=question_count,
            difficulty=question_context.target_difficulty.value,
            cognitive_level=question_context.cognitive_level.value,
            focus_area=question_context.focus_area
        )
        
        return customized_prompt
    
    async def _generate_questions_from_prompts(
        self,
        prompts: List[str],
        question_context: QuestionContext
    ) -> List[Dict[str, Any]]:
        """Generate questions from context-aware prompts"""
        
        # This would integrate with the AI provider system
        # For now, return placeholder questions
        questions = []
        
        for i, prompt in enumerate(prompts):
            # Create context-aware question structure
            question = {
                "id": f"context_q_{i}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "type": "multiple-choice",  # Default type
                "prompt": prompt,
                "context_metadata": {
                    "domain": question_context.content_metadata.domain.value,
                    "content_type": question_context.content_metadata.content_type.value,
                    "reading_level": question_context.content_metadata.reading_level.value,
                    "complexity_score": question_context.content_metadata.complexity_score,
                    "key_concepts": question_context.content_metadata.key_concepts[:5],
                    "generated_at": datetime.now().isoformat()
                },
                "context_aware": True,
                "context_validated": False
            }
            
            questions.append(question)
        
        return questions
    
    async def _validate_context_aware_questions(
        self,
        questions: List[Dict[str, Any]],
        question_context: QuestionContext
    ) -> List[Dict[str, Any]]:
        """Validate questions for context alignment"""
        
        validated_questions = []
        
        for question in questions:
            # Check context relevance
            relevance_score = await self._calculate_context_relevance(question, question_context)
            
            # Check alignment with requirements
            alignment_score = await self._calculate_requirement_alignment(question, question_context)
            
            # Check appropriateness for audience
            appropriateness_score = await self._calculate_audience_appropriateness(question, question_context)
            
            # Overall context score
            context_score = (relevance_score + alignment_score + appropriateness_score) / 3.0
            
            # Update question with context validation
            question["context_validation"] = {
                "relevance_score": relevance_score,
                "alignment_score": alignment_score,
                "appropriateness_score": appropriateness_score,
                "overall_context_score": context_score,
                "validated_at": datetime.now().isoformat(),
                "context_aligned": context_score >= question_context.relevance_threshold
            }
            
            question["context_validated"] = True
            
            if context_score >= question_context.relevance_threshold:
                validated_questions.append(question)
        
        return validated_questions
    
    async def _calculate_context_relevance(
        self,
        question: Dict[str, Any],
        question_context: QuestionContext
    ) -> float:
        """Calculate how relevant the question is to the context"""
        
        # Check if question addresses key concepts
        question_text = question.get("question", "")
        key_concepts = question_context.content_metadata.key_concepts
        
        concept_overlap = sum(1 for concept in key_concepts if concept in question_text.lower())
        concept_relevance = min(1.0, concept_overlap / max(len(key_concepts), 1))
        
        # Check domain alignment
        question_domain = self._infer_question_domain(question_text)
        domain_alignment = 1.0 if question_domain == question_context.content_metadata.domain else 0.5
        
        return (concept_relevance + domain_alignment) / 2.0
    
    def _infer_question_domain(self, question_text: str) -> ContentDomain:
        """Infer the domain of a question"""
        
        # Simple domain inference based on keywords
        domain_indicators = {
            ContentDomain.SCIENCE: ["experiment", "hypothesis", "theory", "molecule", "cell"],
            ContentDomain.MATHEMATICS: ["equation", "calculate", "formula", "theorem", "proof"],
            ContentDomain.HISTORY: ["historical", "century", "war", "ancient", "period"],
            ContentDomain.LITERATURE: ["character", "plot", "theme", "author", "novel"],
            ContentDomain.TECHNOLOGY: ["technology", "software", "hardware", "computer", "digital"]
        }
        
        question_lower = question_text.lower()
        domain_scores = {}
        
        for domain, indicators in domain_indicators.items():
            score = sum(1 for indicator in indicators if indicator in question_lower)
            domain_scores[domain] = score
        
        if domain_scores:
            best_domain = max(domain_scores, key=domain_scores.get)
            if domain_scores[best_domain] > 0:
                return best_domain
        
        return ContentDomain.GENERAL
    
    async def _calculate_requirement_alignment(
        self,
        question: Dict[str, Any],
        question_context: QuestionContext
    ) -> float:
        """Calculate alignment with requirements"""
        
        requirements = question_context.requirements
        
        # Check audience alignment
        audience_alignment = 0.8  # Default moderate alignment
        if requirements.target_audience.lower() in question.get("question", "").lower():
            audience_alignment = 1.0
        
        # Check time constraint alignment
        time_alignment = 1.0  # Assume questions are designed for time constraints
        
        # Check learning objective alignment
        objective_alignment = 0.7  # Default moderate alignment
        if requirements.learning_objectives:
            question_text = question.get("question", "")
            for objective in requirements.learning_objectives:
                if objective.lower() in question_text.lower():
                    objective_alignment = 1.0
                    break
        
        return (audience_alignment + time_alignment + objective_alignment) / 3.0
    
    async def _calculate_audience_appropriateness(
        self,
        question: Dict[str, Any],
        question_context: QuestionContext
    ) -> float:
        """Calculate appropriateness for target audience"""
        
        # Check vocabulary appropriateness
        question_text = question.get("question", "")
        target_reading_level = question_context.content_metadata.reading_level
        
        # Simple vocabulary check
        complex_words = [w for w in question_text.split() if self._is_complex_word(w)]
        complexity_ratio = len(complex_words) / max(len(question_text.split()), 1)
        
        # Score based on reading level
        reading_level_complexity = {
            ReadingLevel.ELEMENTARY: 0.1,
            ReadingLevel.MIDDLE_SCHOOL: 0.2,
            ReadingLevel.HIGH_SCHOOL: 0.3,
            ReadingLevel.UNDERGRADUATE: 0.5,
            ReadingLevel.GRADUATE: 0.7,
            ReadingLevel.PROFESSIONAL: 0.9
        }[target_reading_level]
        
        appropriateness_score = 1.0 - abs(complexity_ratio - reading_level_complexity)
        
        return max(0.0, min(1.0, appropriateness_score))
    
    def _load_domain_keywords(self) -> Dict[str, Dict[str, float]]:
        """Load domain-specific keywords with weights"""
        return {
            "science": {
                "experiment": 2.0, "hypothesis": 1.5, "theory": 1.2, "molecule": 1.0,
                "cell": 1.0, "research": 1.3, "analysis": 1.1, "data": 0.8
            },
            "mathematics": {
                "equation": 2.0, "formula": 1.5, "theorem": 1.8, "calculate": 1.2,
                "proof": 1.5, "algorithm": 1.3, "number": 0.5, "solve": 1.0
            },
            "technology": {
                "software": 2.0, "hardware": 1.8, "computer": 1.5, "digital": 1.2,
                "network": 1.3, "data": 1.0, "system": 1.1, "code": 1.4
            },
            "business": {
                "market": 1.5, "strategy": 1.8, "revenue": 1.3, "management": 1.2,
                "investment": 1.4, "customer": 1.1, "business": 1.0, "company": 0.8
            }
        }
    
    def _load_content_type_patterns(self) -> Dict[str, Dict[str, float]]:
        """Load content type identification patterns"""
        return {
            "factual": {"fact": 2.0, "data": 1.5, "information": 1.2, "statistics": 1.8},
            "conceptual": {"concept": 2.0, "theory": 1.8, "principle": 1.5, "idea": 1.0},
            "procedural": {"step": 2.0, "process": 1.8, "procedure": 1.5, "method": 1.2},
            "analytical": {"analyze": 2.0, "compare": 1.5, "evaluate": 1.8, "examine": 1.3},
            "narrative": {"story": 2.0, "narrative": 1.8, "character": 1.5, "plot": 1.2},
            "descriptive": {"describe": 2.0, "description": 1.8, "appearance": 1.5, "look": 1.0}
        }
    
    def _load_reading_level_indicators(self) -> Dict[str, List[str]]:
        """Load reading level indicators"""
        return {
            "elementary": ["simple", "easy", "basic", "learn", "child", "kid"],
            "middle_school": ["student", "school", "grade", "level", "understand"],
            "high_school": ["advanced", "complex", "analyze", "evaluate", "theory"],
            "undergraduate": ["research", "thesis", "academic", "scholarly", "study"],
            "graduate": ["doctoral", "dissertation", "expert", "specialized", "advanced"],
            "professional": ["professional", "expertise", "specialized", "industry", "field"]
        }
    
    def _load_context_aware_templates(self) -> Dict[str, str]:
        """Load context-aware prompt templates"""
        return {
            "multiple_choice": """
Generate {question_count} context-aware multiple-choice questions based on the following context:

{context_info}

REQUIREMENTS:
- Question Type: Multiple Choice
- Difficulty: {difficulty}
- Cognitive Level: {cognitive_level}
- Focus Area: {focus_area}
- Questions must directly address key concepts from the content
- Options must be plausible and contextually relevant
- Include explanations that reference the content

Format each question as:
Question: [question text]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Correct: [letter] [answer]
Explanation: [explanation with context references]
""",
            "short_answer": """
Generate {question_count} context-aware short answer questions based on the following context:

{context_info}

REQUIREMENTS:
- Question Type: Short Answer
- Difficulty: {difficulty}
- Cognitive Level: {cognitive_level}
- Focus Area: {focus_area}
- Questions must require understanding of key concepts
- Expected length: 20-100 words
- Include scoring criteria based on content understanding

Format each question as:
Question: [question text]
Expected Length: [min]-[max] words
Key Concepts: [concepts to address]
Scoring Criteria: [criteria for evaluation]
""",
            "default": """
Generate {question_count} context-aware questions based on the following context:

{context_info}

REQUIREMENTS:
- Difficulty: {difficulty}
- Cognitive Level: {cognitive_level}
- Focus Area: {focus_area}
- Questions must be contextually relevant and appropriate
- Address key concepts and main topics from the content
"""
        }