#!/usr/bin/env python3
"""
Simple test for xAI Grok integration
"""
import os
import sys
sys.path.append('/app')

from src.generators.grok_generator import XAIGrokFalseStatementGenerator

# Set API key
os.environ['OPENROUTE_API_KEY'] = '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'

try:
    # Test direct generator
    generator = XAIGrokFalseStatementGenerator()
    
    # Test 1: Basic false statement generation
    result = generator.generate_false_statements(
        "The Earth revolves around", 
        "The Earth revolves around the Sun", 
        2
    )
    
    print(f"✅ Test 1 - Generated {len(result)} false statements:")
    for statement in result:
        print(f"   - {statement}")
    
    # Test 2: Different topic
    result2 = generator.generate_false_statements(
        "Water boils at", 
        "Water boils at 100 degrees Celsius", 
        2
    )
    
    print(f"✅ Test 2 - Generated {len(result2)} false statements:")
    for statement in result2:
        print(f"   - {statement}")
    
    print(f"🎉 All tests passed! xAI Grok integration working correctly.")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()