import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    
    # Database configuration (Supabase)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"
    
    # OpenAI configurations (commented out — using Ollama instead)
    # OPENAI_API_KEY: str = "mock-openai-key"
    # EMBEDDING_MODEL: str = "text-embedding-3-small"
    # LLM_MODEL: str = "gpt-4o"
    
    # Ollama configurations (local LLM)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL: str = "qwen3.5:latest"
    EMBEDDING_MODEL: str = "qwen3.5:latest"
    
    # AI logic parameters
    RAG_CONFIDENCE_THRESHOLD: float = 0.7
    TAVILY_API_KEY: str = ""
    
    # Security settings
    SECRET_KEY: str = "gov-copilot-secure-secret-key-change-it"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Allowed Government Search Domains
    ALLOWED_DOMAINS: List[str] = [
        "gov.in",
        "nic.in",
        "services.india.gov.in",
        "uidai.gov.in",
        "digilocker.gov.in",
        "passportindia.gov.in",
        "gst.gov.in",
        "income.gov.in",
        "india.gov.in"
    ]

settings = Settings()
