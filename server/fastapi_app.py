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
import time

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
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
    generators: Optional[Dict[str, bool]] = None

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
async def generate_batch(request: BatchGenerateRequest, background_tasks: BackgroundTasks):
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
    
    Example response:
    ```json
    {
        "success": true,
        "data": {
            "results": [
                {
                    "original_sentence": "Full sentence from text",
                    "partial_sentence": "Beginning part of sentence",
                    "false_sentences": ["False completion 1", "False completion 2", "False completion 3"]
                },
                ...more sentences...
            ],
            "count": 2,
            "timestamp": "2023-04-01T12:34:56.789Z"
        }
    }
    ```
    """
    try:
        # Generate a unique request ID for tracking
        request_id = f"batch_{int(time.time())}_{len(request.sentences)}"
        logger.info(f"Starting batch request {request_id} with {len(request.sentences)} sentences")
        
        if not request.sentences:
            raise HTTPException(status_code=400, detail="At least one sentence is required")
            
        if len(request.sentences) > 20:
            raise HTTPException(status_code=400, detail="Maximum 20 sentences allowed per batch")
            
        # Process each sentence
        partial_sentences = []
        
        # Generate partial sentences for each input
        for sentence in request.sentences:
            if len(sentence.split()) < 4:
                raise HTTPException(status_code=400, detail=f"Sentence too short: {sentence}")
                
            words = word_tokenize(sentence)
            partial_idx = len(words) // 2
            partial_sentences.append(' '.join(words[:partial_idx]))
        
        # Start timing
        start_time = time.time()
        
        # Get preferred generator
        generator = generator_factory.get_generator('claude')
        generator_type = 'claude'
        
        if generator is None:
            generator = generator_factory.get_generator('gpt2')
            generator_type = 'gpt2'
            if generator is None:
                raise HTTPException(status_code=503, detail="No generator available")
        
        # Use statement objects method if available
        if generator_type == 'claude' and hasattr(generator, 'generate_statement_objects'):
            statement_objects = await asyncio.get_event_loop().run_in_executor(
                generator_factory.executor,
                generator.generate_statement_objects,
                partial_sentences,
                request.sentences,
                request.num_statements
            )
            results = statement_objects
        else:
            # Fallback to batch generation
            all_statements = await generator_factory.generate_batch_async(
                generator_type,
                partial_sentences,
                request.sentences,
                request.num_statements
            )
            
            # Format results as statement objects
            results = []
            for i, (sentence, partial, statements) in enumerate(zip(request.sentences, partial_sentences, all_statements)):
                results.append({
                    "original_sentence": sentence,
                    "partial_sentence": partial,
                    "false_sentences": statements,
                    "index": i
                })
            
        # Calculate elapsed time
        elapsed_time = time.time() - start_time
        
        # Add background task for tracking and cleanup
        background_tasks.add_task(
            log_batch_completion,
            request_id,
            len(request.sentences),
            elapsed_time
        )
            
        return {
            "success": True,
            "data": {
                "results": results,
                "count": len(results),
                "request_id": request_id,
                "elapsed_time_seconds": elapsed_time,
                "timestamp": datetime.now().isoformat(),
                "generator_used": generator_type
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
    Generate multiple-choice Q&A format from input text.
    Each question has three answers: one correct and two false ones.
    
    Example request:
    ```json
    {
        "text": "Musk has shown again he can influence the digital currency market...",
        "num_statements": 3
    }
    ```
    
    Example response format:
    ```json
    {
        "success": true,
        "data": {
            "questions": [
                {
                    "question": "What did Musk demonstrate?",
                    "answers": [
                        {"text": "His ability to influence the digital currency market", "correct": true},
                        {"text": "His ability to regulate cryptocurrency", "correct": false},
                        {"text": "His plan to create a new digital currency", "correct": false}
                    ]
                },
                ...more questions...
            ],
            "total_questions": 3,
            "generated_at": "2023-04-01T12:34:56.789Z",
            "generator_used": "claude"
        }
    }
    ```
    """
    try:
        # Validate input
        if not request.text or len(request.text) < 10:
            raise HTTPException(status_code=400, detail="Text is too short")
            
        # Get Claude generator first, fallback to GPT-2 if needed
        generator = generator_factory.get_generator('claude')
        generator_type = 'claude'
        
        # If Claude generator is not available, try GPT-2 generator
        if generator is None:
            generator = generator_factory.get_generator('gpt2')
            generator_type = 'gpt2'
            if generator is None:
                raise HTTPException(status_code=503, detail="No generator available")
            
        # Process asynchronously but wait for result
        qa_output = await generator.generate_qa_from_text_async(request.text)
        
        # For very long texts, use background task for logging/cleanup
        # This won't affect the response but helps with resource management
        background_tasks.add_task(
            log_qa_generation, 
            request.text[:100] + "...",  # Log just the beginning for privacy
            len(qa_output.get("questions", [])) if isinstance(qa_output, dict) else 0
        )
        
        # Format the response properly
        if isinstance(qa_output, str):
            formatted_output = {
                "format": "qa",
                "content": qa_output,
                "generated_at": datetime.now().isoformat(),
                "processing_mode": "async",
                "generator_used": generator_type
            }
        else:
            formatted_output = qa_output
            if "generated_at" not in formatted_output:
                formatted_output["generated_at"] = datetime.now().isoformat()
            if "processing_mode" not in formatted_output:
                formatted_output["processing_mode"] = "async"
            formatted_output["generator_used"] = generator_type
            
        return {
            "success": True,
            "data": formatted_output
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error generating Q&A: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate Q&A: {str(e)}")

@app.post("/generate/statement-objects", response_model=GenerateResponse)
async def generate_statement_objects(request: GenerateRequest):
    """
    Generate a statement object with original sentence, partial sentence, and false options.
    
    Example request:
    ```json
    {
        "full_sentence": "The technology company announced record profits for the third quarter.",
        "num_statements": 3
    }
    ```
    
    Example response:
    ```json
    {
        "success": true,
        "data": {
            "original_sentence": "The technology company announced record profits for the third quarter.",
            "partial_sentence": "The technology company announced",
            "false_sentences": [
                "The technology company announced layoffs affecting 30% of their workforce.",
                "The technology company announced bankruptcy following three quarters of losses.",
                "The technology company announced moving their headquarters to Singapore."
            ]
        }
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
        
        # Get preferred generator
        generator = generator_factory.get_generator('claude')
        generator_type = 'claude'
        
        if generator is None:
            generator = generator_factory.get_generator('gpt2')
            generator_type = 'gpt2'
            if generator is None:
                raise HTTPException(status_code=503, detail="No generator available")
        
        # Generate false statements
        statements = await generator_factory.generate_false_statements_async(
            generator_type,
            request.partial_sentence,
            request.full_sentence,
            request.num_statements
        )
        
        # Format as statement object
        result = {
            "original_sentence": request.full_sentence,
            "partial_sentence": request.partial_sentence,
            "false_sentences": statements
        }
        
        return {
            "success": True,
            "data": result
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error generating statement object: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate statement object: {str(e)}")

# Helper function for background task
async def log_qa_generation(text_preview: str, question_count: int):
    """Log QA generation details for monitoring"""
    try:
        logger.info(f"Generated QA content with {question_count} questions for text starting with: {text_preview}")
        
        # Could add additional background cleanup here
        # For example, clear caches after processing large texts
        if question_count > 10:
            # For large generations, hint the garbage collector
            import gc
            gc.collect()
            
    except Exception as e:
        logger.error(f"Error in background logging task: {str(e)}", exc_info=True)

# Helper function for batch monitoring
async def log_batch_completion(request_id: str, sentence_count: int, elapsed_time: float):
    """Log batch processing completion for monitoring"""
    try:
        logger.info(f"Completed batch request {request_id} with {sentence_count} sentences in {elapsed_time:.2f}s")
        
        # Trigger cleanup for large batches
        if sentence_count > 10 or elapsed_time > 10:
            # Hint the garbage collector for large/slow batches
            import gc
            gc.collect()
            
    except Exception as e:
        logger.error(f"Error in batch logging task: {str(e)}", exc_info=True)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    # Check if Claude generator is available
    claude_generator = generator_factory.get_generator('claude')
    claude_available = claude_generator is not None
    
    # Check if GPT-2 models are loaded
    gpt2_generator = generator_factory.get_generator('gpt2')
    gpt2_loaded = gpt2_generator is not None and hasattr(gpt2_generator, '_is_ready') and gpt2_generator._is_ready()
    
    return {
        "status": "ok", 
        "message": "Service is running",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": claude_available or gpt2_loaded,
        "generators": {
            "claude": claude_available,
            "gpt2": gpt2_loaded
        }
    }

def start():
    """Function to start the server programmatically"""
    # Set default process name
    try:
        import setproctitle
        setproctitle.setproctitle("gentext_api")
    except ImportError:
        pass
    
    # Determine the best loop implementation
    try:
        import uvloop
        loop_implementation = "uvloop"
    except ImportError:
        loop_implementation = "asyncio"
        logger.warning("uvloop not available, falling back to asyncio")
    
    # Start server with optimized settings
    uvicorn.run(
        "fastapi_app:app", 
        host=HOST, 
        port=PORT,
        reload=DEBUG,
        workers=WORKERS,
        log_level="debug" if DEBUG else "info",
        loop=loop_implementation
    )

if __name__ == "__main__":
    start()
