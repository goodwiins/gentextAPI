import requests
import time

BASE_URL = "http://127.0.0.1:8001/auth"

def seed_users():
    common_passwords = ["123456", "password", "12345678", "qwerty", "1234567890"]
    
    # 1. Password Only Users (Vulnerable)
    print("Seeding Password Only Users...")
    for i in range(5):
        username = f"user_pwd_{i}"
        requests.post(f"{BASE_URL}/register", json={
            "username": username,
            "password": common_passwords[i],
            "mfa_preference": "none"
        })

    # 2. SMS Users
    print("Seeding SMS Users...")
    for i in range(5):
        username = f"user_sms_{i}"
        requests.post(f"{BASE_URL}/register", json={
            "username": username,
            "password": common_passwords[i],
            "mfa_preference": "sms",
            "phone_number": f"555000{i}" # Mock phone
        })

    # 3. TOTP Users (Registered but not set up - effectively pwd only until setup? Or maybe setup via script?)
    # For now, let's just register them. Setup requires secret exchange.
    # To truly test MFA effectiveness, they need to have it ENABLED.
    # I'll create a helper to enable TOTP for them.
    print("Seeding TOTP Users...")
    for i in range(5):
        username = f"user_totp_{i}"
        pwd = common_passwords[i]
        requests.post(f"{BASE_URL}/register", json={"username": username, "password": pwd, "mfa_preference": "none"})
        
        # Setup Flow
        resp = requests.post(f"{BASE_URL}/setup-totp", params={"username": username})
        if resp.status_code == 200:
            secret = resp.json()["secret"]
            import pyotp
            totp = pyotp.TOTP(secret)
            requests.post(f"{BASE_URL}/enable-totp", params={"username": username, "code": totp.now()})

    # 4. Questions Users
    print("Seeding Question Users...")
    for i in range(5):
        username = f"user_quest_{i}"
        requests.post(f"{BASE_URL}/register", json={
            "username": username,
            "password": common_passwords[i],
            "mfa_preference": "none"
        })
        requests.post(f"{BASE_URL}/setup-questions", params={"username": username}, json=[{"question": "Color?", "answer": "Blue"}])

    print("Seeding Complete!")

if __name__ == "__main__":
    seed_users()
