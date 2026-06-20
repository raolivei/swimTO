"""Database models."""
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, Date, Time, 
    BigInteger, Integer, Double, Text, ForeignKey, UniqueConstraint, JSON, TypeDecorator
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

# Use JSONB for PostgreSQL, JSON for SQLite (for tests)
# This TypeDecorator automatically uses JSONB for PostgreSQL and JSON for SQLite
class JSONType(TypeDecorator):
    """JSON type that uses JSONB for PostgreSQL and JSON for SQLite."""
    impl = JSON
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import JSONB
            return dialect.type_descriptor(JSONB(astext_type=None))
        else:
            # For SQLite and other databases, use standard JSON
            return dialect.type_descriptor(JSON())

# Use BigInteger for PostgreSQL, Integer for SQLite (for autoincrement compatibility)
# SQLite doesn't properly support BigInteger with autoincrement
class AutoIncrementBigInt(TypeDecorator):
    """BigInteger type that uses Integer for SQLite (autoincrement compatibility)."""
    impl = BigInteger
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        if dialect.name == 'sqlite':
            # SQLite requires Integer for autoincrement to work properly
            return dialect.type_descriptor(Integer())
        else:
            # PostgreSQL and other databases use BigInteger
            return dialect.type_descriptor(BigInteger())

Base = declarative_base()


class Facility(Base):
    """Community pool facility."""

    __tablename__ = "facilities"

    facility_id = Column(String, primary_key=True)
    name = Column(Text, nullable=False)
    address = Column(Text)
    postal_code = Column(String(10))
    district = Column(String(100))
    latitude = Column(Double)
    longitude = Column(Double)
    is_indoor = Column(Boolean, default=True)
    has_indoor = Column(Boolean, default=True, nullable=False)
    has_outdoor = Column(Boolean, default=False, nullable=False)
    phone = Column(String(20))
    website = Column(Text)
    source = Column(String(50))
    is_free_entry = Column(Boolean, default=False, nullable=False)
    toronto_location_id = Column(Integer, nullable=True, index=True)
    raw = Column(JSONType)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sessions = relationship("Session", back_populates="facility", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Facility(id={self.facility_id}, name={self.name})>"


class Session(Base):
    """Drop-in swim session."""
    
    __tablename__ = "sessions"
    
    id = Column(AutoIncrementBigInt, primary_key=True, autoincrement=True)
    facility_id = Column(String, ForeignKey("facilities.facility_id"), nullable=False)
    swim_type = Column(String(50), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    notes = Column(Text)
    age_min = Column(Integer, nullable=True)  # Minimum age in years
    age_max = Column(Integer, nullable=True)  # Maximum age in years
    source = Column(String(50))
    hash = Column(String(64), unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    facility = relationship("Facility", back_populates="sessions")
    
    __table_args__ = (
        UniqueConstraint('facility_id', 'date', 'start_time', 'swim_type', name='uq_session'),
    )
    
    def __repr__(self):
        return f"<Session(facility={self.facility_id}, type={self.swim_type}, date={self.date})>"


class User(Base):
    """User account."""
    
    __tablename__ = "users"
    
    id = Column(AutoIncrementBigInt, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255))
    google_id = Column(String(255), unique=True, nullable=False, index=True)
    picture = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    favorites = relationship("UserFavorite", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"


class UserFavorite(Base):
    """User's favorite facilities."""
    
    __tablename__ = "user_favorites"
    
    id = Column(AutoIncrementBigInt, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    facility_id = Column(String, ForeignKey("facilities.facility_id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="favorites")
    facility = relationship("Facility")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'facility_id', name='uq_user_favorite'),
    )
    
    def __repr__(self):
        return f"<UserFavorite(user_id={self.user_id}, facility_id={self.facility_id})>"


class UserPreferences(Base):
    """User preferences and settings."""
    
    __tablename__ = "user_preferences"
    
    id = Column(AutoIncrementBigInt, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # View preferences
    default_view = Column(String(20), default="list")  # "list", "map", "table"
    default_swim_type = Column(String(50), default=None)  # "LANE_SWIM", "RECREATIONAL", etc.
    dark_mode = Column(Boolean, default=None)  # None = follow system
    
    # Location preferences
    home_latitude = Column(Double, default=None)
    home_longitude = Column(Double, default=None)
    home_address = Column(Text, default=None)
    default_distance_km = Column(Double, default=5.0)  # Default search radius
    
    # Notification preferences
    notifications_enabled = Column(Boolean, default=False)
    notify_favorite_updates = Column(Boolean, default=True)
    
    # Additional preferences stored as JSON for flexibility
    extra = Column(JSONType, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="preferences")
    
    def __repr__(self):
        return f"<UserPreferences(user_id={self.user_id})>"

