#!/usr/bin/env python3
"""Daily refresh job to update pool schedules."""
import sys
from pathlib import Path
import importlib

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import date, timedelta
from loguru import logger
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

from config import settings, CITY_SOURCES
from models import Base, Facility, Session
from sources.facility_store import upsert_facility

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

def refresh_city_data(db_session):
    """Refresh all city data from registered sources."""
    failed_sources = []
    for city, source_modules in CITY_SOURCES.items():
        logger.info(f"Refreshing data for city: {city}")

        for module_name in source_modules:
            try:
                module = importlib.import_module(f"sources.{module_name}")
                source_class = None
                for attr_name in dir(module):
                    attr = getattr(module, attr_name)
                    if isinstance(attr, type) and attr.__name__.endswith('Source') and attr.__module__ == module.__name__ and attr.__name__ != 'BaseSwimSource':
                        source_class = attr
                        break

                if not source_class:
                    logger.warning(f"No source class found in {module_name}")
                    continue

                source = source_class()

                # 1. Ingest/Update Facilities
                facilities = source.fetch_facilities()
                for f_data in facilities:
                    if f_data.city != city:
                        raise ValueError(f"Source {module_name} returned a facility from {f_data.city}")
                    upsert_facility(db_session, f_data)
                db_session.commit()

                # 2. Ingest sessions only for facilities owned by this source.
                # Facility-only sources must never erase schedules populated by
                # another source for the same city.
                if not source.provides_sessions:
                    continue

                facility_ids = [facility.facility_id for facility in facilities]
                if not facility_ids:
                    logger.warning(
                        f"Skipping session refresh for {module_name}: no facilities returned"
                    )
                    continue

                source_facilities = (
                    db_session.query(Facility)
                    .filter(Facility.facility_id.in_(facility_ids))
                    .all()
                )
                for facility in source_facilities:
                    sessions = source.fetch_sessions(
                        facility.facility_id, weeks=max(1, (settings.ingest_window_days + 6) // 7))
                    if not sessions:
                        logger.warning(f"No sessions returned for {facility.facility_id}; retaining existing schedules")
                        continue
                    # Validate before deleting, so bad upstream data cannot
                    # replace a facility's valid schedule.
                    for session in sessions:
                        if session.facility_id != facility.facility_id or session.end_time <= session.start_time:
                            raise ValueError(f"Invalid session for {facility.facility_id}")
                    db_session.query(Session).filter_by(facility_id=facility.facility_id).delete()
                    seen_hashes = set()
                    for s_data in sessions:
                        import hashlib
                        hash_content = f"{facility.facility_id}:{s_data.date}:{s_data.start_time}:{s_data.swim_type}"
                        session_hash = hashlib.sha256(hash_content.encode()).hexdigest()
                        if session_hash in seen_hashes:
                            continue
                        seen_hashes.add(session_hash)

                        new_session = Session(
                            facility_id=facility.facility_id,
                            swim_type=s_data.swim_type,
                            date=s_data.date,
                            start_time=s_data.start_time,
                            end_time=s_data.end_time,
                            notes=s_data.notes,
                            age_min=s_data.age_min,
                            age_max=s_data.age_max,
                            source=s_data.source,
                            hash=session_hash
                        )
                        db_session.add(new_session)
                db_session.commit()

            except Exception as e:
                logger.exception(f"Error refreshing source {module_name}: {e}")
                db_session.rollback()
                failed_sources.append(module_name)

    if failed_sources:
        raise RuntimeError(f"Refresh failed for sources: {', '.join(failed_sources)}")

def log_coverage_summary(db_session):
    """Log a one-line summary of data coverage after refresh."""
    today = date.today()
    week_end = today + timedelta(days=7)

    # Layer 1: curated entries (in-code source of truth)
    try:
        from sources.toronto_pools_data import TORONTO_INDOOR_POOLS
        curated_entries = len(TORONTO_INDOOR_POOLS)
    except Exception as exc:
        logger.warning(f"Could not count curated entries: {exc}")
        curated_entries = -1

    # Layer 2: facilities in the database, by source
    total_facilities = db_session.query(func.count(Facility.facility_id)).scalar() or 0
    by_source_rows = (
        db_session.query(Facility.source, func.count(Facility.facility_id))
        .group_by(Facility.source)
        .all()
    )
    by_source = {(src or "unknown"): count for src, count in by_source_rows}

    # Pool type breakdown
    indoor_only = (
        db_session.query(func.count(Facility.facility_id))
        .filter(Facility.has_indoor.is_(True), Facility.has_outdoor.is_(False))
        .scalar()
        or 0
    )
    outdoor_only = (
        db_session.query(func.count(Facility.facility_id))
        .filter(Facility.has_indoor.is_(False), Facility.has_outdoor.is_(True))
        .scalar()
        or 0
    )
    both = (
        db_session.query(func.count(Facility.facility_id))
        .filter(Facility.has_indoor.is_(True), Facility.has_outdoor.is_(True))
        .scalar()
        or 0
    )
    neither = total_facilities - indoor_only - outdoor_only - both

    # Sessions in the next 7 days
    sessions_next_7 = (
        db_session.query(func.count(Session.id))
        .filter(Session.date >= today, Session.date < week_end)
        .scalar()
        or 0
    )

    # Facilities with zero sessions in the next 7 days
    facilities_with_sessions = (
        db_session.query(Session.facility_id)
        .filter(Session.date >= today, Session.date < week_end)
        .distinct()
        .count()
    )
    facilities_zero_sessions = total_facilities - facilities_with_sessions

    # Layer 3: Open-Data swim locations
    open_data_locations = (
        db_session.query(Session.facility_id)
        .filter(Session.source == "toronto_open_data")
        .distinct()
        .count()
    )

    rule = "=" * 70
    logger.success(rule)
    logger.success("COVERAGE SUMMARY (post-refresh)")
    logger.success(rule)
    logger.success(f"Facilities (DB total): {total_facilities}")
    if by_source:
        source_str = ", ".join(
            f"{src}={count}" for src, count in sorted(by_source.items())
        )
        logger.success(f"  by source: {source_str}")
    logger.success(
        f"Pool type: indoor_only={indoor_only}, outdoor_only={outdoor_only}, "
        f"both={both}, neither={neither}"
    )
    logger.success(
        f"Sessions next 7 days ({today} -> {week_end - timedelta(days=1)}): "
        f"{sessions_next_7}"
    )
    if facilities_zero_sessions > 0:
        logger.warning(
            f"Facilities with ZERO sessions next 7 days: "
            f"{facilities_zero_sessions} / {total_facilities} (red flag)"
        )
    else:
        logger.success(
            f"Facilities with zero sessions next 7 days: 0 / {total_facilities}"
        )
    logger.success(
        f"Layers (issue #178): curated={curated_entries}, "
        f"facilities_in_db={total_facilities}, "
        f"open_data_swim_locations={open_data_locations}"
    )
    logger.success(rule)

def main():
    """Main entry point."""
    setup_logging()
    logger.info("=" * 60)
    logger.info("Starting daily refresh job")
    logger.info("=" * 60)

    db_session = setup_database()

    try:
        refresh_city_data(db_session)

        # Emit a coverage summary
        try:
            log_coverage_summary(db_session)
        except Exception as exc:
            logger.warning(f"Could not emit coverage summary: {exc}")

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
