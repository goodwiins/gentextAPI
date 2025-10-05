"""
Azure AI Foundry Provider Implementation

This module implements the Azure AI Foundry provider for question generation.
"""

import asyncio
import json
import time
from typing import Dict, List, Any, Optional
import aiohttp
import backoff

from .base import BaseAIProvider, ProviderConfig, GenerationRequest, GenerationResult, ProviderCapabilities, QuestionType, Difficulty
import logging

logger = logging.getLogger(__name__)

class AzureAIFoundryProvider(BaseAIProvider):
    """Azure AI Foundry provider implementation"""

    def __init__(self, config: ProviderConfig):
        super().__init__("azure-ai-foundry", config)
        self.api_endpoint = config.base_url
        self.api_version = "2024-02-15-preview"  # Azure AI API version
        self.session = None

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session"""
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=self.config.timeout)
            self.session = aiohttp.ClientSession(
                timeout=timeout,
                headers={
                    "api-key": self.config.api_key,
                    "Content-Type": "application/json"
                }
            )
        return self.session

    def _get_capabilities(self) -> ProviderCapabilities:
        """Get Azure AI Foundry capabilities"""
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
            max_context_length=128000,  # GPT-4 turbo context window
            max_output_tokens=8192,
            supports_streaming=True,
            supports_batch=True,
            supports_json_mode=True,
            languages=["en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh", "ar", "hi"],
            domains=["general", "academic", "technical", "scientific", "business", "medical", "legal", "creative"]
        )

    def _build_system_prompt(self, request: GenerationRequest) -> str:
        """Build system prompt for Azure AI Foundry"""
        question_type_instructions = {
            QuestionType.TRUE_FALSE: "Generate true/false questions with clear statements.",
            QuestionType.MULTIPLE_CHOICE: "Generate multiple choice questions with 4 options (A, B, C, D) and one correct answer.",
            QuestionType.FILL_IN_BLANK: "Generate fill-in-the-blank questions with one missing word or phrase.",
            QuestionType.SHORT_ANSWER: "Generate questions that require brief explanations (1-3 sentences).",
            QuestionType.ESSAY: "Generate essay questions requiring detailed responses.",
            QuestionType.MATCHING: "Generate matching questions with pairs of related items.",
            QuestionType.ORDERING: "Generate questions that require ordering items sequentially.",
            QuestionType.CLASSIFICATION: "Generate questions that require classifying items into categories."
        }

        difficulty_instructions = {
            Difficulty.BEGINNER: "Use simple language and basic concepts.",
            Difficulty.INTERMEDIATE: "Use moderately complex language and concepts.",
            Difficulty.ADVANCED: "Use technical language and complex concepts.",
            Difficulty.EXPERT: "Use highly specialized language and advanced concepts."
        }

        prompt = f"""You are an expert educational content creator. Generate high-quality questions based on the provided content.

Guidelines:
- Create {request.question_count} questions
- Question types: {', '.join([qt.value for qt in request.question_types])}
- Difficulty level: {request.difficulty.value}
- {difficulty_instructions.get(request.difficulty, '')}
- Questions should be clear, unambiguous, and directly related to the source content
- Include correct answers and explanations where appropriate

