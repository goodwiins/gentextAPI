"""
OpenAI GPT-4 Provider Implementation

This module implements the OpenAI GPT-4 provider for question generation.
"""

import asyncio
import json
import time
from typing import Dict, List, Any, Optional
import openai
from openai import AsyncOpenAI
import backoff

from .base import BaseAIProvider, ProviderConfig, GenerationRequest, GenerationResult, ProviderCapabilities, QuestionType, Difficulty
import logging

logger = logging.getLogger(__name__)

class OpenAIProvider(BaseAIProvider):
    """OpenAI GPT-4 provider implementation"""
    
    def __init__(self, config: ProviderConfig):
        super().__init__("openai-gpt-4", config)
        self.client = AsyncOpenAI(
            api_key=config.api_key,
            base_url=config.base_url,
            timeout=config.timeout
        )
    
    def _get_capabilities(self) -> ProviderCapabilities:
        """Get OpenAI GPT-4 capabilities"""
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
            max_context_length=8192,  # Standard GPT-4 context window
            max_output_tokens=4096,
            supports_streaming=True,
            supports_batch=True,
            supports_json_mode=True,
            languages=["en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh"],
            domains=["general", "academic", "technical", "scientific", "business", "medical", "legal"]
        )
    
    @backoff.on_exception(
        backoff.expo,
        (openai.RateLimitError, openai.APIError, openai.APITimeoutError),
        max_tries=3,
        factor=2
    )
    async def _call_openai_api(
        self, 
        messages: List[Dict[str, str]], 
        **kwargs
    ) -> Dict[str, Any]:
        """Make API call to OpenAI with retry logic"""
        
        # Default parameters
        params = {
            "model": self.config.model,
            "messages": messages,
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature,
        }
        
        # Merge with additional parameters
        params.update(kwargs)
        
        logger.debug(f"Calling OpenAI API with model: {self.config.model}")
        
        try:
            response = await self.client.chat.completions.create(**params)
            return response.model_dump()
        except Exception as e:
            logger.error(f"OpenAI API call failed: {str(e)}")
            raise
    
    def _build_prompt(self, request: GenerationRequest) -> List[Dict[str, str]]:
        """Build prompt for question generation"""
        
        # System prompt based on question types
        system_prompt = self._get_system_prompt(request)
        
        # User prompt with content and requirements
        user_prompt = self._get_user_prompt(request)
        
        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    
    def _get_system_prompt(self, request: GenerationRequest) -> str:
        """Generate system prompt based on question types and difficulty"""
        
        base_prompt = """You are an expert educational content creator specializing in generating high-quality assessment questions. 

Your task is to create engaging, accurate, and pedagogically sound questions based on the provided content.

Guidelines:
1. Ensure all questions are directly based on the provided content
2. Maintain appropriate difficulty level for the target audience
3. Create plausible distractors for multiple-choice questions
4. Provide clear, concise explanations for answers
5. Follow educational best practices for assessment design
6. Ensure questions are unbiased and inclusive
7. Use age-appropriate language and complexity"""

        # Add question type specific instructions
        if QuestionType.MULTIPLE_CHOICE in request.question_types:
            base_prompt += "\n8. For multiple-choice questions: provide 4 options with exactly one correct answer"
        
        if QuestionType.TRUE_FALSE in request.question_types:
            base_prompt += "\n9. For true/false questions: ensure statements are clearly true or false"
        
        if QuestionType.SHORT_ANSWER in request.question_types:
            base_prompt += "\n10. For short-answer questions: provide specific answer guidelines"
        
        if QuestionType.FILL_IN_BLANK in request.question_types:
            base_prompt += "\n11. For fill-in-blank questions: select key terms that are essential to understanding"
        
        # Add difficulty specific instructions
        if request.difficulty == Difficulty.BEGINNER:
            base_prompt += "\n12. Use simple language and straightforward concepts"
        elif request.difficulty == Difficulty.INTERMEDIATE:
            base_prompt += "\n12. Include some analytical thinking and moderate complexity"
        elif request.difficulty == Difficulty.ADVANCED:
            base_prompt += "\n12. Require critical thinking and complex reasoning"
        elif request.difficulty == Difficulty.EXPERT:
            base_prompt += "\n12. Demand sophisticated analysis and expert-level knowledge"
        
        return base_prompt
    
    def _get_user_prompt(self, request: GenerationRequest) -> str:
        """Generate user prompt with specific instructions"""
        
        # Format question types
        question_types_str = ", ".join([qt.value for qt in request.question_types])
        
        prompt = f"""Content:
{request.content}

Requirements:
- Generate {request.question_count} questions
- Question types: {question_types_str}
- Difficulty level: {request.difficulty.value}
- Target audience: {request.context.get('audience', 'general learners')}
- Educational level: {request.context.get('educational_level', 'not specified')}"""

        # Add specific instructions for each question type
        instructions = []
        
        if QuestionType.MULTIPLE_CHOICE in request.question_types:
            instructions.append("Multiple-choice questions should include 4 options with clear correct answers")
        
        if QuestionType.TRUE_FALSE in request.question_types:
            instructions.append("True/false questions should be unambiguous and fact-based")
        
        if QuestionType.SHORT_ANSWER in request.question_types:
            instructions.append("Short-answer questions should require 1-3 sentence responses")
        
        if QuestionType.FILL_IN_BLANK in request.question_types:
            instructions.append("Fill-in-blank questions should focus on key vocabulary or concepts")
        
        if QuestionType.ESSAY in request.question_types:
            instructions.append("Essay questions should encourage critical thinking and analysis")
        
        if instructions:
            prompt += "\n\nSpecific Requirements:\n" + "\n".join(f"- {instruction}" for instruction in instructions)
        
        # Add any custom instructions
        if request.options.get('custom_instructions'):
            prompt += f"\n\nCustom Instructions:\n{request.options['custom_instructions']}"
        
        # Add output format requirements
        prompt += """

Return your response in this JSON format:
{
  "questions": [
    {
      "id": "unique_question_id",
      "type": "question_type",
      "question": "The question text",
      "options": ["option1", "option2", "option3", "option4"],
      "correct_answer": "correct_option",
      "explanation": "Explanation of the answer",
      "difficulty": "difficulty_level",
      "topic": "related_topic",
      "metadata": {
        "cognitive_level": "remember/understand/apply/analyze/evaluate/create",
        "estimated_time": "time_in_minutes",
        "keywords": ["relevant", "keywords"]
      }
    }
  ],
  "metadata": {
    "total_questions": "number",
    "content_summary": "brief_summary_of_content",
    "difficulty_distribution": {"beginner": 0, "intermediate": 0, "advanced": 0},
    "topics_covered": ["topic1", "topic2"]
  }
}

Ensure all JSON is valid and properly formatted."""
        
        return prompt
    
    async def _generate_questions_impl(
        self, 
        request: GenerationRequest
    ) -> GenerationResult:
        """Generate questions using OpenAI GPT-4"""
        
        start_time = time.time()
        
        # Build prompt
        messages = self._build_prompt(request)
        
        # Make API call with JSON mode
        try:
            response = await self._call_openai_api(
                messages=messages,
                response_format={"type": "json_object"}
            )
            
            # Extract response content
            content = response['choices'][0]['message']['content']
            
            # Parse JSON response
            try:
                data = json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse OpenAI response as JSON: {str(e)}")
                # Fallback: try to extract JSON from the response
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group(0))
                else:
                    raise Exception("Could not extract valid JSON from response")
            
            # Process and validate questions
            questions = self._process_questions(data.get('questions', []))
            
            # Calculate metrics
            processing_time = time.time() - start_time
            
            # Estimate cost (rough calculation)
            input_tokens = response['usage']['prompt_tokens']
            output_tokens = response['usage']['completion_tokens']
            cost = (input_tokens * 0.00003) + (output_tokens * 0.00006)  # GPT-4 pricing
            
            # Calculate quality score (simple heuristic)
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
            logger.error(f"Failed to generate questions with OpenAI: {str(e)}")
            raise
    
    def _process_questions(self, raw_questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process and validate generated questions"""
        
        processed_questions = []
        
        for i, q in enumerate(raw_questions):
            try:
                # Validate required fields
                if not all(key in q for key in ['id', 'type', 'question', 'correct_answer']):
                    logger.warning(f"Question {i} missing required fields, skipping")
                    continue
                
                # Ensure question has ID
                if 'id' not in q:
                    q['id'] = f"{self.provider_id}_q_{i}"
                
                # Add provider metadata
                q['provider'] = self.provider_id
                q['model'] = self.config.model
                q['generated_at'] = time.time()
                
                # Validate question type
                try:
                    question_type = QuestionType(q['type'])
                    q['type'] = question_type.value
                except ValueError:
                    logger.warning(f"Invalid question type '{q['type']}' for question {i}, defaulting to multiple-choice")
                    q['type'] = QuestionType.MULTIPLE_CHOICE.value
                
                # Validate options for multiple choice
                if q['type'] == QuestionType.MULTIPLE_CHOICE.value:
                    if 'options' not in q or len(q.get('options', [])) < 2:
                        logger.warning(f"Multiple choice question {i} has insufficient options, skipping")
                        continue
                
                processed_questions.append(q)
                
            except Exception as e:
                logger.error(f"Error processing question {i}: {str(e)}")
                continue
        
        logger.info(f"Processed {len(processed_questions)} valid questions from {len(raw_questions)} raw questions")
        return processed_questions
    
    def _calculate_quality_score(self, questions: List[Dict[str, Any]]) -> float:
        """Calculate a simple quality score for the generated questions"""
        
        if not questions:
            return 0.0
        
        score = 0.0
        factors = 0
        
        # Check question variety
        question_types = set(q['type'] for q in questions)
        variety_score = len(question_types) / len([qt.value for qt in QuestionType])
        score += variety_score * 0.2
        factors += 0.2
        
        # Check for explanations
        explanations_count = sum(1 for q in questions if q.get('explanation'))
        explanation_score = explanations_count / len(questions)
        score += explanation_score * 0.3
        factors += 0.3
        
        # Check for metadata completeness
        metadata_scores = []
        for q in questions:
            if 'metadata' in q:
                metadata_score = len(q['metadata']) / 5.0  # Assuming 5 expected metadata fields
                metadata_scores.append(min(metadata_score, 1.0))
        if metadata_scores:
            avg_metadata_score = sum(metadata_scores) / len(metadata_scores)
            score += avg_metadata_score * 0.2
            factors += 0.2
        
        # Check question length appropriateness
        length_scores = []
        for q in questions:
            question_length = len(q['question'])
            if 50 <= question_length <= 300:  # Optimal length
                length_scores.append(1.0)
            elif 20 <= question_length <= 500:  # Acceptable length
                length_scores.append(0.8)
            else:
                length_scores.append(0.5)
        
        if length_scores:
            avg_length_score = sum(length_scores) / len(length_scores)
            score += avg_length_score * 0.3
            factors += 0.3
        
        return score / factors if factors > 0 else 0.0
    
    async def _health_check_impl(self) -> bool:
        """Perform health check for OpenAI API"""
        try:
            # Simple API call to check service availability
            response = await self.client.models.list()
            return response is not None
        except Exception as e:
            logger.error(f"OpenAI health check failed: {str(e)}")
            return False
    
    async def generate_streaming(
        self, 
        request: GenerationRequest
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate questions with streaming response"""
        
        messages = self._build_prompt(request)
        
        try:
            stream = await self.client.chat.completions.create(
                model=self.config.model,
                messages=messages,
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield {
                        "type": "content",
                        "content": chunk.choices[0].delta.content,
                        "provider": self.provider_id,
                        "timestamp": time.time()
                    }
                
        except Exception as e:
            logger.error(f"Streaming generation failed: {str(e)}")
            yield {
                "type": "error",
                "error": str(e),
                "provider": self.provider_id,
                "timestamp": time.time()
            }