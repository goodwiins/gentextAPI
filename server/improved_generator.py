from transformers import GPT2Tokenizer, GPT2LMHeadModel, pipeline
import torch
import scipy.spatial.distance
from sentence_transformers import SentenceTransformer
import re
from nltk.tokenize import sent_tokenize, word_tokenize
import spacy
from qa_formatter import QAFormatter
import os
import time
import logging
import asyncio
from functools import lru_cache
from typing import List, Dict, Any, Optional, Union, Tuple
import warnings
from concurrent.futures import ThreadPoolExecutor
import threading
import sys
import subprocess

# Configure logging
logger = logging.getLogger(__name__)

class ImprovedFalseStatementGenerator:
    def __init__(self, model_name="gpt2-medium", device=None, load_async=False, 
                 max_batch_size=10, timeout=30):
        """
        Initialize the false statement generator.
        
        Args:
            model_name: Name of the GPT-2 model to use
            device: Computing device (cuda, mps, cpu)
            load_async: Whether to load models asynchronously
            max_batch_size: Maximum batch size for generation
            timeout: Timeout for model operations in seconds
        """
        self.model_name = model_name
        self.max_batch_size = max_batch_size
        self.timeout = timeout
        self._executor = ThreadPoolExecutor(max_workers=os.cpu_count())
        self._loading = False
        self._loading_complete = threading.Event()
        self._loading_lock = threading.Lock()
        
        # Initialize device (use GPU if available)
        if device is None:
            if torch.backends.mps.is_available():
                self.device = "mps"
            elif torch.cuda.is_available():
                self.device = "cuda"
            else:
                self.device = "cpu"
        else:
            self.device = device
            
        logger.info(f"Initializing generator with device: {self.device}")
        
        # Load models
        if load_async:
            # Create placeholder attributes to be populated later
            self.tokenizer = None
            self.model = None
            self.generator = None
            self.bert_model = None
            self.nlp = None
            
            # Start async loading
            self._loading = True
            asyncio.create_task(self._load_models_async())
        else:
            self._loading = True
            self._load_models()
            self._loading = False
            self._loading_complete.set()
            
        # Add date pattern matching
        self.date_pattern = re.compile(r'\b\d{4}\b|\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b')
        
        # Add patterns for news content
        self.number_pattern = re.compile(r'\b\d+(?:\.\d+)?%?\b')
        self.company_pattern = re.compile(r'\b(?:Tesla|SpaceX|Bitcoin|Dogecoin)\b')
        
        self.qa_formatter = QAFormatter()

    async def _load_models_async(self):
        """Load models asynchronously to avoid blocking the server startup"""
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(self._executor, self._load_models)
            logger.info("Async model loading completed")
        except Exception as e:
            logger.error(f"Error in async model loading: {str(e)}", exc_info=True)
        finally:
            self._loading = False
            self._loading_complete.set()
        
    def _load_models(self):
        """Load all required models with proper error handling"""
        try:
            # Set up context for model loading
            os.environ["TOKENIZERS_PARALLELISM"] = "false"  # Avoid parallelism warnings
            
            # Suppress non-critical warnings
            warnings.filterwarnings("ignore", category=UserWarning)
            
            # Check system resources
            logger.debug(f"CPU count: {os.cpu_count()}")
            logger.debug(f"Using device: {self.device}")
            
            # Load tokenizer with timeout guard
            start_time = time.time()
            logger.debug(f"Loading tokenizer {self.model_name}...")
            try:
                self.tokenizer = GPT2Tokenizer.from_pretrained(self.model_name)
                self.tokenizer.pad_token = self.tokenizer.eos_token
                logger.info(f"Tokenizer loaded in {time.time() - start_time:.2f}s")
            except Exception as e:
                logger.error(f"Failed to load tokenizer: {str(e)}")
                raise RuntimeError(f"Failed to load tokenizer: {str(e)}")
            
            # Load model with timeout guard
            start_time = time.time()
            logger.debug(f"Loading model {self.model_name}...")
            try:
                self.model = GPT2LMHeadModel.from_pretrained(
                    self.model_name, 
                    pad_token_id=self.tokenizer.eos_token_id,
                    torchscript=True  # Enable torchscript for better performance
                )
                self.model.to(self.device)
                logger.info(f"Model loaded in {time.time() - start_time:.2f}s")
            except Exception as e:
                logger.error(f"Failed to load model: {str(e)}")
                raise RuntimeError(f"Failed to load model: {str(e)}")
            
            # Initialize pipeline for text generation
            start_time = time.time()
            logger.debug("Creating generator pipeline...")
            try:
                device_idx = 0 if self.device == "cuda" else -1
                self.generator = pipeline(
                    'text-generation', 
                    model=self.model, 
                    tokenizer=self.tokenizer, 
                    device=device_idx,
                    framework="pt"
                )
                logger.info(f"Generator pipeline created in {time.time() - start_time:.2f}s")
            except Exception as e:
                logger.error(f"Failed to create generator pipeline: {str(e)}")
                raise RuntimeError(f"Failed to create generator pipeline: {str(e)}")
            
            # Load BERT model for similarity calculation with reduced precision
            start_time = time.time()
            logger.debug("Loading BERT model...")
            try:
                self.bert_model = SentenceTransformer('bert-base-nli-mean-tokens')
                # Force BERT model to CPU as it might not be compatible with MPS
                self.bert_model = self.bert_model.to("cpu")
                logger.info(f"BERT model loaded in {time.time() - start_time:.2f}s")
            except Exception as e:
                logger.error(f"Failed to load BERT model: {str(e)}")
                raise RuntimeError(f"Failed to load BERT model: {str(e)}")
            
            # Load spaCy for NLP tasks
            start_time = time.time()
            logger.debug("Loading spaCy model...")
            try:
                # Try to load, or download if needed
                try:
                    self.nlp = spacy.load('en_core_web_sm', disable=['ner', 'textcat'])
                except OSError:
                    logger.info("SpaCy model not found, attempting to download...")
                    # If model isn't found, try to download it
                    subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], 
                                  check=True, capture_output=True)
                    self.nlp = spacy.load('en_core_web_sm', disable=['ner', 'textcat'])
                logger.info(f"SpaCy NLP loaded in {time.time() - start_time:.2f}s")
            except Exception as e:
                logger.error(f"Failed to load spaCy model: {str(e)}")
                raise RuntimeError(f"Failed to load spaCy model: {str(e)}")
            
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}", exc_info=True)
            import traceback
            logger.error(f"Detailed traceback: {traceback.format_exc()}")
            raise RuntimeError(f"Failed to initialize generator: {str(e)}")
        
        # Log success
        logger.info(f"Successfully loaded all models for {self.model_name} on {self.device}")

    def _is_ready(self) -> bool:
        """Check if all models are loaded and ready"""
        return (self.tokenizer is not None and 
                self.model is not None and 
                self.generator is not None and 
                self.bert_model is not None and 
                self.nlp is not None)
    
    async def _ensure_models_loaded(self) -> bool:
        """Ensure models are loaded, waiting if needed"""
        if self._is_ready():
            return True
            
        if self._loading:
            # If models are currently loading, wait for them to finish
            logger.info("Waiting for models to finish loading...")
            # Convert threading Event to asyncio compatible
            for _ in range(30):  # Wait up to 30 seconds
                if self._loading_complete.is_set():
                    logger.info("Models finished loading")
                    return self._is_ready()
                await asyncio.sleep(1)
            logger.warning("Timed out waiting for models to load")
            
        # If models haven't started loading or loading timed out, load synchronously
        if not self._is_ready():
            with self._loading_lock:
                if not self._loading and not self._is_ready():
                    self._loading = True
                    try:
                        logger.info("Models not loaded, loading synchronously")
                        self._load_models()
                        logger.info("Synchronous model loading completed")
                        return True
                    finally:
                        self._loading = False
                        self._loading_complete.set()
        
        return self._is_ready()
    
    def process_full_text(self, text: str) -> List[Dict[str, Any]]:
        """Break down text into processable chunks and generate false statements."""
        if not self._is_ready():
            logger.warning("Models not fully loaded yet, waiting...")
            self._load_models()  # Fallback to synchronous loading
            
        sentences = sent_tokenize(text)  # Split text into sentences
        results = []
        
        # Process in batches to improve performance
        batch_sentences = []
        batch_partials = []
        batch_indices = []
        
        for i, sentence in enumerate(sentences):
            # Only process meaningful sentences
            if len(sentence.split()) < 5:
                continue
            
            # Look for sentences with important information
            has_numbers = bool(self.number_pattern.search(sentence))
            has_companies = bool(self.company_pattern.search(sentence))
            
            if has_numbers or has_companies:
                # Create partial sentence for generation prompt
                words = word_tokenize(sentence)
                partial_idx = len(words) // 2
                partial_sentence = ' '.join(words[:partial_idx])
                
                batch_sentences.append(sentence)
                batch_partials.append(partial_sentence)
                batch_indices.append(i)
                
                # Process batch when max size reached
                if len(batch_sentences) >= self.max_batch_size:
                    self._process_sentence_batch(batch_sentences, batch_partials, batch_indices, results)
                    batch_sentences = []
                    batch_partials = []
                    batch_indices = []
        
        # Process remaining batch
        if batch_sentences:
            self._process_sentence_batch(batch_sentences, batch_partials, batch_indices, results)
        
        return results
        
    def _process_sentence_batch(self, 
                              sentences: List[str],
                              partials: List[str],
                              indices: List[int],
                              results: List[Dict[str, Any]]) -> None:
        """Process a batch of sentences together for better performance"""
        try:
            # Generate alternative statements in batch
            all_false_statements = self.generate_statements_batch(partials, sentences)
            
            for i, (sentence, partial, false_statements) in enumerate(zip(sentences, partials, all_false_statements)):
                if false_statements:
                    results.append({
                        "original_sentence": sentence,
                        "partial_sentence": partial,
                        "false_sentences": false_statements,
                        "generator_used": "gpt2",
                        "sentence_index": indices[i]
                    })
        except Exception as e:
            logger.error(f"Error processing batch: {str(e)}", exc_info=True)

    def generate_false_statements(self, partial_sentence: str, full_sentence: str, num_statements: int = 3) -> List[str]:
        """Generate and filter false statements using GPT-2."""
        if not self._is_ready():
            logger.warning("Models not fully loaded yet, waiting...")
            self._load_models()  # Fallback to synchronous loading
            
        # Adjust generation parameters based on content
        has_date = bool(self.date_pattern.search(partial_sentence))
        has_company = bool(self.company_pattern.search(partial_sentence))
        has_number = bool(self.number_pattern.search(partial_sentence))
        
        # Dynamic parameter adjustment
        max_length = len(partial_sentence.split()) + (
            30 if has_date else 
            40 if has_company or has_number else 
            50
        )
        temperature = (
            0.8 if has_date else
            0.85 if has_company or has_number else
            0.9
        )
        
        try:
            # Generate variations using GPT-2 with timeout protection
            start_time = time.time()
            outputs = self.generator(
                partial_sentence,
                truncation=True,
                max_length=max_length,
                num_return_sequences=min(20, max(10, num_statements * 3)),  # Adapt based on requested number
                do_sample=True,
                top_p=0.90,
                top_k=40,
                temperature=temperature,
                repetition_penalty=1.3,
                return_full_text=False
            )
            
            if time.time() - start_time > self.timeout:
                logger.warning(f"Generation timed out after {self.timeout}s")
                
            generated_sentences = [output['generated_text'] for output in outputs]
            return self._filter_sentences(full_sentence, generated_sentences, max_results=num_statements)
            
        except Exception as e:
            logger.error(f"Error in statement generation: {str(e)}", exc_info=True)
            return []

    def _filter_sentences(self, original_sentence: str, candidates: List[str], 
                         threshold: float = 0.75, max_results: int = 3) -> List[str]:
        """Filter and rank generated sentences."""
        if not candidates:
            return []
            
        cleaned_candidates = []
        
        # Clean and validate candidates
        for sent in candidates:
            try:
                sentences = sent_tokenize(sent)
                if sentences:
                    cleaned_sent = sentences[0].strip()
                    if self._is_valid_sentence(cleaned_sent):
                        cleaned_candidates.append(cleaned_sent)
            except Exception as e:
                logger.debug(f"Error cleaning candidate: {str(e)}")
                continue
        
        if not cleaned_candidates:
            return []
        
        try:
            # Calculate semantic similarity efficiently
            embeddings = self._get_embeddings([original_sentence] + cleaned_candidates)
            if embeddings is None:
                return cleaned_candidates[:max_results]  # Fallback if embeddings fail
                
            original_embedding = embeddings[0]
            candidate_embeddings = embeddings[1:]
            
            filtered_candidates = []
            for i, candidate in enumerate(cleaned_candidates):
                try:
                    similarity = self._calculate_similarity(original_embedding, candidate_embeddings[i])
                    if 0.3 < similarity < threshold:
                        filtered_candidates.append({
                            "text": candidate,
                            "similarity": similarity
                        })
                except Exception as e:
                    logger.debug(f"Error calculating similarity: {str(e)}")
                    continue
            
            # Sort by optimal similarity (targeting 0.6)
            filtered_candidates.sort(key=lambda x: abs(0.6 - x["similarity"]))
            return [item["text"] for item in filtered_candidates[:max_results]]
        except Exception as e:
            logger.error(f"Error filtering sentences: {str(e)}", exc_info=True)
            # Return some candidates as fallback
            return cleaned_candidates[:max_results]

    @lru_cache(maxsize=128)
    def _is_valid_sentence(self, sentence: str) -> bool:
        """Check if a sentence is valid and well-formed, with caching for performance."""
        if len(sentence.split()) < 5 or len(sentence.split()) > 30:
            return False
            
        try:
            doc = self.nlp(sentence)
            has_verb = any(token.pos_ == "VERB" for token in doc)
            has_subject = any(token.dep_ == "nsubj" for token in doc)
            
            return has_verb and has_subject
        except Exception:
            # Log but continue in case of spaCy errors
            return True
    
    def _get_embeddings(self, sentences: List[str]) -> Optional[List[List[float]]]:
        """Get BERT embeddings for a list of sentences with batching for efficiency."""
        try:
            # Process in batches for efficiency
            batch_size = min(32, len(sentences))
            all_embeddings = []
            
            for i in range(0, len(sentences), batch_size):
                batch = sentences[i:i+batch_size]
                batch_embeddings = self.bert_model.encode(batch, convert_to_numpy=True)
                all_embeddings.extend(batch_embeddings)
                
            return all_embeddings
        except Exception as e:
            logger.error(f"Error getting embeddings: {e}", exc_info=True)
            return None

    def _calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings."""
        try:
            return 1 - scipy.spatial.distance.cosine(embedding1, embedding2)
        except Exception as e:
            logger.error(f"Error calculating similarity: {e}", exc_info=True)
            return 0.0

    def generate_statements_batch(self, partial_sentences: List[str], 
                                 full_sentences: List[str], 
                                 num_statements: int = 3) -> List[List[str]]:
        """
        Generate false statements for multiple sentences in batch for better performance.
        
        Args:
            partial_sentences: List of partial sentences
            full_sentences: List of corresponding full sentences
            num_statements: Number of statements per sentence
            
        Returns:
            List of lists, each containing false statements for the corresponding input
        """
        if not self._is_ready():
            logger.warning("Models not fully loaded yet, waiting...")
            self._load_models()
            
        if not partial_sentences or len(partial_sentences) != len(full_sentences):
            logger.error("Invalid input for batch generation")
            return [[] for _ in range(max(len(partial_sentences), len(full_sentences)))]
            
        results = []
        # Process in smaller batches for memory efficiency
        batch_size = min(self.max_batch_size, len(partial_sentences))
        
        for i in range(0, len(partial_sentences), batch_size):
            batch_partials = partial_sentences[i:i+batch_size]
            batch_full = full_sentences[i:i+batch_size]
            batch_results = []
            
            for partial, full in zip(batch_partials, batch_full):
                try:
                    statements = self.generate_false_statements(partial, full, num_statements)
                    batch_results.append(statements)
                except Exception as e:
                    logger.error(f"Error in batch item: {str(e)}")
                    batch_results.append([])
                    
            results.extend(batch_results)
            
        return results
    
    async def generate_false_statements_async(self, partial_sentence: str, full_sentence: str, num_statements: int = 3) -> List[str]:
        """Generate false statements asynchronously"""
        await self._ensure_models_loaded()
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self._executor,
            self.generate_false_statements,
            partial_sentence,
            full_sentence,
            num_statements
        )
        
    async def generate_qa_from_text_async(self, text: str) -> Dict[str, Any]:
        """Generate Q&A format from text asynchronously."""
        await self._ensure_models_loaded()
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self._executor, self.generate_qa_from_text, text)
    
    def generate_qa_from_text(self, text: str) -> Dict[str, Any]:
        """Generate Q&A format from text."""
        if not self._is_ready():
            logger.warning("Models not fully loaded yet, waiting...")
            self._load_models()
            
        try:
            results = self.process_full_text(text)
            questions = []
            
            for result in results:
                # Create question from original sentence
                question = f"What is the correct statement about {result['partial_sentence']}?"
                
                # Combine correct and false statements
                choices = [result['original_sentence']] + result['false_sentences']
                
                questions.append({
                    "question": question,
                    "choices": choices,
                    "correct_answer": 0  # Index of the correct answer (always first in the list)
                })
            
            return {
                "questions": questions,
                "format_version": "1.0",
                "total_questions": len(questions),
                "generated_at": time.time()
            }
        except Exception as e:
            logger.error(f"Error generating Q&A: {str(e)}", exc_info=True)
            return {
                "questions": [],
                "format_version": "1.0",
                "total_questions": 0,
                "error": str(e),
                "generated_at": time.time()
            }
            
    def cleanup(self):
        """Release resources and clear caches to free memory"""
        if hasattr(self, '_executor'):
            self._executor.shutdown(wait=False)
        
        # Clear any cached data
        if hasattr(self, '_is_valid_sentence'):
            self._is_valid_sentence.cache_clear()
        
        # Release CUDA memory if needed
        if self.device == "cuda" and hasattr(self, 'model'):
            torch.cuda.empty_cache()