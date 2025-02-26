# setup_models.py
import nltk
import benepar
import spacy

print("Downloading necessary NLP models...")

# Download NLTK data
print("Downloading NLTK punkt...")
nltk.download('punkt')

# Download Benepar model
print("Downloading Benepar model...")
benepar.download('benepar_en3')

# Download spaCy model
print("Downloading spaCy model...")
try:
    spacy.load('en_core_web_sm')
except:
    import os
    os.system('python -m spacy download en_core_web_sm')

print("All models downloaded successfully!")