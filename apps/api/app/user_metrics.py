"""User signup metrics helpers (Toronto-local week boundaries)."""

from datetime import datetime, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import User

TORONTO = ZoneInfo("America/Toronto")


def _toronto_midnight_as_utc_naive(when: datetime) -> datetime:
    """Convert a Toronto-local datetime to naive UTC for DB comparison."""
    if when.tzinfo is None:
        when = when.replace(tzinfo=TORONTO)
    return when.astimezone(timezone.utc).replace(tzinfo=None)


def toronto_week_start(now: Optional[datetime] = None) -> datetime:
    """Monday 00:00 America/Toronto for the week containing ``now``."""
    local = (now or datetime.now(TORONTO)).astimezone(TORONTO)
    monday = local.date() - timedelta(days=local.weekday())
    start_local = datetime(
        monday.year, monday.month, monday.day, tzinfo=TORONTO
    )
    return _toronto_midnight_as_utc_naive(start_local)


def toronto_day_start(now: Optional[datetime] = None) -> datetime:
    """Today 00:00 America/Toronto."""
    local = (now or datetime.now(TORONTO)).astimezone(TORONTO)
    start_local = datetime(
        local.year, local.month, local.day, tzinfo=TORONTO
    )
    return _toronto_midnight_as_utc_naive(start_local)


def count_users(db: Session) -> int:
    return int(db.query(func.count(User.id)).scalar() or 0)


def count_signups_since(db: Session, since_utc_naive: datetime) -> int:
    return int(
        db.query(func.count(User.id))
        .filter(User.created_at >= since_utc_naive)
        .scalar()
        or 0
    )
