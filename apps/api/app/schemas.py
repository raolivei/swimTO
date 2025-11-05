"""Pydantic schemas for API."""
from datetime import date, time, datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class FacilityBase(BaseModel):
    """Base facility schema."""
    facility_id: str
    name: str
    address: Optional[str] = None
    postal_code: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_indoor: bool = True
    phone: Optional[str] = None
    website: Optional[str] = None


class FacilityCreate(FacilityBase):
    """Create facility schema."""
    pass


class FacilityResponse(FacilityBase):
    """Facility response schema."""
    source: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FacilityWithSessions(FacilityResponse):
    """Facility with sessions."""
    next_session: Optional['SessionResponse'] = None
    session_count: int = 0


class SessionBase(BaseModel):
    """Base session schema."""
    facility_id: str
    swim_type: str
    date: date
    start_time: time
    end_time: time
    notes: Optional[str] = None


class SessionCreate(SessionBase):
    """Create session schema."""
    pass


class SessionResponse(SessionBase):
    """Session response schema."""
    id: int
    source: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class SessionWithFacility(SessionResponse):
    """Session with facility details."""
    facility: FacilityResponse


class ScheduleQuery(BaseModel):
    """Query parameters for schedule endpoint."""
    facility_id: Optional[str] = None
    district: Optional[str] = None
    swim_type: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    days_of_week: Optional[List[int]] = Field(None, description="0=Monday, 6=Sunday")
    time_from: Optional[time] = None
    time_to: Optional[time] = None
    limit: int = Field(100, ge=1, le=1000)
    offset: int = Field(0, ge=0)


class UpdateResponse(BaseModel):
    """Response from update endpoint."""
    success: bool
    message: str
    facilities_updated: int = 0
    sessions_added: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Resolve forward references for Pydantic v2
FacilityWithSessions.model_rebuild()

