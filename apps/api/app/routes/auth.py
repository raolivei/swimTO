"""Authentication routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from loguru import logger
import httpx
from urllib.parse import urlparse

from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import TokenResponse, UserResponse
from app.auth import create_access_token, get_current_user

router = APIRouter()

# Allowed redirect URI origins (for security - prevent open redirect attacks)
ALLOWED_ORIGINS = [
    "https://swimto.app",
    "https://swimto.eldertree.xyz",
    "https://swimto.eldertree.local",
    "http://swimto.eldertree.local",
    "http://localhost:5173",
    "http://localhost:3000",
]


def get_redirect_uri(origin: str | None, request: Request) -> str:
    """Determine the correct redirect URI based on request origin.
    
    Priority:
    1. Explicit origin parameter (if allowed)
    2. Origin header from request (if allowed)
    3. Referer header from request (if allowed)
    4. Default from settings or localhost
    """
    callback_path = "/auth/callback"
    
    # Try explicit origin parameter
    if origin:
        parsed = urlparse(origin)
        base_origin = f"{parsed.scheme}://{parsed.netloc}"
        if base_origin in ALLOWED_ORIGINS:
            return f"{base_origin}{callback_path}"
        logger.warning(f"Origin parameter not in allowed list: {origin}")
    
    # Try Origin header
    origin_header = request.headers.get("origin")
    if origin_header and origin_header in ALLOWED_ORIGINS:
        return f"{origin_header}{callback_path}"
    
    # Try Referer header
    referer = request.headers.get("referer")
    if referer:
        parsed = urlparse(referer)
        base_origin = f"{parsed.scheme}://{parsed.netloc}"
        if base_origin in ALLOWED_ORIGINS:
            return f"{base_origin}{callback_path}"
    
    # Fall back to settings or default
    if settings.google_redirect_uri:
        return settings.google_redirect_uri
    
    return "http://localhost:5173/auth/callback"


@router.get("/auth/google-url", tags=["auth"])
async def get_google_auth_url(
    request: Request,
    origin: str | None = Query(None, description="Origin URL for redirect")
):
    """Get Google OAuth URL.
    
    The redirect_uri is determined dynamically based on:
    1. The 'origin' query parameter (if provided and allowed)
    2. The Origin header (if allowed)
    3. The Referer header (if allowed)
    4. Default configuration
    
    This allows the same API to serve multiple frontend domains.
    """
    logger.debug("Received request for Google auth URL")
    
    if not settings.google_client_id:
        logger.warning("Google OAuth not configured - missing client_id")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured"
        )
    
    redirect_uri = get_redirect_uri(origin, request)
    scope = "openid email profile"
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.google_client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code"
        f"&scope={scope}"
        f"&access_type=offline"
        f"&prompt=consent"
    )
    
    logger.info(f"Generated Google auth URL (redirect_uri: {redirect_uri})")
    return {"auth_url": google_auth_url, "redirect_uri": redirect_uri}


@router.post("/auth/google-callback", response_model=TokenResponse, tags=["auth"])
async def google_callback(
    request: Request,
    code: str,
    redirect_uri: str | None = Query(None, description="Redirect URI used during auth"),
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback.
    
    The redirect_uri must match the one used when generating the auth URL.
    It can be passed explicitly or determined from request headers.
    """
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured"
        )
    
    # Determine redirect URI - must match what was used for the auth URL
    final_redirect_uri = redirect_uri or get_redirect_uri(None, request)
    logger.info(f"Google callback with redirect_uri: {final_redirect_uri}")
    
    # Exchange code for token
    try:
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": final_redirect_uri,
                    "grant_type": "authorization_code",
                }
            )
            token_response.raise_for_status()
            token_data = token_response.json()
            access_token = token_data["access_token"]
            
            # Get user info from Google
            user_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            user_response.raise_for_status()
            google_user = user_response.json()
    except httpx.HTTPError as e:
        logger.error(f"Google OAuth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to authenticate with Google"
        )
    
    # Get or create user
    user = db.query(User).filter(User.google_id == google_user["id"]).first()
    
    if not user:
        # Check if email already exists (shouldn't happen, but safety check)
        existing_user = db.query(User).filter(User.email == google_user["email"]).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered with different account"
            )
        
        # Create new user
        user = User(
            email=google_user["email"],
            name=google_user.get("name"),
            google_id=google_user["id"],
            picture=google_user.get("picture")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Created new user: {user.email}")
    else:
        # Update existing user info
        user.name = google_user.get("name") or user.name
        user.picture = google_user.get("picture") or user.picture
        db.commit()
        db.refresh(user)
    
    # Create JWT token (sub must be string)
    token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user)
    )


@router.get("/auth/me", response_model=UserResponse, tags=["auth"])
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return UserResponse.model_validate(current_user)

