import requests
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_qa_generation():
    # API endpoint
    url = "http://167.71.90.100:8000/generate/qa"
    
    # Test text
    test_text = """
    My Sweet Charlie is a 1970 American made-for-television drama film directed by Lamont Johnson. 
    The film stars Patty Duke and Al Freeman Jr. The teleplay was written by Richard Levinson and 
    William Link, based on the novel by David Westheimer. The film is considered a landmark in 
    television films for its treatment of interracial relationships and social issues.
    """
    
    # Request payload
    payload = {
        "text": test_text,
        "num_statements": 3
    }
    
    try:
        # Make the request
        logger.info("Sending request to QA generation endpoint...")
        response = requests.post(url, json=payload)
        
        # Check if request was successful
        if response.status_code == 200:
            result = response.json()
            logger.info("Successfully received response:")
            
            # Print each question and its answers
            for i, qa in enumerate(result.get("data", {}).get("questions", []), 1):
                print(f"\nQuestion {i}:")
                print(f"Q: {qa['partial_sentence']}")
                print(f"Correct Answer: {qa['original_sentence']}")
                print("False Answers:")
                for j, false_answer in enumerate(qa['false_sentences'], 1):
                    print(f"  {j}. {false_answer}")
        else:
            logger.error(f"Request failed with status code: {response.status_code}")
            logger.error(f"Response: {response.text}")
            
    except Exception as e:
        logger.error(f"Error during testing: {str(e)}")

if __name__ == "__main__":
    test_qa_generation() 