"""Configuration for data pipeline."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Pipeline configuration."""
    
    # Database
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/pools"
    
    # Toronto Open Data
    open_data_base_url: str = "https://open.toronto.ca"
    city_base_url: str = "https://www.toronto.ca"
    
    # Ingestion parameters
    ingest_window_days: int = 56  # ~8 weeks ahead
    
    # Cache
    cache_dir: str = "data/cache"
    enable_cache: bool = True
    cache_ttl_hours: int = 24
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

