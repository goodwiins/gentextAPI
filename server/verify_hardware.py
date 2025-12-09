import requests
import time
import hashlib

BASE_URL = "http://127.0.0.1:8001/auth"

def test_hardware_flow():
    username = f"hw_user_{int(time.time())}"
    password = "securepassword"
    mock_key = "my_secret_hardware_key"
    
    # 1. Register
    print(f"Registering {username}...")
    requests.post(f"{BASE_URL}/register", json={
        "username": username,
        "password": password,
        "mfa_preference": "none"
    })
    
    # 2. Setup Start
    print("Starting Hardware Setup...")
    resp = requests.post(f"{BASE_URL}/setup-hardware-start", json={"username": username})
    print("Start:", resp.json())
    assert resp.status_code == 200
    challenge = resp.json()["challenge"]
    
    # 3. Setup Finish (Simulate signing)
    print("Finishing Hardware Setup...")
    signature = hashlib.sha256((challenge + mock_key).encode()).hexdigest()
    resp = requests.post(f"{BASE_URL}/setup-hardware-finish", json={
        "username": username,
        "credential_id": "credential_123",
        "public_key": mock_key,
        "signature": signature
    })
    print("Finish:", resp.json())
    assert resp.status_code == 200
    
    # 4. Login
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    print("Login:", resp.json())
    assert resp.status_code == 200
    data = resp.json()
    assert data["mfa_required"] == True
    assert data["mfa_type"] == "hardware"
    c2 = data["challenge_data"]["challenge"]
    
    # 5. Verify
    print("Verifying...")
    sig2 = hashlib.sha256((c2 + mock_key).encode()).hexdigest()
    resp = requests.post(f"{BASE_URL}/verify-mfa", json={
        "username": username,
        "session_id": data["session_id"],
        "webauthn_data": {"signature": sig2}
    })
    print("Verify:", resp.json())
    assert resp.status_code == 200
    assert "access_token" in resp.json()
    
    print("Hardware Token Verification Successful!")

if __name__ == "__main__":
    test_hardware_flow()
