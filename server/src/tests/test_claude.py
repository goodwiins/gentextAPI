#!/usr/bin/env python
"""
Test script for the Claude generator.
"""
import os
import sys
import logging
from generator_factory import StatementGeneratorFactory

# Configure debug logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_claude_generator():
    """Test the Claude generator's ability to generate false statements."""
    try:
        # Check environment variables
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            print("ERROR: ANTHROPIC_API_KEY environment variable not set.")
            return 1
            
        model = os.getenv("CLAUDE_MODEL")
        print(f"Using Claude model: {model}")
        
        # Initialize the generator factory
        print("Initializing generator factory...")
        factory = StatementGeneratorFactory()
        
        # Get the Claude generator
        print("Getting Claude generator...")
        generator = factory.get_generator('claude')
        
        if generator is None:
            print("ERROR: Failed to get Claude generator.")
            return 1
            
        print(f"Successfully initialized Claude generator using model: {model}")
        
        # Test with a sample sentence
        partial = "The technology company announced"
        full = "The technology company announced record profits for the third quarter."
        
        print(f"\nGenerating false statements for: '{full}'")
        print(f"Using partial sentence: '{partial}'")
        
        # Generate false statements
        statements = generator.generate_false_statements(partial, full, 3)
        
        print("\nGenerated statements:")
        for i, statement in enumerate(statements, 1):
            print(f"{i}. {statement}")
            
        return 0
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(test_claude_generator()) 