"""
Anthropic Claude Provider Implementation

This module implements the Anthropic Claude provider for question generation.
"""

import asyncio
import json
import time
from typing import Dict, List, Any, Optional
import anthropic
from anthropic import AsyncAnthropic
import backoff

from .base import BaseAIProvider, ProviderConfig, GenerationRequest, GenerationResult, ProviderCapabilities, QuestionType, Difficulty
import logging

logger = logging.getLogger(__name__)

class AnthropicProvider(BaseAIProvider):
    """Anthropic Claude provider implementation"""
    
    def __init__(self, config: ProviderConfig):
        super().__init__("anthropic-claude", config)
        self.client = AsyncAnthropic(
            api_key=config.api_key,
            base_url=config.base_url,
            timeout=config.timeout
        )
    
    def _get_capabilities(self) -> ProviderCapabilities:
        """Get Anthropic Claude capabilities"""
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
            max_context_length=200000,  # Claude 3 has 200K context
            max_output_tokens=4096,
            supports_streaming=True,
            supports_batch=True,
            supports_json_mode=False,  # Claude doesn't have native JSON mode
            languages=["en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh", "ar"],
            domains=["general", "academic", "technical", "scientific", "business", "medical", "legal", "humanities"]
        )
    
    @backoff.on_exception(
        backoff.expo,
        (anthropic.RateLimitError, anthropic.APIError, anthropic.APIConnectionError),
        max_tries=3,
        factor=2
    )
    async def _call_claude_api(
        self, 
        messages: List[Dict[str, str]], 
        **kwargs
    ) -> Dict[str, Any]:
        """Make API call to Claude with retry logic"""
        
        # Convert OpenAI-style messages to Claude format
        system_message = ""
        user_messages = []
        
        for message in messages:
            if message["role"] == "system":
                system_message = message["content"]
            else:
                user_messages.append(message)
        
        # Default parameters
        params = {
            "model": self.config.model,
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature,
        }
        
        if system_message:
            params["system"] = system_message
        
        # Add user messages
        if len(user_messages) > 0:
            params["messages"] = user_messages
        
        # Merge with additional parameters
        params.update(kwargs)
        
        logger.debug(f"Calling Claude API with model: {self.config.model}")
        
        try:
            response = await self.client.messages.create(**params)
            return response.model_dump()
        except Exception as e:
            logger.error(f"Claude API call failed: {str(e)}")
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
        
        base_prompt = """You are Claude, an AI assistant created by Anthropic. You are an expert educational content creator specializing in generating high-quality assessment questions.

Your task is to create engaging, accurate, and pedagogically sound questions based on the provided content.

Core Principles:
1. Accuracy: All questions must be directly based on and verifiable from the provided content
2. Clarity: Questions should be unambiguous and clearly worded
3. Pedagogical Value: Questions should assess meaningful understanding and learning objectives
4. Fairness: Questions should be unbiased and accessible to the target audience
5. Educational Alignment: Questions should align with educational best practices and standards

Question Design Guidelines:
- Use clear, concise language appropriate for the target audience
- Avoid trick questions or ambiguous wording
- Ensure questions assess understanding, not just memorization
- Provide appropriate context when necessary
- Include explanations that reinforce learning

Content Standards:
- All questions must be factually correct based on the provided text
- Do not introduce external information not present in the content
- Maintain consistency with the source material's terminology and concepts
- Respect the complexity and nuance of the original content"""

        # Add question type specific instructions
        question_type_instructions = []
        
        if QuestionType.MULTIPLE_CHOICE in request.question_types:
            question_type_instructions.append(
                "Multiple-Choice Questions:\n"
                "- Provide exactly 4 options\n"
                "- Ensure only one correct answer\n"
                "- Make distractors plausible but clearly incorrect\n"
                "- Avoid 'all of the above' or 'none of the above' options\n"
                "- Ensure options are similar in length and complexity"
            )
        
        if QuestionType.TRUE_FALSE in request.question_types:
            question_type_instructions.append(
                "True/False Questions:\n"
                "- Make statements unambiguously true or false\n"
                "- Avoid partially true statements\n"
                "- Focus on key facts and concepts from the content"
            )
        
        if QuestionType.SHORT_ANSWER in request.question_types:
            question_type_instructions.append(
                "Short-Answer Questions:\n"
                "- Ask questions that require 1-3 sentence responses\n"
                "- Focus on key concepts, explanations, or applications\n"
                "- Ensure questions have specific, correct answers"
            )
        
        if QuestionType.FILL_IN_BLANK in request.question_types:
            question_type_instructions.append(
                "Fill-in-the-Blank Questions:\n"
                "- Select key vocabulary terms or essential concepts\n"
                "- Ensure the blank represents a specific, important term\n"
                "- Provide sufficient context for determining the correct answer"
            )
        
        if QuestionType.ESSAY in request.question_types:
            question_type_instructions.append(
                "Essay Questions:\n"
                "- Require critical thinking, analysis, or synthesis\n"
                "- Ask for evaluation, comparison, or application of concepts\n"
                "- Provide clear guidance on expected response length and focus"
            )
        
        if question_type_instructions:
            base_prompt += "\n\nQuestion Type Specific Instructions:\n" + "\n".join(question_type_instructions)
        
        # Add difficulty specific instructions
        difficulty_instructions = {
            Difficulty.BEGINNER: "Use simple language and focus on basic recall and understanding",
            Difficulty.INTERMEDIATE: "Include some analysis and application of concepts",
            Difficulty.ADVANCED: "Require critical thinking and complex reasoning",
            Difficulty.EXPERT: "Demand sophisticated analysis and expert-level evaluation"
        }
        
        base_prompt += f"\n\nDifficulty Level: {difficulty_instructions.get(request.difficulty, 'Standard difficulty')}"
        
        return base_prompt
    
    def _get_user_prompt(self, request: GenerationRequest) -> str:
        """Generate user prompt with specific instructions"""
        
        # Format question types
        question_types_str = ", ".join([qt.value for qt in request.question_types])
        
        prompt = f"""Please generate {request.question_count} high-quality assessment questions based on the following content:

CONTENT:
{request.content}

REQUIREMENTS:
- Number of questions: {request.question_count}
- Question types: {question_types_str}
- Difficulty level: {request.difficulty.value}
- Target audience: {request.context.get('audience', 'general learners')}
- Educational level: {request.context.get('educational_level', 'not specified')}
- Subject area: {request.context.get('domain', 'general')}"""

        # Add specific instructions for each question type
        type_requirements = []
        type_counts = {}
        
        for qt in request.question_types:
            type_counts[qt] = type_counts.get(qt, 0) + 1
        
        for qt, count in type_counts.items():
            if count > 0:
                type_requirements.append(f"- {count} {qt.value} question{'s' if count > 1 else ''}")
        
        if type_requirements:
            prompt += "\n\nQUESTION TYPE BREAKDOWN:\n" + "\n".join(type_requirements)
        
        # Add any custom instructions
        if request.options.get('custom_instructions'):
            prompt += f"\n\nCUSTOM INSTRUCTIONS:\n{request.options['custom_instructions']}"
        
        # Add specific options
        if request.options.get('include_explanations', False):
            prompt += "\n- Include detailed explanations for each answer"
        
        if request.options.get('include_hints', False):
            prompt += "\n- Include helpful hints for difficult questions"
        
        if request.options.get('difficulty_variation', False):
            prompt += "\n- Vary difficulty levels within the general difficulty range"
        
        # Add output format requirements
        prompt += """

Please structure your response as follows:

## Questions
[Generate each question with the following format]

### Question 1
**Type:** [question_type]
**Question:** [the question text]
**Options:** [for multiple choice: A) option1 B) option2 C) option3 D) option4]
**Correct Answer:** [the correct answer]
**Explanation:** [clear explanation of why this is correct]
**Difficulty:** [specific difficulty level]
**Topic:** [related topic from content]
**Cognitive Level:** [remember/understand/apply/analyze/evaluate/create]

### Question 2
[Same format as above...]

## Summary
**Total Questions:** [number]
**Content Summary:** [brief summary of covered content]
**Difficulty Distribution:** [breakdown by difficulty level]
**Key Topics:** [list of main topics covered]

Important: Ensure your response is well-structured and directly based on the provided content. Do not introduce external information not present in the source material."""
        
        return prompt
    
    async def _generate_questions_impl(
        self, 
        request: GenerationRequest
    ) -> GenerationResult:
        """Generate questions using Anthropic Claude"""
        
        start_time = time.time()
        
        # Build prompt
        messages = self._build_prompt(request)
        
        # Make API call
        try:
            response = await self._call_claude_api(messages=messages)
            
            # Extract response content
            content = response['content'][0]['text']
            
            # Parse structured response (Claude doesn't have native JSON mode)
            questions = self._parse_claude_response(content, request)
            
            # Calculate metrics
            processing_time = time.time() - start_time
            
            # Estimate cost (rough calculation)
            input_tokens = response['usage']['input_tokens']
            output_tokens = response['usage']['output_tokens']
            cost = (input_tokens * 0.000015) + (output_tokens * 0.000075)  # Claude 3 pricing
            
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
            logger.error(f"Failed to generate questions with Claude: {str(e)}")
            raise
    
    def _parse_claude_response(self, content: str, request: GenerationRequest) -> List[Dict[str, Any]]:
        """Parse Claude's structured response into question format"""
        
        questions = []
        lines = content.split('\n')
        
        current_question = {}
        parsing_questions = False
        question_count = 0
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            if line.startswith('## Questions'):
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
                current_question['type'] = line.replace('**Type:**', '').strip()
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
            elif line.startswith('**Cognitive Level:**'):
                current_question['cognitive_level'] = line.replace('**Cognitive Level:**', '').strip()
            
            i += 1
        
        # Save the last question
        if current_question:
            question = self._finalize_question(current_question)
            if question:
                questions.append(question)
        
        logger.info(f"Parsed {len(questions)} questions from Claude response")
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
            logger.warning(f"Invalid question type: {question_data['type']}")
            return None
        
        # Validate options for multiple choice
        if question_data['type'] == QuestionType.MULTIPLE_CHOICE.value:
            if 'options' not in question_data or len(question_data.get('options', [])) < 2:
                logger.warning("Multiple choice question missing options")
                return None
        
        # Add metadata if not present
        if 'metadata' not in question_data:
            question_data['metadata'] = {}
        
        # Move cognitive level to metadata
        if 'cognitive_level' in question_data:
            question_data['metadata']['cognitive_level'] = question_data.pop('cognitive_level')
        
        return question_data
    
    def _calculate_quality_score(self, questions: List[Dict[str, Any]]) -> float:
        """Calculate a quality score for the generated questions"""
        
        if not questions:
            return 0.0
        
        score = 0.0
        factors = 0.0
        
        # Check completeness of required fields
        completeness_scores = []
        for q in questions:
            required_fields = ['type', 'question', 'correct_answer']
            optional_fields = ['explanation', 'difficulty', 'topic', 'options']
            
            present_required = sum(1 for field in required_fields if field in q)
            present_optional = sum(1 for field in optional_fields if field in q)
            
            completeness = (present_required / len(required_fields)) * 0.7 + (present_optional / len(optional_fields)) * 0.3
            completeness_scores.append(completeness)
        
        if completeness_scores:
            avg_completeness = sum(completeness_scores) / len(completeness_scores)
            score += avg_completeness * 0.3
            factors += 0.3
        
        # Check explanation quality
        explanations_with_questions = sum(1 for q in questions if q.get('explanation'))
        if explanations_with_questions > 0:
            explanation_ratio = explanations_with_questions / len(questions)
            score += explanation_ratio * 0.25
            factors += 0.25
        
        # Check difficulty appropriateness
        difficulties = [q.get('difficulty', 'unknown') for q in questions if q.get('difficulty')]
        if difficulties:
            unique_difficulties = len(set(difficulties))
            variety_score = unique_difficulties / 4.0  # 4 difficulty levels
            score += min(variety_score, 1.0) * 0.2
            factors += 0.2
        
        # Check topic coverage
        topics = [q.get('topic') for q in questions if q.get('topic')]
        if topics:
            unique_topics = len(set(topics))
            topic_coverage = min(unique_topics / len(questions), 1.0)
            score += topic_coverage * 0.15
            factors += 0.15
        
        # Check question length appropriateness
        length_scores = []
        for q in questions:
            question_length = len(q.get('question', ''))
            if 30 <= question_length <= 400:  # Optimal range
                length_scores.append(1.0)
            elif 15 <= question_length <= 600:  # Acceptable range
                length_scores.append(0.8)
            else:
                length_scores.append(0.5)
        
        if length_scores:
            avg_length_score = sum(length_scores) / len(length_scores)
            score += avg_length_score * 0.1
            factors += 0.1
        
        return score / factors if factors > 0 else 0.0
    
    async def _health_check_impl(self) -> bool:
        """Perform health check for Anthropic Claude API"""
        try:
            # Simple API call to check service availability
            response = await self.client.messages.create(
                model=self.config.model,
                max_tokens=10,
                messages=[{"role": "user", "content": "Hello"}]
            )
            return response is not None
        except Exception as e:
            logger.error(f"Claude health check failed: {str(e)}")
            return False
    
    async def generate_streaming(
        self, 
        request: GenerationRequest
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate questions with streaming response"""
        
        messages = self._build_prompt(request)
        
        try:
            stream = await self.client.messages.create(
                model=self.config.model,
                messages=messages,
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.type == "content_block_delta":
                    if hasattr(chunk.delta, 'text'):
                        yield {
                            "type": "content",
                            "content": chunk.delta.text,
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