# services/generator_factory.py
import logging
from improved_generator import ImprovedFalseStatementGenerator
from paraphraser import T5Paraphraser

logger = logging.getLogger(__name__)

class StatementGeneratorFactory:
    """
    Factory class to provide different statement generation strategies.
    This allows the application to choose between different generation approaches.
    """
    
    def __init__(self):
        """Initialize the generator factory with available generators."""
        self.generators = {}
        
        # Initialize the GPT-2 generator
        try:
            logger.info("Initializing GPT-2 generator...")
            self.generators['gpt2'] = ImprovedFalseStatementGenerator(model_name="gpt2-medium")
            logger.info("GPT-2 generator initialized")
        except Exception as e:
            logger.error(f"Failed to initialize GPT-2 generator: {str(e)}")
        
        # Initialize the T5 paraphraser 
        try:
            logger.info("Initializing T5 paraphraser...")
            self.generators['t5'] = T5Paraphraser()
            logger.info("T5 paraphraser initialized")
        except Exception as e:
            logger.error(f"Failed to initialize T5 paraphraser: {str(e)}")
    
    def get_generator(self, generator_type='gpt2'):
        """
        Get a generator of the specified type.
        
        Args:
            generator_type: Type of generator to use ('gpt2' or 't5')
            
        Returns:
            The requested generator instance
        """
        if generator_type in self.generators:
            return self.generators[generator_type]
        else:
            # Default to GPT-2 if the requested type is not available
            logger.warning(f"Generator type '{generator_type}' not found, using default")
            return self.generators.get('gpt2', None)
    
    def generate_false_statements(self, generator_type, partial_sentence, full_sentence, num_statements=3):
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
            
        if generator_type == 'gpt2':
            return generator.generate_false_statements(
                partial_sentence, 
                full_sentence, 
                num_statements=num_statements
            )
        elif generator_type == 't5':
            return generator.generate_false_statement(
                full_sentence,
                partial_text=partial_sentence,
                num_candidates=num_statements + 2  # Generate a few extra for diversity
            )
        else:
            logger.error(f"Unknown generator type: {generator_type}")
            return []
