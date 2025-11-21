"""Schedule endpoints."""
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import date as date_type, time as time_type, datetime
from typing import Optional
from zoneinfo import ZoneInfo

from app.database import get_db
from app.models import Session as SessionModel, Facility
from app.schemas import SessionWithFacility

router = APIRouter()

# Toronto timezone for determining "today"
TORONTO_TZ = ZoneInfo('America/Toronto')


def get_today_toronto() -> date_type:
    """Get today's date in Toronto timezone."""
    now_toronto = datetime.now(TORONTO_TZ)
    return now_toronto.date()


@router.get("/", response_model=List[SessionWithFacility])
async def get_schedule(
    facility_id: Optional[str] = Query(None, description="Filter by facility"),
    district: Optional[str] = Query(None, description="Filter by district"),
    swim_type: Optional[str] = Query(None, description="Filter by swim type (e.g., LANE_SWIM)"),
    date_from: Optional[date_type] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[date_type] = Query(None, description="End date (YYYY-MM-DD)"),
    time_from: Optional[time_type] = Query(None, description="Earliest start time (HH:MM)"),
    time_to: Optional[time_type] = Query(None, description="Latest end time (HH:MM)"),
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
    else:
        # Default to today onwards (in Toronto timezone)
        filters.append(SessionModel.date >= get_today_toronto())
    
    if date_to:
        filters.append(SessionModel.date <= date_to)
    
    if time_from:
        filters.append(SessionModel.start_time >= time_from)
    
    if time_to:
        filters.append(SessionModel.end_time <= time_to)
    
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
async def get_today_schedule(
    swim_type: Optional[str] = Query(None, description="Filter by swim type"),
    db: Session = Depends(get_db)
):
    """Get today's swim schedule (in Toronto timezone)."""
    today = get_today_toronto()
    
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

