"""Health check endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import HealthResponse
from app.config import settings

router = APIRouter()


@router.get("/", response_model=HealthResponse)
@router.get("/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint."""
    # Test database connection
    try:
        db.execute("SELECT 1")
        return HealthResponse(
            status="healthy",
            version=settings.version
        )
    except Exception:
        return HealthResponse(
            status="unhealthy",
            version=settings.version
        )

