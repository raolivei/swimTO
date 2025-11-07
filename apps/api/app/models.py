"""Database models."""
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, Date, Time, 
    BigInteger, Double, Text, ForeignKey, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

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
    phone = Column(String(20))
    website = Column(Text)
    source = Column(String(50))
    raw = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sessions = relationship("Session", back_populates="facility", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Facility(id={self.facility_id}, name={self.name})>"


class Session(Base):
    """Drop-in swim session."""
    
    __tablename__ = "sessions"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    facility_id = Column(String, ForeignKey("facilities.facility_id"), nullable=False)
    swim_type = Column(String(50), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    notes = Column(Text)
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
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255))
    google_id = Column(String(255), unique=True, nullable=False, index=True)
    picture = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    favorites = relationship("UserFavorite", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"


class UserFavorite(Base):
    """User's favorite facilities."""
    
    __tablename__ = "user_favorites"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
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

