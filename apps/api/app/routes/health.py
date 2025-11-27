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
    # This health check is designed to be resilient - it returns HTTP 200 even if DB is down
    # so Kubernetes probes succeed and the pod can be marked as ready
    db_status = "unknown"
    try:
        # Try database connection with short timeout
        def check_db():
            try:
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                    return "connected"
            except OperationalError:
                return "disconnected"
            except Exception:
                return "error"
        
        db_status = await asyncio.wait_for(
            asyncio.to_thread(check_db),
            timeout=2.0
        )
    except asyncio.TimeoutError:
        db_status = "timeout"
    except Exception:
        db_status = "error"
    
    # Return healthy if app is running (database connection is optional for readiness)
    # This allows Kubernetes to mark the pod as ready even if DB is temporarily down
    # The health endpoint is designed to be resilient - it will return "degraded" status
    # if the database is unavailable, but still return HTTP 200 so Kubernetes probes succeed
    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        version=settings.version,
        database=db_status
    )

