from typing import List, Dict
import json

__all__ = ['QAFormatter']

class QAFormatter:
    def __init__(self):
        self.letter_mapping = {
            0: 'A',
            1: 'B',
            2: 'C',
            3: 'D'
        }
    
    def format_qa(self, questions: List[Dict]) -> str:
        """Format questions and answers into a standardized output."""
        formatted_output = ""
        
        for idx, qa in enumerate(questions, 1):
            # Format question
            formatted_output += f"{idx}/3\n"
            formatted_output += f"{qa['question']}\n"
            
            # Format answer choices
            for choice_idx, choice in enumerate(qa['choices']):
                letter = self.letter_mapping[choice_idx]
                formatted_output += f"{letter}\n{choice}\n"
            
            formatted_output += "Show Explanation\n\n"
        
        return formatted_output.strip()
    
    def parse_json(self, json_input: str) -> List[Dict]:
        """Parse JSON input into question format."""
        return json.loads(json_input)

    def generate_qa_json(self, question: str, choices: List[str]) -> str:
        """Generate JSON format for a single Q&A."""
        qa_dict = {
            "question": question,
            "choices": choices
        }
        return json.dumps(qa_dict, indent=2)
