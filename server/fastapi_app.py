from typing import Optional, Dict, Any, Union, List
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn
from generator_factory import StatementGeneratorFactory
import nltk
from nltk.tokenize import word_tokenize
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os
import logging
import asyncio
import signal
from starlette.exceptions import HTTPException as StarletteHTTPException

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables for configuration
HOST = os.getenv("API_HOST", "0.0.0.0")  # Default to all interfaces for production
PORT = int(os.getenv("API_PORT", "8000"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
WORKERS = int(os.getenv("API_WORKERS", "1"))
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
MAX_WORKERS = int(os.getenv("MAX_THREAD_WORKERS", os.cpu_count() or 4))
MODEL_DEVICE = os.getenv("MODEL_DEVICE", None)  # Allow environment override of model device

app = FastAPI(
    title="GenText API",
    description="API for generating false statements and Q&A from text",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    debug=DEBUG
)

# Add CORSMiddleware with configurable origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=86400,  # 24 hours cache for preflight requests
)

class TextRequest(BaseModel):
    text: str
    num_statements: Optional[int] = Field(3, ge=1, le=10, description="Number of statements to generate (1-10)")

class GenerateRequest(BaseModel):
    full_sentence: str
    num_statements: Optional[int] = Field(3, ge=1, le=10, description="Number of statements to generate (1-10)")
    partial_sentence: Optional[str] = None

class BatchGenerateRequest(BaseModel):
    sentences: List[str] = Field(..., min_items=1, max_items=20, description="List of sentences to process")
    num_statements: Optional[int] = Field(3, ge=1, le=5, description="Number of statements per sentence (1-5)")

class GenerateResponse(BaseModel):
    success: bool
    data: Dict[str, Any]

class QAResponse(BaseModel):
    success: bool
    data: Union[Dict[str, Any], str]

class HealthResponse(BaseModel):
    status: str
    message: str
    version: str = "1.0.0"
    timestamp: str
    models_loaded: bool

# Initialize the generator factory with configurable thread pool
generator_factory = StatementGeneratorFactory(max_workers=MAX_WORKERS)

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

# Setup cleanup handlers
def cleanup_resources():
    """Cleanup resources properly on shutdown"""
    logger.info("Cleaning up resources...")
    generator_factory.shutdown()

@app.on_event("shutdown")
async def shutdown_event():
    """Handle application shutdown gracefully"""
    cleanup_resources()

# Register signal handlers
for sig in (signal.SIGTERM, signal.SIGINT):
    signal.signal(sig, lambda signum, frame: cleanup_resources())

# Global exception handler
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": str(exc.detail)},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error"},
    )

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
        # Validate input
        if not request.full_sentence:
            raise HTTPException(status_code=400, detail="Full sentence is required")
        
        if request.num_statements < 1 or request.num_statements > 10:
            raise HTTPException(status_code=400, detail="Number of statements must be between 1 and 10")
            
        # If partial_sentence not provided, generate it automatically
        if not request.partial_sentence:
            words = word_tokenize(request.full_sentence)
            if len(words) < 4:
                raise HTTPException(status_code=400, detail="Full sentence is too short")
                
            partial_idx = len(words) // 2  # Take first half of words
            request.partial_sentence = ' '.join(words[:partial_idx])
        
        # Use the async generator directly
        statements = await generator_factory.generate_false_statements_async(
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
                "generator_used": "gpt2",
                "timestamp": datetime.now().isoformat()
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error generating statements: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate statements: {str(e)}")

@app.post("/generate/batch", response_model=GenerateResponse)
async def generate_batch(request: BatchGenerateRequest):
    """
    Generate false statements for multiple sentences in batch.
    
    Example request:
    ```json
    {
        "sentences": [
            "Musk has shown again he can influence the digital currency market with just his tweets.",
            "The company announced record profits for the fourth quarter."
        ],
        "num_statements": 3
    }
    ```
    """
    try:
        if not request.sentences:
            raise HTTPException(status_code=400, detail="At least one sentence is required")
            
        if len(request.sentences) > 20:
            raise HTTPException(status_code=400, detail="Maximum 20 sentences allowed per batch")
            
        # Process each sentence
        results = []
        partial_sentences = []
        
        # Generate partial sentences for each input
        for sentence in request.sentences:
            if len(sentence.split()) < 4:
                raise HTTPException(status_code=400, detail=f"Sentence too short: {sentence}")
                
            words = word_tokenize(sentence)
            partial_idx = len(words) // 2
            partial_sentences.append(' '.join(words[:partial_idx]))
        
        # Use batch generation
        all_statements = await generator_factory.generate_batch_async(
            'gpt2',
            partial_sentences,
            request.sentences,
            request.num_statements
        )
        
        # Format results
        for i, (sentence, partial, statements) in enumerate(zip(request.sentences, partial_sentences, all_statements)):
            results.append({
                "original_sentence": sentence,
                "partial_sentence": partial,
                "false_sentences": statements,
                "index": i
            })
            
        return {
            "success": True,
            "data": {
                "results": results,
                "count": len(results),
                "timestamp": datetime.now().isoformat()
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in batch generation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process batch: {str(e)}")

@app.post("/generate/qa", response_model=QAResponse)
async def generate_qa(request: TextRequest, background_tasks: BackgroundTasks):
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
        # Validate input
        if not request.text or len(request.text) < 10:
            raise HTTPException(status_code=400, detail="Text is too short")
            
        # Get generator and use async version
        generator = generator_factory.get_generator('gpt2')
        if generator is None:
            raise HTTPException(status_code=503, detail="Generator not available")
            
        # Generate Q&A asynchronously
        qa_output = await generator.generate_qa_from_text_async(request.text)
        
        # Format the response properly
        if isinstance(qa_output, str):
            formatted_output = {
                "format": "qa",
                "content": qa_output,
                "generated_at": datetime.now().isoformat()
            }
        else:
            formatted_output = qa_output
            if "generated_at" not in formatted_output:
                formatted_output["generated_at"] = datetime.now().isoformat()
            
        return {
            "success": True,
            "data": formatted_output
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error generating Q&A: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate Q&A: {str(e)}")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    # Check if models are loaded
    generator = generator_factory.get_generator('gpt2')
    models_loaded = generator is not None and hasattr(generator, '_is_ready') and generator._is_ready()
    
    return {
        "status": "ok", 
        "message": "Service is running",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": models_loaded
    }

def start():
    """Function to start the server programmatically"""
    # Set default process name
    try:
        import setproctitle
        setproctitle.setproctitle("gentext_api")
    except ImportError:
        pass
    
    # Start server with optimized settings
    uvicorn.run(
        "fastapi_app:app", 
        host=HOST, 
        port=PORT,
        reload=DEBUG,
        workers=WORKERS,
        log_level="debug" if DEBUG else "info",
        loop="uvloop" if not DEBUG else "asyncio"
    )

if __name__ == "__main__":
    start()
