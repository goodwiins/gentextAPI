# config.py
from dotenv import load_dotenv
import os
import redis
from datetime import timedelta

# Load environment variables from .env file
load_dotenv()

class BaseConfig:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'hard-to-guess-key'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    RATELIMIT_HEADERS_ENABLED = True
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # GPT-2 specific configurations
    GPT2_MODEL_NAME = "gpt2-medium"
    GPT2_MAX_LENGTH = 100
    GPT2_TEMPERATURE = 0.9
    GPT2_TOP_K = 50
    GPT2_TOP_P = 0.95

    # Rate limiter configuration
    RATELIMIT_STORAGE_URL = "memory://"  # Default to memory storage

class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///dev.db'
    SQLALCHEMY_ECHO = True

class ProductionConfig(BaseConfig):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    JWT_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

class TestingConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

# Set the application config based on environment
env = os.environ.get("FLASK_ENV", "development")
ApplicationConfig = config.get(env, DevelopmentConfig)