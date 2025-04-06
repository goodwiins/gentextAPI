# services/text_process.py
import re
import spacy
import json
import nltk
import logging
from summa.summarizer import summarize
from string import punctuation
from nltk.tokenize import sent_tokenize
from generator_factory import StatementGeneratorFactory

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load necessary models
try:
    nlp = spacy.load('en_core_web_sm')
    nltk.download('punkt', quiet=True)
except Exception as e:
    logger.error(f"Error loading NLP models: {str(e)}")

# Initialize the generator factory
generator_factory = StatementGeneratorFactory()

def preprocess(sentences):
    """Filter out sentences with quotes or questions."""
    output = []
    for sent in sentences:
        single_quotes_present = len(re.findall(r"['][\w\s.:;,!?\\-]+[']", sent)) > 0
        double_quotes_present = len(re.findall(r'["][\w\s.:;,!?\\-]+["]', sent)) > 0
        question_present = "?" in sent
        if single_quotes_present or double_quotes_present or question_present:
            continue
        else:
            output.append(sent.strip(punctuation))
    return output

def get_candidate_sents(r_text, ratio=0.3):
    """Extract candidate sentences using text summarization."""
    candidate_sents = summarize(r_text, ratio)
    candidate_sents_list = sent_tokenize(candidate_sents)
    candidate_sents_list = [re.split(r'[:;]+', x)[0] for x in candidate_sents_list]
    filtered_list_short_sentences = [sent for sent in candidate_sents_list if 30 < len(sent) < 150]
    return filtered_list_short_sentences

def get_sentence_completions(key_sentences):
    """Create partial sentences for statement generation."""
    sentence_completion_dict = {}
    for sentence in key_sentences:
        # Simple approach: take first 70% of the words
        words = sentence.split()
        cut_point = int(len(words) * 0.7)
        partial = ' '.join(words[:cut_point])
        sentence_completion_dict[sentence] = [partial]
    
    return sentence_completion_dict

def process_text(text, generator_type='gpt2'):
    """
    Process text to generate false statements for educational purposes.
    
    Args:
        text: Input text to process
        generator_type: Type of generator to use ('gpt2' or 't5')
        
    Returns:
        JSON string with original sentences and generated false statements
    """
    try:
        # Extract candidate sentences
        cand_sent = get_candidate_sents(text)
        filter_quotes_and_questions = preprocess(cand_sent)
        
        # Get partial sentences
        sent_completion_dict = get_sentence_completions(filter_quotes_and_questions)
        
        # Generate false statements using the factory
        results = []
        for key_sentence in sent_completion_dict:
            partial_sentences = sent_completion_dict[key_sentence]
            false_sentences = []
            
            for partial_sent in partial_sentences:
                false_sents = generator_factory.generate_false_statements(
                    generator_type,
                    partial_sent, 
                    key_sentence, 
                    num_statements=3
                )
                false_sentences.extend(false_sents)
            
            temp = {
                "original_sentence": key_sentence,
                "partial_sentence": partial_sentences[0],
                "false_sentences": false_sentences,
                "generator_used": generator_type
            }
            results.append(temp)
        
        return json.dumps(results, indent=4)
        
    except Exception as e:
        logger.error(f"Error in process_text: {str(e)}")
        return json.dumps({"error": str(e)})