# config.py
from dotenv import load_dotenv
import os
import redis

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get("SECRET_KEY", "insecure-default-key")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_ECHO = True
    SQLALCHEMY_DATABASE_URI = r"sqlite:///./db.sqlite"
    SESSION_TYPE = "filesystem"  # Simpler for development

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", r"sqlite:///./db.sqlite"
    )
    SESSION_TYPE = "redis"
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    SESSION_REDIS = redis.from_url(os.environ.get("REDIS_URL", "redis://127.0.0.1:6379"))

# Set the application config based on environment
env = os.environ.get("FLASK_ENV", "development")
if env == "production":
    ApplicationConfig = ProductionConfig
else:
    ApplicationConfig = DevelopmentConfig