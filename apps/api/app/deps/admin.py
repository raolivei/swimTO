"""Admin API authentication."""

from fastapi import Depends, Header, HTTPException

from app.config import settings


def verify_admin_token(authorization: str = Header(None)) -> str:
    """Verify ``Authorization: Bearer <ADMIN_TOKEN>``."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = parts[1]
    if token != settings.admin_token:
        raise HTTPException(status_code=403, detail="Invalid token")

    return token


AdminToken = Depends(verify_admin_token)
