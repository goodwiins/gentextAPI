from sqlalchemy import Column, Integer, String, Enum, JSON
from .database import Base
import enum

class MFAPreference(str, enum.Enum):
    NONE = "none"
    SMS = "sms"
    TOTP = "totp"
    QUESTIONS = "questions"
    HARDWARE = "hardware"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # MFA related fields
    phone_number = Column(String, nullable=True)
    totp_secret = Column(String, nullable=True)
    security_questions = Column(JSON, nullable=True)
    hardware_token_id = Column(String, nullable=True)
    
    mfa_preference = Column(Enum(MFAPreference), default=MFAPreference.NONE)
