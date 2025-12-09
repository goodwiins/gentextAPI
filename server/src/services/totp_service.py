import pyotp
from typing import Tuple

class TOTPService:
    def generate_secret(self) -> str:
        return pyotp.random_base32()
    
    def get_provisioning_uri(self, secret: str, username: str, issuer_name: str = "MFA Research") -> str:
        return pyotp.totp.TOTP(secret).provisioning_uri(name=username, issuer_name=issuer_name)
    
    def verify_code(self, secret: str, code: str) -> bool:
        totp = pyotp.TOTP(secret)
        return totp.verify(code)

totp_service = TOTPService()
