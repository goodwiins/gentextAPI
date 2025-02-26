# improved_text_process.py
import re
import spacy
import torch
import json
import nltk
from summa.summarizer import summarize
import benepar
from string import punctuation
from nltk.tokenize import sent_tokenize
from improved_generator import ImprovedFalseStatementGenerator

# Load necessary models
nlp = spacy.load('en_core_web_sm')
benepar_parser = benepar.Parser("benepar_en3")
nltk.download('punkt', quiet=True)

# Initialize the improved generator
generator = ImprovedFalseStatementGenerator(model_name="gpt2-medium")

def preprocess(sentences):
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
    candidate_sents = summarize(r_text, ratio)
    candidate_sents_list = sent_tokenize(candidate_sents)
    candidate_sents_list = [re.split(r'[:;]+', x)[0] for x in candidate_sents_list]
    filtered_list_short_sentences = [sent for sent in candidate_sents_list if 30 < len(sent) < 150]
    return filtered_list_short_sentences

def get_sentence_completions(key_sentences):
    # Use your existing function to get partial sentences
    # [Your existing implementation...]
    # This is where you'd implement your parsing for partial sentences
    # For now I'll use a simplified version
    sentence_completion_dict = {}
    for sentence in key_sentences:
        # Simple approach: take first 70% of the words
        words = sentence.split()
        cut_point = int(len(words) * 0.7)
        partial = ' '.join(words[:cut_point])
        sentence_completion_dict[sentence] = [partial]
    
    return sentence_completion_dict

def process_text(text):
    # Extract candidate sentences
    cand_sent = get_candidate_sents(text)
    filter_quotes_and_questions = preprocess(cand_sent)
    
    # Get partial sentences
    sent_completion_dict = get_sentence_completions(filter_quotes_and_questions)
    
    # Generate false statements using the improved generator
    results = []
    for key_sentence in sent_completion_dict:
        partial_sentences = sent_completion_dict[key_sentence]
        false_sentences = []
        
        for partial_sent in partial_sentences:
            false_sents = generator.generate_false_statements(
                partial_sent, 
                key_sentence, 
                num_statements=3
            )
            false_sentences.extend(false_sents)
        
        temp = {
            "original_sentence": key_sentence,
            "partial_sentence": partial_sentences[0],
            "false_sentences": false_sentences
        }
        results.append(temp)
    
    return json.dumps(results, indent=4)