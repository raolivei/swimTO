#!/usr/bin/env python3
"""Seed database with comprehensive Toronto indoor pool facilities."""
import sys
from pathlib import Path
import importlib

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import settings, CITY_SOURCES
from models import Base, Facility
from sources.facility_store import upsert_facility


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
    """Seed database with facilities from all registered city sources."""
    logger.info("Seeding database with pool facilities from registered cities")

    total_added = 0
    total_updated = 0

    for city, source_modules in CITY_SOURCES.items():
        logger.info(f"Processing city: {city}")

        for module_name in source_modules:
            try:
                module = importlib.import_module(f"sources.{module_name}")
                # Find the class that inherits from BaseSwimSource
                source_class = None
                for attr_name in dir(module):
                    attr = getattr(module, attr_name)
                    if isinstance(attr, type) and attr.__name__.endswith('Source') and attr.__module__ == module.__name__ and attr.__name__ != 'BaseSwimSource':
                        source_class = attr
                        break

                if not source_class:
                    logger.warning(f"No source class found in module {module_name}")
                    continue

                source = source_class()
                facilities = source.fetch_facilities()
                logger.info(f"Found {len(facilities)} facilities from {module_name}")

                added = 0
                updated = 0
                for facility_data in facilities:
                    existing = db_session.query(Facility).filter_by(facility_id=facility_data.facility_id).first()

                    if existing:
                        # Update existing facility
                        logger.info(f"Updating: {facility_data.name}")
                        updated += 1
                    else:
                        # Insert new facility
                        logger.info(f"Adding: {facility_data.name}")
                        added += 1
                    if facility_data.city != city:
                        raise ValueError(f"Source {module_name} returned a facility from {facility_data.city}")
                    upsert_facility(db_session, facility_data)

                db_session.commit()
                total_added += added
                total_updated += updated

            except Exception as e:
                logger.exception(f"Error processing source {module_name} for {city}: {e}")
                db_session.rollback()

    logger.success("✓ Seeding complete!")
    logger.info(f"  Added: {total_added} new facilities")
    logger.info(f"  Updated: {total_updated} existing facilities")
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

