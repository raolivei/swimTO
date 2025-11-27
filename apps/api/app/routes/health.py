"""Health check endpoints."""
from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
import asyncio

from app.database import engine
from app.schemas import HealthResponse
from app.config import settings

router = APIRouter()


@router.get("/", response_model=HealthResponse)
@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint.
    
    Returns healthy if the app is running. Database connection is checked
    but failures don't prevent the endpoint from responding, allowing the
    pod to be ready even if database is temporarily unavailable.
    """
    # Check database connection with timeout (non-blocking)
    db_healthy = False
    try:
        # Try database connection with short timeout
        def check_db():
            try:
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                    return True
            except (OperationalError, Exception):
                return False
        
        db_healthy = await asyncio.wait_for(
            asyncio.to_thread(check_db),
            timeout=1.0
        )
    except (asyncio.TimeoutError, Exception):
        db_healthy = False
    
    # Return healthy if app is running (database connection is optional for readiness)
    # This allows Kubernetes to mark the pod as ready even if DB is temporarily down
    return HealthResponse(
        status="healthy" if db_healthy else "degraded",
        version=settings.version
    )

