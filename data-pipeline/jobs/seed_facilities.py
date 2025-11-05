#!/usr/bin/env python3
"""Seed database with comprehensive Toronto indoor pool facilities."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime
from loguru import logger
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import settings
from models import Base, Facility
from sources.toronto_pools_data import get_all_indoor_pools


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


def seed_facilities(db_session):
    """Seed database with curated facility data."""
    logger.info("Seeding database with Toronto indoor pool facilities")
    
    facilities = get_all_indoor_pools()
    logger.info(f"Found {len(facilities)} indoor pool facilities to seed")
    
    added = 0
    updated = 0
    skipped = 0
    
    for facility_data in facilities:
        # Generate facility_id from name (normalized)
        facility_id = facility_data['name'].lower().replace(' ', '-').replace("'", '').replace('.', '')
        
        # Check if exists
        existing = db_session.query(Facility).filter_by(facility_id=facility_id).first()
        
        if existing:
            # Update existing facility
            logger.info(f"Updating: {facility_data['name']}")
            existing.name = facility_data.get('name', existing.name)
            existing.address = facility_data.get('address', existing.address)
            existing.postal_code = facility_data.get('postal_code', existing.postal_code)
            existing.district = facility_data.get('district', existing.district)
            existing.latitude = facility_data.get('latitude', existing.latitude)
            existing.longitude = facility_data.get('longitude', existing.longitude)
            existing.is_indoor = facility_data.get('is_indoor', existing.is_indoor)
            existing.phone = facility_data.get('phone', existing.phone)
            existing.website = facility_data.get('website', existing.website)
            existing.source = 'curated'
            existing.updated_at = datetime.utcnow()
            updated += 1
        else:
            # Insert new facility
            logger.info(f"Adding: {facility_data['name']}")
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
    
    # Commit all changes
    db_session.commit()
    
    logger.success(f"✓ Seeding complete!")
    logger.info(f"  Added: {added} new facilities")
    logger.info(f"  Updated: {updated} existing facilities")
    logger.info(f"  Total facilities in database: {db_session.query(Facility).count()}")


def main():
    """Main entry point."""
    setup_logging()
    
    logger.info("=" * 70)
    logger.info("Toronto Indoor Pool Facilities - Database Seeder")
    logger.info("=" * 70)
    
    engine, db_session = setup_database()
    
    try:
        seed_facilities(db_session)
        logger.success("Database seeding completed successfully! 🏊")
    except Exception as e:
        logger.exception(f"Error during database seeding: {e}")
        sys.exit(1)
    finally:
        db_session.close()
        engine.dispose()


if __name__ == "__main__":
    main()

