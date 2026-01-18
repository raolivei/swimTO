"""Facilities endpoints."""
from typing import List, Optional
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from loguru import logger

from app.database import get_db
from app.models import Facility, Session as SessionModel
from app.schemas import FacilityResponse, FacilityWithSessions

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/", response_model=List[FacilityWithSessions])
@limiter.limit("60/minute")  # 60 requests per minute per IP
async def get_facilities(
    request: Request,  # Required for rate limiting
    district: Optional[str] = Query(None, description="Filter by district"),
    has_lane_swim: bool = Query(False, description="Only facilities with lane swim"),
    db: Session = Depends(get_db)
):
    """Get all facilities with enriched session data."""
    try:
        logger.info(f"Fetching facilities (district={district}, has_lane_swim={has_lane_swim})")
        
        query = db.query(Facility).filter(Facility.is_indoor.is_(True))
        
        if district:
            query = query.filter(Facility.district.ilike(f"%{district}%"))
        
        facilities = query.all()
        logger.debug(f"Found {len(facilities)} facilities")
        
        # Enrich with session data using optimized bulk queries (avoid N+1 problem)
        result = []
        today = date_type.today()
        facility_ids = [f.facility_id for f in facilities]
        
        if not facility_ids:
            logger.info("No facilities found, returning empty list")
            return result
        
        # Pre-fetch all sessions and find first per facility (simpler than DISTINCT ON)
        # This avoids N+1 queries by fetching all sessions in one query
        all_sessions = db.query(SessionModel).filter(
            SessionModel.facility_id.in_(facility_ids),
            SessionModel.date >= today
        ).order_by(
            SessionModel.facility_id,
            SessionModel.date,
            SessionModel.start_time
        ).all()
        
        # Create lookup dict for next sessions (first session per facility)
        next_sessions_dict = {}
        for session in all_sessions:
            if session.facility_id not in next_sessions_dict:
                next_sessions_dict[session.facility_id] = session
        
        # Get session counts in one bulk query
        session_counts_query = db.query(
            SessionModel.facility_id,
            func.count(SessionModel.id).label('count')
        ).filter(
            SessionModel.facility_id.in_(facility_ids),
            SessionModel.date >= today
        ).group_by(SessionModel.facility_id).all()
        session_counts_dict = {s.facility_id: s.count for s in session_counts_query}
        
        # Get lane swim facilities in one query (if filter requested)
        lane_swim_facilities = set()
        if has_lane_swim:
            lane_swim_query = db.query(SessionModel.facility_id).filter(
                SessionModel.facility_id.in_(facility_ids),
                SessionModel.swim_type == "LANE_SWIM",
                SessionModel.date >= today
            ).distinct().all()
            lane_swim_facilities = {s.facility_id for s in lane_swim_query}
        
        # Build result using pre-fetched data
        for facility in facilities:
            # Filter for lane swim if requested
            if has_lane_swim and facility.facility_id not in lane_swim_facilities:
                continue
            
            # Get pre-fetched data
            next_session = next_sessions_dict.get(facility.facility_id)
            session_count = session_counts_dict.get(facility.facility_id, 0)
            
            result.append(FacilityWithSessions(
                **facility.__dict__,
                next_session=next_session,
                session_count=session_count
            ))
        
        logger.info(f"Returning {len(result)} facilities")
        return result
        
    except SQLAlchemyError as e:
        logger.error(f"Database error in get_facilities: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Database error occurred while fetching facilities"
        )
    except Exception as e:
        logger.exception(f"Unexpected error in get_facilities: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
        )


@router.get("/{facility_id}", response_model=FacilityResponse)
@limiter.limit("60/minute")
async def get_facility(
    request: Request,  # Required for rate limiting
    facility_id: str,
    db: Session = Depends(get_db)
):
    """Get facility by ID."""
    try:
        logger.info(f"Fetching facility {facility_id}")
        facility = db.query(Facility).filter(Facility.facility_id == facility_id).first()
        
        if not facility:
            logger.warning(f"Facility {facility_id} not found")
            raise HTTPException(status_code=404, detail="Facility not found")
        
        return facility
        
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error in get_facility: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Database error occurred while fetching facility"
        )
    except Exception as e:
        logger.exception(f"Unexpected error in get_facility: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
        )

