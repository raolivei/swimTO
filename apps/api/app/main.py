"""Main FastAPI application."""
import asyncio
import os
import sys

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from prometheus_client import Gauge
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import func
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.database import SessionLocal, engine
from app.models import Base, User
from app.routes import facilities, schedule, update, health, auth, favorites, preferences

# Initialize Sentry if DSN is configured
sentry_dsn = os.getenv("SENTRY_DSN")
if sentry_dsn:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration
    
    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[
            StarletteIntegration(transaction_style="endpoint"),
            FastApiIntegration(transaction_style="endpoint"),
        ],
        traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
        profiles_sample_rate=0.1,
        environment=os.getenv("ENVIRONMENT", "production"),
    )
    logger.info("Sentry error tracking initialized")

# Configure logging
logger.remove()
logger.add(
    sys.stderr,
    level=settings.log_level,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>"
)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="API for Toronto indoor pool drop-in swim schedules",
    docs_url="/docs",
    redoc_url="/redoc",
    redirect_slashes=False  # Prevent 307 redirects that break CORS
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Trailing slash middleware - strip trailing slashes to avoid 404s
# (redirect_slashes=False is set to prevent CORS issues with 307 redirects)
class TrailingSlashMiddleware(BaseHTTPMiddleware):
    """Strip trailing slashes from request paths to avoid 404s."""
    
    async def dispatch(self, request: Request, call_next):
        # Strip trailing slash from path (except for root "/")
        if request.url.path != "/" and request.url.path.endswith("/"):
            # Modify the scope to remove trailing slash
            scope = request.scope.copy()
            scope["path"] = request.url.path.rstrip("/")
            request = Request(scope, request.receive)
        return await call_next(request)


# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()"
        # HSTS - only in production with HTTPS
        if os.getenv("ENVIRONMENT") == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


# Add middleware (order matters - first added = last executed)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(TrailingSlashMiddleware)  # Strip trailing slashes before routing
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Prometheus instrumentation
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# Product / DB KPIs (low-cardinality; scraped with other /metrics)
swimto_db_users_total = Gauge(
    "swimto_db_users_total",
    "Registered users in the SwimTO database (refreshed periodically)",
)


async def _refresh_business_metrics_loop() -> None:
    while True:
        try:
            db = SessionLocal()
            try:
                n = db.query(func.count(User.id)).scalar()
                swimto_db_users_total.set(float(n or 0))
            finally:
                db.close()
        except Exception as e:
            logger.warning("Business metrics refresh failed: {}", e)
        await asyncio.sleep(300)


# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(auth.router, tags=["auth"])
app.include_router(favorites.router, tags=["favorites"])
app.include_router(preferences.router, tags=["preferences"])
app.include_router(facilities.router, prefix="/facilities", tags=["facilities"])
app.include_router(schedule.router, prefix="/schedule", tags=["schedule"])
app.include_router(update.router, prefix="/update", tags=["update"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler with Sentry reporting."""
    logger.exception(f"Unhandled exception: {exc}")
    # Sentry will automatically capture this if initialized
    if sentry_dsn:
        import sentry_sdk
        sentry_sdk.capture_exception(exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


@app.on_event("startup")
async def startup_event():
    """Startup event."""
    logger.info(f"Starting {settings.app_name} v{settings.version}")
    # Create tables if they don't exist (alembic handles migrations, but this ensures tables exist)
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created")
    except Exception as e:
        logger.warning(f"Could not create database tables (may already exist): {e}")
    asyncio.create_task(_refresh_business_metrics_loop())


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event."""
    logger.info("Shutting down API")

