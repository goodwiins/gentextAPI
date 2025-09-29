"""
Cohere Command R+ Provider Implementation

This module implements the Cohere Command R+ provider for question generation.
"""

import asyncio
import json
import time
from typing import Dict, List, Any, Optional
import cohere
from cohere import AsyncClient
import backoff

from .base import BaseAIProvider, ProviderConfig, GenerationRequest, GenerationResult, ProviderCapabilities, QuestionType, Difficulty
import logging

logger = logging.getLogger(__name__)

class CohereProvider(BaseAIProvider):
    """Cohere Command R+ provider implementation"""
    
    def __init__(self, config: ProviderConfig):
        super().__init__("cohere-command-r", config)
        self.client = AsyncClient(
            api_key=config.api_key,
            base_url=config.base_url,
            timeout=config.timeout
        )
    
    def _get_capabilities(self) -> ProviderCapabilities:
        """Get Cohere Command R+ capabilities"""
        return ProviderCapabilities(
            supported_question_types=[
                QuestionType.TRUE_FALSE,
                QuestionType.MULTIPLE_CHOICE,
                QuestionType.FILL_IN_BLANK,
                QuestionType.SHORT_ANSWER,
                QuestionType.ESSAY,
                QuestionType.MATCHING,
                QuestionType.ORDERING,
                QuestionType.CLASSIFICATION
            ],
            max_context_length=128000,  # Command R+ has 128K context
            max_output_tokens=4096,
            supports_streaming=True,
            supports_batch=True,
            supports_json_mode=False,  # Cohere doesn't have native JSON mode
            languages=["en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh", "ar"],
            domains=["general", "academic", "technical", "scientific", "business", "medical", "legal", "professional"]
        )
    
    @backoff.on_exception(
        backoff.expo,
        (cohere.errors.TooManyRequests, cohere.errors.ServiceUnavailable, cohere.errors.InternalServerError),
        max_tries=3,
        factor=2
    )
    async def _call_cohere_api(
        self, 
        prompt: str, 
        **kwargs
    ) -> Dict[str, Any]:
        """Make API call to Cohere with retry logic"""
        
        # Default parameters
        params = {
            "model": self.config.model,
            "prompt": prompt,
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature,
        }
        
        # Merge with additional parameters
        params.update(kwargs)
        
        logger.debug(f"Calling Cohere API with model: {self.config.model}")
        
        try:
            response = await self.client.generate(**params)
            return response.dict()
        except Exception as e:
            logger.error(f"Cohere API call failed: {str(e)}")
            raise
    
    def _build_prompt(self, request: GenerationRequest) -> str:
        """Build prompt for question generation"""
        
        # System prompt based on question types
        system_prompt = self._get_system_prompt(request)
        
        # User prompt with content and requirements
        user_prompt = self._get_user_prompt(request)
        
        return f"{system_prompt}\n\n{user_prompt}"
    
    def _get_system_prompt(self, request: GenerationRequest) -> str:
        """Generate system prompt based on question types and difficulty"""
        
        base_prompt = """You are an expert educational content creator specializing in generating high-quality assessment questions. 

Your task is to create engaging, accurate, and pedagogically sound questions based on the provided content.

Core Guidelines:
1. Accuracy: All questions must be directly based on and verifiable from the provided content
2. Clarity: Questions should be unambiguous and clearly worded
3. Educational Value: Questions should assess meaningful understanding and learning objectives
4. Professional Tone: Use professional, educational language appropriate for the target audience
5. Structured Output: Provide well-organized, structured responses

Question Design Principles:
- Use clear, concise language
- Avoid ambiguous or trick questions
- Ensure questions assess understanding, not just memorization
- Provide appropriate context when necessary
- Include comprehensive explanations for answers
- Follow instructional design best practices"""

        # Add question type specific instructions
        if QuestionType.MULTIPLE_CHOICE in request.question_types:
            base_prompt += """

Multiple-Choice Question Guidelines:
- Provide exactly 4 options (A, B, C, D)
- Ensure only one correct answer
- Create plausible but clearly incorrect distractors
- Make options similar in length and complexity
- Avoid "all of the above" or "none of the above" options"""
        
        if QuestionType.TRUE_FALSE in request.question_types:
            base_prompt += """

True/False Question Guidelines:
- Make statements unambiguously true or false
- Avoid partially true or misleading statements
- Focus on key facts and concepts from the content
- Ensure statements are factually verifiable"""
        
        if QuestionType.SHORT_ANSWER in request.question_types:
            base_prompt += """

Short-Answer Question Guidelines:
- Ask questions requiring 1-3 sentence responses
- Focus on key concepts, explanations, or applications
- Ensure questions have specific, correct answers
- Provide clear response expectations"""
        
        if QuestionType.FILL_IN_BLANK in request.question_types:
            base_prompt += """

Fill-in-the-Blank Question Guidelines:
- Select key vocabulary terms or essential concepts
- Ensure the blank represents a specific, important term
- Provide sufficient context for determining the correct answer
- Choose terms critical to understanding the content"""
        
        if QuestionType.ESSAY in request.question_types:
            base_prompt += """

Essay Question Guidelines:
- Require critical thinking, analysis, or synthesis
- Ask for evaluation, comparison, or application of concepts
- Provide clear guidance on expected response length and focus
- Encourage depth of understanding and reasoning"""
        
        # Add difficulty specific instructions
        difficulty_instructions = {
            Difficulty.BEGINNER: "Use simple language and focus on basic recall and understanding",
            Difficulty.INTERMEDIATE: "Include some analysis and application of concepts",
            Difficulty.ADVANCED: "Require critical thinking and complex reasoning",
            Difficulty.EXPERT: "Demand sophisticated analysis and expert-level evaluation"
        }
        
        base_prompt += f"""

Difficulty Level: {difficulty_instructions.get(request.difficulty, 'Standard difficulty')}"""
        
        return base_prompt
    
    def _get_user_prompt(self, request: GenerationRequest) -> str:
        """Generate user prompt with specific instructions"""
        
        # Format question types
        question_types_str = ", ".join([qt.value.replace('-', ' ').title() for qt in request.question_types])
        
        prompt = f"""TASK: Generate {request.question_count} high-quality assessment questions

CONTENT:
{request.content}

REQUIREMENTS:
- Number of questions: {request.question_count}
- Question types: {question_types_str}
- Difficulty level: {request.difficulty.value}
- Target audience: {request.context.get('audience', 'general learners')}
- Educational level: {request.context.get('educational_level', 'not specified')}
- Subject area: {request.context.get('domain', 'general')}"""

        # Calculate question distribution
        type_distribution = {}
        for qt in request.question_types:
            type_distribution[qt] = type_distribution.get(qt, 0) + 1
        
        if type_distribution:
            prompt += """

QUESTION DISTRIBUTION:"""
            for qt, count in type_distribution.items():
                prompt += f"\n- {count} {qt.value.replace('-', ' ').title().lower()} question{'s' if count > 1 else ''}"
        
        # Add any custom instructions
        if request.options.get('custom_instructions'):
            prompt += f"""

CUSTOM INSTRUCTIONS:
{request.options['custom_instructions']}"""
        
        # Add specific options
        if request.options.get('include_explanations', False):
            prompt += "\n- Include detailed explanations for each answer"
        
        if request.options.get('include_hints', False):
            prompt += "\n- Include helpful hints for difficult questions"
        
        if request.options.get('difficulty_variation', False):
            prompt += "\n- Vary difficulty levels within the general range"
        
        # Add output format requirements
        prompt += """

OUTPUT FORMAT:
Please provide your response in the following structured format:

## QUESTIONS

### Question 1
**Type:** [question_type]
**Question:** [the question text]
**Options:** [for multiple choice: A) option1 B) option2 C) option3 D) option4]
**Correct Answer:** [the correct answer]
**Explanation:** [clear explanation of why this is correct]
**Difficulty:** [specific difficulty level]
**Topic:** [related topic from content]
**Keywords:** [relevant keywords]

### Question 2
**Type:** [question_type]
**Question:** [the question text]
[Format according to question type...]

## SUMMARY
**Total Questions:** [number]
**Content Summary:** [brief summary of covered content]
**Difficulty Distribution:** [breakdown by difficulty level]
**Key Topics:** [list of main topics covered]

Important: Ensure your response is well-structured and directly based on the provided content."""
        
        return prompt
    
    async def _generate_questions_impl(
        self, 
        request: GenerationRequest
    ) -> GenerationResult:
        """Generate questions using Cohere Command R+"""
        
        start_time = time.time()
        
        # Build prompt
        prompt = self._build_prompt(request)
        
        # Make API call
        try:
            response = await self._call_cohere_api(prompt)
            
            # Extract response text
            content = response['generations'][0]['text']
            
            # Parse structured response
            questions = self._parse_cohere_response(content, request)
            
            # Calculate metrics
            processing_time = time.time() - start_time
            
            # Estimate cost
            input_tokens = response['meta']['billed_units']['input_tokens']
            output_tokens = response['meta']['billed_units']['output_tokens']
            cost = (input_tokens * 0.003) + (output_tokens * 0.015)  # Command R+ pricing
            
            # Calculate quality score
            quality_score = self._calculate_quality_score(questions)
            
            return GenerationResult(
                request_id=request.id,
                questions=questions,
                provider=self.provider_id,
                model=self.config.model,
                metrics={
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "total_tokens": input_tokens + output_tokens,
                    "api_calls": 1,
                    "retries": 0
                },
                cost=cost,
                quality_score=quality_score,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Failed to generate questions with Cohere: {str(e)}")
            raise
    
    def _parse_cohere_response(self, content: str, request: GenerationRequest) -> List[Dict[str, Any]]:
        """Parse Cohere's structured response into question format"""
        
        questions = []
        lines = content.split('\n')
        
        current_question = {}
        parsing_questions = False
        question_count = 0
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            if line.startswith('## QUESTIONS'):
                parsing_questions = True
                i += 1
                continue
            
            if not parsing_questions:
                i += 1
                continue
            
            if line.startswith('### Question') and question_count < request.question_count:
                # Save previous question if exists
                if current_question:
                    question = self._finalize_question(current_question)
                    if question:
                        questions.append(question)
                        question_count += 1
                
                # Start new question
                current_question = {
                    'id': f"{self.provider_id}_q_{question_count + 1}",
                    'provider': self.provider_id,
                    'model': self.config.model,
                    'generated_at': time.time()
                }
                i += 1
                continue
            
            # Parse question fields
            if line.startswith('**Type:**'):
                current_question['type'] = line.replace('**Type:**', '').strip().lower()
            elif line.startswith('**Question:**'):
                # Multi-line question support
                question_text = line.replace('**Question:**', '').strip()
                i += 1
                while i < len(lines) and not lines[i].startswith('**') and lines[i].strip():
                    question_text += ' ' + lines[i].strip()
                    i += 1
                current_question['question'] = question_text
                continue
            elif line.startswith('**Options:**'):
                options_text = line.replace('**Options:**', '').strip()
                # Parse options like "A) option1 B) option2 C) option3 D) option4"
                options = []
                import re
                option_matches = re.findall(r'([A-D])\)\s*([^)]+(?:\([^)]*\)[^)]*)*)', options_text)
                for letter, option_text in option_matches:
                    options.append(option_text.strip())
                if options:
                    current_question['options'] = options
            elif line.startswith('**Correct Answer:**'):
                current_question['correct_answer'] = line.replace('**Correct Answer:**', '').strip()
            elif line.startswith('**Explanation:**'):
                # Multi-line explanation support
                explanation = line.replace('**Explanation:**', '').strip()
                i += 1
                while i < len(lines) and not lines[i].startswith('**') and lines[i].strip():
                    explanation += ' ' + lines[i].strip()
                    i += 1
                current_question['explanation'] = explanation
                continue
            elif line.startswith('**Difficulty:**'):
                current_question['difficulty'] = line.replace('**Difficulty:**', '').strip()
            elif line.startswith('**Topic:**'):
                current_question['topic'] = line.replace('**Topic:**', '').strip()
            elif line.startswith('**Keywords:**'):
                keywords_text = line.replace('**Keywords:**', '').strip()
                import re
                keywords = re.findall(r'([^,]+)', keywords_text)
                if keywords:
                    current_question['metadata'] = current_question.get('metadata', {})
                    current_question['metadata']['keywords'] = [k.strip() for k in keywords]
            
            i += 1
        
        # Save the last question
        if current_question:
            question = self._finalize_question(current_question)
            if question:
                questions.append(question)
        
        logger.info(f"Parsed {len(questions)} questions from Cohere response")
        return questions
    
    def _finalize_question(self, question_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Finalize and validate a question"""
        
        # Required fields
        required_fields = ['type', 'question', 'correct_answer']
        if not all(field in question_data for field in required_fields):
            logger.warning(f"Question missing required fields: {question_data}")
            return None
        
        # Validate question type
        try:
            QuestionType(question_data['type'])
        except ValueError:
            # Map common variations
            type_mapping = {
                'multiple choice': 'multiple-choice',
                'true false': 'true-false',
                'fill in the blank': 'fill-in-blank',
                'short answer': 'short-answer'
            }
            normalized_type = type_mapping.get(question_data['type'], question_data['type'])
            try:
                QuestionType(normalized_type)
                question_data['type'] = normalized_type
            except ValueError:
                logger.warning(f"Invalid question type: {question_data['type']}")
                return None
        
        # Validate options for multiple choice
        if question_data['type'] == 'multiple-choice':
            if 'options' not in question_data or len(question_data.get('options', [])) < 2:
                logger.warning("Multiple choice question missing options")
                return None
        
        # Add metadata if not present
        if 'metadata' not in question_data:
            question_data['metadata'] = {}
        
        return question_data
    
    def _calculate_quality_score(self, questions: List[Dict[str, Any]]) -> float:
        """Calculate a quality score for the generated questions"""
        
        if not questions:
            return 0.0
        
        score = 0.0
        factors = 0.0
        
        # Check structural completeness
        structure_scores = []
        for q in questions:
            required_fields = ['type', 'question', 'correct_answer']
            optional_fields = ['explanation', 'difficulty', 'topic', 'options']
            
            present_required = sum(1 for field in required_fields if field in q)
            present_optional = sum(1 for field in optional_fields if field in q)
            
            structure_score = (present_required / len(required_fields)) * 0.7 + (present_optional / len(optional_fields)) * 0.3
            structure_scores.append(min(structure_score, 1.0))
        
        if structure_scores:
            avg_structure_score = sum(structure_scores) / len(structure_scores)
            score += avg_structure_score * 0.35
            factors += 0.35
        
        # Check explanation quality and presence
        explanations_count = sum(1 for q in questions if q.get('explanation'))
        if explanations_count > 0:
            explanation_ratio = explanations_count / len(questions)
            score += explanation_ratio * 0.25
            factors += 0.25
        
        # Check question length and complexity
        length_scores = []
        for q in questions:
            question_length = len(q.get('question', ''))
            if 40 <= question_length <= 300:  # Optimal range for educational questions
                length_scores.append(1.0)
            elif 20 <= question_length <= 500:  # Acceptable range
                length_scores.append(0.8)
            else:
                length_scores.append(0.6)
        
        if length_scores:
            avg_length_score = sum(length_scores) / len(length_scores)
            score += avg_length_score * 0.2
            factors += 0.2
        
        # Check topic diversity and coverage
        topics = [q.get('topic') for q in questions if q.get('topic')]
        if topics:
            unique_topics = len(set(topics))
            topic_diversity = min(unique_topics / max(1, len(questions) / 2), 1.0)  # Expect 1 topic per 2 questions
            score += topic_diversity * 0.1
            factors += 0.1
        
        # Check keyword coverage (Cohere-specific)
        keyword_coverage = 0
        for q in questions:
            if 'metadata' in q and 'keywords' in q['metadata']:
                if q['metadata']['keywords']:
                    keyword_coverage += 1
        
        if keyword_coverage > 0:
            keyword_ratio = keyword_coverage / len(questions)
            score += keyword_ratio * 0.1
            factors += 0.1
        
        return score / factors if factors > 0 else 0.0
    
    async def _health_check_impl(self) -> bool:
        """Perform health check for Cohere API"""
        try:
            # Simple API call to check service availability
            response = await self.client.generate(
                model=self.config.model,
                prompt="Hello",
                max_tokens=10
            )
            return response is not None
        except Exception as e:
            logger.error(f"Cohere health check failed: {str(e)}")
            return False
    
    async def generate_streaming(
        self, 
        request: GenerationRequest
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate questions with streaming response"""
        
        prompt = self._build_prompt(request)
        
        try:
            # Cohere doesn't have a direct streaming async API in the current version
            # This is a placeholder implementation
            result = await self._call_cohere_api(prompt)
            
            # Simulate streaming by yielding chunks
            content = result['generations'][0]['text']
            chunk_size = 100
            
            for i in range(0, len(content), chunk_size):
                chunk = content[i:i + chunk_size]
                yield {
                    "type": "content",
                    "content": chunk,
                    "provider": self.provider_id,
                    "timestamp": time.time()
                }
                
                # Small delay to simulate streaming
                await asyncio.sleep(0.01)
                
        except Exception as e:
            logger.error(f"Streaming generation failed: {str(e)}")
            yield {
                "type": "error",
                "error": str(e),
                "provider": self.provider_id,
                "timestamp": time.time()
            }