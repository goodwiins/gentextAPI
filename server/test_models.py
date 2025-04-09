#!/usr/bin/env python
"""
Simple script to test the loading of transformer models directly.
"""
import os
import sys
import logging
import traceback

# Configure debug logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Test loading of the models one by one to isolate issues"""
    try:
        print("Testing import of transformers library...")
        from transformers import GPT2Tokenizer, GPT2LMHeadModel, pipeline
        print("✓ Successfully imported transformers")
        
        # Check for CUDA
        import torch
        print(f"CUDA available: {torch.cuda.is_available()}")
        print(f"MPS available: {torch.backends.mps.is_available() if hasattr(torch.backends, 'mps') else 'N/A'}")
        
        # Set device
        device = "cpu"  # Force CPU for testing
        print(f"Using device: {device}")
        
        # Test GPT2 tokenizer
        print("Loading GPT2 tokenizer...")
        tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
        tokenizer.pad_token = tokenizer.eos_token
        print("✓ Successfully loaded tokenizer")
        
        # Test GPT2 model (small)
        print("Loading GPT2 model...")
        model = GPT2LMHeadModel.from_pretrained("gpt2")
        model.to(device)
        print("✓ Successfully loaded model")
        
        # Test pipeline
        print("Creating text generation pipeline...")
        generator = pipeline('text-generation', model=model, tokenizer=tokenizer, device=-1)
        print("✓ Successfully created pipeline")
        
        # Test generation
        print("Testing text generation...")
        prompt = "Once upon a time"
        outputs = generator(prompt, max_length=20, num_return_sequences=1)
        print(f"Generated: {outputs[0]['generated_text']}")
        
        print("\nAll transformer model tests passed!")
        
        # Test BERT model
        print("\nTesting BERT model (SentenceTransformer)...")
        try:
            from sentence_transformers import SentenceTransformer
            print("Loading BERT model...")
            bert_model = SentenceTransformer('bert-base-nli-mean-tokens')
            bert_model = bert_model.to("cpu")
            print("✓ Successfully loaded BERT model")
            
            # Test encoding
            test_sentence = "This is a test sentence for encoding."
            print("Testing sentence encoding...")
            embedding = bert_model.encode([test_sentence])
            print(f"✓ Successfully encoded sentence (shape: {embedding.shape})")
        except Exception as e:
            print(f"❌ BERT model failed: {str(e)}")
            traceback.print_exc()
        
        # Test spaCy
        print("\nTesting spaCy model...")
        try:
            import spacy
            try:
                nlp = spacy.load('en_core_web_sm', disable=['ner', 'textcat'])
                print("✓ Successfully loaded spaCy model")
            except OSError:
                print("SpaCy model not found, attempting to download...")
                import subprocess
                subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], 
                               check=True, capture_output=True)
                nlp = spacy.load('en_core_web_sm', disable=['ner', 'textcat'])
                print("✓ Successfully downloaded and loaded spaCy model")
                
            # Test spaCy processing
            doc = nlp("This is a test sentence for spaCy processing.")
            print(f"✓ Successfully processed text with spaCy: {len(doc)} tokens")
        except Exception as e:
            print(f"❌ spaCy model failed: {str(e)}")
            traceback.print_exc()
            
        print("\nAll tests completed!")
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 