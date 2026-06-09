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
    has_indoor: bool = True
    has_outdoor: bool = False
    phone: Optional[str] = None
    website: Optional[str] = None
    is_free_entry: bool = False


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
    age_min: Optional[int] = None
    age_max: Optional[int] = None


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
    """Health check response.
    
    Status can be "healthy" (app and DB working) or "degraded" (app working but DB unavailable).
    Database field indicates connection status: "connected", "disconnected", "timeout", or "error".
    """
    status: str
    version: str
    database: Optional[str] = None  # Database connection status
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class UserBase(BaseModel):
    """Base user schema."""
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None


class UserCreate(UserBase):
    """Create user schema."""
    google_id: str


class UserResponse(UserBase):
    """User response schema."""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class FavoriteResponse(BaseModel):
    """Favorite response schema."""
    facility_id: str
    created_at: datetime
    facility: Optional[FacilityResponse] = None
    
    class Config:
        from_attributes = True


class FavoriteCreate(BaseModel):
    """Create favorite schema."""
    facility_id: str


class UserPreferencesBase(BaseModel):
    """Base user preferences schema."""
    default_view: Optional[str] = Field(None, description="Default view: 'list', 'map', or 'table'")
    default_swim_type: Optional[str] = Field(None, description="Default swim type filter")
    dark_mode: Optional[bool] = Field(None, description="Dark mode preference (None = follow system)")
    home_latitude: Optional[float] = Field(None, description="Home location latitude")
    home_longitude: Optional[float] = Field(None, description="Home location longitude")
    home_address: Optional[str] = Field(None, description="Home address for display")
    default_distance_km: Optional[float] = Field(None, ge=0.1, le=50, description="Default search radius in km")
    notifications_enabled: Optional[bool] = Field(None, description="Enable push notifications")
    notify_favorite_updates: Optional[bool] = Field(None, description="Notify when favorites have schedule updates")
    extra: Optional[dict] = Field(None, description="Additional preferences as key-value pairs")


class UserPreferencesCreate(UserPreferencesBase):
    """Create user preferences schema."""
    pass


class UserPreferencesUpdate(UserPreferencesBase):
    """Update user preferences schema (all fields optional)."""
    pass


class UserPreferencesResponse(UserPreferencesBase):
    """User preferences response schema."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Resolve forward references for Pydantic v2
FacilityWithSessions.model_rebuild()

