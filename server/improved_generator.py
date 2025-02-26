from transformers import GPT2Tokenizer, GPT2LMHeadModel, pipeline
import torch
import scipy.spatial.distance
from sentence_transformers import SentenceTransformer
import nltk
from nltk.tokenize import sent_tokenize
import spacy

class ImprovedFalseStatementGenerator:
    def __init__(self, model_name="gpt2-medium", device=None):
        # Initialize device (use GPU if available)
        if device is None:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
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
        self.bert_model.to(self.device)
        
        # Load spaCy for NLP tasks
        self.nlp = spacy.load('en_core_web_sm')
    
    def generate_false_statements(self, partial_sentence, full_sentence, num_statements=3, similarity_threshold=0.85):
        """
        Generate false statements based on a partial sentence.
        
        Args:
            partial_sentence: The beginning of a sentence to complete
            full_sentence: The original complete sentence (for comparison)
            num_statements: Number of false statements to return
            similarity_threshold: Maximum similarity score for sentences to be considered different
            
        Returns:
            List of false statements
        """
        # Generate candidate sentences
        outputs = self.generator(
            partial_sentence,
            max_length=len(partial_sentence.split()) + 80,
            num_return_sequences=10,
            do_sample=True,
            top_p=0.92,
            top_k=50,
            temperature=1.0,
            repetition_penalty=1.2,
            return_full_text=False
        )
        
        # Extract the generated text from the outputs
        generated_sentences = [output['generated_text'] for output in outputs]
        
        # Process and filter the generated sentences
        return self._filter_sentences(full_sentence, generated_sentences, similarity_threshold, num_statements)
    
    def _filter_sentences(self, original_sentence, candidate_sentences, threshold=0.85, max_results=3):
        """
        Filter sentences based on multiple criteria:
        1. Semantic dissimilarity to original sentence
        2. Grammatical correctness
        3. Appropriate length
        
        Args:
            original_sentence: The original true sentence
            candidate_sentences: List of generated candidate sentences
            threshold: Maximum similarity score allowed
            max_results: Maximum number of results to return
            
        Returns:
            List of filtered sentences
        """
        # First, clean up sentences by taking just the first sentence if there are multiple
        cleaned_candidates = []
        for sent in candidate_sentences:
            sentences = sent_tokenize(sent)
            if sentences:
                cleaned_candidates.append(sentences[0].strip())
        
        # Filter out duplicates
        cleaned_candidates = list(set(cleaned_candidates))
        
        # Skip sentences that are too short or too similar to original
        filtered_candidates = []
        
        # Get embeddings for all sentences at once (more efficient)
        if not cleaned_candidates:
            return []
            
        all_sentences = [original_sentence] + cleaned_candidates
        embeddings = self.bert_model.encode(all_sentences)
        
        original_embedding = embeddings[0]
        candidate_embeddings = embeddings[1:]
        
        for i, candidate in enumerate(cleaned_candidates):
            # Skip very short sentences
            if len(candidate.split()) < 5:
                continue
                
            # Check for grammatical validity
            doc = self.nlp(candidate)
            has_verb = any(token.pos_ == "VERB" for token in doc)
            
            if not has_verb:
                continue
                
            # Calculate similarity with original sentence
            similarity = 1 - scipy.spatial.distance.cosine(original_embedding, candidate_embeddings[i])
            
            # Only accept sentences that are different enough
            if similarity < threshold:
                filtered_candidates.append({
                    "text": candidate,
                    "similarity": similarity
                })
        
        # Sort by similarity (prefer sentences in the 0.5-0.7 range - related but clearly different)
        filtered_candidates.sort(key=lambda x: abs(0.6 - x["similarity"]))
        
        # Return the top results
        return [item["text"] for item in filtered_candidates[:max_results]]
    
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