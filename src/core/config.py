"""
Application Configuration and Settings Management.
Reads configuration from environment variables with strong typing and secure defaults.
"""

import os
from typing import List
from pydantic import BaseModel, Field

try:
    from pydantic_settings import BaseSettings
except ImportError:
    class BaseSettings(BaseModel):
        class Config:
            extra = "ignore"

class Settings(BaseSettings):
    # Application Metadata
    APP_NAME: str = "Nexora Enterprise AI Recruiter"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    API_V1_STR: str = "/api"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Security & JWT Authentication
    JWT_SECRET: str = os.getenv(
        "JWT_SECRET", 
        "nexora-enterprise-default-jwt-secret-replace-in-production-32-chars"
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # AI Model Providers
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Storage Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    PROCESSED_DATA_DIR: str = os.path.join(DATA_DIR, "processed")
    SAMPLE_DATA_DIR: str = os.path.join(DATA_DIR, "sample")
    RAW_DATA_DIR: str = os.path.join(DATA_DIR, "raw")

    # Security & Feature Flags
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"
    ENABLE_PROMPT_INJECTION_DEFENSE: bool = True
    ENABLE_DEMOGRAPHIC_MASKING_BY_DEFAULT: bool = True

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "*",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://recruit-ai-enterprise-ai-recruiter.vercel.app"
    ]

settings = Settings()
