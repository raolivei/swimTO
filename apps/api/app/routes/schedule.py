"""Schedule endpoints."""
from typing import List, Optional
from datetime import date as date_type, time as time_type

from fastapi import APIRouter, Depends, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.database import get_db
from app.models import Session as SessionModel, Facility
from app.schemas import SessionWithFacility

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("", response_model=List[SessionWithFacility])
@limiter.limit("60/minute")  # 60 requests per minute per IP
async def get_schedule(
    request: Request,  # Required for rate limiting
    facility_id: Optional[str] = Query(None, description="Filter by facility"),
    district: Optional[str] = Query(None, description="Filter by district"),
    swim_type: Optional[str] = Query(None, description="Filter by swim type (e.g., LANE_SWIM)"),
    date_from: Optional[date_type] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[date_type] = Query(None, description="End date (YYYY-MM-DD)"),
    time_from: Optional[time_type] = Query(None, description="Earliest start time (HH:MM)"),
    time_to: Optional[time_type] = Query(None, description="Latest end time (HH:MM)"),
    age_max: Optional[int] = Query(None, description="Filter for sessions suitable for this age (e.g., 3 for infants)"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get swim schedule with filters."""
    query = db.query(SessionModel).join(Facility)
    
    # Apply filters
    filters = []
    
    if facility_id:
        filters.append(SessionModel.facility_id == facility_id)
    
    if district:
        filters.append(Facility.district.ilike(f"%{district}%"))
    
    if swim_type:
        filters.append(SessionModel.swim_type == swim_type)
    
    if date_from:
        filters.append(SessionModel.date >= date_from)
    # Only default to today onwards if no other date filters are specified
    # This allows facility_id or other filters to show all matching sessions
    elif not facility_id and not date_to:
        # Default to today onwards only when no specific filters are applied
        filters.append(SessionModel.date >= date_type.today())
    
    if date_to:
        filters.append(SessionModel.date <= date_to)
    
    if time_from:
        filters.append(SessionModel.start_time >= time_from)
    
    if time_to:
        filters.append(SessionModel.end_time <= time_to)
    
    # Age-based filtering: show sessions where the given age falls within the allowed range
    if age_max is not None:
        # Session's minimum age must be <= the person's age (or no restriction)
        filters.append(or_(
            SessionModel.age_min.is_(None),
            SessionModel.age_min <= age_max
        ))
        # Session's maximum age must be >= the person's age (or no restriction)
        filters.append(or_(
            SessionModel.age_max.is_(None),
            SessionModel.age_max >= age_max
        ))
    
    if filters:
        query = query.filter(and_(*filters))
    
    # Order by date and time
    query = query.order_by(SessionModel.date, SessionModel.start_time)
    
    # Pagination
    sessions = query.offset(offset).limit(limit).all()
    
    # Enrich with facility data
    result = []
    for session in sessions:
        facility = db.query(Facility).filter(
            Facility.facility_id == session.facility_id
        ).first()
        
        result.append(SessionWithFacility(
            **session.__dict__,
            facility=facility
        ))
    
    return result


@router.get("/today", response_model=List[SessionWithFacility])
@limiter.limit("60/minute")
async def get_today_schedule(
    request: Request,  # Required for rate limiting
    swim_type: Optional[str] = Query(None, description="Filter by swim type"),
    db: Session = Depends(get_db)
):
    """Get today's swim schedule."""
    today = date_type.today()
    
    query = db.query(SessionModel).join(Facility).filter(
        SessionModel.date == today
    )
    
    if swim_type:
        query = query.filter(SessionModel.swim_type == swim_type)
    
    query = query.order_by(SessionModel.start_time)
    
    sessions = query.all()
    
    result = []
    for session in sessions:
        facility = db.query(Facility).filter(
            Facility.facility_id == session.facility_id
        ).first()
        
        result.append(SessionWithFacility(
            **session.__dict__,
            facility=facility
        ))
    
    return result

