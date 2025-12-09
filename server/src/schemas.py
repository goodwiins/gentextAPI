from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
from .models import MFAPreference

class UserBase(BaseModel):
    username: str
    phone_number: Optional[str] = None
    mfa_preference: MFAPreference = MFAPreference.NONE

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class MFAChallenge(BaseModel):
    mfa_required: bool
    mfa_type: str
    session_id: str
    challenge_data: Optional[Dict[str, Any]] = None # To send question text or hardware challenge

class MFAVerifyRequest(BaseModel):
    username: str
    code: Optional[str] = None # Used for SMS/TOTP
    answer: Optional[str] = None # Used for Security Questions
    webauthn_data: Optional[Dict[str, Any]] = None # Used for Hardware
    session_id: str

class TOTPSetupResponse(BaseModel):
    secret: str
    provisioning_uri: str

class SecurityQuestion(BaseModel):
    question: str
    answer: str

class WebAuthnSetupStart(BaseModel):
    username: str

class WebAuthnSetupFinish(BaseModel):
    username: str
    credential_id: str
    public_key: str
    signature: str 
