"""Admin endpoints (Bearer ADMIN_TOKEN)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps.admin import verify_admin_token
from app.models import User
from app.schemas import AdminUserListResponse, AdminUserStatsResponse, AdminUserSummary
from app.user_metrics import (
    count_signups_since,
    count_users,
    toronto_day_start,
    toronto_week_start,
)

router = APIRouter(prefix="/admin")


@router.get("/users/stats", response_model=AdminUserStatsResponse, tags=["admin"])
async def get_user_stats(
    _: str = Depends(verify_admin_token),
    db: Session = Depends(get_db),
):
    """Registered-user counts for growth tracking."""
    week_start = toronto_week_start()
    day_start = toronto_day_start()
    return AdminUserStatsResponse(
        total_users=count_users(db),
        signups_this_week=count_signups_since(db, week_start),
        signups_today=count_signups_since(db, day_start),
        week_start_utc=week_start,
    )


@router.get("/users", response_model=AdminUserListResponse, tags=["admin"])
async def list_users(
    _: str = Depends(verify_admin_token),
    db: Session = Depends(get_db),
):
    """List registered users (email + signup time) for outreach."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return AdminUserListResponse(
        total=len(users),
        users=[
            AdminUserSummary(
                id=u.id,
                email=u.email,
                name=u.name,
                created_at=u.created_at,
            )
            for u in users
        ],
    )
