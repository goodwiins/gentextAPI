import requests
import pyotp
import time

BASE_URL = "http://127.0.0.1:8001/auth"

def test_totp_flow():
    username = f"totp_user_{int(time.time())}"
    password = "securepassword"
    
    # 1. Register
    print(f"Registering {username}...")
    resp = requests.post(f"{BASE_URL}/register", json={
        "username": username,
        "password": password,
        "mfa_preference": "none" # Default none, enable later
    })
    print("Register:", resp.json())
    assert resp.status_code == 200

    # 2. Setup TOTP
    print("Setting up TOTP...")
    resp = requests.post(f"{BASE_URL}/setup-totp", params={"username": username})
    print("Setup:", resp.json())
    assert resp.status_code == 200
    secret = resp.json()["secret"]
    
    # 3. Enable TOTP
    totp = pyotp.TOTP(secret)
    code = totp.now()
    print(f"Enabling with code {code}...")
    resp = requests.post(f"{BASE_URL}/enable-totp", params={"username": username, "code": code})
    print("Enable:", resp.json())
    assert resp.status_code == 200
    
    # 4. Login (Should get challenge)
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    print("Login:", resp.json())
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("mfa_required") == True
    assert data.get("mfa_type") == "totp"
    session_id = data.get("session_id")
    
    # 5. Verify MFA
    code = totp.now()
    print(f"Verifying with code {code}...")
    resp = requests.post(f"{BASE_URL}/verify-mfa", json={
        "username": username,
        "code": code,
        "session_id": session_id
    })
    print("Verify:", resp.json())
    assert resp.status_code == 200
    assert "access_token" in resp.json()
    
    print("TOTP Flow Verified Successfully!")

if __name__ == "__main__":
    test_totp_flow()
