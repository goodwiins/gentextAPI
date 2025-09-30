"""
Specialized Question Generators

This module provides specialized generators for different question types
with advanced algorithms for multiple choice, fill-in-blank, and short answer questions.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple, Set
from dataclasses import dataclass
from enum import Enum
import re
import json
from datetime import datetime
import random

from .base import (
    BaseAIProvider, 
    QuestionType,
    Difficulty,
    CognitiveLevel,
    get_provider_registry,
    get_model_router,
    RoutingStrategy
)

logger = logging.getLogger(__name__)

class DistractorStrategy(Enum):
    """Strategies for generating distractors"""
    SEMANTIC_SIMILARITY = "semantic_similarity"
    COMMON_MISCONCEPTIONS = "common_misconceptions"
    PLAUSIBLE_ALTERNATIVES = "plausible_alternatives"
    DOMAIN_SPECIFIC = "domain_specific"

class BlankStrategy(Enum):
    """Strategies for fill-in-the-blank questions"""
    KEY_TERMS = "key_terms"
    CONCEPTUAL = "conceptual"
    DEFINITIONAL = "definitional"
    PROCEDURAL = "procedural"

@dataclass
class MultipleChoiceConfig:
    """Configuration for multiple choice question generation"""
    options_count: int = 4
    distractor_strategy: DistractorStrategy = DistractorStrategy.SEMANTIC_SIMILARITY
    ensure_one_correct: bool = True
    avoid_all_none: bool = True
    balance_option_length: bool = True
    include_explanations: bool = True

@dataclass
class FillInBlankConfig:
    """Configuration for fill-in-the-blank question generation"""
    blank_strategy: BlankStrategy = BlankStrategy.KEY_TERMS
    max_blanks_per_question: int = 1
    min_word_length: int = 4
    exclude_proper_nouns: bool = True
    include_hints: bool = False
    word_bank_size: int = 0

@dataclass
class ShortAnswerConfig:
    """Configuration for short answer question generation"""
    expected_length_min: int = 20
    expected_length_max: int = 100
    require_keywords: bool = True
    include_rubric: bool = True
    allow_partial_credit: bool = True

class MultipleChoiceGenerator:
    """Specialized generator for multiple choice questions"""
    
    def __init__(self, config: MultipleChoiceConfig = None):
        self.config = config or MultipleChoiceConfig()
        self.distractor_generators = {
            DistractorStrategy.SEMANTIC_SIMILARITY: self._generate_semantic_distractors,
            DistractorStrategy.COMMON_MISCONCEPTIONS: self._generate_misconception_distractors,
            DistractorStrategy.PLAUSIBLE_ALTERNATIVES: self._generate_plausible_distractors,
            DistractorStrategy.DOMAIN_SPECIFIC: self._generate_domain_distractors
        }
    
    async def generate_questions(
        self,
        content: str,
        question_count: int,
        difficulty: Difficulty,
        cognitive_level: CognitiveLevel,
        context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Generate multiple choice questions with advanced distractors"""
        
        logger.info(f"Generating {question_count} multiple choice questions")
        
        questions = []
        
        # Generate base questions
        base_questions = await self._generate_base_questions(
            content, question_count, difficulty, cognitive_level, context
        )
        
        # Enhance with distractors
        for base_question in base_questions:
            enhanced_question = await self._enhance_with_distractors(base_question)
            questions.append(enhanced_question)
        
        return questions
    
    async def _generate_base_questions(
        self,
        content: str,
        question_count: int,
        difficulty: Difficulty,
        cognitive_level: CognitiveLevel,
        context: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Generate base multiple choice questions"""
        
        # Get router and provider
        router = await get_model_router()
        registry = await get_provider_registry()
        
        # Create prompt for multiple choice generation
        prompt = self._create_multiple_choice_prompt(
            content, question_count, difficulty, cognitive_level
        )
        
        # Get provider and generate
        provider_ids = list(registry.get_all_providers().keys())
        if provider_ids:
            # Use first available provider for generation
            provider = registry.get_all_providers()[provider_ids[0]]
            
            # Create generation request
            from .base import GenerationRequest, GenerationResult
            request = GenerationRequest(
                id=f"mc_gen_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                content=prompt,
                question_types=[QuestionType.MULTIPLE_CHOICE],
                difficulty=difficulty,
                question_count=question_count,
                context=context or {}
            )
            
            result = await provider.generate_questions(request)
            return result.questions
        
        return []
    
    def _create_multiple_choice_prompt(
        self,
        content: str,
        question_count: int,
        difficulty: Difficulty,
        cognitive_level: CognitiveLevel
    ) -> str:
        """Create specialized prompt for multiple choice generation"""
        
        cognitive_guidance = {
            CognitiveLevel.REMEMBER: "focus on factual recall and basic knowledge",
            CognitiveLevel.UNDERSTAND: "focus on comprehension and explanation of concepts",
            CognitiveLevel.APPLY: "focus on applying knowledge to new situations",
            CognitiveLevel.ANALYZE: "focus on breaking down information and examining relationships",
            CognitiveLevel.EVALUATE: "focus on making judgments and defending positions",
            CognitiveLevel.CREATE: "focus on generating new ideas and solutions"
        }
        
        prompt = f"""Generate {question_count} high-quality multiple choice questions based on the following content.

CONTENT:
{content}

REQUIREMENTS:
- Cognitive Level: {cognitive_level.value} - {cognitive_guidance[cognitive_level]}
- Difficulty: {difficulty.value}
- Questions per concept: 1-2
- Focus on key concepts and important details
- Avoid trivial or overly obvious questions

QUESTION QUALITY STANDARDS:
- Clear, unambiguous wording
- One definitively correct answer
- Plausible but incorrect distractors
- Balanced option lengths
- Age-appropriate language
- Educational value

OUTPUT FORMAT:
For each question, provide:
1. Question text
2. Four options (A, B, C, D)
3. Correct answer with letter
4. Explanation of why it's correct
5. Difficulty level (beginner/intermediate/advanced/expert)
6. Topic/concept being tested

Example format:
Q1: [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Correct: B) [Correct answer]
Explanation: [Detailed explanation]
Difficulty: intermediate
Topic: [Main topic]

Generate the questions now:"""
        
        return prompt
    
    async def _enhance_with_distractors(self, question: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance question with high-quality distractors"""
        
        if question.get("type") != "multiple-choice":
            return question
        
        # Extract correct answer
        correct_answer = question.get("correct_answer", "")
        options = question.get("options", [])
        
        # Generate distractors using selected strategy
        distractor_strategy = self.config.distractor_strategy
        distractor_generator = self.distractor_generators[distractor_strategy]
        
        distractors = await distractor_generator(
            correct_answer, question, options
        )
        
        # Combine and shuffle options
        all_options = [correct_answer] + distractors
        random.shuffle(all_options)
        
        # Update question with enhanced options
        question["options"] = all_options[:self.config.options_count]
        question["correct_letter"] = chr(65 + all_options.index(correct_answer))  # A, B, C, D
        
        # Add distractor metadata
        question["metadata"] = question.get("metadata", {})
        question["metadata"]["distractor_strategy"] = distractor_strategy.value
        question["metadata"]["enhanced_distractors"] = True
        
        return question
    
    async def _generate_semantic_distractors(
        self,
        correct_answer: str,
        question: Dict[str, Any],
        existing_options: List[str]
    ) -> List[str]:
        """Generate distractors using semantic similarity"""
        
        # Simplified semantic distractor generation
        # In production, this would use NLP embeddings or semantic analysis
        
        distractors = []
        
        # Strategy 1: Synonyms or related terms
        synonyms = self._get_synonyms(correct_answer)
        distractors.extend(synonyms[:2])
        
        # Strategy 2: Terms from the same domain
        domain_terms = self._get_domain_terms(question)
        distractors.extend(domain_terms[:2])
        
        # Filter out existing options and correct answer
        distractors = [
            d for d in distractors 
            if d not in existing_options and d != correct_answer
        ]
        
        return distractors[:3]  # Return up to 3 distractors
    
    async def _generate_misconception_distractors(
        self,
        correct_answer: str,
        question: Dict[str, Any],
        existing_options: List[str]
    ) -> List[str]:
        """Generate distractors based on common misconceptions"""
        
        # Common misconception patterns
        misconception_patterns = [
            f"Not {correct_answer}",
            f"Only {correct_answer}",
            f"{correct_answer} always",
            f"Never {correct_answer}",
            f"All {correct_answer}",
            f"No {correct_answer}"
        ]
        
        distractors = []
        for pattern in misconception_patterns:
            if len(pattern) < 100:  # Reasonable length
                distractors.append(pattern)
        
        # Filter out existing options
        distractors = [
            d for d in distractors 
            if d not in existing_options and d != correct_answer
        ]
        
        return distractors[:3]
    
    async def _generate_plausible_distractors(
        self,
        correct_answer: str,
        question: Dict[str, Any],
        existing_options: List[str]
    ) -> List[str]:
        """Generate plausible alternative distractors"""
        
        # Generate plausible alternatives
        distractors = []
        
        # Strategy 1: Partial correct answers
        if len(correct_answer.split()) > 1:
            words = correct_answer.split()
            partial_answers = [
                " ".join(words[:-1]),  # Remove last word
                " ".join(words[1:]),   # Remove first word
                words[0]              # Just first word
            ]
            distractors.extend(partial_answers)
        
        # Strategy 2: Related but incorrect concepts
        related_concepts = self._get_related_concepts(correct_answer)
        distractors.extend(related_concepts)
        
        # Filter and limit
        distractors = [
            d for d in distractors 
            if d not in existing_options and d != correct_answer and len(d) > 0
        ]
        
        return distractors[:3]
    
    async def _generate_domain_distractors(
        self,
        correct_answer: str,
        question: Dict[str, Any],
        existing_options: List[str]
    ) -> List[str]:
        """Generate domain-specific distractors"""
        
        # Extract domain from question context
        domain = question.get("metadata", {}).get("domain", "general")
        
        # Domain-specific distractor strategies
        domain_distractors = {
            "scientific": [
                "Hypothesis", "Theory", "Law", "Fact", "Observation"
            ],
            "historical": [
                "Ancient", "Medieval", "Modern", "Contemporary", "Future"
            ],
            "technical": [
                "Hardware", "Software", "Network", "Database", "Security"
            ]
        }
        
        distractors = domain_distractors.get(domain, ["Alternative", "Option", "Choice", "Method"])
        
        # Filter and limit
        distractors = [
            d for d in distractors 
            if d not in existing_options and d != correct_answer
        ]
        
        return distractors[:3]
    
    def _get_synonyms(self, term: str) -> List[str]:
        """Get synonyms for a term (simplified)"""
        # In production, use a thesaurus or word embeddings
        synonym_map = {
            "important": ["significant", "crucial", "vital", "essential"],
            "process": ["procedure", "method", "system", "approach"],
            "analysis": ["examination", "investigation", "study", "evaluation"],
            "concept": ["idea", "notion", "principle", "theory"],
            "effect": ["result", "outcome", "consequence", "impact"]
        }
        
        term_lower = term.lower()
        for key, synonyms in synonym_map.items():
            if key in term_lower:
                return synonyms
        
        return []
    
    def _get_domain_terms(self, question: Dict[str, Any]) -> List[str]:
        """Get domain-specific terms"""
        # Extract domain from question metadata
        domain = question.get("metadata", {}).get("domain", "general")
        
        domain_terms = {
            "scientific": ["molecule", "cell", "energy", "force", "mass"],
            "historical": ["century", "dynasty", "empire", "revolution", "culture"],
            "technical": ["algorithm", "database", "network", "protocol", "interface"]
        }
        
        return domain_terms.get(domain, [])
    
    def _get_related_concepts(self, term: str) -> List[str]:
        """Get related concepts for a term"""
        # Simplified related concepts
        related_map = {
            "photosynthesis": ["respiration", "chlorophyll", "sunlight", "oxygen"],
            "gravity": ["force", "mass", "acceleration", "weight"],
            "democracy": ["voting", "election", "representation", "freedom"],
            "economy": ["market", "trade", "currency", "resources"]
        }
        
        term_lower = term.lower()
        for key, concepts in related_map.items():
            if key in term_lower:
                return concepts
        
        return []

class FillInBlankGenerator:
    """Specialized generator for fill-in-the-blank questions"""
    
    def __init__(self, config: FillInBlankConfig = None):
        self.config = config or FillInBlankConfig()
        self.blank_strategies = {
            BlankStrategy.KEY_TERMS: self._generate_key_term_blanks,
            BlankStrategy.CONCEPTUAL: self._generate_conceptual_blanks,
            BlankStrategy.DEFINITIONAL: self._generate_definitional_blanks,
            BlankStrategy.PROCEDURAL: self._generate_procedural_blanks
        }
    
    async def generate_questions(
        self,
        content: str,
        question_count: int,
        difficulty: Difficulty,
        context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Generate fill-in-the-blank questions"""
        
        logger.info(f"Generating {question_count} fill-in-the-blank questions")
        
        questions = []
        
        # Extract candidate words for blanks
        candidate_words = self._extract_candidate_words(content)
        
        # Generate questions using selected strategy
        blank_strategy = self.config.blank_strategy
        blank_generator = self.blank_strategies[blank_strategy]
        
        generated_questions = await blank_generator(
            content, candidate_words, question_count, difficulty
        )
        
        # Post-process questions
        for question in generated_questions:
            processed_question = await self._post_process_question(question)
            questions.append(processed_question)
        
        return questions
    
    def _extract_candidate_words(self, content: str) -> List[Tuple[str, int]]:
        """Extract candidate words for blanks"""
        
        candidates = []
        sentences = re.split(r'[.!?]+', content)
        
        for i, sentence in enumerate(sentences):
            if len(sentence.strip()) < 20:  # Skip very short sentences
                continue
            
            words = sentence.split()
            for j, word in enumerate(words):
                # Check if word is a good candidate
                if self._is_good_candidate(word):
                    candidates.append((word, i))  # (word, sentence_index)
        
        return candidates
    
    def _is_good_candidate(self, word: str) -> bool:
        """Check if a word is a good blank candidate"""
        
        # Clean word of punctuation
        clean_word = re.sub(r'[^\w]', '', word)
        
        # Length check
        if len(clean_word) < self.config.min_word_length:
            return False
        
        # Exclude proper nouns if configured
        if self.config.exclude_proper_nouns and clean_word.istitle():
            return False
        
        # Exclude common words
        common_words = {
            "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
            "is", "are", "was", "were", "be", "been", "have", "has", "had", "do",
            "does", "did", "will", "would", "could", "should", "may", "might", "can"
        }
        
        if clean_word.lower() in common_words:
            return False
        
        return True
    
    async def _generate_key_term_blanks(
        self,
        content: str,
        candidate_words: List[Tuple[str, int]],
        question_count: int,
        difficulty: Difficulty
    ) -> List[Dict[str, Any]]:
        """Generate blanks based on key terms"""
        
        questions = []
        
        # Select top candidates based on frequency and importance
        word_freq = {}
        for word, _ in candidate_words:
            clean_word = re.sub(r'[^\w]', '', word).lower()
            word_freq[clean_word] = word_freq.get(clean_word, 0) + 1
        
        # Sort by frequency and take top candidates
        sorted_candidates = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        top_candidates = [word for word, freq in sorted_candidates[:question_count * 2]]
        
        # Generate questions
        for candidate in top_candidates[:question_count]:
            question = await self._create_blank_question(
                content, candidate, difficulty, "key_term"
            )
            if question:
                questions.append(question)
        
        return questions
    
    async def _generate_conceptual_blanks(
        self,
        content: str,
        candidate_words: List[Tuple[str, int]],
        question_count: int,
        difficulty: Difficulty
    ) -> List[Dict[str, Any]]:
        """Generate blanks based on conceptual understanding"""
        
        questions = []
        
        # Focus on conceptual terms (nouns and important verbs)
        conceptual_candidates = []
        for word, _ in candidate_words:
            clean_word = re.sub(r'[^\w]', '', word)
            if self._is_conceptual_term(clean_word):
                conceptual_candidates.append(clean_word)
        
        # Generate questions
        for candidate in conceptual_candidates[:question_count]:
            question = await self._create_blank_question(
                content, candidate, difficulty, "conceptual"
            )
            if question:
                questions.append(question)
        
        return questions
    
    async def _generate_definitional_blanks(
        self,
        content: str,
        candidate_words: List[Tuple[str, int]],
        question_count: int,
        difficulty: Difficulty
    ) -> List[Dict[str, Any]]:
        """Generate blanks based on definitions"""
        
        questions = []
        
        # Look for definitional patterns
        definitional_candidates = []
        sentences = re.split(r'[.!?]+', content)
        
        for sentence in sentences:
            # Look for definition patterns
            if any(pattern in sentence.lower() for pattern in ["is defined as", "refers to", "means that", "is a"]):
                words = sentence.split()
                for word in words:
                    clean_word = re.sub(r'[^\w]', '', word)
                    if self._is_good_candidate(clean_word):
                        definitional_candidates.append(clean_word)
        
        # Generate questions
        for candidate in definitional_candidates[:question_count]:
            question = await self._create_blank_question(
                content, candidate, difficulty, "definitional"
            )
            if question:
                questions.append(question)
        
        return questions
    
    async def _generate_procedural_blanks(
        self,
        content: str,
        candidate_words: List[Tuple[str, int]],
        question_count: int,
        difficulty: Difficulty
    ) -> List[Dict[str, Any]]:
        """Generate blanks based on procedural steps"""
        
        questions = []
        
        # Look for procedural language
        procedural_candidates = []
        sentences = re.split(r'[.!?]+', content)
        
        for sentence in sentences:
            if any(pattern in sentence.lower() for pattern in ["first", "then", "next", "finally", "step", "process"]):
                words = sentence.split()
                for word in words:
                    clean_word = re.sub(r'[^\w]', '', word)
                    if self._is_good_candidate(clean_word):
                        procedural_candidates.append(clean_word)
        
        # Generate questions
        for candidate in procedural_candidates[:question_count]:
            question = await self._create_blank_question(
                content, candidate, difficulty, "procedural"
            )
            if question:
                questions.append(question)
        
        return questions
    
    def _is_conceptual_term(self, word: str) -> bool:
        """Check if a word is a conceptual term"""
        # Simple heuristic: nouns that are not too common
        conceptual_indicators = ["tion", "sion", "ment", "ness", "ity", "er", "or", "ist"]
        return any(indicator in word.lower() for indicator in conceptual_indicators)
    
    async def _create_blank_question(
        self,
        content: str,
        target_word: str,
        difficulty: Difficulty,
        blank_type: str
    ) -> Optional[Dict[str, Any]]:
        """Create a fill-in-the-blank question"""
        
        # Find sentences containing the target word
        sentences = re.split(r'[.!?]+', content)
        target_sentences = []
        
        for sentence in sentences:
            if target_word.lower() in sentence.lower():
                target_sentences.append(sentence.strip())
        
        if not target_sentences:
            return None
        
        # Select the best sentence (prefer mid-length sentences)
        selected_sentence = min(target_sentences, key=lambda s: abs(len(s.split()) - 15))
        
        # Create blank
        blank_pattern = re.compile(r'\b' + re.escape(target_word) + r'\b', re.IGNORECASE)
        question_text = blank_pattern.sub('__________', selected_sentence, count=1)
        
        # Create word bank if configured
        word_bank = []
        if self.config.word_bank_size > 0:
            word_bank = self._create_word_bank(target_word, content, self.config.word_bank_size)
        
        # Create question
        question = {
            "id": f"fib_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{random.randint(1000, 9999)}",
            "type": "fill-in-blank",
            "question": question_text,
            "correct_answer": target_word,
            "blank_type": blank_type,
            "difficulty": difficulty.value,
            "word_bank": word_bank if word_bank else None,
            "metadata": {
                "original_sentence": selected_sentence,
                "blank_position": selected_sentence.lower().find(target_word.lower()),
                "blank_strategy": self.config.blank_strategy.value
            }
        }
        
        # Add hint if configured
        if self.config.include_hints:
            question["hint"] = self._generate_hint(target_word, blank_type)
        
        return question
    
    def _create_word_bank(self, correct_answer: str, content: str, size: int) -> List[str]:
        """Create a word bank for the question"""
        
        # Extract other candidate words from content
        candidates = self._extract_candidate_words(content)
        candidate_words = [word for word, _ in candidates]
        
        # Filter out correct answer and get random alternatives
        alternatives = [w for w in candidate_words if w.lower() != correct_answer.lower()]
        
        if len(alternatives) >= size - 1:
            word_bank = random.sample(alternatives, size - 1)
        else:
            word_bank = alternatives
        
        # Add correct answer and shuffle
        word_bank.append(correct_answer)
        random.shuffle(word_bank)
        
        return word_bank
    
    def _generate_hint(self, target_word: str, blank_type: str) -> str:
        """Generate a hint for the blank"""
        
        hints = {
            "key_term": f"This is a key term in the text",
            "conceptual": f"Think about the main concept being described",
            "definitional": f"This word is being defined in the sentence",
            "procedural": f"This is part of a process or sequence"
        }
        
        base_hint = hints.get(blank_type, "Consider the context of the sentence")
        
        # Add specific hint based on word characteristics
        if len(target_word) > 8:
            return f"{base_hint}. The word is relatively long."
        elif target_word.istitle():
            return f"{base_hint}. The word is a proper noun."
        else:
            return base_hint
    
    async def _post_process_question(self, question: Dict[str, Any]) -> Dict[str, Any]:
        """Post-process fill-in-the-blank question"""
        
        # Add validation
        question["validated"] = True
        
        # Add metadata
        question["created_at"] = datetime.now().isoformat()
        question["generator"] = "fill-in-blank-specialized"
        
        return question

class ShortAnswerGenerator:
    """Specialized generator for short answer questions"""
    
    def __init__(self, config: ShortAnswerConfig = None):
        self.config = config or ShortAnswerConfig()
    
    async def generate_questions(
        self,
        content: str,
        question_count: int,
        difficulty: Difficulty,
        cognitive_level: CognitiveLevel,
        context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Generate short answer questions"""
        
        logger.info(f"Generating {question_count} short answer questions")
        
        questions = []
        
        # Generate question stems
        question_stems = await self._generate_question_stems(
            content, question_count, difficulty, cognitive_level
        )
        
        # Create full questions with rubrics
        for stem in question_stems:
            question = await self._create_short_answer_question(
                stem, difficulty, cognitive_level
            )
            questions.append(question)
        
        return questions
    
    async def _generate_question_stems(
        self,
        content: str,
        question_count: int,
        difficulty: Difficulty,
        cognitive_level: CognitiveLevel
    ) -> List[str]:
        """Generate question stems for short answer questions"""
        
        # Extract key concepts and create question stems
        stems = []
        
        # Cognitive level specific question patterns
        question_patterns = {
            CognitiveLevel.REMEMBER: [
                "What is the definition of {}?",
                "List the main characteristics of {}.",
                "Describe the key features of {}."
            ],
            CognitiveLevel.UNDERSTAND: [
                "Explain the concept of {} in your own words.",
                "How would you describe the relationship between {} and {}?",
                "What is meant by {} in this context?"
            ],
            CognitiveLevel.APPLY: [
                "How would you apply {} to a real-world situation?",
                "Give an example of how {} can be used.",
                "Illustrate how {} works in practice."
            ],
            CognitiveLevel.ANALYZE: [
                "Analyze the factors that influence {}.",
                "What are the components of {} and how do they relate?",
                "Compare and contrast {} with {}."
            ],
            CognitiveLevel.EVALUATE: [
                "Evaluate the effectiveness of {}.",
                "What are the strengths and weaknesses of {}?",
                "Assess the impact of {} on {}."
            ],
            CognitiveLevel.CREATE: [
                "Design a new approach to {}.",
                "How could {} be improved or modified?",
                "Propose an alternative to {}."
            ]
        }
        
        # Extract key concepts from content
        key_concepts = self._extract_key_concepts(content)
        
        # Generate stems using patterns
        patterns = question_patterns.get(cognitive_level, question_patterns[CognitiveLevel.UNDERSTAND])
        
        for i in range(min(question_count, len(key_concepts))):
            concept = key_concepts[i]
            pattern = random.choice(patterns)
            
            # Format the pattern
            if "{}" in pattern:
                stem = pattern.format(concept)
            else:
                stem = pattern + " " + concept
            
            stems.append(stem)
        
        return stems
    
    def _extract_key_concepts(self, content: str) -> List[str]:
        """Extract key concepts from content"""
        
        # Simple concept extraction
        words = re.findall(r'\b[a-zA-Z]{4,}\b', content.lower())
        word_freq = {}
        
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Get most frequent words
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        concepts = [word for word, freq in sorted_words if freq >= 2]  # Appear at least twice
        
        return concepts[:10]  # Limit to top 10 concepts
    
    async def _create_short_answer_question(
        self,
        stem: str,
        difficulty: Difficulty,
        cognitive_level: CognitiveLevel
    ) -> Dict[str, Any]:
        """Create a complete short answer question"""
        
        question = {
            "id": f"sa_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{random.randint(1000, 9999)}",
            "type": "short-answer",
            "question": stem,
            "difficulty": difficulty.value,
            "cognitive_level": cognitive_level.value,
            "expected_length": {
                "min": self.config.expected_length_min,
                "max": self.config.expected_length_max
            },
            "metadata": {
                "require_keywords": self.config.require_keywords,
                "allow_partial_credit": self.config.allow_partial_credit,
                "created_at": datetime.now().isoformat()
            }
        }
        
        # Add rubric if configured
        if self.config.include_rubric:
            question["rubric"] = self._create_rubric(difficulty, cognitive_level)
        
        # Add keywords if configured
        if self.config.require_keywords:
            question["keywords"] = self._extract_keywords_from_question(stem)
        
        return question
    
    def _create_rubric(self, difficulty: Difficulty, cognitive_level: CognitiveLevel) -> Dict[str, Any]:
        """Create a scoring rubric for the question"""
        
        rubric = {
            "total_points": 5,
            "criteria": [
                {
                    "criterion": "Accuracy",
                    "description": "Correctness of information and concepts",
                    "max_points": 2
                },
                {
                    "criterion": "Completeness", 
                    "description": "Addresses all parts of the question",
                    "max_points": 1
                },
                {
                    "criterion": "Clarity",
                    "description": "Clear and well-explained response",
                    "max_points": 1
                },
                {
                    "criterion": "Relevance",
                    "description": "Stays on topic and relevant to question",
                    "max_points": 1
                }
            ]
        }
        
        # Adjust based on cognitive level
        if cognitive_level in [CognitiveLevel.ANALYZE, CognitiveLevel.EVALUATE, CognitiveLevel.CREATE]:
            rubric["criteria"].append({
                "criterion": "Depth",
                "description": "Demonstrates deep understanding and critical thinking",
                "max_points": 1
            })
            rubric["total_points"] = 6
        
        return rubric
    
    def _extract_keywords_from_question(self, question_text: str) -> List[str]:
        """Extract expected keywords from question"""
        
        # Extract important nouns and verbs
        words = re.findall(r'\b[a-zA-Z]{4,}\b', question_text.lower())
        
        # Filter out common words
        common_words = {"what", "when", "where", "why", "how", "would", "could", "should"}
        keywords = [word for word in words if word not in common_words]
        
        return keywords[:5]  # Limit to 5 keywords