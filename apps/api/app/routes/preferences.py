"""User preferences routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from loguru import logger

from app.database import get_db
from app.models import User, UserPreferences
from app.schemas import UserPreferencesResponse, UserPreferencesUpdate
from app.auth import get_current_user

router = APIRouter()


@router.get("/preferences", response_model=UserPreferencesResponse, tags=["preferences"])
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's preferences.
    
    Returns the user's saved preferences, or creates default preferences
    if none exist.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Get or create preferences
    preferences = db.query(UserPreferences).filter(
        UserPreferences.user_id == current_user.id
    ).first()
    
    if not preferences:
        # Create default preferences
        preferences = UserPreferences(user_id=current_user.id)
        db.add(preferences)
        db.commit()
        db.refresh(preferences)
        logger.info(f"Created default preferences for user {current_user.id}")
    
    return UserPreferencesResponse.model_validate(preferences)


@router.put("/preferences", response_model=UserPreferencesResponse, tags=["preferences"])
@router.patch("/preferences", response_model=UserPreferencesResponse, tags=["preferences"])
async def update_preferences(
    updates: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's preferences.
    
    Only provided fields are updated. Use null/None to clear a preference.
    Supports both PUT (full replace) and PATCH (partial update).
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Get or create preferences
    preferences = db.query(UserPreferences).filter(
        UserPreferences.user_id == current_user.id
    ).first()
    
    if not preferences:
        preferences = UserPreferences(user_id=current_user.id)
        db.add(preferences)
    
    # Update only provided fields
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(preferences, field, value)
    
    db.commit()
    db.refresh(preferences)
    
    logger.info(f"Updated preferences for user {current_user.id}: {list(update_data.keys())}")
    return UserPreferencesResponse.model_validate(preferences)


@router.delete("/preferences", status_code=status.HTTP_204_NO_CONTENT, tags=["preferences"])
async def reset_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset user's preferences to defaults.
    
    Deletes all stored preferences, returning to system defaults.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    preferences = db.query(UserPreferences).filter(
        UserPreferences.user_id == current_user.id
    ).first()
    
    if preferences:
        db.delete(preferences)
        db.commit()
        logger.info(f"Reset preferences for user {current_user.id}")
    
    return None
