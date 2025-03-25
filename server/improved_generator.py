from transformers import GPT2Tokenizer, GPT2LMHeadModel, pipeline
import torch
import scipy.spatial.distance
from sentence_transformers import SentenceTransformer
import re
from nltk.tokenize import sent_tokenize, word_tokenize
import spacy
from qa_formatter import QAFormatter

class ImprovedFalseStatementGenerator:
    def __init__(self, model_name="gpt2-medium", device=None):
        # Initialize device (use GPU if available)
        if device is None:
            if torch.backends.mps.is_available():
                self.device = "mps"
            elif torch.cuda.is_available():
                self.device = "cuda"
            else:
                self.device = "cpu"
        else:
            self.device = device
            
        print(f"Using device: {self.device}")
        
        # Load tokenizer and model
        self.tokenizer = GPT2Tokenizer.from_pretrained(model_name)
        self.tokenizer.pad_token = self.tokenizer.eos_token
        self.model = GPT2LMHeadModel.from_pretrained(model_name, pad_token_id=self.tokenizer.eos_token_id)
        self.model.to(self.device)
        
        # Initialize pipeline for text generation
        self.generator = pipeline('text-generation', model=self.model, tokenizer=self.tokenizer, device=0 if self.device == "cuda" else -1)
        
        # Load BERT model for similarity calculation
        self.bert_model = SentenceTransformer('bert-base-nli-mean-tokens')
        # Force BERT model to CPU as it might not be compatible with MPS
        self.bert_model = self.bert_model.to("cpu")
        
        # Load spaCy for NLP tasks
        self.nlp = spacy.load('en_core_web_sm')
        
        # Add date pattern matching
        self.date_pattern = re.compile(r'\b\d{4}\b|\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b')
        
        # Add patterns for news content
        self.number_pattern = re.compile(r'\b\d+(?:\.\d+)?%?\b')
        self.company_pattern = re.compile(r'\b(?:Tesla|SpaceX|Bitcoin|Dogecoin)\b')
        
        self.qa_formatter = QAFormatter()
    
    def process_full_text(self, text):
        """Break down text into processable chunks and generate false statements."""
        sentences = sent_tokenize(text)  # Split text into sentences
        results = []
        
        for sentence in sentences:
            # Only process meaningful sentences
            if len(sentence.split()) < 5:
                continue
            
            # Look for sentences with important information
            has_numbers = bool(self.number_pattern.search(sentence))
            has_companies = bool(self.company_pattern.search(sentence))
            
            if has_numbers or has_companies:
                # Create partial sentence for generation prompt
                words = word_tokenize(sentence)
                partial_idx = len(words) // 2
                partial_sentence = ' '.join(words[:partial_idx])
                
                # Generate alternative statements
                false_statements = self.generate_false_statements(
                    partial_sentence,
                    sentence,
                    num_statements=3
                )
                
                if false_statements:
                    results.append({
                        "original_sentence": sentence,
                        "partial_sentence": partial_sentence,
                        "false_sentences": false_statements,
                        "generator_used": "gpt2"
                    })
        
        return results

    def generate_false_statements(self, partial_sentence, full_sentence, num_statements=3):
        """Generate and filter false statements using GPT-2."""
        # Adjust generation parameters based on content
        has_date = bool(self.date_pattern.search(partial_sentence))
        has_company = bool(self.company_pattern.search(partial_sentence))
        has_number = bool(self.number_pattern.search(partial_sentence))
        
        # Dynamic parameter adjustment
        max_length = len(partial_sentence.split()) + (
            30 if has_date else 
            40 if has_company or has_number else 
            50
        )
        temperature = (
            0.8 if has_date else
            0.85 if has_company or has_number else
            0.9
        )
        
        # Generate variations using GPT-2 with truncation enabled
        outputs = self.generator(
            partial_sentence,
            truncation=True,  # Added truncation strategy
            max_length=max_length,
            num_return_sequences=20,
            do_sample=True,
            top_p=0.90,
            top_k=40,
            temperature=temperature,
            repetition_penalty=1.3,
            return_full_text=False
        )
        
        generated_sentences = [output['generated_text'] for output in outputs]
        return self._filter_sentences(full_sentence, generated_sentences)

    def _filter_sentences(self, original_sentence, candidates, threshold=0.75, max_results=3):
        """Filter and rank generated sentences."""
        cleaned_candidates = []
        
        # Clean and validate candidates
        for sent in candidates:
            sentences = sent_tokenize(sent)
            if sentences:
                cleaned_sent = sentences[0].strip()
                if self._is_valid_sentence(cleaned_sent):
                    cleaned_candidates.append(cleaned_sent)
        
        if not cleaned_candidates:
            return []
        
        # Calculate semantic similarity
        embeddings = self._get_embeddings([original_sentence] + cleaned_candidates)
        original_embedding = embeddings[0]
        candidate_embeddings = embeddings[1:]
        
        filtered_candidates = []
        for i, candidate in enumerate(cleaned_candidates):
            similarity = self._calculate_similarity(original_embedding, candidate_embeddings[i])
            if 0.3 < similarity < threshold:
                filtered_candidates.append({
                    "text": candidate,
                    "similarity": similarity
                })
        
        # Sort by optimal similarity (targeting 0.6)
        filtered_candidates.sort(key=lambda x: abs(0.6 - x["similarity"]))
        return [item["text"] for item in filtered_candidates[:max_results]]

    def _is_valid_sentence(self, sentence):
        """Check if a sentence is valid and well-formed."""
        if len(sentence.split()) < 5 or len(sentence.split()) > 20:
            return False
            
        doc = self.nlp(sentence)
        has_verb = any(token.pos_ == "VERB" for token in doc)
        has_subject = any(token.dep_ == "nsubj" for token in doc)
        
        return has_verb and has_subject
    
    def _get_embeddings(self, sentences):
        """Get BERT embeddings for a list of sentences."""
        try:
            return self.bert_model.encode(sentences)
        except Exception as e:
            print(f"Error getting embeddings: {e}")
            return None

    def _calculate_similarity(self, embedding1, embedding2):
        """Calculate cosine similarity between two embeddings."""
        try:
            return 1 - scipy.spatial.distance.cosine(embedding1, embedding2)
        except Exception as e:
            print(f"Error calculating similarity: {e}")
            return 0.0

    def generate_statements_batch(self, partial_sentences, full_sentences):
        """
        Generate false statements for multiple sentences in batch
        
        Args:
            partial_sentences: List of partial sentences
            full_sentences: List of corresponding full sentences
            
        Returns:
            List of lists, each containing false statements for the corresponding input
        """
        results = []
        for partial, full in zip(partial_sentences, full_sentences):
            false_statements = self.generate_false_statements(partial, full)
            results.append(false_statements)
        return results
    
    def generate_qa_from_text(self, text: str) -> dict:
        """Generate Q&A format from text."""
        results = self.process_full_text(text)
        questions = []
        
        for result in results:
            # Create question from original sentence
            question = f"What is the correct statement about {result['partial_sentence']}?"
            
            # Combine correct and false statements
            choices = [result['original_sentence']] + result['false_sentences']
            
            questions.append({
                "question": question,
                "choices": choices,
                "correct_answer": 0  # Index of the correct answer (always first in the list)
            })
        
        return {
            "questions": questions,
            "format_version": "1.0",
            "total_questions": len(questions)
        }