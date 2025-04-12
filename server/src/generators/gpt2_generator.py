import time
from typing import Dict, Any

class GPT2Generator:
    async def generate_qa_from_text_async(self, text: str, num_questions: int = 3) -> Dict[str, Any]:
        """
        Generate Q&A pairs from input text using GPT-2.
        
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
                
            # Generate questions using the existing method
            questions = await self.generate_questions_from_text_async(text, num_questions)
            
            # Format the questions into the standard format
            formatted_questions = []
            for q in questions:
                # Get the correct answer (first answer)
                correct_answer = q["answers"][0]["text"]
                
                # Get false answers (remaining answers)
                false_answers = [a["text"] for a in q["answers"][1:]]
                
                formatted_questions.append({
                    "original_sentence": correct_answer,
                    "partial_sentence": q["question"],
                    "false_sentences": false_answers
                })
            
            return {
                "format_version": "1.0",
                "questions": formatted_questions,
                "total_questions": len(formatted_questions),
                "generated_at": time.time(),
                "processing_mode": "gpt2"
            }
            
        except Exception as e:
            logger.error(f"Error in QA generation with GPT-2: {str(e)}", exc_info=True)
            return {
                "format_version": "1.0",
                "questions": [],
                "total_questions": 0,
                "error": str(e),
                "generated_at": time.time()
            } 