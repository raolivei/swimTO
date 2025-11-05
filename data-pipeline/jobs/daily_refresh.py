#!/usr/bin/env python3
"""Daily refresh job to update pool schedules."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime
from loguru import logger
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import settings
from models import Base, Facility, Session
from sources.open_data import OpenDataClient
from sources.pools_xml_parser import PoolsXMLParser
from sources.facility_scraper import FacilityScraper


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


def ingest_facilities(db_session):
    """Ingest facility metadata."""
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
            # Update
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
    logger.info(f"Ingested {ingested} facilities")


def ingest_schedules(db_session):
    """Ingest swim schedules."""
    logger.info("Ingesting swim schedules")
    
    # Get all facilities with websites
    facilities = db_session.query(Facility).filter(
        Facility.website.isnot(None),
        Facility.is_indoor == True
    ).all()
    
    scraper = FacilityScraper()
    total_sessions = 0
    
    for facility in facilities:
        logger.info(f"Processing {facility.name}")
        
        try:
            facility_data = scraper.scrape_facility_page(facility.website)
            if facility_data and facility_data.get('sessions'):
                sessions = facility_data['sessions']
                
                for session_data in sessions:
                    # Create session hash for deduplication
                    session_hash = FacilityScraper.generate_session_hash(
                        facility.facility_id,
                        session_data.get('date', ''),
                        session_data.get('start_time', ''),
                        session_data.get('swim_type', '')
                    )
                    
                    # Check if exists
                    existing = db_session.query(Session).filter_by(hash=session_hash).first()
                    if not existing:
                        # Insert new session (simplified - needs proper date/time parsing)
                        # In production, you'd parse the session_data properly
                        logger.debug(f"Would insert session: {session_data}")
                        total_sessions += 1
        
        except Exception as e:
            logger.error(f"Error processing {facility.name}: {e}")
    
    logger.info(f"Processed {total_sessions} new sessions")


def main():
    """Main entry point."""
    setup_logging()
    logger.info("=" * 60)
    logger.info("Starting daily refresh job")
    logger.info("=" * 60)
    
    db_session = setup_database()
    
    try:
        # Step 1: Update facility metadata
        ingest_facilities(db_session)
        
        # Step 2: Update schedules
        ingest_schedules(db_session)
        
        logger.info("Daily refresh completed successfully")
    except Exception as e:
        logger.exception(f"Error during daily refresh: {e}")
        sys.exit(1)
    finally:
        db_session.close()


if __name__ == "__main__":
    main()

