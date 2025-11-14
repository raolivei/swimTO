"""API configuration."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings.
    
    Note: Default values are for local development only.
    In production, all secrets are retrieved from Vault via External Secrets Operator
    and provided as environment variables (DATABASE_URL, SECRET_KEY, ADMIN_TOKEN, etc.).
    """
    
    # Application
    app_name: str = "SwimTO API"
    version: str = "2.0.0"
    debug: bool = False
    
    # Database
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/pools"  # Overridden by DATABASE_URL env var from Vault in production
    
    # Redis
    redis_url: Optional[str] = "redis://localhost:6379"  # Overridden by REDIS_URL env var from Vault in production
    cache_ttl: int = 3600  # 1 hour
    
    # Security
    admin_token: str = "change-me-in-production"  # Overridden by ADMIN_TOKEN env var from Vault in production
    secret_key: str = "change-me-in-production-secret-key"  # Overridden by SECRET_KEY env var from Vault in production
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # Google OAuth
    google_client_id: Optional[str] = None  # Overridden by GOOGLE_CLIENT_ID env var from Vault in production
    google_client_secret: Optional[str] = None  # Overridden by GOOGLE_CLIENT_SECRET env var from Vault in production
    google_redirect_uri: Optional[str] = None
    
    # CORS
    cors_origins: list = [
        "http://localhost:5173", 
        "http://localhost:3000",
        "http://192.168.2.48:5173"  # Network access for mobile devices
    ]
    
    # External APIs
    city_base_url: str = "https://www.toronto.ca"
    open_data_base_url: str = "https://open.toronto.ca"
    
    # AI Image Generation APIs
    openai_api_key: Optional[str] = None  # Overridden by OPENAI_API_KEY env var from Vault in production
    leonardo_api_key: Optional[str] = None  # Overridden by LEONARDO_API_KEY env var from Vault in production

    # Ingestion
    ingest_window_days: int = 56
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

