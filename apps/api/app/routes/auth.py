"""Authentication routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from loguru import logger
import httpx

from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import TokenResponse, UserResponse, UserCreate
from app.auth import create_access_token, get_current_user

router = APIRouter()


@router.get("/auth/google-url", tags=["auth"])
async def get_google_auth_url():
    """Get Google OAuth URL."""
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured"
        )
    
    redirect_uri = settings.google_redirect_uri or "http://localhost:5173/auth/callback"
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
    
    return {"auth_url": google_auth_url}


@router.post("/auth/google-callback", response_model=TokenResponse, tags=["auth"])
async def google_callback(
    code: str,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback."""
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured"
        )
    
    redirect_uri = settings.google_redirect_uri or "http://localhost:5173/auth/callback"
    
    # Exchange code for token
    try:
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": redirect_uri,
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
    
    # Create JWT token
    token = create_access_token(data={"sub": user.id})
    
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

