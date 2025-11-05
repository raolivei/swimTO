"""Facilities endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from loguru import logger

from app.database import get_db
from app.models import Facility, Session as SessionModel
from app.schemas import FacilityResponse, FacilityWithSessions
from datetime import date as date_type

router = APIRouter()


@router.get("/", response_model=List[FacilityWithSessions])
async def get_facilities(
    district: Optional[str] = Query(None, description="Filter by district"),
    has_lane_swim: bool = Query(False, description="Only facilities with lane swim"),
    db: Session = Depends(get_db)
):
    """Get all facilities with enriched session data."""
    try:
        logger.info(f"Fetching facilities (district={district}, has_lane_swim={has_lane_swim})")
        
        query = db.query(Facility).filter(Facility.is_indoor == True)
        
        if district:
            query = query.filter(Facility.district.ilike(f"%{district}%"))
        
        facilities = query.all()
        logger.debug(f"Found {len(facilities)} facilities")
        
        # Enrich with session data
        result = []
        today = date_type.today()
        
        for facility in facilities:
            # Get next session
            next_session = db.query(SessionModel).filter(
                SessionModel.facility_id == facility.facility_id,
                SessionModel.date >= today
            ).order_by(SessionModel.date, SessionModel.start_time).first()
            
            # Get total session count
            session_count = db.query(func.count(SessionModel.id)).filter(
                SessionModel.facility_id == facility.facility_id,
                SessionModel.date >= today
            ).scalar()
            
            # Filter for lane swim if requested
            if has_lane_swim:
                has_lane = db.query(SessionModel).filter(
                    SessionModel.facility_id == facility.facility_id,
                    SessionModel.swim_type == "LANE_SWIM",
                    SessionModel.date >= today
                ).first()
                if not has_lane:
                    continue
            
            result.append(FacilityWithSessions(
                **facility.__dict__,
                next_session=next_session,
                session_count=session_count or 0
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
async def get_facility(
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

