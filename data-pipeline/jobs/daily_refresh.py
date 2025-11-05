#!/usr/bin/env python3
"""Daily refresh job to update pool schedules."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime, timedelta
from loguru import logger
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import settings
from models import Base, Facility, Session
from sources.open_data import OpenDataClient
from sources.pools_xml_parser import PoolsXMLParser
from sources.facility_scraper import FacilityScraper
from sources.toronto_pools_data import get_all_indoor_pools
from sources.toronto_drop_in_api import TorontoDropInAPI
from sources.toronto_parks_json_api import TorontoParksJSONAPI
from sources.curated_json_facilities import get_json_api_facilities


def setup_logging():
    """Configure logging."""
    logger.remove()
    logger.add(
        sys.stderr,
        level=settings.log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>"
    )
    logger.add(
        "logs/daily_refresh_{time}.log",
        rotation="1 day",
        retention="30 days",
        level="DEBUG"
    )


def setup_database():
    """Set up database connection."""
    engine = create_engine(settings.database_url)
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()


def ingest_curated_facilities(db_session):
    """Ingest curated facility data from toronto_pools_data."""
    logger.info("Ingesting curated facility data")
    
    facilities = get_all_indoor_pools()
    
    ingested = 0
    updated = 0
    for facility_data in facilities:
        # Generate facility_id from name (normalized)
        facility_id = facility_data['name'].lower().replace(' ', '-').replace("'", '')
        
        # Check if exists
        existing = db_session.query(Facility).filter_by(facility_id=facility_id).first()
        
        if existing:
            # Update
            existing.name = facility_data.get('name', existing.name)
            existing.address = facility_data.get('address', existing.address)
            existing.postal_code = facility_data.get('postal_code', existing.postal_code)
            existing.district = facility_data.get('district', existing.district)
            existing.latitude = facility_data.get('latitude', existing.latitude)
            existing.longitude = facility_data.get('longitude', existing.longitude)
            existing.is_indoor = facility_data.get('is_indoor', existing.is_indoor)
            existing.phone = facility_data.get('phone', existing.phone)
            existing.website = facility_data.get('website', existing.website)
            existing.updated_at = datetime.utcnow()
            updated += 1
        else:
            # Insert
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
                raw=facility_data
            )
            db_session.add(facility)
            ingested += 1
    
    db_session.commit()
    logger.info(f"Ingested {ingested} new facilities, updated {updated} existing facilities")


def ingest_facilities(db_session):
    """Ingest facility metadata from XML parser."""
    logger.info("Ingesting facility metadata from pools.xml")
    
    parser = PoolsXMLParser()
    facilities = parser.fetch_and_parse()
    
    ingested = 0
    for facility_data in facilities:
        facility_id = facility_data.get('facility_id')
        if not facility_id:
            continue
        
        # Check if exists
        existing = db_session.query(Facility).filter_by(facility_id=facility_id).first()
        
        if existing:
            # Update only if not from curated source
            if existing.source != 'curated':
                for key, value in facility_data.items():
                    if hasattr(existing, key) and value is not None:
                        setattr(existing, key, value)
                existing.updated_at = datetime.utcnow()
        else:
            # Insert
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
                source='pools_xml',
                raw=facility_data
            )
            db_session.add(facility)
        
        ingested += 1
    
    db_session.commit()
    logger.info(f"Processed {ingested} facilities from XML")


def ingest_official_schedules(db_session):
    """Ingest schedules from Toronto Open Data API (official source)."""
    logger.info("=" * 60)
    logger.info("Ingesting swim schedules from Toronto Open Data API")
    logger.info("=" * 60)
    
    api = TorontoDropInAPI()
    
    # Fetch data from API
    logger.info("Fetching drop-in programs...")
    programs = api.fetch_drop_in_programs()
    
    logger.info("Fetching locations...")
    locations = api.fetch_locations()
    
    if not programs:
        logger.error("No programs fetched from API")
        return
    
    # Filter for swim activities
    swim_programs = api.filter_swim_activities(programs)
    
    if not swim_programs:
        logger.warning("No swim programs found in drop-in data")
        return
    
    # Get all existing facilities for matching
    existing_facilities = db_session.query(Facility).all()
    
    total_sessions = 0
    total_inserted = 0
    total_skipped = 0
    facilities_processed = set()
    unmatched_locations = set()
    
    for program in swim_programs:
        location_id = api.get_field(program, 'Location ID', 'LocationID', 'Location_ID')
        location = locations.get(location_id)
        
        # Parse program into sessions
        sessions = api.parse_schedule_to_sessions(
            program,
            location,
            weeks_ahead=4
        )
        
        if not sessions:
            continue
        
        # Try to match facility
        facility_name = sessions[0]['facility_name']
        facility_id = api.match_facility(
            facility_name,
            location_id,
            location,
            existing_facilities
        )
        
        if not facility_id:
            unmatched_locations.add(f"{facility_name} (ID: {location_id})")
            total_skipped += len(sessions)
            continue
        
        facilities_processed.add(facility_id)
        
        # Insert sessions
        for session_data in sessions:
            try:
                # Generate hash for deduplication
                session_hash = api.generate_session_hash(
                    facility_id,
                    session_data['date'],
                    session_data['start_time'],
                    session_data['swim_type']
                )
                
                # Check if exists
                existing = db_session.query(Session).filter_by(hash=session_hash).first()
                
                if not existing:
                    # Insert new session
                    new_session = Session(
                        facility_id=facility_id,
                        swim_type=session_data['swim_type'],
                        date=session_data['date'],
                        start_time=session_data['start_time'],
                        end_time=session_data['end_time'],
                        notes=session_data.get('notes'),
                        source='toronto_open_data',
                        hash=session_hash
                    )
                    db_session.add(new_session)
                    total_inserted += 1
                    
                    logger.debug(
                        f"Inserted: {facility_name} - {session_data['swim_type']} "
                        f"on {session_data['date']} at {session_data['start_time']}"
                    )
                
                total_sessions += 1
                
            except Exception as e:
                logger.error(f"Error inserting session: {e}")
                db_session.rollback()
                continue
        
        # Commit after each program to avoid losing progress
        db_session.commit()
    
    logger.info("=" * 60)
    logger.success(f"✓ Processed {len(swim_programs)} swim programs")
    logger.success(f"✓ Matched {len(facilities_processed)} facilities")
    logger.success(f"✓ Processed {total_sessions} sessions")
    logger.success(f"✓ Inserted {total_inserted} new sessions")
    
    if total_skipped > 0:
        logger.warning(f"⚠ Skipped {total_skipped} sessions from {len(unmatched_locations)} unmatched locations")
        
        if unmatched_locations:
            logger.warning("Unmatched locations:")
            for loc in sorted(unmatched_locations):
                logger.warning(f"  - {loc}")
    
    logger.info("=" * 60)


def ingest_json_api_schedules(db_session):
    """
    Ingest schedules from Toronto Parks JSON API.
    
    This handles facilities that are NOT in the Toronto Open Data API,
    but have schedules available via the JSON API at:
    https://www.toronto.ca/data/parks/live/locations/{location_id}/swim/
    """
    logger.info("=" * 60)
    logger.info("Ingesting swim schedules from Toronto Parks JSON API")
    logger.info("=" * 60)
    
    api = TorontoParksJSONAPI()
    json_facilities = get_json_api_facilities()
    
    if not json_facilities:
        logger.info("No facilities configured for JSON API scraping")
        return
    
    logger.info(f"Found {len(json_facilities)} facilities to scrape via JSON API")
    
    total_sessions = 0
    total_inserted = 0
    total_skipped = 0
    
    for facility_id, facility_info in json_facilities.items():
        location_id = facility_info.get('location_id')
        facility_name = facility_info.get('name')
        
        if not location_id:
            logger.warning(f"No location_id for facility: {facility_id}")
            continue
        
        logger.info(f"Processing {facility_name} (location_id={location_id})")
        
        # Check if facility exists in database
        existing_facility = db_session.query(Facility).filter_by(facility_id=facility_id).first()
        if not existing_facility:
            logger.warning(f"Facility not found in database: {facility_id}")
            logger.warning(f"Please add it to toronto_pools_data.py first")
            continue
        
        try:
            # Fetch schedule data
            sessions = api.fetch_facility_schedule(location_id, weeks_ahead=4)
            
            if not sessions:
                logger.warning(f"No sessions found for {facility_name}")
                continue
            
            # Insert sessions
            for session_data in sessions:
                try:
                    # Generate hash for deduplication
                    import hashlib
                    hash_content = f"{facility_id}:{session_data['date']}:{session_data['start_time']}:{session_data['swim_type']}"
                    session_hash = hashlib.sha256(hash_content.encode()).hexdigest()
                    
                    # Check if exists
                    existing = db_session.query(Session).filter_by(hash=session_hash).first()
                    
                    if not existing:
                        # Insert new session
                        new_session = Session(
                            facility_id=facility_id,
                            swim_type=session_data['swim_type'],
                            date=session_data['date'],
                            start_time=session_data['start_time'],
                            end_time=session_data['end_time'],
                            notes=session_data.get('notes'),
                            source='toronto_parks_json_api',
                            hash=session_hash
                        )
                        db_session.add(new_session)
                        total_inserted += 1
                        
                        logger.debug(
                            f"Inserted: {facility_name} - {session_data['swim_type']} "
                            f"on {session_data['date']} at {session_data['start_time']}"
                        )
                    
                    total_sessions += 1
                    
                except Exception as e:
                    logger.error(f"Error inserting session: {e}")
                    db_session.rollback()
                    continue
            
            # Commit after each facility
            db_session.commit()
            logger.success(f"✓ Processed {len(sessions)} sessions for {facility_name}")
            
        except Exception as e:
            logger.error(f"Error processing {facility_name}: {e}")
            db_session.rollback()
            continue
    
    logger.info("=" * 60)
    logger.success(f"✓ Processed {total_sessions} sessions from JSON API")
    logger.success(f"✓ Inserted {total_inserted} new sessions")
    
    if total_skipped > 0:
        logger.warning(f"⚠ Skipped {total_skipped} sessions")
    
    logger.info("=" * 60)


def ingest_schedules_legacy(db_session):
    """
    Legacy web scraper (DEPRECATED - use ingest_official_schedules instead).
    
    This scraper is kept as a fallback but should not be used in production.
    The official Toronto Open Data API provides more accurate and complete data.
    """
    logger.warning("Using legacy web scraper (DEPRECATED)")
    logger.info("Ingesting swim schedules via web scraping")
    
    # Get all facilities with websites
    facilities = db_session.query(Facility).filter(
        Facility.website.isnot(None),
        Facility.is_indoor == True
    ).all()
    
    scraper = FacilityScraper()
    total_sessions = 0
    total_inserted = 0
    
    for facility in facilities:
        logger.info(f"Processing {facility.name}")
        
        try:
            facility_data = scraper.scrape_facility_page(facility.website)
            if facility_data and facility_data.get('sessions'):
                sessions = facility_data['sessions']
                
                for session_data in sessions:
                    # Parse time text into start/end times
                    time_text = session_data.get('time_text', '')
                    times = FacilityScraper.parse_time_text(time_text)
                    
                    if not times:
                        logger.debug(f"Could not parse time text: {time_text}")
                        continue
                    
                    start_time, end_time = times
                    
                    # Get the session date
                    # New format: session_data has 'date' field with actual date object
                    # Old format: session_data has 'day' field with day name that needs conversion
                    session_date = session_data.get('date')
                    
                    if session_date:
                        # New format: we have the exact date
                        # Project this schedule forward for the next week only
                        # This ensures "Next Week" navigation works even if the source
                        # page only shows the current week
                        dates = []
                        for week_offset in range(2):  # Current week + next week
                            future_date = session_date + timedelta(weeks=week_offset)
                            dates.append(future_date)
                    else:
                        # Old format: convert day name to dates for the next 2 weeks
                        day_name = session_data.get('day', '')
                        dates = FacilityScraper.day_name_to_dates(day_name, weeks_ahead=2)
                        
                        if not dates:
                            logger.debug(f"Could not parse day name: {day_name}")
                            continue
                    
                    swim_type = session_data.get('swim_type', 'OTHER')
                    
                    # Create a session for each date
                    for session_date in dates:
                        # Create session hash for deduplication
                        session_hash = FacilityScraper.generate_session_hash(
                            facility.facility_id,
                            str(session_date),
                            str(start_time),
                            swim_type
                        )
                        
                        # Check if exists
                        existing = db_session.query(Session).filter_by(hash=session_hash).first()
                        if not existing:
                            # Insert new session
                            new_session = Session(
                                facility_id=facility.facility_id,
                                swim_type=swim_type,
                                date=session_date,
                                start_time=start_time,
                                end_time=end_time,
                                source='web_scraper',
                                hash=session_hash
                            )
                            db_session.add(new_session)
                            total_inserted += 1
                            logger.debug(
                                f"Inserted session: {facility.name} - {swim_type} on {session_date} "
                                f"from {start_time} to {end_time}"
                            )
                        
                        total_sessions += 1
            
            # Commit after each facility to avoid losing all progress on error
            db_session.commit()
        
        except Exception as e:
            logger.error(f"Error processing {facility.name}: {e}")
            db_session.rollback()
    
    logger.info(f"Processed {total_sessions} sessions, inserted {total_inserted} new sessions")


def main():
    """Main entry point."""
    setup_logging()
    logger.info("=" * 60)
    logger.info("Starting daily refresh job")
    logger.info("=" * 60)
    
    db_session = setup_database()
    
    try:
        # Step 1: Ingest curated facility data
        ingest_curated_facilities(db_session)
        
        # Step 2: Update facility metadata from XML
        ingest_facilities(db_session)
        
        # Step 3: Update schedules from official Toronto Open Data API
        ingest_official_schedules(db_session)
        
        # Step 4: Update schedules from Toronto Parks JSON API (for facilities not in Open Data)
        ingest_json_api_schedules(db_session)
        
        logger.info("=" * 60)
        logger.success("✓ Daily refresh completed successfully!")
        logger.info("=" * 60)
    except Exception as e:
        logger.exception(f"Error during daily refresh: {e}")
        sys.exit(1)
    finally:
        db_session.close()


if __name__ == "__main__":
    main()

