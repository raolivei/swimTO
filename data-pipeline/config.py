"""Configuration for data pipeline."""
from pydantic_settings import BaseSettings


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
        extra = "ignore"  # Ignore extra env vars from shared environment


settings = Settings()


# Registry of city → source module names (relative to sources/).
# Pipeline jobs iterate this dict so adding a new city requires only
# a new entry here + the corresponding source module.
# Phase 2 (ActiveNet) and Phase 3 (PerfectMind) will populate the non-Toronto entries.
CITY_SOURCES: dict[str, list[str]] = {
    "Toronto": [
        "toronto_drop_in_api",
        "toronto_parks_json_api",
    ],
    # Phase 2 — ActiveNet cities (Peel / York)
    "Mississauga": ["mississauga_activenet"],
    "Richmond Hill": ["richmond_hill_activenet"],
    # Phase 3 — additional York/Peel municipalities
    "Vaughan": ["vaughan_activenet"],
    # "Brampton": ["brampton_activenet"],  # Phase 3 — PerfectMind
    # "Markham":  ["markham_activenet"],   # Phase 3 — PerfectMind
}


