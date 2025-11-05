#!/usr/bin/env python3
"""
Complete database reseeding script.
This ensures facilities and schedules are properly populated with consistent IDs and varied times.
"""
import sys
from pathlib import Path
from datetime import datetime, date, time, timedelta
from random import choice, randint, sample

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import hashlib

from config import settings
from models import Base, Facility, Session
from sources.toronto_pools_data import get_all_indoor_pools


# Realistic swim times for different types
SCHEDULE_TEMPLATES = {
    'LANE_SWIM': [
        (time(6, 0), time(7, 30)),   # Early morning
        (time(7, 0), time(8, 30)),   # Morning
        (time(8, 30), time(10, 0)),  # Late morning
        (time(11, 30), time(13, 0)), # Lunch
        (time(12, 0), time(13, 30)), # Lunch alt
        (time(17, 0), time(18, 30)), # Evening
        (time(17, 30), time(19, 0)), # Evening alt
        (time(19, 0), time(20, 30)), # Late evening
        (time(20, 0), time(21, 30)), # Night
        (time(20, 30), time(22, 0)), # Late night
    ],
    'RECREATIONAL': [
        (time(10, 0), time(11, 30)),
        (time(11, 0), time(12, 30)),
        (time(13, 0), time(14, 30)),
        (time(14, 0), time(15, 30)),
        (time(14, 30), time(16, 0)),
        (time(15, 0), time(16, 30)),
        (time(16, 0), time(17, 30)),
    ],
    'ADULT_SWIM': [
        (time(6, 30), time(8, 0)),
        (time(7, 30), time(9, 0)),
        (time(12, 30), time(14, 0)),
        (time(18, 30), time(20, 0)),
        (time(20, 0), time(21, 30)),
    ],
    'SENIOR_SWIM': [
        (time(9, 0), time(10, 30)),
        (time(10, 0), time(11, 30)),
        (time(10, 30), time(12, 0)),
        (time(11, 0), time(12, 30)),
        (time(13, 0), time(14, 30)),
        (time(14, 0), time(15, 30)),
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
    content = f"{facility_id}:{session_date}:{start_time}:{swim_type}"
    return hashlib.sha256(content.encode()).hexdigest()


def normalize_facility_id(name):
    """Generate consistent facility_id from name."""
    return name.lower().replace(' ', '-').replace("'", '').replace('.', '').replace(',', '')


def clear_existing_data(db_session):
    """Clear existing sessions and facilities."""
    logger.info("Clearing existing data...")
    
    session_count = db_session.query(Session).count()
    facility_count = db_session.query(Facility).count()
    
    if session_count > 0:
        logger.info(f"Deleting {session_count} existing sessions")
        db_session.query(Session).delete()
    
    if facility_count > 0:
        logger.info(f"Deleting {facility_count} existing facilities")
        db_session.query(Facility).delete()
    
    db_session.commit()
    logger.success("✓ Existing data cleared")


def seed_facilities(db_session):
    """Seed database with curated facility data."""
    logger.info("Seeding facilities...")
    
    facilities = get_all_indoor_pools()
    logger.info(f"Found {len(facilities)} indoor pool facilities")
    
    added = 0
    for facility_data in facilities:
        # Generate consistent facility_id
        facility_id = normalize_facility_id(facility_data['name'])
        
        # Insert new facility
        facility = Facility(
            facility_id=facility_id,
            name=facility_data.get('name', ''),
            address=facility_data.get('address'),
            postal_code=facility_data.get('postal_code'),
            district=facility_data.get('district'),
            latitude=facility_data.get('latitude'),
            longitude=facility_data.get('longitude'),
            is_indoor=facility_data.get('is_indoor', True),
            phone=facility_data.get('phone'),
            website=facility_data.get('website'),
            source='curated',
            raw=facility_data,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db_session.add(facility)
        added += 1
    
    db_session.commit()
    logger.success(f"✓ Added {added} facilities")
    return added


def seed_demo_schedules(db_session):
    """Generate realistic demo schedule data with VARIED times."""
    logger.info("Generating varied demo schedules...")
    
    # Get all facilities
    facilities = db_session.query(Facility).all()
    logger.info(f"Generating schedules for {len(facilities)} facilities")
    
    # Generate schedules for the next 4 weeks
    start_date = date.today()
    total_inserted = 0
    
    for facility in facilities:
        logger.info(f"  {facility.name}...")
        
        # Each facility gets LANE_SWIM plus 1-3 other swim types
        swim_types = ['LANE_SWIM']
        other_types = list(SCHEDULE_TEMPLATES.keys())
        other_types.remove('LANE_SWIM')
        num_other_types = randint(1, 3)
        swim_types.extend(sample(other_types, num_other_types))
        
        # Track sessions to avoid duplicates
        seen_sessions = set()
        
        for swim_type in swim_types:
            # Each swim type appears on 3-6 days per week (varied)
            days_of_week = list(range(7))  # 0=Monday, 6=Sunday
            num_active_days = randint(3, 6)
            active_days = sample(days_of_week, num_active_days)
            
            # Each swim type has 1-3 DIFFERENT time slots (ensuring variety)
            available_slots = SCHEDULE_TEMPLATES[swim_type]
            num_slots = randint(1, min(3, len(available_slots)))
            # Pick random non-overlapping slots
            time_slots = sample(available_slots, num_slots)
            
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
    
    logger.success(f"✓ Generated {total_inserted} varied demo sessions")
    return total_inserted


def verify_data(db_session):
    """Verify the seeded data."""
    logger.info("Verifying seeded data...")
    
    facility_count = db_session.query(Facility).count()
    session_count = db_session.query(Session).count()
    facilities_with_coords = db_session.query(Facility).filter(
        Facility.latitude.isnot(None),
        Facility.longitude.isnot(None)
    ).count()
    
    # Check unique times across all lane swim sessions
    from sqlalchemy import func, distinct
    lane_swim_times = db_session.query(
        distinct(Session.start_time)
    ).filter(
        Session.swim_type == 'LANE_SWIM'
    ).count()
    
    # Check facilities with lane swim
    facilities_with_lane = db_session.query(
        distinct(Session.facility_id)
    ).filter(
        Session.swim_type == 'LANE_SWIM'
    ).count()
    
    logger.info("=" * 70)
    logger.info("DATA VERIFICATION")
    logger.info("=" * 70)
    logger.info(f"✓ Total facilities: {facility_count}")
    logger.info(f"✓ Facilities with coordinates: {facilities_with_coords}")
    logger.info(f"✓ Facilities with LANE_SWIM: {facilities_with_lane}")
    logger.info(f"✓ Total sessions: {session_count}")
    logger.info(f"✓ Unique LANE_SWIM start times: {lane_swim_times}")
    logger.info("=" * 70)
    
    if facility_count == 0:
        logger.error("❌ No facilities in database!")
        return False
    if session_count == 0:
        logger.error("❌ No sessions in database!")
        return False
    if facilities_with_coords != facility_count:
        logger.warning(f"⚠ Only {facilities_with_coords}/{facility_count} facilities have coordinates")
    if lane_swim_times < 5:
        logger.warning(f"⚠ Only {lane_swim_times} unique LANE_SWIM times (should have more variety)")
    if facilities_with_lane < 10:
        logger.warning(f"⚠ Only {facilities_with_lane} facilities have LANE_SWIM")
    
    return True


def main():
    """Main entry point."""
    setup_logging()
    
    logger.info("=" * 70)
    logger.info("COMPLETE DATABASE RESEEDING")
    logger.info("=" * 70)
    logger.warning("This will DELETE ALL existing data and reseed with demo data")
    logger.info("=" * 70)
    
    engine, db_session = setup_database()
    
    try:
        # Step 1: Clear existing data
        clear_existing_data(db_session)
        
        # Step 2: Seed facilities
        facility_count = seed_facilities(db_session)
        
        # Step 3: Seed schedules with varied times
        session_count = seed_demo_schedules(db_session)
        
        # Step 4: Verify the data
        if verify_data(db_session):
            logger.success("=" * 70)
            logger.success("DATABASE RESEEDING COMPLETED SUCCESSFULLY! 🏊")
            logger.success("=" * 70)
        else:
            logger.error("Data verification failed!")
            sys.exit(1)
            
    except Exception as e:
        logger.exception(f"Error during database reseeding: {e}")
        db_session.rollback()
        sys.exit(1)
    finally:
        db_session.close()
        engine.dispose()


if __name__ == "__main__":
    main()

