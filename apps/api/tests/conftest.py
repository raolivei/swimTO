"""Pytest fixtures and configuration."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.models import Base
from app.database import get_db


# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create a test client with database dependency override."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def sample_facility(db):
    """Create a sample facility for testing."""
    from app.models import Facility
    
    facility = Facility(
        facility_id="TEST001",
        name="Test Pool",
        address="123 Test St",
        postal_code="M1M 1M1",
        district="Test District",
        latitude=43.6532,
        longitude=-79.3832,
        is_indoor=True,
        phone="416-555-0100",
        source="test"
    )
    db.add(facility)
    db.commit()
    db.refresh(facility)
    return facility


@pytest.fixture
def sample_session(db, sample_facility):
    """Create a sample session for testing."""
    from app.models import Session
    from datetime import date, time
    
    session = Session(
        facility_id=sample_facility.facility_id,
        swim_type="LANE_SWIM",
        date=date(2025, 11, 10),
        start_time=time(18, 0),
        end_time=time(20, 0),
        notes="Test session",
        source="test",
        hash="test-hash-123"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