For each question, provide:
1. Question text
2. Question type
3. Correct answer(s)
4. Explanation (if applicable)
5. Difficulty level
"""

        # Add specific instructions for each question type
        for qtype in request.question_types:
            if qtype in question_type_instructions:
                prompt += f"\n- {question_type_instructions[qtype]}"

        return prompt

    def _build_user_prompt(self, request: GenerationRequest) -> str:
        """Build user prompt from request content"""
        prompt = f"Source Content:\n{request.content}\n\n"

        if request.context:
            prompt += "Additional Context:\n"
            for key, value in request.context.items():
                prompt += f"- {key}: {value}\n"
            prompt += "\n"

        prompt += f"Generate {request.question_count} questions based on this content."

        return prompt

    def _format_request_body(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Format request body for Azure AI Foundry API"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        return {
            "messages": messages,
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature,
            "top_p": 0.95,
            "frequency_penalty": 0,
            "presence_penalty": 0,
            "stop": None,
            "response_format": {"type": "json_object"}  # Force JSON response
        }

    @backoff.on_exception(
        backoff.expo,
        (aiohttp.ClientError, asyncio.TimeoutError),
        max_tries=3,
        base=2,
        max_value=60
    )
    async def _make_api_request(self, request_body: Dict[str, Any]) -> Dict[str, Any]:
        """Make API request to Azure AI Foundry"""
        session = await self._get_session()

        url = f"{self.api_endpoint}/openai/deployments/{self.config.model}/chat/completions?api-version={self.api_version}"

        async with session.post(url, json=request_body) as response:
            if response.status == 429:  # Rate limited
                retry_after = int(response.headers.get('retry-after', 5))
                await asyncio.sleep(retry_after)
                raise aiohttp.ClientError("Rate limited")

            response.raise_for_status()
            return await response.json()

    def _parse_response(self, api_response: Dict[str, Any], request: GenerationRequest) -> List[Dict[str, Any]]:
        """Parse API response and extract questions"""
        try:
            content = api_response["choices"][0]["message"]["content"]
            questions_data = json.loads(content)

            # Ensure we have a list of questions
            if isinstance(questions_data, dict):
                questions_data = [questions_data]
            elif not isinstance(questions_data, list):
                # If the response doesn't match expected format, create a structured response
                questions_data = [{
                    "question": content,
                    "type": request.question_types[0].value if request.question_types else "short-answer",
                    "correct_answer": "See explanation above",
                    "explanation": "Generated from AI response",
                    "difficulty": request.difficulty.value
                }]

            # Validate and format each question
            formatted_questions = []
            for i, question in enumerate(questions_data[:request.question_count]):
                formatted_question = {
                    "id": f"azure_foundry_{i+1}",
                    "question": question.get("question", ""),
                    "type": question.get("type", request.question_types[0].value if request.question_types else "short-answer"),
                    "correct_answer": question.get("correct_answer", ""),
                    "explanation": question.get("explanation", ""),
                    "difficulty": question.get("difficulty", request.difficulty.value),
                    "options": question.get("options", []),
                    "metadata": {
                        "provider": "azure-ai-foundry",
                        "model": self.config.model,
                        "generated_at": time.time()
                    }
                }
                formatted_questions.append(formatted_question)

            return formatted_questions

        except (json.JSONDecodeError, KeyError, IndexError) as e:
            logger.error(f"Failed to parse Azure AI Foundry response: {str(e)}")
            # Fallback: create a basic question structure
            return [{
                "id": "azure_foundry_fallback",
                "question": "Error parsing AI response. Please try again.",
                "type": "short-answer",
                "correct_answer": "N/A",
                "explanation": f"Parsing error: {str(e)}",
                "difficulty": request.difficulty.value,
                "options": [],
                "metadata": {
                    "provider": "azure-ai-foundry",
                    "model": self.config.model,
                    "error": "parse_error"
                }
            }]

    async def _generate_questions_impl(self, request: GenerationRequest) -> GenerationResult:
        """Generate questions using Azure AI Foundry"""
        start_time = time.time()

        try:
            # Build prompts
            system_prompt = self._build_system_prompt(request)
            user_prompt = self._build_user_prompt(request)

            # Format request body
            request_body = self._format_request_body(system_prompt, user_prompt)

            # Make API request
            api_response = await self._make_api_request(request_body)

            # Parse response
            questions = self._parse_response(api_response, request)

            # Calculate metrics
            processing_time = time.time() - start_time

            # Estimate cost (rough calculation based on token usage)
            prompt_tokens = api_response.get("usage", {}).get("prompt_tokens", 0)
            completion_tokens = api_response.get("usage", {}).get("completion_tokens", 0)
            total_tokens = prompt_tokens + completion_tokens

            # Azure pricing (approximate, varies by region and model)
            # GPT-4 Turbo: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
            input_cost = (prompt_tokens / 1000) * 0.03
            output_cost = (completion_tokens / 1000) * 0.06
            total_cost = input_cost + output_cost

            # Calculate quality score (simple heuristic based on question completeness)
            quality_score = self._calculate_quality_score(questions)

            return GenerationResult(
                request_id=request.id,
                questions=questions,
                provider=self.provider_id,
                model=self.config.model,
                metrics={
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens,
                    "api_response_time": processing_time
                },
                cost=total_cost,
                quality_score=quality_score,
                processing_time=processing_time
            )

        except Exception as e:
            logger.error(f"Azure AI Foundry generation failed: {str(e)}")
            raise

    def _calculate_quality_score(self, questions: List[Dict[str, Any]]) -> float:
        """Calculate quality score for generated questions"""
        if not questions:
            return 0.0

        total_score = 0.0
        for question in questions:
            score = 0.0

            # Check for required fields
            if question.get("question") and len(question["question"]) > 10:
                score += 0.3
            if question.get("correct_answer"):
                score += 0.3
            if question.get("explanation") and len(question["explanation"]) > 5:
                score += 0.2
            if question.get("type"):
                score += 0.1
            if question.get("difficulty"):
                score += 0.1

            total_score += score

        return min(total_score / len(questions), 1.0)

    async def _health_check_impl(self) -> bool:
        """Check Azure AI Foundry service health"""
        try:
            session = await self._get_session()

            # Make a simple API call to check connectivity
            url = f"{self.api_endpoint}/openai/deployments/{self.config.model}/chat/completions?api-version={self.api_version}"

            test_request = {
                "messages": [
                    {"role": "user", "content": "Hello, this is a health check."}
                ],
                "max_tokens": 10,
                "temperature": 0.1
            }

            async with session.post(url, json=test_request) as response:
                return response.status == 200

        except Exception as e:
            logger.error(f"Azure AI Foundry health check failed: {str(e)}")
            return False

    async def close(self):
        """Close aiohttp session"""
        if self.session and not self.session.closed:
            await self.session.close()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()