# services/generator_factory.py
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Optional, Union, Any
from functools import lru_cache
import os
from src.generators.improved_generator import ImprovedFalseStatementGenerator
from src.generators.claude_generator import ClaudeFalseStatementGenerator

logger = logging.getLogger(__name__)

class StatementGeneratorFactory:
    """
    Factory class to provide statement generation strategies.
    Currently supports GPT-2 and Claude based generation.
    """
    
    def __init__(self, max_workers: int = None, model_cache_size: int = 2):
        """
        Initialize the generator factory with available generators.
        
        Args:
            max_workers (int, optional): Maximum number of worker threads for concurrent operations
            model_cache_size (int, optional): Number of models to cache in memory
        """
        self.generators: Dict[str, Any] = {}
        self.executor = ThreadPoolExecutor(max_workers=max_workers or os.cpu_count())
        self._model_cache_size = model_cache_size
        
        # Initialize the generators
        self._init_generators()
    
    def _init_generators(self) -> None:
        """Initialize available generators with error handling"""
        # Initialize the GPT-2 generator
        try:
            logger.info("Initializing GPT-2 generator...")
            # Print the model directory to help debug
            cache_dir = os.path.expanduser("~/.cache/huggingface")
            logger.debug(f"HuggingFace cache directory: {cache_dir}")
            logger.debug(f"Cache directory exists: {os.path.exists(cache_dir)}")
            if os.path.exists(cache_dir):
                logger.debug(f"Cache contents: {os.listdir(cache_dir)}")
                
            self.generators['gpt2'] = ImprovedFalseStatementGenerator(
                model_name="gpt2-medium", 
                device=os.getenv("MODEL_DEVICE", None)
            )
            logger.info("GPT-2 generator initialized successfully on device: %s", 
                       self.generators['gpt2'].device)
        except Exception as e:
            logger.error(f"Failed to initialize GPT-2 generator: {str(e)}", exc_info=True)
            # Print more details about the error
            import traceback
            logger.error(f"Detailed traceback: {traceback.format_exc()}")
            logger.error(f"Error type: {type(e).__name__}")
            # Try to initialize with a smaller model as fallback
            try:
                logger.info("Attempting fallback to smaller gpt2 model...")
                self.generators['gpt2'] = ImprovedFalseStatementGenerator(
                    model_name="gpt2", 
                    device="cpu"
                )
                logger.info("Fallback to smaller model successful")
            except Exception as e2:
                logger.error(f"Fallback initialization also failed: {str(e2)}")
                # We'll leave self.generators['gpt2'] unset
                
        # Initialize the Claude generator
        try:
            logger.info("Initializing Claude generator...")
            self.generators['claude'] = ClaudeFalseStatementGenerator()
            logger.info("Claude generator initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Claude generator: {str(e)}", exc_info=True)
            # Print more details about the error
            import traceback
            logger.error(f"Detailed traceback: {traceback.format_exc()}")
            logger.error(f"Error type: {type(e).__name__}")
            # We'll leave self.generators['claude'] unset
    
    @lru_cache(maxsize=32)
    def get_generator(self, generator_type: str = 'gpt2') -> Optional[ImprovedFalseStatementGenerator]:
        """
        Get a generator of the specified type with caching for frequent requests.
        
        Args:
            generator_type: Type of generator to use (currently only 'gpt2')
            
        Returns:
            The requested generator instance or None if unavailable
        """
        if generator_type in self.generators:
            return self.generators[generator_type]
        else:
            logger.warning(f"Generator type '{generator_type}' not found, using default")
            return self.generators.get('gpt2', None)
    
    def generate_false_statements(
        self, 
        generator_type: str, 
        partial_sentence: str, 
        full_sentence: str, 
        num_statements: int = 3
    ) -> List[str]:
        """
        Generate false statements using the specified generator type.
        
        Args:
            generator_type: Type of generator to use
            partial_sentence: Partial sentence for GPT-2 generation
            full_sentence: Original complete sentence
            num_statements: Number of statements to generate
            
        Returns:
            List of false statements
        """
        generator = self.get_generator(generator_type)
        
        if generator is None:
            logger.error("No generator available")
            return []
            
        try:
            return generator.generate_false_statements(
                partial_sentence, 
                full_sentence, 
                num_statements=num_statements
            )
        except Exception as e:
            logger.error(f"Error generating false statements: {str(e)}", exc_info=True)
            return []
    
    async def generate_false_statements_async(
        self, 
        generator_type: str, 
        partial_sentence: str, 
        full_sentence: str, 
        num_statements: int = 3
    ) -> List[str]:
        """
        Generate false statements asynchronously using the specified generator type.
        
        Args:
            generator_type: Type of generator to use
            partial_sentence: Partial sentence for GPT-2 generation
            full_sentence: Original complete sentence
            num_statements: Number of statements to generate
            
        Returns:
            List of false statements
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor, 
            self.generate_false_statements,
            generator_type, 
            partial_sentence, 
            full_sentence, 
            num_statements
        )
    
    async def generate_batch_async(
        self,
        generator_type: str,
        partial_sentences: List[str],
        full_sentences: List[str],
        num_statements: int = 3
    ) -> List[List[str]]:
        """
        Generate false statements for multiple sentences concurrently.
        
        Args:
            generator_type: Type of generator to use
            partial_sentences: List of partial sentences
            full_sentences: List of corresponding full sentences
            num_statements: Number of statements to generate for each sentence
            
        Returns:
            List of lists, each containing false statements for the corresponding input
        """
        generator = self.get_generator(generator_type)
        if generator is None:
            logger.error("No generator available for batch processing")
            return [[] for _ in partial_sentences]
        
        try:
            # Check if models are ready
            if hasattr(generator, '_ensure_models_loaded'):
                try:
                    await generator._ensure_models_loaded()
                except Exception as e:
                    logger.error(f"Error ensuring models are loaded: {str(e)}", exc_info=True)
            
            # Use the batch method if available on the generator
            if hasattr(generator, 'generate_statements_batch'):
                try:
                    # Start a task with timeout protection
                    loop = asyncio.get_event_loop()
                    batch_task = loop.run_in_executor(
                        self.executor,
                        generator.generate_statements_batch,
                        partial_sentences,
                        full_sentences,
                        num_statements
                    )
                    
                    # Apply timeout - 30 seconds per sentence, minimum 60 seconds
                    timeout = max(60, len(partial_sentences) * 30)
                    try:
                        return await asyncio.wait_for(batch_task, timeout=timeout)
                    except asyncio.TimeoutError:
                        logger.error(f"Batch generation timed out after {timeout}s")
                        # Return partial results if available, empty lists otherwise
                        return [[] for _ in partial_sentences]
                        
                except Exception as e:
                    logger.error(f"Error in batch executor: {str(e)}", exc_info=True)
                    return [[] for _ in partial_sentences]
            
            # Otherwise process concurrently
            tasks = []
            for partial, full in zip(partial_sentences, full_sentences):
                task = self.generate_false_statements_async(
                    generator_type, partial, full, num_statements
                )
                tasks.append(task)
            
            # Use gather with return_exceptions to handle errors gracefully
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results, handling any exceptions
            processed_results = []
            for result in results:
                if isinstance(result, Exception):
                    logger.error(f"Error in batch item: {str(result)}")
                    processed_results.append([])
                else:
                    processed_results.append(result)
                    
            return processed_results
            
        except Exception as e:
            logger.error(f"Error in batch generation: {str(e)}", exc_info=True)
            return [[] for _ in partial_sentences]
            
    def shutdown(self):
        """Properly shut down resources to prevent hanging connections"""
        logger.info("Shutting down generator factory resources")
        self.executor.shutdown(wait=True)
