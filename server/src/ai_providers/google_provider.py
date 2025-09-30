"""
Google Gemini Provider Implementation

This module implements the Google Gemini provider for question generation.
"""

import asyncio
import json
import time
from typing import Dict, List, Any, Optional
import google.generativeai as genai
from google.generativeai.types import GenerateContentResponse
import backoff

from .base import BaseAIProvider, ProviderConfig, GenerationRequest, GenerationResult, ProviderCapabilities, QuestionType, Difficulty
import logging

logger = logging.getLogger(__name__)

class GoogleProvider(BaseAIProvider):
    """Google Gemini provider implementation"""
    
    def __init__(self, config: ProviderConfig):
        super().__init__("google-gemini", config)
        genai.configure(api_key=config.api_key)
        self.client = genai.GenerativeModel(config.model)
    
    def _get_capabilities(self) -> ProviderCapabilities:
        """Get Google Gemini capabilities"""
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
            max_context_length=32768,  # Gemini Pro has 32K context
            max_output_tokens=2048,
            supports_streaming=True,
            supports_batch=False,  # Limited batch support
            supports_json_mode=False,
            languages=["en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh", "ar", "hi"],
            domains=["general", "academic", "technical", "scientific", "business", "medical", "legal", "creative"]
        )
    
    @backoff.on_exception(
        backoff.expo,
        Exception,  # Google AI doesn't have specific exception types
        max_tries=3,
        factor=2
    )
    async def _call_gemini_api(
        self, 
        prompt: str, 
        **kwargs
    ) -> GenerateContentResponse:
        """Make API call to Google Gemini with retry logic"""
        
        # Default parameters
        generation_config = {
            "temperature": self.config.temperature,
            "top_p": 0.9,
            "top_k": 40,
            "max_output_tokens": self.config.max_tokens,
        }
        
        # Merge with additional parameters
        if "generation_config" in kwargs:
            generation_config.update(kwargs["generation_config"])
        
        logger.debug(f"Calling Gemini API with model: {self.config.model}")
        
        try:
            response = await self.client.generate_content_async(
                prompt,
                generation_config=generation_config
            )
            return response
        except Exception as e:
            logger.error(f"Gemini API call failed: {str(e)}")
            raise
    
    def _build_prompt(self, request: GenerationRequest) -> str:
        """Build prompt for question generation"""
        
        # System prompt
        system_prompt = self._get_system_prompt(request)
        
        # User prompt with content and requirements
        user_prompt = self._get_user_prompt(request)
        
        return f"{system_prompt}\n\n{user_prompt}"
    
    def _get_system_prompt(self, request: GenerationRequest) -> str:
        """Generate system prompt based on question types and difficulty"""
        
        base_prompt = """You are an expert educational content creator specializing in generating high-quality assessment questions. Your task is to create engaging, accurate, and pedagogically sound questions based on provided content.

IMPORTANT GUIDELINES:
1. Accuracy: All questions must be directly based on the provided content
2. Clarity: Use clear, unambiguous language
3. Educational Value: Create questions that test meaningful understanding
4. Age Appropriateness: Tailor complexity to the target audience
5. Fairness: Ensure questions are unbiased and accessible

CONTENT STANDARDS:
- Base all questions strictly on the provided text
- Do not introduce external information
- Maintain consistency with source terminology
- Respect the complexity and nuance of the original material"""

        # Add question type specific instructions
        type_instructions = []
        
        if QuestionType.MULTIPLE_CHOICE in request.question_types:
            type_instructions.append(
                "MULTIPLE CHOICE:\n"
                "• Provide 4 options (A, B, C, D)\n"
                "• Only one correct answer\n"
                "• Make distractors plausible but clearly wrong\n"
                "• Ensure options are similar in length"
            )
        
        if QuestionType.TRUE_FALSE in request.question_types:
            type_instructions.append(
                "TRUE/FALSE:\n"
                "• Make statements unambiguously true or false\n"
                "• Avoid partially true statements\n"
                "• Focus on key facts from the content"
            )
        
        if QuestionType.SHORT_ANSWER in request.question_types:
            type_instructions.append(
                "SHORT ANSWER:\n"
                "• Questions requiring 1-3 sentence responses\n"
                "• Focus on explanations, definitions, or applications\n"
                "• Ensure specific, correct answers exist"
            )
        
        if QuestionType.FILL_IN_BLANK in request.question_types:
            type_instructions.append(
                "FILL-IN-THE-BLANK:\n"
                "• Select essential vocabulary or concepts\n"
                "• Ensure context makes answer clear\n"
                "• Choose terms critical to understanding"
            )
        
        if QuestionType.ESSAY in request.question_types:
            type_instructions.append(
                "ESSAY:\n"
                "• Require critical thinking and analysis\n"
                "• Ask for evaluation or application of concepts\n"
                "• Provide clear response expectations"
            )
        
        if type_instructions:
            base_prompt += "\n\nQUESTION TYPE INSTRUCTIONS:\n" + "\n\n".join(type_instructions)
        
        # Add difficulty specific instructions
        difficulty_map = {
            Difficulty.BEGINNER: "Simple language, basic recall and understanding",
            Difficulty.INTERMEDIATE: "Some analysis and application, moderate complexity",
            Difficulty.ADVANCED: "Critical thinking, complex reasoning and evaluation",
            Difficulty.EXPERT: "Sophisticated analysis, expert-level evaluation and synthesis"
        }
        
        base_prompt += f"\n\nDIFFICULTY LEVEL: {difficulty_map.get(request.difficulty, 'Standard complexity')}"
        
        return base_prompt
    
    def _get_user_prompt(self, request: GenerationRequest) -> str:
        """Generate user prompt with specific instructions"""
        
        # Format question types
        question_types_str = ", ".join([qt.value.replace('-', ' ').title() for qt in request.question_types])
        
        prompt = f"""TASK: Generate {request.question_count} high-quality assessment questions

CONTENT:
{request.content}

REQUIREMENTS:
• Number of questions: {request.question_count}
• Question types: {question_types_str}
• Difficulty level: {request.difficulty.value}
• Target audience: {request.context.get('audience', 'general learners')}
• Educational level: {request.context.get('educational_level', 'not specified')}
• Subject area: {request.context.get('domain', 'general')}"""

        # Calculate question distribution
        type_distribution = {}
        for qt in request.question_types:
            type_distribution[qt] = type_distribution.get(qt, 0) + 1
        
        if type_distribution:
            prompt += "\n\nQUESTION DISTRIBUTION:"
            for qt, count in type_distribution.items():
                prompt += f"\n• {count} {qt.value.replace('-', ' ').title().lower()} question{'s' if count > 1 else ''}"
        
        # Add specific options
        if request.options.get('include_explanations', False):
            prompt += "\n• Include detailed explanations for each answer"
        
        if request.options.get('include_hints', False):
            prompt += "\n• Include helpful hints for difficult questions"
        
        if request.options.get('difficulty_variation', False):
            prompt += "\n• Vary difficulty within the general range"
        
        # Add any custom instructions
        if request.options.get('custom_instructions'):
            prompt += f"\n\nCUSTOM INSTRUCTIONS:\n{request.options['custom_instructions']}"
        
        # Add output format requirements
        prompt += """

OUTPUT FORMAT:
Please provide your response in the following structured format:

QUESTIONS:
1. [Question Type] | [Question Text]
   Options: A) [Option 1]  B) [Option 2]  C) [Option 3]  D) [Option 4]
   Correct Answer: [Letter] [Answer Text]
   Explanation: [Detailed explanation]
   Difficulty: [Specific difficulty]
   Topic: [Related topic]

2. [Question Type] | [Question Text]
   [Format according to question type...]

SUMMARY:
Total Questions: [Number]
Content Summary: [Brief summary]
Difficulty Breakdown: [By difficulty level]
Key Topics: [List of main topics covered]

IMPORTANT:
• Ensure all questions are based strictly on the provided content
• Make questions clear and unambiguous
• Provide comprehensive explanations
• Maintain educational appropriateness"""

        return prompt
    
    async def _generate_questions_impl(
        self, 
        request: GenerationRequest
    ) -> GenerationResult:
        """Generate questions using Google Gemini"""
        
        start_time = time.time()
        
        # Build prompt
        prompt = self._build_prompt(request)
        
        # Make API call
        try:
            response = await self._call_gemini_api(prompt)
            
            # Extract response text
            content = response.text
            
            # Parse structured response
            questions = self._parse_gemini_response(content, request)
            
            # Calculate metrics
            processing_time = time.time() - start_time
            
            # Estimate cost (rough calculation based on characters)
            # Gemini pricing is per 1K characters
            input_chars = len(prompt)
            output_chars = len(content)
            cost = (input_chars * 0.000001) + (output_chars * 0.000001)  # $0.001 per 1K characters
            
            # Calculate quality score
            quality_score = self._calculate_quality_score(questions)
            
            return GenerationResult(
                request_id=request.id,
                questions=questions,
                provider=self.provider_id,
                model=self.config.model,
                metrics={
                    "input_characters": input_chars,
                    "output_characters": output_chars,
                    "total_characters": input_chars + output_chars,
                    "api_calls": 1,
                    "retries": 0
                },
                cost=cost,
                quality_score=quality_score,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Failed to generate questions with Gemini: {str(e)}")
            raise
    
    def _parse_gemini_response(self, content: str, request: GenerationRequest) -> List[Dict[str, Any]]:
        """Parse Gemini's structured response into question format"""
        
        questions = []
        lines = content.split('\n')
        
        current_question = {}
        parsing_questions = False
        question_count = 0
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            if line.upper() == 'QUESTIONS:':
                parsing_questions = True
                i += 1
                continue
            
            if not parsing_questions:
                i += 1
                continue
            
            if line.upper() == 'SUMMARY:' or question_count >= request.question_count:
                # End of questions section
                break
            
            # Parse question line (format: "1. [Question Type] | [Question Text]")
            question_match = None
            if line and line[0].isdigit() and '. ' in line:
                # Save previous question if exists
                if current_question:
                    question = self._finalize_question(current_question)
                    if question:
                        questions.append(question)
                        question_count += 1
                
                # Parse new question
                parts = line.split('. ', 1)
                if len(parts) == 2:
                    question_line = parts[1]
                    if ' | ' in question_line:
                        q_type, q_text = question_line.split(' | ', 1)
                        current_question = {
                            'id': f"{self.provider_id}_q_{question_count + 1}",
                            'type': q_type.strip().lower().replace(' ', '-'),
                            'question': q_text.strip(),
                            'provider': self.provider_id,
                            'model': self.config.model,
                            'generated_at': time.time()
                        }
                    else:
                        # Fallback: assume multiple choice if type not specified
                        current_question = {
                            'id': f"{self.provider_id}_q_{question_count + 1}",
                            'type': 'multiple-choice',
                            'question': question_line.strip(),
                            'provider': self.provider_id,
                            'model': self.config.model,
                            'generated_at': time.time()
                        }
                
                i += 1
                continue
            
            # Parse question fields
            if line.startswith('Options:'):
                options_text = line.replace('Options:', '').strip()
                # Parse options like "A) [Option 1]  B) [Option 2]  C) [Option 3]  D) [Option 4]"
                options = []
                import re
                option_matches = re.findall(r'([A-D])\)\s*([^)]+(?:\([^)]*\)[^)]*)*)', options_text)
                option_map = {}
                for letter, option_text in option_matches:
                    option_map[letter] = option_text.strip()
                
                # Store options and map
                if option_map:
                    current_question['options'] = list(option_map.values())
                    current_question['option_map'] = option_map
            
            elif line.startswith('Correct Answer:'):
                correct_answer_text = line.replace('Correct Answer:', '').strip()
                # Extract letter and answer text
                import re
                match = re.match(r'([A-D])\)\s*(.+)', correct_answer_text)
                if match:
                    letter, answer_text = match.groups()
                    current_question['correct_answer'] = answer_text.strip()
                    current_question['correct_letter'] = letter
                else:
                    current_question['correct_answer'] = correct_answer_text
            
            elif line.startswith('Explanation:'):
                # Multi-line explanation support
                explanation = line.replace('Explanation:', '').strip()
                i += 1
                while i < len(lines) and lines[i].strip() and not lines[i].startswith('Difficulty:') and not lines[i][0].isdigit():
                    explanation += ' ' + lines[i].strip()
                    i += 1
                current_question['explanation'] = explanation
                continue
            
            elif line.startswith('Difficulty:'):
                current_question['difficulty'] = line.replace('Difficulty:', '').strip()
            
            elif line.startswith('Topic:'):
                current_question['topic'] = line.replace('Topic:', '').strip()
            
            i += 1
        
        # Save the last question
        if current_question:
            question = self._finalize_question(current_question)
            if question:
                questions.append(question)
        
        logger.info(f"Parsed {len(questions)} questions from Gemini response")
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
            
            # Ensure correct answer is in options
            correct_answer = question_data['correct_answer']
            if correct_answer not in question_data['options']:
                # If correct answer has letter mapping, use that
                if 'option_map' in question_data and 'correct_letter' in question_data:
                    letter = question_data['correct_letter']
                    if letter in question_data['option_map']:
                        question_data['correct_answer'] = question_data['option_map'][letter]
                    else:
                        logger.warning("Correct answer letter not found in options")
                        return None
                else:
                    logger.warning("Correct answer not found in options")
                    return None
        
        # Add metadata if not present
        if 'metadata' not in question_data:
            question_data['metadata'] = {}
        
        # Clean up temporary fields
        if 'option_map' in question_data:
            del question_data['option_map']
        if 'correct_letter' in question_data:
            del question_data['correct_letter']
        
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
            
            # Weight required fields more heavily
            structure_score = (present_required / len(required_fields)) * 0.8 + (present_optional / len(optional_fields)) * 0.2
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
            # Optimal range for educational questions
            if 40 <= question_length <= 300:
                length_scores.append(1.0)
            elif 20 <= question_length <= 500:
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
        
        # Check difficulty appropriateness
        difficulties = [q.get('difficulty', 'intermediate') for q in questions]
        if difficulties:
            # Check if we have variety in difficulty
            unique_difficulties = len(set(difficulties))
            variety_score = min(unique_difficulties / 3.0, 1.0)  # Up to 3 difficulty levels
            score += variety_score * 0.1
            factors += 0.1
        
        return score / factors if factors > 0 else 0.0
    
    async def _health_check_impl(self) -> bool:
        """Perform health check for Google Gemini API"""
        try:
            # Simple API call to check service availability
            response = await self.client.generate_content_async("Hello", max_output_tokens=10)
            return response is not None
        except Exception as e:
            logger.error(f"Gemini health check failed: {str(e)}")
            return False
    
    async def generate_streaming(
        self, 
        request: GenerationRequest
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate questions with streaming response"""
        
        prompt = self._build_prompt(request)
        
        try:
            # Gemini doesn't have a direct streaming async API in the current version
            # This is a placeholder implementation
            result = await self._call_gemini_api(prompt)
            
            # Simulate streaming by yielding chunks
            content = result.text
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