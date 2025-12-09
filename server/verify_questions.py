import requests
import time

BASE_URL = "http://127.0.0.1:8001/auth"

def test_questions_flow():
    username = f"q_user_{int(time.time())}"
    password = "securepassword"
    
    # 1. Register
    print(f"Registering {username}...")
    requests.post(f"{BASE_URL}/register", json={
        "username": username,
        "password": password,
        "mfa_preference": "none"
    })
    
    # 2. Setup Questions
    print("Setting up Questions...")
    questions = [{"question": "What is your pet's name?", "answer": "Fluffy"}]
    resp = requests.post(f"{BASE_URL}/setup-questions", params={"username": username}, json=questions)
    print("Setup:", resp.json())
    assert resp.status_code == 200
    
    # 3. Login
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    print("Login:", resp.json())
    assert resp.status_code == 200
    data = resp.json()
    assert data["mfa_required"] == True
    assert data["mfa_type"] == "questions"
    assert data["challenge_data"]["question"] == "What is your pet's name?"
    
    # 4. Verify
    print("Verifying...")
    resp = requests.post(f"{BASE_URL}/verify-mfa", json={
        "username": username,
        "session_id": data["session_id"],
        "answer": "Fluffy"
    })
    print("Verify:", resp.json())
    assert resp.status_code == 200
    assert "access_token" in resp.json()
    
    print("Security Questions Flow Verified!")

if __name__ == "__main__":
    test_questions_flow()
