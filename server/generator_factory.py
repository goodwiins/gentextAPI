import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Optional, Union, Any
from functools import lru_cache
import os
from improved_generator import ImprovedFalseStatementGenerator
from claude_generator import ClaudeFalseStatementGenerator  # Import the Claude generator

logger = logging.getLogger(__name__)

class StatementGeneratorFactory:
    """
    Factory class to provide statement generation strategies.
    Supports both GPT-2 and Claude-based generation.
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
            self.generators['gpt2'] = ImprovedFalseStatementGenerator(
                model_name="gpt2-medium", 
                device=os.getenv("MODEL_DEVICE", None)
            )
            logger.info("GPT-2 generator initialized successfully on device: %s", 
                       self.generators['gpt2'].device)
        except Exception as e:
            logger.error(f"Failed to initialize GPT-2 generator: {str(e)}", exc_info=True)
        
        # Initialize the Claude generator
        try:
            logger.info("Initializing Claude generator...")
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if api_key:
                model = os.getenv("CLAUDE_MODEL", "claude-3-7-sonnet-20250219")
                self.generators['claude'] = ClaudeFalseStatementGenerator(
                    model_name=model,
                    api_key=api_key
                )
                logger.info(f"Claude generator initialized successfully with model: {model}")
            else:
                logger.warning("ANTHROPIC_API_KEY not found, Claude generator not initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Claude generator: {str(e)}", exc_info=True)
            
    @lru_cache(maxsize=32)
    def get_generator(self, generator_type: str = 'claude') -> Optional[Union[ImprovedFalseStatementGenerator, ClaudeFalseStatementGenerator]]:
        """
        Get a generator of the specified type with caching for frequent requests.
        
        Args:
            generator_type: Type of generator to use ('gpt2' or 'claude')
            
        Returns:
            The requested generator instance or None if unavailable
        """
        if generator_type in self.generators:
            return self.generators[generator_type]
        else:
            # Try claude first, then fall back to gpt2
            logger.warning(f"Generator type '{generator_type}' not found, trying default generators")
            return self.generators.get('claude', self.generators.get('gpt2', None))
    
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
            partial_sentence: Partial sentence for generation
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
            partial_sentence: Partial sentence for generation
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
                    # For Claude, we might need longer timeouts
                    timeout = max(120, len(partial_sentences) * 45)
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