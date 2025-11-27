"""Database setup and connection."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.config import settings

# Create engine
# Connection settings optimized for Kubernetes environment:
# - connect_timeout: Prevents hanging on connection attempts
# - statement_timeout: Prevents long-running queries from blocking
# - pool_recycle: Recycles connections to prevent stale connections
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={
        "connect_timeout": 10,  # 10 second connection timeout
        "options": "-c statement_timeout=30000"  # 30 second statement timeout (increased for complex queries)
    },
    pool_recycle=3600,  # Recycle connections after 1 hour
    echo=False
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

