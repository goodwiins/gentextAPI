# services/paraphraser.py
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import logging

logger = logging.getLogger(__name__)

class T5Paraphraser:
    """
    A service class for generating diverse paraphrases using the T5 large model.
    This can be used to create alternative false statements or paraphrase true statements.
    """
    
    def __init__(self, model_name="ramsrigouthamg/t5-large-paraphraser-diverse-high-quality", device=None):
        """
        Initialize the T5 paraphraser with the specified model.
        
        Args:
            model_name: Name of the pretrained model to use
            device: Computation device ('cuda' or 'cpu')
        """
        logger.info(f"Initializing T5Paraphraser with model: {model_name}")
        
        # Determine device
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = device
            
        logger.info(f"Using device: {self.device}")
        
        try:
            # Load model and tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
            self.model = self.model.to(self.device)
            logger.info("T5 paraphraser model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load T5 paraphraser model: {str(e)}")
            raise
    
    def generate_paraphrases(self, text, num_paraphrases=3, max_length=128, diversity_penalty=0.70):
        """
        Generate diverse paraphrases for the input text.
        
        Args:
            text: Input text to paraphrase
            num_paraphrases: Number of paraphrases to generate
            max_length: Maximum length of generated paraphrases
            diversity_penalty: Penalty for repeated content (higher = more diverse)
            
        Returns:
            List of paraphrased texts
        """
        try:
            # Format input for the paraphraser model
            input_text = f"paraphrase: {text} </s>"
            
            # Encode the input text
            encoding = self.tokenizer.encode_plus(
                input_text, 
                max_length=max_length, 
                padding=True, 
                return_tensors="pt"
            )
            
            # Move tensors to the appropriate device
            input_ids = encoding["input_ids"].to(self.device)
            attention_mask = encoding["attention_mask"].to(self.device)
            
            # Generate paraphrases using diverse beam search
            self.model.eval()  # Set model to evaluation mode
            with torch.no_grad():  # Disable gradient calculation for inference
                outputs = self.model.generate(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    max_length=max_length,
                    early_stopping=True,
                    num_beams=5,
                    num_beam_groups=5,
                    num_return_sequences=num_paraphrases,
                    diversity_penalty=diversity_penalty
                )
            
            # Decode the outputs
            paraphrases = []
            for output in outputs:
                paraphrase = self.tokenizer.decode(
                    output, 
                    skip_special_tokens=True,
                    clean_up_tokenization_spaces=True
                )
                paraphrases.append(paraphrase)
            
            return paraphrases
            
        except Exception as e:
            logger.error(f"Error generating paraphrases: {str(e)}")
            return [text]  # Return the original text if paraphrasing fails
    
    def generate_false_statement(self, original_text, partial_text=None, num_candidates=5):
        """
        Generate false statements by paraphrasing the original and selecting the most different.
        
        Args:
            original_text: The original true statement
            partial_text: Optional partial text to guide generation
            num_candidates: Number of candidate paraphrases to generate
            
        Returns:
            List of false statements
        """
        import scipy.spatial.distance
        from sentence_transformers import SentenceTransformer
        
        # Generate paraphrases
        paraphrases = self.generate_paraphrases(
            partial_text if partial_text else original_text,
            num_paraphrases=num_candidates,
            diversity_penalty=0.9  # Higher diversity for false statements
        )
        
        # Load BERT model for semantic similarity calculation
        try:
            bert_model = SentenceTransformer('bert-base-nli-mean-tokens')
            bert_model = bert_model.to(self.device)
            
            # Get embeddings
            original_embedding = bert_model.encode([original_text])[0]
            paraphrase_embeddings = bert_model.encode(paraphrases)
            
            # Calculate similarities
            similarities = []
            for i, embedding in enumerate(paraphrase_embeddings):
                similarity = 1 - scipy.spatial.distance.cosine(original_embedding, embedding)
                similarities.append((paraphrases[i], similarity))
            
            # Sort by similarity (less similar = better false statement)
            similarities.sort(key=lambda x: x[1])
            
            # Select the least similar paraphrases as false statements
            return [item[0] for item in similarities[:3]]
            
        except Exception as e:
            logger.error(f"Error selecting false statements: {str(e)}")
            return paraphrases[:3]  # Fall back to returning first 3 paraphrases