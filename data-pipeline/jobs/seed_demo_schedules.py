#!/usr/bin/env python3
"""
DEPRECATED: Seed database with realistic demo swim schedule data.

⚠️  WARNING: This script generates FAKE demo data for testing only.
⚠️  DO NOT USE IN PRODUCTION!

The official Toronto Open Data API integration (toronto_drop_in_api.py) 
should be used instead via the daily_refresh.py job.

This script is kept for local development and testing purposes only.
"""
import sys
from pathlib import Path
from datetime import datetime, date, time, timedelta
from random import choice, randint

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import settings
from models import Base, Facility, Session


# Realistic swim times for different types
SCHEDULE_TEMPLATES = {
    'LANE_SWIM': [
        (time(6, 0), time(7, 30)),   # Early morning
        (time(7, 0), time(8, 30)),   # Morning
        (time(8, 30), time(10, 0)),  # Late morning
        (time(12, 0), time(13, 30)), # Lunch
        (time(17, 30), time(19, 0)), # Evening
        (time(19, 0), time(20, 30)), # Late evening
        (time(20, 30), time(22, 0)), # Night
    ],
    'RECREATIONAL': [
        (time(10, 0), time(11, 30)),
        (time(13, 0), time(14, 30)),
        (time(14, 30), time(16, 0)),
        (time(16, 0), time(17, 30)),
    ],
    'ADULT_SWIM': [
        (time(6, 30), time(8, 0)),
        (time(12, 30), time(14, 0)),
        (time(20, 0), time(21, 30)),
    ],
    'SENIOR_SWIM': [
        (time(9, 0), time(10, 30)),
        (time(10, 30), time(12, 0)),
        (time(13, 0), time(14, 30)),
    ],
}


def setup_logging():
    """Configure logging."""
    logger.remove()
    logger.add(
        sys.stderr,
        level="INFO",
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>"
    )


def setup_database():
    """Set up database connection."""
    engine = create_engine(settings.database_url)
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    return engine, SessionLocal()


def generate_session_hash(facility_id, session_date, start_time, swim_type):
    """Generate unique hash for session."""
    import hashlib
    content = f"{facility_id}:{session_date}:{start_time}:{swim_type}"
    return hashlib.sha256(content.encode()).hexdigest()


def seed_demo_schedules(db_session):
    """Generate realistic demo schedule data."""
    logger.info("Generating demo swim schedules")
    
    # Get all facilities
    facilities = db_session.query(Facility).all()
    logger.info(f"Found {len(facilities)} facilities")
    
    # Clear existing sessions
    existing_count = db_session.query(Session).count()
    if existing_count > 0:
        logger.info(f"Clearing {existing_count} existing sessions")
        db_session.query(Session).delete()
        db_session.commit()
    
    # Generate schedules for the next 4 weeks
    start_date = date.today()
    total_inserted = 0
    
    for facility in facilities:
        # Each facility gets 2-4 swim types
        num_swim_types = randint(2, 4)
        swim_types = ['LANE_SWIM'] + list(choice(list(SCHEDULE_TEMPLATES.keys())) 
                                          for _ in range(num_swim_types - 1))
        swim_types = list(set(swim_types))  # Remove duplicates
        
        logger.info(f"Generating schedule for {facility.name} ({len(swim_types)} swim types)")
        
        # Track sessions to avoid duplicates within same facility
        seen_sessions = set()
        
        for swim_type in swim_types:
            # Each swim type appears on 3-5 days per week
            days_of_week = list(range(7))  # 0=Monday, 6=Sunday
            active_days = list(set([choice(days_of_week) for _ in range(randint(3, 5))]))
            
            # Each swim type has 1-2 time slots (ensure unique)
            available_slots = SCHEDULE_TEMPLATES[swim_type]
            num_slots = min(randint(1, 2), len(available_slots))
            time_slots = [available_slots[i] for i in range(num_slots)]
            
            # Generate sessions for next 4 weeks
            for week in range(4):
                for day_offset in range(7):
                    session_date = start_date + timedelta(days=week * 7 + day_offset)
                    weekday = session_date.weekday()
                    
                    if weekday in active_days:
                        for start_time, end_time in time_slots:
                            # Create unique key for deduplication
                            session_key = (session_date, start_time, swim_type)
                            if session_key in seen_sessions:
                                continue
                            
                            seen_sessions.add(session_key)
                            
                            session_hash = generate_session_hash(
                                facility.facility_id,
                                session_date,
                                start_time,
                                swim_type
                            )
                            
                            new_session = Session(
                                facility_id=facility.facility_id,
                                swim_type=swim_type,
                                date=session_date,
                                start_time=start_time,
                                end_time=end_time,
                                source='demo_data',
                                hash=session_hash,
                                notes=None
                            )
                            db_session.add(new_session)
                            total_inserted += 1
        
        # Commit after each facility
        db_session.commit()
    
    logger.success(f"✓ Generated {total_inserted} demo sessions")
    logger.info(f"  Total sessions in database: {db_session.query(Session).count()}")


def main():
    """Main entry point."""
    setup_logging()
    
    logger.info("=" * 70)
    logger.error("⚠️  DEPRECATED: Demo Swim Schedule Generator ⚠️")
    logger.info("=" * 70)
    logger.error("This script generates FAKE demo data for testing only!")
    logger.error("DO NOT USE IN PRODUCTION!")
    logger.info("")
    logger.info("Use the official Toronto Open Data API integration instead:")
    logger.info("  python data-pipeline/jobs/daily_refresh.py")
    logger.info("=" * 70)
    logger.info("")
    
    # Require explicit confirmation
    response = input("Are you sure you want to generate FAKE demo data? (yes/no): ")
    if response.lower() != 'yes':
        logger.info("Aborted.")
        sys.exit(0)
    
    engine, db_session = setup_database()
    
    try:
        seed_demo_schedules(db_session)
        logger.success("Demo schedule generation completed! 🏊")
    except Exception as e:
        logger.exception(f"Error during demo schedule generation: {e}")
        sys.exit(1)
    finally:
        db_session.close()
        engine.dispose()


if __name__ == "__main__":
    main()

