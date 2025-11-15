#!/usr/bin/env python3
"""
Fix and update all facility website URLs from Toronto Open Data.

This job:
1. Downloads Toronto Parks & Recreation Facilities CSV from Open Data
2. Matches facilities in our DB to Toronto facilities
3. Updates facility websites with correct location URLs
"""
import sys
import csv
from pathlib import Path
from io import StringIO
from typing import Dict, Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from difflib import SequenceMatcher

from config import settings
from models import Base, Facility


# Toronto Open Data CSV URL
TORONTO_FACILITIES_CSV_URL = (
    "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/"
    "cbea3a67-9168-4c6d-8186-16ac1a795b5b/resource/"
    "61691590-4c3f-42d3-94c5-443ad3856f64/download/"
    "parks-and-recreation-facilities-4326.csv"
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
    # Remove common suffixes and prefixes
    suffixes = [
        ' arena and recreation centre',
        ' community recreation centre',
        ' community centre',
        ' community center',
        ' recreation centre',
        ' recreation center',
        ' neighbourhood services',
        ' aquatic centre',
        ' aquatic center',
        ' aquatic complex',
        ' district park pool',
        ' community gardens',
        ' clubhouse',
        ' community pool',
        ' and pool',
        ' arena',
        ' pool',
    ]
    
    for suffix in suffixes:
        if name.endswith(suffix):
            name = name[:-len(suffix)]
            break  # Only remove one suffix
    
    return name.strip()


def similarity_score(a: str, b: str) -> float:
    """Calculate similarity score between two strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def download_toronto_facilities() -> Dict[str, Dict]:
    """
    Download Toronto Parks & Recreation Facilities from Open Data.
    
    Returns dict mapping normalized names to facility data.
    """
    print("Downloading Toronto Open Data facilities CSV...")
    
    try:
        response = requests.get(TORONTO_FACILITIES_CSV_URL, timeout=30)
        response.raise_for_status()
    except Exception as e:
        print(f"Error downloading facilities CSV: {e}")
        return {}
    
    csv_data = StringIO(response.text)
    reader = csv.DictReader(csv_data)
    
    facilities = {}
    for row in reader:
        name = row['ASSET_NAME'].strip()
        location_id = row['LOCATIONID']
        url = row['URL']
        
        # Only include if it has a valid URL
        if url and '/location/?id=' in url:
            normalized = normalize_name(name)
            if normalized:
                facilities[normalized] = {
                    'name': name,
                    'location_id': location_id,
                    'url': url
                }
    
    print(f"Loaded {len(facilities)} facilities from Toronto Open Data")
    return facilities


def match_facility(our_facility: Facility, toronto_data: Dict) -> Optional[Dict]:
    """
    Match our facility to Toronto Open Data facility.
    
    Returns matched facility data dict or None.
    """
    our_name = normalize_name(our_facility.name)
    
    # Try exact normalized name match first
    if our_name in toronto_data:
        return toronto_data[our_name]
    
    # Try fuzzy matching
    best_match = None
    best_score = 0.0
    best_key = None
    
    for normalized_name, data in toronto_data.items():
        score = similarity_score(our_name, normalized_name)
        if score > best_score:
            best_score = score
            best_match = data
            best_key = normalized_name
    
    # Accept match if similarity is high enough
    if best_score >= 0.75:
        if best_score < 0.90:  # Log uncertain matches
            print(f"  Fuzzy match ({best_score:.2f}): '{our_name}' -> '{best_key}'")
        return best_match
    
    return None


def fix_all_urls(db_session, dry_run: bool = False):
    """
    Fix all facility URLs in the database.
    
    Args:
        db_session: Database session
        dry_run: If True, only show what would be updated
    """
    print("\n" + "="*60)
    print("FIXING ALL FACILITY URLS")
    print("="*60 + "\n")
    
    # Download Toronto facilities data
    toronto_facilities = download_toronto_facilities()
    
    if not toronto_facilities:
        print("ERROR: Failed to download facility data")
        return
    
    # Get all Toronto facilities (exclude non-Toronto like YMCA, JCC, etc.)
    non_toronto_patterns = ['ymca', 'jcc', 'canlan', 'athletic club', 'pan am', 'variety village']
    
    our_facilities = db_session.query(Facility).all()
    toronto_only = [
        f for f in our_facilities 
        if not any(pattern in f.name.lower() for pattern in non_toronto_patterns)
    ]
    
    print(f"Found {len(toronto_only)} Toronto facilities to process\n")
    
    updates = []
    no_match = []
    already_correct = []
    
    for facility in toronto_only:
        # Try to match with Toronto data
        matched = match_facility(facility, toronto_facilities)
        
        if matched:
            new_url = matched['url']
            
            # Check if already correct
            if facility.website == new_url:
                already_correct.append(facility.name)
                continue
            
            updates.append({
                'facility': facility,
                'location_id': matched['location_id'],
                'new_url': new_url,
                'matched_name': matched['name'],
                'old_url': facility.website
            })
            print(f"✓ {facility.name}")
            print(f"  Matched: {matched['name']}")
            print(f"  Location ID: {matched['location_id']}")
            print(f"  Old URL: {facility.website}")
            print(f"  New URL: {new_url}\n")
        else:
            no_match.append(facility.name)
            print(f"✗ {facility.name} - No match found\n")
    
    # Summary
    print("\n" + "="*60)
    print(f"SUMMARY: {'DRY RUN' if dry_run else 'UPDATES'}")
    print("="*60)
    print(f"Already correct: {len(already_correct)}")
    print(f"Will update: {len(updates)}")
    print(f"No match: {len(no_match)}")
    
    if already_correct:
        print("\nAlready have correct URLs:")
        for name in already_correct[:10]:  # Show first 10
            print(f"  ✓ {name}")
        if len(already_correct) > 10:
            print(f"  ... and {len(already_correct) - 10} more")
    
    if no_match:
        print("\nFacilities without matches:")
        for name in no_match:
            print(f"  ✗ {name}")
    
    if not dry_run and updates:
        print(f"\nUpdating {len(updates)} facilities in database...")
        for update in updates:
            facility = update['facility']
            facility.website = update['new_url']
        
        db_session.commit()
        print(f"✓ Updated {len(updates)} facility URLs in database")
    elif dry_run:
        print("\nDry run complete. Use --apply to update database.")


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Fix all facility URLs from Toronto Open Data')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Show what would be updated without making changes')
    parser.add_argument('--apply', action='store_true',
                       help='Apply updates to database')
    
    args = parser.parse_args()
    
    # Default to dry-run if neither flag is specified
    if not args.dry_run and not args.apply:
        args.dry_run = True
    
    db_session = setup_database()
    
    try:
        fix_all_urls(db_session, dry_run=args.dry_run)
        
        print("\n" + "="*60)
        print("✓ Complete!")
        print("="*60)
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db_session.close()


if __name__ == "__main__":
    main()
