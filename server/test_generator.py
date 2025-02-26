from improved_generator import ImprovedFalseStatementGenerator

def test_generator():
    # Initialize the generator
    generator = ImprovedFalseStatementGenerator(model_name="gpt2-medium")
    
    # Test with a simple example
    partial_sentence = "Climate change is causing"
    full_sentence = "Climate change is causing sea levels to rise around the world."
    
    print(f"Partial sentence: {partial_sentence}")
    print(f"Full sentence: {full_sentence}")
    print("\nGenerated false statements:")
    
    false_statements = generator.generate_false_statements(
        partial_sentence, 
        full_sentence,
        num_statements=3
    )
    
    for i, statement in enumerate(false_statements, 1):
        print(f"{i}. {statement}")

if __name__ == "__main__":
    test_generator()