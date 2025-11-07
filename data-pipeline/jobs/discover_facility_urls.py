#!/usr/bin/env python3
"""
Discover and update facility website URLs from Toronto Open Data.

This job:
1. Fetches facility data from Toronto Open Data Facilities API
2. Matches facilities in our DB to Toronto facilities
3. Updates facility websites with correct toronto.ca location URLs
"""
import sys
from pathlib import Path
from urllib.parse import quote

sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import settings
from models import Base, Facility
from sources.toronto_drop_in_api import TorontoDropInAPI


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


def normalize_name(name: str) -> str:
    """Normalize facility name for matching."""
    name = name.lower().strip()
    # Remove common suffixes
    name = name.replace(' community centre', '')
    name = name.replace(' community center', '')
    name = name.replace(' recreation centre', '')
    name = name.replace(' recreation center', '')
    name = name.replace(' pool', '')
    name = name.replace(' and pool', '')
    name = name.replace(' aquatic centre', '')
    name = name.replace(' aquatic center', '')
    name = name.replace(' aquatic complex', '')
    return name.strip()


def match_facility(our_facility: Facility, toronto_locations: list) -> dict:
    """
    Match our facility to Toronto Open Data location.
    
    Returns matched Toronto location dict or None.
    """
    our_name = normalize_name(our_facility.name)
    
    # Try exact normalized name match first
    for tl in toronto_locations:
        tl_name = normalize_name(
            tl.get('LocationName', '') or 
            tl.get('locationname', '') or 
            tl.get('Location Name', '')
        )
        if our_name == tl_name:
            logger.debug(f"Exact match: {our_facility.name} -> {tl.get('LocationName')}")
            return tl
    
    # Try postal code match
    if our_facility.postal_code:
        our_postal = our_facility.postal_code.replace(' ', '').upper()
        for tl in toronto_locations:
            tl_postal = (
                tl.get('PostalCode', '') or 
                tl.get('postalcode', '') or 
                tl.get('Postal Code', '')
            ).replace(' ', '').upper()
            if tl_postal and our_postal == tl_postal:
                logger.debug(f"Postal code match: {our_facility.name} -> {tl.get('LocationName')}")
                return tl
    
    # Try partial name match with address verification
    if our_facility.address:
        our_addr_lower = our_facility.address.lower()
        for tl in toronto_locations:
            tl_name = normalize_name(
                tl.get('LocationName', '') or 
                tl.get('locationname', '') or 
                tl.get('Location Name', '')
            )
            tl_addr = (
                tl.get('Address', '') or 
                tl.get('address', '') or 
                tl.get('StreetAddress', '')
            ).lower()
            
            # Check if names are similar and addresses match
            if (our_name in tl_name or tl_name in our_name) and tl_addr and tl_addr in our_addr_lower:
                logger.debug(f"Partial match: {our_facility.name} -> {tl.get('LocationName')}")
                return tl
    
    return None


def construct_facility_url(location_id: str, facility_name: str) -> str:
    """Construct toronto.ca facility URL."""
    # Create URL-safe title
    title = facility_name.replace(' ', '-')
    title = title.replace('&', 'and')
    # Remove special characters
    title = ''.join(c for c in title if c.isalnum() or c == '-')
    
    base_url = "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/"
    return f"{base_url}?id={location_id}&title={title}"


def discover_and_update_urls(db_session, dry_run: bool = False):
    """
    Discover facility URLs from Toronto Open Data and update database.
    
    Args:
        db_session: Database session
        dry_run: If True, only show what would be updated
    """
    logger.info("Fetching Toronto Open Data locations...")
    
    api = TorontoDropInAPI()
    toronto_locations_dict = api.fetch_locations()
    
    if not toronto_locations_dict:
        logger.error("Failed to fetch Toronto locations data")
        return
    
    # Convert dict to list for easier iteration
    toronto_locations = list(toronto_locations_dict.values())
    
    logger.success(f"Fetched {len(toronto_locations)} Toronto locations")
    
    # Get our facilities without URLs or with old complex/ URLs
    our_facilities = db_session.query(Facility).filter(
        (Facility.website.is_(None)) | 
        (Facility.website.like('%/complex/%'))
    ).all()
    
    logger.info(f"Found {len(our_facilities)} facilities to process")
    
    updates = []
    no_match = []
    
    for facility in our_facilities:
        # Skip non-Toronto facilities (YMCA, JCC, etc. with their own websites)
        if facility.website and not facility.website.startswith('https://www.toronto.ca'):
            continue
        
        matched = match_facility(facility, toronto_locations)
        
        if matched:
            # Get location ID (try various field names)
            location_id = (
                matched.get('LocationID') or 
                matched.get('locationid') or 
                matched.get('location_id') or
                matched.get('Location ID') or
                matched.get('_id')
            )
            
            if location_id:
                new_url = construct_facility_url(location_id, facility.name)
                matched_name = (
                    matched.get('LocationName', '') or 
                    matched.get('locationname', '') or 
                    matched.get('Location Name', '')
                )
                updates.append({
                    'facility': facility,
                    'location_id': location_id,
                    'new_url': new_url,
                    'matched_name': matched_name
                })
                logger.info(f"✓ {facility.name}")
                logger.info(f"  Matched: {matched_name}")
                logger.info(f"  Location ID: {location_id}")
                logger.info(f"  URL: {new_url}")
                logger.info("")
        else:
            no_match.append(facility.name)
    
    logger.info("=" * 60)
    logger.info(f"SUMMARY: {'DRY RUN' if dry_run else 'UPDATES'}")
    logger.info("=" * 60)
    logger.info(f"Found URLs for {len(updates)} facilities")
    logger.info(f"No match for {len(no_match)} facilities")
    
    if no_match:
        logger.warning("\nFacilities without matches:")
        for name in no_match:
            logger.warning(f"  - {name}")
    
    if not dry_run and updates:
        logger.info("\nUpdating database...")
        for update in updates:
            facility = update['facility']
            facility.website = update['new_url']
        
        db_session.commit()
        logger.success(f"✓ Updated {len(updates)} facility URLs in database")
    elif dry_run:
        logger.info("\nDry run complete. Use --apply to update database.")


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Discover facility URLs from Toronto Open Data')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Show what would be updated without making changes')
    parser.add_argument('--apply', action='store_true',
                       help='Apply updates to database')
    
    args = parser.parse_args()
    
    # Default to dry-run if neither flag is specified
    if not args.dry_run and not args.apply:
        args.dry_run = True
    
    setup_logging()
    logger.info("=" * 60)
    logger.info("Facility URL Discovery")
    logger.info("=" * 60)
    
    db_session = setup_database()
    
    try:
        discover_and_update_urls(db_session, dry_run=args.dry_run)
        
        logger.info("=" * 60)
        logger.success("✓ Complete!")
        logger.info("=" * 60)
    except Exception as e:
        logger.exception(f"Error during URL discovery: {e}")
        sys.exit(1)
    finally:
        db_session.close()


if __name__ == "__main__":
    main()

