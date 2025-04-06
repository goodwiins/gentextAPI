#!/usr/bin/env python
"""
Test client for the GenText API.
This script sends test requests to the running API server.
"""
import requests
import json
import time
import sys

API_URL = "http://167.71.90.100:8000"  # Using the server's IP address

def test_generate_statements():
    """Test the /generate/statements endpoint using Claude generator."""
    endpoint = f"{API_URL}/generate/statements"
    
    payload = {
        "full_sentence": "The new AI model demonstrated unprecedented capabilities in complex reasoning tasks.",
        "num_statements": 3
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print(f"Sending request to {endpoint}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        start_time = time.time()
        response = requests.post(endpoint, headers=headers, data=json.dumps(payload))
        elapsed = time.time() - start_time
        
        print(f"\nRequest completed in {elapsed:.2f}s")
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\nAPI Response:")
            print(json.dumps(result, indent=2))
            
            if result.get("success"):
                print("\nFalse statements generated:")
                for i, statement in enumerate(result["data"]["false_sentences"], 1):
                    print(f"{i}. {statement}")
                    
                print(f"\nGenerator used: {result['data'].get('generator_used', 'unknown')}")
                return 0
            else:
                print(f"API returned error: {result.get('error', 'Unknown error')}")
                return 1
        else:
            print(f"API request failed with status {response.status_code}")
            print(response.text)
            return 1
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1

def test_batch_generate():
    """Test the /generate/batch endpoint using Claude generator."""
    endpoint = f"{API_URL}/generate/batch"
    
    payload = {
        "sentences": [
            "The company announced a significant increase in quarterly profits.",
            "Scientists discovered a new species of deep-sea fish near the Mariana Trench."
        ],
        "num_statements": 2
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print(f"Sending batch request to {endpoint}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        start_time = time.time()
        response = requests.post(endpoint, headers=headers, data=json.dumps(payload))
        elapsed = time.time() - start_time
        
        print(f"\nBatch request completed in {elapsed:.2f}s")
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\nAPI Response:")
            print(json.dumps(result, indent=2))
            
            if result.get("success"):
                print("\nResults by sentence:")
                for i, item in enumerate(result["data"]["results"], 1):
                    print(f"\nSentence {i}: {item['original_sentence']}")
                    for j, statement in enumerate(item["false_sentences"], 1):
                        print(f"  {j}. {statement}")
                
                return 0
            else:
                print(f"API returned error: {result.get('error', 'Unknown error')}")
                return 1
        else:
            print(f"API request failed with status {response.status_code}")
            print(response.text)
            return 1
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1

def test_generate_qa():
    """Test the /generate/qa endpoint using Claude generator."""
    endpoint = f"{API_URL}/generate/qa"
    
    payload = {
        "text": """Anthropic's Claude is a family of AI assistants. Claude excels at thoughtful dialogue and complex reasoning. 
                It can help with writing, analysis, question answering, and creative tasks. 
                Claude is designed to be helpful, harmless, and honest.""",
        "num_statements": 3
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print(f"Sending request to {endpoint}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        start_time = time.time()
        response = requests.post(endpoint, headers=headers, data=json.dumps(payload))
        elapsed = time.time() - start_time
        
        print(f"\nRequest completed in {elapsed:.2f}s")
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\nAPI Response:")
            print(json.dumps(result, indent=2))
            
            if result.get("success"):
                # Extract and display questions and answers if available
                if "questions" in result["data"]:
                    print("\nGenerated Q&A:")
                    for i, qa_item in enumerate(result["data"]["questions"], 1):
                        print(f"\nQ{i}: {qa_item.get('question', 'No question')}")
                        print(f"A{i}: {qa_item.get('answer', 'No answer')}")
                return 0
            else:
                print(f"API returned error: {result.get('error', 'Unknown error')}")
                return 1
        else:
            print(f"API request failed with status {response.status_code}")
            print(response.text)
            return 1
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1

if __name__ == "__main__":
    print("GenText API Test Client")
    print("======================")
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "batch":
            sys.exit(test_batch_generate())
        elif sys.argv[1] == "qa":
            sys.exit(test_generate_qa())
        else:
            print(f"Unknown command: {sys.argv[1]}")
            print("Available commands: batch, qa")
            sys.exit(1)
    else:
        sys.exit(test_generate_statements()) 