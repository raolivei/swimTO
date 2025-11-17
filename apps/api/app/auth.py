"""Authentication utilities."""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify JWT token."""
    from loguru import logger
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError as e:
        logger.error(f"JWT decode error: {type(e).__name__}: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error decoding token: {type(e).__name__}: {str(e)}")
        return None


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user from token."""
    from loguru import logger
    
    if not token:
        logger.info("❌ No token provided in request")
        return None
    
    logger.info(f"✓ Token received: {token[:30]}...")
    payload = decode_access_token(token)
    if not payload:
        logger.error(f"❌ Failed to decode token: {token[:30]}...")
        return None
    
    logger.info(f"✓ Token payload decoded: {payload}")
    user_id_str = payload.get("sub")
    if user_id_str is None:
        logger.error("❌ No user_id (sub) in token payload")
        return None
    
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        logger.error(f"❌ Invalid user_id in token: {user_id_str}")
        return None
    
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        logger.info(f"✓ User authenticated: {user.email}")
    else:
        logger.error(f"❌ No user found with id: {user_id}")
    return user


async def get_current_user_required(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """Get current user, raise 401 if not authenticated."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user

