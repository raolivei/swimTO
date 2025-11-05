"""API configuration."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    app_name: str = "SwimTO API"
    version: str = "2.0.0"
    debug: bool = False
    
    # Database
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/pools"
    
    # Redis
    redis_url: Optional[str] = "redis://localhost:6379"
    cache_ttl: int = 3600  # 1 hour
    
    # Security
    admin_token: str = "change-me-in-production"
    
    # CORS
    cors_origins: list = [
        "http://localhost:5173", 
        "http://localhost:3000",
        "http://192.168.2.48:5173"  # Network access for mobile devices
    ]
    
    # External APIs
    city_base_url: str = "https://www.toronto.ca"
    open_data_base_url: str = "https://open.toronto.ca"
    
    # Ingestion
    ingest_window_days: int = 56
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

