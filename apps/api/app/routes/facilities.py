"""Facilities endpoints."""
from typing import List, Literal, Optional
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from loguru import logger

from app.database import get_db
from app.models import Facility, Session as SessionModel
from app.schemas import FacilityResponse, FacilityWithSessions

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("", response_model=List[FacilityWithSessions])
@limiter.limit("60/minute")  # 60 requests per minute per IP
async def get_facilities(
    request: Request,  # Required for rate limiting
    district: Optional[str] = Query(None, description="Filter by district"),
    has_lane_swim: bool = Query(False, description="Only facilities with lane swim"),
    swim_type: Optional[str] = Query(
        None, description="Only facilities with upcoming sessions of this swim type"
    ),
    is_free: Optional[bool] = Query(None, description="Filter by free entry"),
    pool_type: Literal["all", "indoor", "outdoor"] = Query(
        "all", description="Filter by pool type (indoor, outdoor, or all)"
    ),
    include_outdoor: Optional[bool] = Query(
        None,
        description="Deprecated: use pool_type. False maps to indoor, True maps to all",
    ),
    db: Session = Depends(get_db)
):
    """Get all facilities with enriched session data."""
    try:
        effective_pool_type = pool_type
        if include_outdoor is not None:
            effective_pool_type = "all" if include_outdoor else "indoor"

        logger.info(
            f"Fetching facilities (district={district}, has_lane_swim={has_lane_swim}, "
            f"swim_type={swim_type}, is_free={is_free}, pool_type={effective_pool_type})"
        )

        query = db.query(Facility)
        if effective_pool_type == "indoor":
            query = query.filter(Facility.has_indoor.is_(True))
        elif effective_pool_type == "outdoor":
            query = query.filter(Facility.has_outdoor.is_(True))

        if district:
            query = query.filter(Facility.district.ilike(f"%{district}%"))

        if is_free is not None:
            query = query.filter(Facility.is_free_entry == is_free)
        
        facilities = query.all()
        logger.debug(f"Found {len(facilities)} facilities")
        
        # Enrich with session data using optimized bulk queries (avoid N+1 problem)
        result = []
        today = date_type.today()
        facility_ids = [f.facility_id for f in facilities]
        
        if not facility_ids:
            logger.info("No facilities found, returning empty list")
            return result
        
        # Pre-fetch upcoming sessions (one query, used for next session + counts + filters)
        all_sessions = db.query(SessionModel).filter(
            SessionModel.facility_id.in_(facility_ids),
            SessionModel.date >= today
        ).order_by(
            SessionModel.facility_id,
            SessionModel.date,
            SessionModel.start_time
        ).all()

        effective_swim_type = swim_type
        if effective_swim_type is None and has_lane_swim:
            effective_swim_type = "LANE_SWIM"

        def session_matches_filter(session: SessionModel) -> bool:
            if effective_swim_type is None:
                return True
            return session.swim_type == effective_swim_type

        # Next session per facility (first upcoming session matching swim filter)
        next_sessions_dict = {}
        for session in all_sessions:
            if not session_matches_filter(session):
                continue
            if session.facility_id not in next_sessions_dict:
                next_sessions_dict[session.facility_id] = session

        # Session counts per facility (matching swim filter)
        session_counts_dict: dict[str, int] = {}
        for session in all_sessions:
            if not session_matches_filter(session):
                continue
            session_counts_dict[session.facility_id] = (
                session_counts_dict.get(session.facility_id, 0) + 1
            )

        facilities_with_matching_sessions = set(session_counts_dict.keys())
        
        # Build result using pre-fetched data
        for facility in facilities:
            if effective_swim_type is not None:
                if facility.facility_id not in facilities_with_matching_sessions:
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

