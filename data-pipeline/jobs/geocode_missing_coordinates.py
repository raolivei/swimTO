#!/usr/bin/env python3
"""
Geocode facilities with missing lat/lon via OpenStreetMap Nominatim.

Fetches all facilities where latitude or longitude is NULL, geocodes their
addresses via Nominatim (rate-limited to 1 req/sec per OSM usage policy),
and updates the database.

Usage:
  python jobs/geocode_missing_coordinates.py
  python jobs/geocode_missing_coordinates.py --dry-run
"""
import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import requests
from loguru import logger
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import settings
from models import Base, Facility


NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "swimTO-geocoder/1.0 (https://github.com/raolivei/swimTO)"


def setup_logging():
    logger.remove()
    logger.add(
        sys.stderr,
        level="INFO",
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <7}</level> | <level>{message}</level>",
    )


def setup_database():
    engine = create_engine(settings.database_url)
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()


def geocode_address(address: str) -> tuple[float | None, float | None]:
    """
    Geocode an address via Nominatim. Returns (lat, lon) or (None, None).
    Rate-limited to 1 req/sec per OSM usage policy.
    """
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={"q": address, "format": "json", "limit": 1},
            headers={"User-Agent": USER_AGENT},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"])
        return None, None
    except Exception as e:
        logger.warning(f"Geocode failed for '{address}': {e}")
        return None, None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be updated without writing to DB",
    )
    args = parser.parse_args()

    setup_logging()
    db_session = setup_database()

    logger.info("Fetching facilities with missing coordinates...")
    missing = (
        db_session.query(Facility)
        .filter(
            (Facility.latitude.is_(None) | Facility.longitude.is_(None))
            & Facility.address.isnot(None)
        )
        .all()
    )
    logger.info(f"Found {len(missing)} facilities with missing lat/lon")

    if not missing:
        logger.success("No facilities need geocoding.")
        return

    updated = 0
    failed = 0

    for i, facility in enumerate(missing):
        logger.info(
            f"[{i+1}/{len(missing)}] Geocoding: {facility.name} ({facility.address})"
        )
        lat, lon = geocode_address(facility.address)

        if lat and lon:
            logger.success(f"  → Lat: {lat:.6f}, Lon: {lon:.6f}")
            if not args.dry_run:
                facility.latitude = lat
                facility.longitude = lon
            updated += 1
        else:
            logger.warning("  → No result")
            failed += 1

        # Respect Nominatim usage policy: max 1 req/sec
        if i < len(missing) - 1:
            time.sleep(1.1)

    if not args.dry_run:
        db_session.commit()
        logger.success(f"Updated {updated} facilities in the database.")
    else:
        logger.info(f"Dry run: would update {updated} facilities.")

    if failed:
        logger.warning(f"{failed} facilities could not be geocoded (no results).")

    db_session.close()


if __name__ == "__main__":
    main()
