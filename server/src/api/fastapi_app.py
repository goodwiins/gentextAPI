from typing import Optional, Dict, Any, Union, List
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn
from src.generators.generator_factory import StatementGeneratorFactory
from src.api.analytics import router as analytics_router
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
import uuid

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables for configuration
HOST = os.getenv("API_HOST", "0.0.0.0")  # Default to all interfaces for production
PORT = int(os.getenv("API_PORT", "8000"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://167.71.90.100:3000,http://167.71.90.100,http://localhost,https://gentext-api.vercel.app").split(",")
WORKERS = int(os.getenv("API_WORKERS", "1"))
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
MAX_WORKERS = int(os.getenv("MAX_THREAD_WORKERS", os.cpu_count() or 4))
MODEL_DEVICE = os.getenv("MODEL_DEVICE", None)  # Allow environment override of model device

# Enhanced CORS origins for analytics
ANALYTICS_CORS_ORIGINS = [
    # Development origins
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    
    # Production origins
    "https://gentext-api.vercel.app",
    "https://your-production-domain.com",
    
    # CDN origins for analytics scripts
    "https://cdn.jsdelivr.net",
    "https://unpkg.com",
    
    # Development server origins
    "http://167.71.90.100:3000",
    "http://167.71.90.100",
    
    # Add any additional analytics-specific origins
] + CORS_ORIGINS

app = FastAPI(
    title="GenText API",
    description="API for generating false statements and Q&A from text",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    debug=DEBUG
)

# Add enhanced CORSMiddleware with analytics support
app.add_middleware(
    CORSMiddleware,
    allow_origins=ANALYTICS_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=[
        "*",
        # Standard headers
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        
        # Analytics specific headers
        "X-Session-ID",
        "X-User-ID", 
        "X-Analytics-Version",
        "X-Performance-Metrics",
        "X-Client-Timestamp",
        
        # Performance monitoring headers
        "X-Page-Load-Time",
        "X-Memory-Usage",
        "X-Bundle-Size",
        
        # Custom analytics headers
        "X-Section-Name",
        "X-Engagement-Type",
        "X-Conversion-Event",
    ],
    expose_headers=[
        # Standard response headers to expose
        "X-Request-ID",
        "X-Process-Time", 
        "X-Timestamp",
        "X-Server-Instance",
        
        # Analytics response headers
        "X-Analytics-Received",
        "X-Performance-Score",
        "X-Rate-Limit-Remaining",
    ],
    max_age=86400,  # 24 hours cache for preflight requests
)

# Enhanced analytics middleware for comprehensive request tracking
@app.middleware("http")
async def analytics_middleware(request: Request, call_next):
    """Enhanced middleware to track API requests, performance metrics, and user analytics"""
    start_time = time.time()
    
    # Generate unique request ID
    request_id = str(uuid.uuid4())
    
    # Add request ID to request state for access in endpoints
    request.state.request_id = request_id
    
    # Extract client information
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    referer = request.headers.get("referer", "")
    session_id = request.headers.get("x-session-id", "")
    
    # Extract route information
    path = request.url.path
    method = request.method
    query_params = dict(request.query_params)
    
    # Log comprehensive request details
    logger.info(
        f"Request {request_id}: {method} {path} from {client_ip} "
        f"(Session: {session_id[:8] if session_id else 'none'})"
    )
    
    try:
        # Process the request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Add comprehensive analytics headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{process_time:.4f}"
        response.headers["X-Timestamp"] = str(int(start_time))
        response.headers["X-Server-Instance"] = os.getenv("HOSTNAME", "unknown")
        
        # Track request analytics
        await track_request_analytics({
            "request_id": request_id,
            "method": method,
            "path": path,
            "status_code": response.status_code,
            "process_time": process_time,
            "client_ip": client_ip,
            "user_agent": user_agent,
            "referer": referer,
            "session_id": session_id,
            "query_params": query_params,
            "timestamp": datetime.now().isoformat(),
            "success": True
        })
        
        # Log successful request with enhanced details
        logger.info(
            f"Request {request_id} completed: {response.status_code} in {process_time:.4f}s "
            f"(Size: {response.headers.get('content-length', 'unknown')} bytes)"
        )
        
        # Track performance issues
        if process_time > 1.0:
            logger.warning(f"Slow request detected: {request_id} took {process_time:.4f}s")
            await track_performance_issue("slow_request", {
                "request_id": request_id,
                "path": path,
                "process_time": process_time,
                "method": method
            })
        
        # Track high memory usage if available
        if hasattr(request.state, 'memory_usage'):
            memory_mb = getattr(request.state, 'memory_usage', 0)
            if memory_mb > 100:  # 100MB threshold
                await track_performance_issue("high_memory", {
                    "request_id": request_id,
                    "path": path,
                    "memory_usage": memory_mb
                })
        
        return response
        
    except Exception as e:
        # Calculate processing time even for failed requests
        process_time = time.time() - start_time
        
        # Track failed request analytics
        await track_request_analytics({
            "request_id": request_id,
            "method": method,
            "path": path,
            "status_code": 500,
            "process_time": process_time,
            "client_ip": client_ip,
            "user_agent": user_agent,
            "referer": referer,
            "session_id": session_id,
            "query_params": query_params,
            "timestamp": datetime.now().isoformat(),
            "success": False,
            "error_message": str(e)
        })
        
        # Log failed request with enhanced details
        logger.error(
            f"Request {request_id} failed after {process_time:.4f}s: {str(e)} "
            f"(Path: {path}, IP: {client_ip})"
        )
        
        # Re-raise the exception
        raise


# Analytics tracking functions
async def track_request_analytics(data: dict):
    """Track request analytics data (async to avoid blocking)"""
    try:
        # In a production environment, this would send to a proper analytics service
        # For now, we'll just log structured data that can be collected by log aggregators
        logger.info(f"ANALYTICS_REQUEST: {data}")
        
        # Optional: Send to external analytics service
        # await send_to_analytics_service(data)
        
    except Exception as e:
        # Analytics should never break the main request flow
        logger.warning(f"Failed to track request analytics: {e}")


async def track_performance_issue(issue_type: str, data: dict):
    """Track performance issues for monitoring"""
    try:
        performance_data = {
            "type": "performance_issue",
            "issue_type": issue_type,
            "timestamp": datetime.now().isoformat(),
            **data
        }
        
        logger.warning(f"ANALYTICS_PERFORMANCE: {performance_data}")
        
        # Optional: Send to monitoring service like Sentry, DataDog, etc.
        # await send_to_monitoring_service(performance_data)
        
    except Exception as e:
        logger.warning(f"Failed to track performance issue: {e}")


async def track_user_engagement(data: dict):
    """Track user engagement metrics"""
    try:
        engagement_data = {
            "type": "user_engagement",
            "timestamp": datetime.now().isoformat(),
            **data
        }
        
        logger.info(f"ANALYTICS_ENGAGEMENT: {engagement_data}")
        
    except Exception as e:
        logger.warning(f"Failed to track user engagement: {e}")


# Rate limiting for analytics endpoints
analytics_rate_limit = {}
ANALYTICS_RATE_LIMIT_REQUESTS = 1000  # requests per minute
ANALYTICS_RATE_LIMIT_WINDOW = 60  # seconds

def check_analytics_rate_limit(client_ip: str) -> bool:
    """Check if client has exceeded analytics rate limit"""
    now = time.time()
    window_start = now - ANALYTICS_RATE_LIMIT_WINDOW
    
    # Clean old entries
    analytics_rate_limit[client_ip] = [
        timestamp for timestamp in analytics_rate_limit.get(client_ip, [])
        if timestamp > window_start
    ]
    
    # Check current rate
    current_requests = len(analytics_rate_limit.get(client_ip, []))
    
    if current_requests >= ANALYTICS_RATE_LIMIT_REQUESTS:
        return False
    
    # Add current request
    if client_ip not in analytics_rate_limit:
        analytics_rate_limit[client_ip] = []
    analytics_rate_limit[client_ip].append(now)
    
    return True

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
    data: Union[Dict[str, Any], List[Dict[str, Any]]]
    generator_used: Optional[str] = None
    generation_time: Optional[float] = None
    message: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    message: str
    version: str = "1.0.0"
    timestamp: str
    models_loaded: bool

class QuizSubmission(BaseModel):
    title: Optional[str] = None
    text: str
    questions: List[Dict[str, Any]]
    userId: Optional[str] = None
    createdAt: Optional[str] = None

# Initialize the generator factory with configurable thread pool
generator_factory = StatementGeneratorFactory(max_workers=MAX_WORKERS)

# Include analytics router
app.include_router(analytics_router)

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
        results = []
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
        
        # Use batch generation
        all_statements = await generator_factory.generate_batch_async(
            'gpt2',
            partial_sentences,
            request.sentences,
            request.num_statements
        )
        
        # Calculate elapsed time
        elapsed_time = time.time() - start_time
        
        # Format results
        for i, (sentence, partial, statements) in enumerate(zip(request.sentences, partial_sentences, all_statements)):
            results.append({
                "original_sentence": sentence,
                "partial_sentence": partial,
                "false_sentences": statements,
                "index": i
            })
            
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
    Generate Q&A format from input text using Claude.
    
    Example request:
    ```json
    {
        "text": "Musk has shown again he can influence the digital currency market...",
        "num_statements": 3
    }
    ```
    
    Example response:
    ```json
    {
        "success": true,
        "data": [
            {
                "original_sentence": "Complete sentence from text",
                "partial_sentence": "First part of sentence",
                "false_sentences": ["False option 1", "False option 2", "False option 3"]
            }
        ]
    }
    ```
    """
    try:
        # Log the incoming request for debugging
        logger.debug(f"Received request with text length: {len(request.text)}")
        logger.debug(f"Number of statements requested: {request.num_statements}")
        
        # Validate input
        if not request.text or len(request.text) < 10:
            logger.warning(f"Text too short: {len(request.text)} characters")
            raise HTTPException(status_code=400, detail="Text is too short")
            
        # Try to get Claude generator first
        generator = generator_factory.get_generator('claude')
        if generator is None:
            logger.warning("Claude generator not available, falling back to GPT-2")
            # Fallback to GPT-2 if Claude is not available
            generator = generator_factory.get_generator('gpt2')
            if generator is None:
                logger.error("No generators available")
                raise HTTPException(status_code=503, detail="No generators available")
            
        # Generate Q&A pairs
        logger.info(f"Generating Q&A with {generator.__class__.__name__}")
        start_time = time.time()
        qa_output = await generator.generate_qa_from_text_async(request.text, request.num_statements)
        generation_time = time.time() - start_time
        
        # Log the output for debugging
        logger.debug(f"Generated {len(qa_output) if isinstance(qa_output, list) else 0} questions in {generation_time:.2f}s")
        if isinstance(qa_output, list) and qa_output:
            logger.debug(f"First question sample: {qa_output[0] if qa_output else 'None'}")
        
        # Log the request in background
        background_tasks.add_task(
            log_qa_generation,
            request.text[:100] + "...",  # Log just the beginning for privacy
            len(qa_output) if isinstance(qa_output, list) else 0,
            generation_time
        )
        
        # Ensure the output is a proper list
        if qa_output is None:
            qa_output = []
        elif not isinstance(qa_output, list):
            logger.warning(f"Unexpected qa_output type: {type(qa_output)}")
            qa_output = [qa_output] if qa_output else []
            
        # Validate each item in the output
        validated_output = []
        for item in qa_output:
            # Ensure each item has the expected structure
            if isinstance(item, dict) and all(key in item for key in ['original_sentence', 'partial_sentence', 'false_sentences']):
                # Ensure false_sentences is a list
                if not isinstance(item['false_sentences'], list):
                    item['false_sentences'] = []
                validated_output.append(item)
            else:
                logger.warning(f"Skipping invalid item: {item}")
        
        # Format the response
        response_data = {
            "success": True,
            "data": validated_output,
            "generator_used": "claude" if generator.__class__.__name__ == "ClaudeFalseStatementGenerator" else "gpt2",
            "generation_time": generation_time,
            "message": None  # Explicitly set to None
        }
        
        # If the output is empty, add a message
        if not validated_output:
            logger.warning("Generated empty Q&A output")
            response_data["message"] = "No questions were generated. The text might be too short or not suitable for Q&A generation."
            
        logger.info(f"Returning response with {len(response_data['data'])} questions")
        
        # Print the exact response being returned
        import json
        logger.debug(f"Response JSON: {json.dumps(response_data)}")
        
        # Return with explicit content type
        return JSONResponse(
            content=response_data,
            status_code=200,
            headers={"Content-Type": "application/json"}
        )
            
    except HTTPException as e:
        logger.error(f"HTTP exception in generate_qa: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Error generating Q&A: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate Q&A: {str(e)}")

# Helper function for background task
async def log_qa_generation(text_preview: str, question_count: int, generation_time: float):
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

@app.post("/api/v2/quizzes", status_code=201)
async def save_quiz(quiz: QuizSubmission):
    """
    Save a generated quiz to a database (currently just returns success with mock ID)
    
    Example request:
    ```json
    {
        "title": "My Quiz",
        "text": "Original text content",
        "questions": [{"original_sentence": "...", "partial_sentence": "...", "false_sentences": ["...", "..."]}],
        "userId": "user123"
    }
    ```
    """
    try:
        # This is a mock implementation - in a real app, you would save to a database
        logger.info(f"Saving quiz with title: {quiz.title or 'Untitled'}")
        logger.info(f"Text length: {len(quiz.text)}, Questions: {len(quiz.questions)}")
        
        # Generate a mock ID
        quiz_id = str(uuid.uuid4())
        
        # Return success with the mock ID
        return {
            "id": quiz_id,
            "success": True,
            "message": "Quiz saved successfully"
        }
    except Exception as e:
        logger.error(f"Error saving quiz: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save quiz: {str(e)}")

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

@app.get("/test/qa", response_model=QAResponse)
async def test_qa_response():
    """
    Test endpoint that returns a hardcoded response matching the expected format.
    Use this to verify frontend parsing works correctly.
    """
    logger.info("Test QA endpoint called")
    
    # Return the exact format that should work with the frontend
    response_data = {
        "success": True,
        "data": [
            {
                "original_sentence": "Lamont Johnson",
                "partial_sentence": "Who directed the film 'My Sweet Charlie'?",
                "false_sentences": [
                    "Richard Levinson",
                    "David Westheimer"
                ]
            },
            {
                "original_sentence": "January 20, 1970",
                "partial_sentence": "When was 'My Sweet Charlie' first broadcast?",
                "false_sentences": [
                    "December 15, 1970",
                    "March 8, 1970"
                ]
            },
            {
                "original_sentence": "David Westheimer",
                "partial_sentence": "Who wrote the novel that 'My Sweet Charlie' was based on?",
                "false_sentences": [
                    "William Link",
                    "Lamont Johnson"
                ]
            },
            {
                "original_sentence": "Port Bolivar, Texas",
                "partial_sentence": "Where was 'My Sweet Charlie' filmed?",
                "false_sentences": [
                    "Port Arthur, Texas",
                    "Galveston, Texas"
                ]
            },
            {
                "original_sentence": "Universal Television",
                "partial_sentence": "Which company produced 'My Sweet Charlie'?",
                "false_sentences": [
                    "NBC Productions",
                    "Paramount Television"
                ]
            }
        ],
        "generator_used": "claude",
        "generation_time": 5.985682725906372,
        "message": None
    }
    
    # Return with explicit content type
    return JSONResponse(
        content=response_data,
        status_code=200,
        headers={"Content-Type": "application/json"}
    )

@app.get("/generate/simple-qa")
async def simple_qa():
    """
    Simple endpoint that returns a hardcoded response for testing.
    This is a GET endpoint with no parameters.
    """
    logger.info("Simple QA endpoint called")
    
    # Return the exact format that should work with the frontend
    response_data = {
        "success": True,
        "data": [
            {
                "original_sentence": "Lamont Johnson",
                "partial_sentence": "Who directed the film 'My Sweet Charlie'?",
                "false_sentences": [
                    "Richard Levinson",
                    "David Westheimer"
                ]
            },
            {
                "original_sentence": "January 20, 1970",
                "partial_sentence": "When was 'My Sweet Charlie' first broadcast?",
                "false_sentences": [
                    "December 15, 1970",
                    "March 8, 1970"
                ]
            },
            {
                "original_sentence": "David Westheimer",
                "partial_sentence": "Who wrote the novel that 'My Sweet Charlie' was based on?",
                "false_sentences": [
                    "William Link",
                    "Lamont Johnson"
                ]
            }
        ],
        "generator_used": "test",
        "generation_time": 0.1,
        "message": None
    }
    
    # Return directly as a dictionary, without JSONResponse
    return response_data

# Analytics endpoints
@app.post("/analytics/track")
async def track_analytics_event(request: Request, event_data: dict):
    """
    Generic analytics tracking endpoint for frontend events
    """
    client_ip = request.client.host if request.client else "unknown"
    
    # Check rate limit
    if not check_analytics_rate_limit(client_ip):
        raise HTTPException(
            status_code=429, 
            detail="Analytics rate limit exceeded"
        )
    
    try:
        # Extract session info
        session_id = request.headers.get("x-session-id", "")
        user_id = request.headers.get("x-user-id", "")
        
        # Enhanced event data
        enhanced_event = {
            **event_data,
            "client_ip": client_ip,
            "session_id": session_id,
            "user_id": user_id,
            "timestamp": datetime.now().isoformat(),
            "server_request_id": getattr(request.state, 'request_id', '')
        }
        
        # Track the event
        await track_user_engagement(enhanced_event)
        
        return {
            "success": True,
            "message": "Event tracked successfully",
            "event_id": str(uuid.uuid4())
        }
        
    except Exception as e:
        logger.error(f"Failed to track analytics event: {e}")
        raise HTTPException(status_code=500, detail="Failed to track event")

@app.post("/analytics/performance")
async def track_performance_metrics(request: Request, metrics_data: dict):
    """
    Endpoint for tracking performance metrics from frontend
    """
    client_ip = request.client.host if request.client else "unknown"
    
    # Check rate limit
    if not check_analytics_rate_limit(client_ip):
        raise HTTPException(
            status_code=429, 
            detail="Analytics rate limit exceeded"
        )
    
    try:
        # Extract performance metrics
        performance_metrics = {
            **metrics_data,
            "client_ip": client_ip,
            "timestamp": datetime.now().isoformat(),
            "server_request_id": getattr(request.state, 'request_id', '')
        }
        
        # Check for performance issues
        if metrics_data.get('lcp', 0) > 4000:  # Poor LCP
            await track_performance_issue("poor_lcp", performance_metrics)
        
        if metrics_data.get('cls', 0) > 0.25:  # Poor CLS
            await track_performance_issue("poor_cls", performance_metrics)
            
        if metrics_data.get('fid', 0) > 300:  # Poor FID
            await track_performance_issue("poor_fid", performance_metrics)
        
        # Track the metrics
        logger.info(f"ANALYTICS_PERFORMANCE_FRONTEND: {performance_metrics}")
        
        return {
            "success": True,
            "message": "Performance metrics tracked",
            "performance_score": calculate_performance_score(metrics_data)
        }
        
    except Exception as e:
        logger.error(f"Failed to track performance metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to track performance metrics")

@app.get("/analytics/status")
async def analytics_status():
    """
    Get analytics system status
    """
    return {
        "status": "operational",
        "version": "1.0.0",
        "endpoints": {
            "track": "/analytics/track",
            "performance": "/analytics/performance", 
            "status": "/analytics/status"
        },
        "rate_limits": {
            "requests_per_minute": ANALYTICS_RATE_LIMIT_REQUESTS,
            "window_seconds": ANALYTICS_RATE_LIMIT_WINDOW
        },
        "cors_origins": len(ANALYTICS_CORS_ORIGINS),
        "timestamp": datetime.now().isoformat()
    }

def calculate_performance_score(metrics: dict) -> int:
    """Calculate a performance score from 0-100 based on Web Vitals"""
    score = 100
    
    # LCP scoring (max 25 points deduction)
    lcp = metrics.get('lcp', 0)
    if lcp > 4000:
        score -= 25
    elif lcp > 2500:
        score -= 15
    
    # CLS scoring (max 25 points deduction)  
    cls = metrics.get('cls', 0)
    if cls > 0.25:
        score -= 25
    elif cls > 0.1:
        score -= 15
    
    # FID scoring (max 25 points deduction)
    fid = metrics.get('fid', 0)
    if fid > 300:
        score -= 25
    elif fid > 100:
        score -= 15
    
    # FCP scoring (max 25 points deduction)
    fcp = metrics.get('fcp', 0)
    if fcp > 3000:
        score -= 25
    elif fcp > 1800:
        score -= 15
    
    return max(0, score)

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
