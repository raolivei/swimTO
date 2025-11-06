#!/usr/bin/env python3
"""Fix incorrect facility website URLs."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from config import settings
from models import Base, Facility


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
    return SessionLocal()


def fix_facility_urls(db_session):
    """
    Fix incorrect facility website URLs.
    
    URLs like https://www.toronto.ca/data/parks/prd/facilities/complex/X/index.html
    are often incorrect because the complex IDs don't match the actual facilities.
    
    This script will NULL out these incorrect URLs. Correct URLs can be added
    manually to toronto_pools_data.py.
    """
    logger.info("Finding facilities with potentially incorrect URLs...")
    
    # Find facilities with complex/ URLs
    result = db_session.execute(text("""
        SELECT facility_id, name, website
        FROM facilities
        WHERE website LIKE '%/complex/%'
        ORDER BY facility_id
    """))
    
    facilities_to_fix = list(result.fetchall())
    
    if not facilities_to_fix:
        logger.info("No facilities found with complex/ URLs")
        return
    
    logger.info(f"Found {len(facilities_to_fix)} facilities with complex/ URLs")
    
    # Show what will be fixed
    logger.info("\nFacilities that will have URLs removed:")
    for facility_id, name, website in facilities_to_fix:
        logger.info(f"  {name}")
        logger.info(f"    Current URL: {website}")
        logger.info(f"    Will be set to: NULL")
        logger.info("")
    
    # Proceed with fix (non-interactive mode)
    logger.info(f"\nProceeding to remove {len(facilities_to_fix)} incorrect URLs...")
    
    # Update facilities
    updated = 0
    for facility_id, name, website in facilities_to_fix:
        facility = db_session.query(Facility).filter_by(facility_id=facility_id).first()
        if facility:
            facility.website = None
            updated += 1
            logger.debug(f"Updated {name}")
    
    db_session.commit()
    logger.success(f"✓ Updated {updated} facilities")
    
    logger.info("\nTo add correct URLs, update toronto_pools_data.py with the correct")
    logger.info("location URLs in the format:")
    logger.info("https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/")
    logger.info("parks-and-recreation-facilities/location/?id=XXX&title=FACILITY-NAME")


def main():
    """Main entry point."""
    setup_logging()
    logger.info("=" * 60)
    logger.info("Facility URL Fixer")
    logger.info("=" * 60)
    
    db_session = setup_database()
    
    try:
        fix_facility_urls(db_session)
        
        logger.info("=" * 60)
        logger.success("✓ Complete!")
        logger.info("=" * 60)
    except Exception as e:
        logger.exception(f"Error during URL fix: {e}")
        sys.exit(1)
    finally:
        db_session.close()


if __name__ == "__main__":
    main()

