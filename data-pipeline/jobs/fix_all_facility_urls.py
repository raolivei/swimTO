#!/usr/bin/env python3
"""
Fix and update all facility website URLs from Toronto Open Data.

This job:
1. Scrapes Toronto recreation centre listings page
2. Matches facilities in our DB to Toronto facilities
3. Updates facility websites with correct location URLs
4. Handles facilities not on the listings with fallback search
"""
import sys
import re
from pathlib import Path
from urllib.parse import quote
from typing import Dict, Optional, List

sys.path.insert(0, str(Path(__file__).parent.parent))

import requests
from bs4 import BeautifulSoup
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from difflib import SequenceMatcher

from config import settings
from models import Base, Facility


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


def get_known_facility_ids() -> Dict[str, str]:
    """
    Return known facility IDs from Toronto.ca.
    This is a manual mapping for facilities we know about.
    """
    # Manually verified IDs from toronto.ca
    return {
        # Format: normalize_name(facility) -> location_id
        'pam mcconnell': '2012',
        'joseph j piccininni': '509',
        'norseman': '797',
        'york': '3326',
        'swansea': '696',
        'trinity': '1167',
        'annette': '33',
        'etobicoke olympium': '261',
        'scarborough civic': '668',
        'regent park': '627',
        'moss park': '557',
        'scadding court': '669',
        'jimmie simpson': '476',
        'george bell': '314',
        'high park': '403',
        'matty eckler': '528',
        'giovanni caboto': '323',
        'wallace emerson': '1209',
        'macdonald-mowat': '500',
        'greenwood': '353',
        'albert campbell': '10',
        'centennial': '143',
        'malvern': '511',
        'woburn': '1236',
        'birchmount': '75',
        'leaside memorial': '491',
        'oriole': '590',
        'flemingdon park': '280',
        'goulding park': '338',
        'grandravine': '347',
        'mcgregor park': '532',
        'westway': '1229',
        'stan wadlow': '752',
        'mary mccormick': '522',
        'eastview': '256',
        'fairview': '270',
        'weston lions': '1225',
        'swansea town hall': '1085',
        'harrison': '382',
        'burnhamthorpe': '127',
        'albion': '13',
        "l'amoreaux": '481',
    }


def scrape_recreation_listings() -> Dict[str, Dict]:
    """
    Get facility data from known IDs and web search.
    
    Returns dict mapping normalized names to facility data with location_id.
    """
    print("Loading known facility IDs...")
    
    known_ids = get_known_facility_ids()
    facilities = {}
    
    for normalized_name, location_id in known_ids.items():
        # Convert normalized name to title case for display
        display_name = normalized_name.replace('-', ' ').title()
        facilities[normalized_name] = {
            'name': display_name,
            'location_id': location_id,
            'url': construct_facility_url(location_id, display_name)
        }
    
    print(f"Loaded {len(facilities)} known facility IDs")
    return facilities


def construct_facility_url(location_id: str, facility_name: str) -> str:
    """Construct toronto.ca facility URL."""
    # Create URL-safe title
    title = facility_name.replace(' ', '-')
    title = title.replace('&', 'and')
    # Remove special characters except hyphens
    title = ''.join(c for c in title if c.isalnum() or c == '-')
    
    base_url = "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/"
    return f"{base_url}?id={location_id}&title={title}"


def search_toronto_ca(facility_name: str) -> Optional[str]:
    """
    Fallback: Search toronto.ca for facility and try to find location ID.
    
    Returns location_id if found, None otherwise.
    """
    print(f"  Searching toronto.ca for: {facility_name}")
    
    # Try Google search for the facility on toronto.ca
    search_query = f"site:toronto.ca {facility_name} location"
    
    try:
        # Use DuckDuckGo HTML search (no API key needed)
        search_url = f"https://html.duckduckgo.com/html/?q={quote(search_query)}"
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(search_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            # Look for location ID in the HTML
            match = re.search(r'location/\?id=(\d+)', response.text)
            if match:
                location_id = match.group(1)
                print(f"    Found via search: id={location_id}")
                return location_id
    except Exception as e:
        print(f"    Search failed: {e}")
    
    return None


def match_facility(our_facility: Facility, scraped_data: Dict) -> Optional[Dict]:
    """
    Match our facility to scraped Toronto facility data.
    
    Returns matched facility data dict or None.
    """
    our_name = normalize_name(our_facility.name)
    
    # Try exact normalized name match first
    if our_name in scraped_data:
        return scraped_data[our_name]
    
    # Try fuzzy matching
    best_match = None
    best_score = 0.0
    best_key = None
    
    for normalized_name, data in scraped_data.items():
        score = similarity_score(our_name, normalized_name)
        if score > best_score:
            best_score = score
            best_match = data
            best_key = normalized_name
    
    # Accept match if similarity is high enough (lowered threshold for better matching)
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
    
    # Scrape Toronto recreation listings
    scraped_facilities = scrape_recreation_listings()
    
    if not scraped_facilities:
        print("ERROR: Failed to scrape facility data")
        return
    
    # Get all Toronto facilities (exclude non-Toronto like YMCA, JCC, etc.)
    non_toronto_patterns = ['ymca', 'jcc', 'canlan', 'athletic club', 'pan am', 'variety village']
    
    our_facilities = db_session.query(Facility).all()
    toronto_facilities = [
        f for f in our_facilities 
        if not any(pattern in f.name.lower() for pattern in non_toronto_patterns)
    ]
    
    print(f"Found {len(toronto_facilities)} Toronto facilities to process\n")
    
    updates = []
    no_match = []
    already_correct = []
    
    for facility in toronto_facilities:
        # Check if already has correct format URL
        if facility.website and '/location/?id=' in facility.website:
            already_correct.append(facility.name)
            continue
        
        # Try to match with scraped data
        matched = match_facility(facility, scraped_facilities)
        
        if matched:
            location_id = matched['location_id']
            new_url = construct_facility_url(location_id, facility.name)
            updates.append({
                'facility': facility,
                'location_id': location_id,
                'new_url': new_url,
                'matched_name': matched['name'],
                'old_url': facility.website
            })
            print(f"✓ {facility.name}")
            print(f"  Matched: {matched['name']}")
            print(f"  Location ID: {location_id}")
            print(f"  Old URL: {facility.website}")
            print(f"  New URL: {new_url}\n")
        else:
            # Try fallback search
            location_id = search_toronto_ca(facility.name)
            if location_id:
                new_url = construct_facility_url(location_id, facility.name)
                updates.append({
                    'facility': facility,
                    'location_id': location_id,
                    'new_url': new_url,
                    'matched_name': facility.name + " (via search)",
                    'old_url': facility.website
                })
                print(f"✓ {facility.name} (found via search)")
                print(f"  Location ID: {location_id}")
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
        for name in already_correct:
            print(f"  ✓ {name}")
    
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
    
    parser = argparse.ArgumentParser(description='Fix all facility URLs from Toronto recreation listings')
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

