"""Favorites routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, UserFavorite, Facility
from app.schemas import FavoriteResponse, FavoriteCreate
from app.auth import get_current_user_required

router = APIRouter()


@router.get("/favorites", response_model=List[FavoriteResponse], tags=["favorites"])
async def get_favorites(
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """Get user's favorites."""
    favorites = (
        db.query(UserFavorite)
        .filter(UserFavorite.user_id == current_user.id)
        .order_by(UserFavorite.created_at.desc())
        .all()
    )
    
    # Load facility data for each favorite
    result = []
    for fav in favorites:
        facility = db.query(Facility).filter(Facility.facility_id == fav.facility_id).first()
        result.append(FavoriteResponse(
            facility_id=fav.facility_id,
            created_at=fav.created_at,
            facility=facility
        ))
    
    return result


@router.post("/favorites", response_model=FavoriteResponse, tags=["favorites"])
async def add_favorite(
    favorite: FavoriteCreate,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """Add a facility to favorites."""
    # Verify facility exists
    facility = db.query(Facility).filter(Facility.facility_id == favorite.facility_id).first()
    if not facility:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Facility {favorite.facility_id} not found"
        )
    
    # Check if already favorited
    existing = (
        db.query(UserFavorite)
        .filter(
            UserFavorite.user_id == current_user.id,
            UserFavorite.facility_id == favorite.facility_id
        )
        .first()
    )
    
    if existing:
        return FavoriteResponse(
            facility_id=existing.facility_id,
            created_at=existing.created_at,
            facility=facility
        )
    
    # Create new favorite
    new_favorite = UserFavorite(
        user_id=current_user.id,
        facility_id=favorite.facility_id
    )
    db.add(new_favorite)
    db.commit()
    db.refresh(new_favorite)
    
    return FavoriteResponse(
        facility_id=new_favorite.facility_id,
        created_at=new_favorite.created_at,
        facility=facility
    )


@router.delete("/favorites/{facility_id}", tags=["favorites"])
async def remove_favorite(
    facility_id: str,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """Remove a facility from favorites."""
    favorite = (
        db.query(UserFavorite)
        .filter(
            UserFavorite.user_id == current_user.id,
            UserFavorite.facility_id == facility_id
        )
        .first()
    )
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )
    
    db.delete(favorite)
    db.commit()
    
    return {"message": "Favorite removed", "facility_id": facility_id}


@router.get("/favorites/check/{facility_id}", tags=["favorites"])
async def check_favorite(
    facility_id: str,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """Check if a facility is favorited."""
    favorite = (
        db.query(UserFavorite)
        .filter(
            UserFavorite.user_id == current_user.id,
            UserFavorite.facility_id == facility_id
        )
        .first()
    )
    
    return {"is_favorite": favorite is not None, "facility_id": facility_id}

