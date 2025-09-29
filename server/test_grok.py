#!/usr/bin/env python3
"""
Test script to verify xAI Grok integration with OpenRoute API
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.generators.grok_generator import XAIGrokFalseStatementGenerator
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_grok_generator():
    """Test the xAI Grok generator"""
    try:
        # Check if API key is set
        api_key = os.getenv("OPENROUTE_API_KEY")
        if not api_key:
            logger.error("OPENROUTE_API_KEY environment variable not set")
            return False
            
        logger.info("Testing xAI Grok generator...")
        
        # Initialize the generator
        generator = XAIGrokFalseStatementGenerator()
        
        # Test data
        partial_sentence = "The Earth revolves around"
        full_sentence = "The Earth revolves around the Sun"
        
        # Generate false statements
        false_statements = generator.generate_false_statements(
            partial_sentence, 
            full_sentence, 
            num_statements=3
        )
        
        logger.info(f"Generated {len(false_statements)} false statements:")
        for i, statement in enumerate(false_statements, 1):
            logger.info(f"  {i}. {statement}")
        
        # Verify results
        if len(false_statements) == 3:
            logger.info("✅ xAI Grok integration test successful!")
            return True
        else:
            logger.error(f"❌ Expected 3 statements, got {len(false_statements)}")
            return False
            
    except Exception as e:
        logger.error(f"❌ xAI Grok integration test failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_grok_generator()
    sys.exit(0 if success else 1)