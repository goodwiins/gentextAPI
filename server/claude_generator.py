import logging
import os
import requests
import json
from typing import List, Optional, Dict, Any, Union
import time
import backoff

logger = logging.getLogger(__name__)

class ClaudeFalseStatementGenerator:
    """
    False statement generator using Anthropic's Claude API
    """
    
    def __init__(self, 
                 model_name: str = "claude-3-7-sonnet-20250219",
                 api_key: Optional[str] = None,
                 max_retries: int = 3,
                 timeout: int = 20):
        """
        Initialize the Claude generator.
        
        Args:
            model_name: Claude model to use (default: claude-3-7-sonnet-20250219)
            api_key: Anthropic API key (defaults to ANTHROPIC_API_KEY env variable)
            max_retries: Maximum number of retries for API calls
            timeout: Timeout in seconds for API calls
        """
        self.model_name = model_name
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("Anthropic API key not provided and not found in environment")
        
        self.max_retries = max_retries
        self.timeout = timeout
        self.api_url = "https://api.anthropic.com/v1/messages"
        
        logger.info(f"Initialized Claude generator with model: {model_name}")
    
    @backoff.on_exception(
        backoff.expo,
        (requests.exceptions.RequestException, requests.exceptions.Timeout),
        max_tries=3,
        factor=2
    )
    def _call_claude_api(self, prompt: str) -> Dict[Any, Any]:
        """
        Make a request to Claude API with backoff retry logic.
        
        Args:
            prompt: The prompt to send to Claude
            
        Returns:
            API response as dictionary
        """
        headers = {
            "x-api-key": self.api_key,
            "content-type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 1024,
            "temperature": 0.9  # Higher temperature for more creative false statements
        }
        
        try:
            response = requests.post(
                self.api_url,
                headers=headers,
                data=json.dumps(payload),
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {str(e)}")
            raise
    
    def generate_false_statements(
        self,
        partial_sentence: str,
        full_sentence: str,
        num_statements: int = 3
    ) -> List[str]:
        """
        Generate false statements using Claude.
        
        Args:
            partial_sentence: Beginning of a sentence
            full_sentence: Complete original sentence
            num_statements: Number of false statements to generate
            
        Returns:
            List of false statements
        """
        try:
            prompt = f"""
I need you to generate {num_statements} plausible but factually incorrect completions for this sentence fragment. 
The original complete sentence is: "{full_sentence}"

The beginning of the sentence is: "{partial_sentence}"

Generate {num_statements} different completions that:
1. Sound plausible and grammatically correct
2. Are factually incorrect (different from the original)
3. Are diverse and creative
4. Are concise (try to match the length and style of the original)

Output the false statements only, one per line, with no explanations or numbering.
"""
            
            response = self._call_claude_api(prompt)
            
            if "content" not in response or len(response["content"]) == 0:
                logger.error("Invalid response format from Claude API")
                return []
                
            # Extract the text response
            text_response = response["content"][0]["text"]
            
            # Parse the response - split by newlines and clean
            statements = [line.strip() for line in text_response.strip().split('\n') 
                          if line.strip() and not line.strip().isdigit()]
            
            # Take only the requested number
            statements = statements[:num_statements]
            
            # Ensure each statement is complete by prepending the partial sentence if needed
            for i, statement in enumerate(statements):
                if not statement.startswith(partial_sentence):
                    statements[i] = partial_sentence + statement
            
            logger.debug(f"Generated {len(statements)} false statements")
            return statements
            
        except Exception as e:
            logger.error(f"Error generating false statements with Claude: {str(e)}", exc_info=True)
            return []
    
    def generate_statement_objects(
        self,
        partial_sentences: List[str],
        full_sentences: List[str],
        num_statements: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Generate false statement objects with the original sentence, 
        partial sentence, and false options.
        
        Args:
            partial_sentences: List of partial sentences
            full_sentences: List of corresponding full sentences
            num_statements: Number of false statements to generate for each sentence
            
        Returns:
            List of statement objects with original, partial, and false options
        """
        results = []
        
        for partial, full in zip(partial_sentences, full_sentences):
            # Add small delay between requests to avoid rate limits
            time.sleep(0.5)
            
            # Generate the false statements
            false_statements = self.generate_false_statements(partial, full, num_statements)
            
            # Create the statement object
            statement_obj = {
                "original_sentence": full,
                "partial_sentence": partial,
                "false_sentences": false_statements
            }
            
            results.append(statement_obj)
        
        return results
    
    def generate_statements_batch(
        self,
        partial_sentences: List[str],
        full_sentences: List[str],
        num_statements: int = 3
    ) -> List[List[str]]:
        """
        Generate false statements for multiple sentences.
        
        Args:
            partial_sentences: List of partial sentences
            full_sentences: List of corresponding full sentences
            num_statements: Number of statements to generate for each sentence
            
        Returns:
            List of lists, each containing false statements
        """
        results = []
        
        for partial, full in zip(partial_sentences, full_sentences):
            # Add small delay between requests to avoid rate limits
            time.sleep(0.5)
            statements = self.generate_false_statements(partial, full, num_statements)
            results.append(statements)
        
        return results
    
    def _ensure_models_loaded(self):
        """
        Compatibility method - Claude models are cloud-based and don't need preloading
        """
        return
        
    async def generate_qa_from_text_async(self, text: str, num_questions: int = 3) -> Dict[str, Any]:
        """
        Generate Q&A pairs from input text using Claude, with one true and two false answers per question.
        
        Args:
            text: The input text to generate questions and answers from
            num_questions: Number of Q&A pairs to generate
            
        Returns:
            Dictionary containing questions with multiple-choice answers (one true, two false)
        """
        try:
            # Check if text is too short
            if len(text.strip()) < 20:
                return {
                    "format_version": "1.0",
                    "questions": [],
                    "total_questions": 0,
                    "error": "Input text is too short to generate meaningful Q&A",
                    "generated_at": time.time()
                }
                
            prompt = f"""
Please generate {num_questions} multiple-choice questions based on the following text.

Text:
```
{text}
```

For each question:
1. Create an accurate question based on the text
2. Provide THREE possible answers for each question:
   - One answer that is completely correct (mark this as "correct": true)
   - Two answers that sound plausible but are factually incorrect (mark these as "correct": false)
3. The false answers should be convincing but clearly wrong when compared to the text
4. Randomize the order of correct and incorrect answers

Return your response in this exact JSON format:
{{
  "questions": [
    {{
      "question": "What is stated in the text about X?",
      "answers": [
        {{ "text": "Correct answer based on the text", "correct": true }},
        {{ "text": "Plausible but incorrect answer 1", "correct": false }},
        {{ "text": "Plausible but incorrect answer 2", "correct": false }}
      ]
    }},
    ...more questions...
  ]
}}

Do not include any additional text outside of this JSON structure.
"""
            
            # Call the Claude API
            response = self._call_claude_api(prompt)
            
            if "content" not in response or len(response["content"]) == 0:
                logger.error("Invalid response format from Claude API for QA generation")
                return {
                    "format_version": "1.0",
                    "questions": [],
                    "total_questions": 0,
                    "error": "Failed to generate QA content",
                    "generated_at": time.time()
                }
                
            # Extract the text response
            text_response = response["content"][0]["text"]
            
            # Parse JSON from the response
            try:
                # Find the JSON part in the response (ignoring any additional text)
                import re
                json_match = re.search(r'(\{.*\})', text_response, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1)
                    qa_data = json.loads(json_str)
                else:
                    qa_data = json.loads(text_response)
                    
                # Ensure expected format
                if "questions" not in qa_data or not isinstance(qa_data["questions"], list):
                    raise ValueError("Response lacks 'questions' array")
                    
                # Add metadata
                result = {
                    "format_version": "1.0",
                    "questions": qa_data["questions"],
                    "total_questions": len(qa_data["questions"]),
                    "generated_at": time.time(),
                    "processing_mode": "claude"
                }
                return result
                
            except (json.JSONDecodeError, ValueError) as e:
                logger.error(f"Error parsing QA response: {str(e)}", exc_info=True)
                # Return error
                return {
                    "format_version": "1.0",
                    "questions": [],
                    "total_questions": 0,
                    "error": f"Failed to parse response: {str(e)}",
                    "generated_at": time.time(),
                    "processing_mode": "claude"
                }
                
        except Exception as e:
            logger.error(f"Error in QA generation with Claude: {str(e)}", exc_info=True)
            return {
                "format_version": "1.0",
                "questions": [],
                "total_questions": 0,
                "error": str(e),
                "generated_at": time.time()
            }