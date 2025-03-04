from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
import uvicorn
from generator_factory import StatementGeneratorFactory
from improved_generator import ImprovedFalseStatementGenerator
import nltk
from nltk.tokenize import word_tokenize

app = FastAPI(
    title="Text Generation API",
    description="API for generating false statements and Q&A format content",
    version="1.0.0"
)

class TextRequest(BaseModel):
    text: str
    num_statements: Optional[int] = 3

class GenerateRequest(BaseModel):
    full_sentence: str
    num_statements: Optional[int] = 3
    partial_sentence: Optional[str] = None  # Make partial_sentence optional

class GenerateResponse(BaseModel):
    success: bool
    data: Dict[str, Any]

class QAResponse(BaseModel):
    success: bool
    data: Union[Dict[str, Any], str]  # Allow either dict or string

# Initialize the generator factory
generator_factory = StatementGeneratorFactory()

# Example requests for documentation
example_generate_request = {
    "partial_sentence": "Musk has shown again he can",
    "full_sentence": "Musk has shown again he can influence the digital currency market with just his tweets.",
    "num_statements": 3
}

example_qa_request = {
    "text": """Musk has shown again he can influence the digital currency market with just his tweets. 
            After saying that his electric vehicle-making company Tesla will not accept payments in Bitcoin 
            because of environmental concerns, he tweeted that he was working with developers of Dogecoin 
            to improve system transaction efficiency.""",
    "num_statements": 3
}

@app.post("/generate/statements", response_model=GenerateResponse)
async def generate_statements(request: GenerateRequest):
    """
    Generate false statements from a sentence. If partial_sentence is not provided,
    it will be automatically generated from the full sentence.
    
    Example request:
    ```json
    {
        "full_sentence": "Musk has shown again he can influence the digital currency market with just his tweets.",
        "num_statements": 3
    }
    ```
    """
    try:
        # If partial_sentence not provided, generate it automatically
        if not request.partial_sentence:
            words = word_tokenize(request.full_sentence)
            partial_idx = len(words) // 2  # Take first half of words
            request.partial_sentence = ' '.join(words[:partial_idx])
        
        statements = generator_factory.generate_false_statements(
            'gpt2',
            request.partial_sentence,
            request.full_sentence,
            request.num_statements
        )
        return {
            "success": True,
            "data": {
                "original_sentence": request.full_sentence,
                "partial_sentence": request.partial_sentence,
                "false_sentences": statements,
                "generator_used": "gpt2"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/qa", response_model=QAResponse)
async def generate_qa(request: TextRequest):
    """
    Generate Q&A format from input text.
    
    Example request:
    ```json
    {
        "text": "Musk has shown again he can influence the digital currency market...",
        "num_statements": 3
    }
    ```
    """
    try:
        generator = generator_factory.get_generator('gpt2')
        qa_output = generator.generate_qa_from_text(request.text)
        
        # Format the response properly
        if isinstance(qa_output, str):
            # If the output is a string, wrap it in a dict with metadata
            formatted_output = {
                "format": "qa",
                "content": qa_output,
                "generated_at": str(datetime.datetime.now())
            }
        else:
            formatted_output = qa_output
            
        return {
            "success": True,
            "data": formatted_output
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

# OpenAPI documentation customization
app.title = "GenText API"
app.description = """
Text Generation API for creating false statements and Q&A format content.
Supports both statement generation and Q&A format conversion.
"""
app.version = "1.0.0"

if __name__ == "__main__":
    uvicorn.run("fastapi_app:app", host="127.0.0.1", port=8000, reload=True)
