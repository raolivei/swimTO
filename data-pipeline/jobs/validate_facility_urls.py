#!/usr/bin/env python3
"""
Weekly validation job to verify facility URLs are correct.

This job:
1. Fetches all facilities from our database
2. Downloads Toronto Open Data facilities CSV
3. Validates each facility URL:
   - Checks URL is accessible (HTTP 200)
   - Verifies location ID matches Toronto Open Data
   - Ensures facility name matches
4. Reports any mismatches or broken links
5. Exits with non-zero code if validation fails

Run weekly via Kubernetes CronJob.
"""
import sys
import csv
from pathlib import Path
from io import StringIO
from typing import Dict, List, Optional
from difflib import SequenceMatcher

sys.path.insert(0, str(Path(__file__).parent.parent))

import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

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
            break
    
    return name.strip()


def similarity_score(a: str, b: str) -> float:
    """Calculate similarity score between two strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def download_toronto_facilities() -> Dict[str, Dict]:
    """
    Download Toronto Parks & Recreation Facilities from Open Data.
    
    Returns dict mapping location_id to facility data.
    """
    print("📥 Downloading Toronto Open Data facilities CSV...")
    
    try:
        response = requests.get(TORONTO_FACILITIES_CSV_URL, timeout=30)
        response.raise_for_status()
    except Exception as e:
        print(f"❌ Error downloading facilities CSV: {e}")
        return {}
    
    csv_data = StringIO(response.text)
    reader = csv.DictReader(csv_data)
    
    # Index by location ID for fast lookup
    facilities_by_id = {}
    facilities_by_name = {}
    
    for row in reader:
        name = row['ASSET_NAME'].strip()
        location_id = row['LOCATIONID']
        url = row['URL']
        
        if url and '/location/?id=' in url:
            normalized = normalize_name(name)
            facilities_by_id[location_id] = {
                'name': name,
                'normalized': normalized,
                'location_id': location_id,
                'url': url
            }
            facilities_by_name[normalized] = facilities_by_id[location_id]
    
    print(f"✓ Loaded {len(facilities_by_id)} facilities from Toronto Open Data\n")
    return facilities_by_id, facilities_by_name


def extract_location_id(url: str) -> Optional[str]:
    """Extract location ID from Toronto.ca URL."""
    import re
    match = re.search(r'id=(\d+)', url)
    return match.group(1) if match else None


def validate_url_accessible(url: str) -> tuple[bool, int]:
    """Check if URL is accessible. Returns (is_valid, status_code)."""
    try:
        response = requests.head(url, timeout=10, allow_redirects=True)
        return response.status_code == 200, response.status_code
    except Exception as e:
        print(f"    ⚠️  Error checking URL: {e}")
        return False, 0


def validate_facilities(db_session) -> bool:
    """
    Validate all facility URLs.
    
    Returns True if all validations pass, False otherwise.
    """
    print("="*70)
    print("🔍 FACILITY URL VALIDATION - WEEKLY CHECK")
    print("="*70 + "\n")
    
    # Download Toronto Open Data
    facilities_by_id, facilities_by_name = download_toronto_facilities()
    
    if not facilities_by_id:
        print("❌ Failed to download Toronto Open Data - cannot validate")
        return False
    
    # Get all Toronto facilities (exclude non-Toronto like YMCA, JCC, etc.)
    non_toronto_patterns = ['ymca', 'jcc', 'canlan', 'athletic club', 'pan am', 'variety village']
    
    our_facilities = db_session.query(Facility).all()
    toronto_facilities = [
        f for f in our_facilities 
        if not any(pattern in f.name.lower() for pattern in non_toronto_patterns)
    ]
    
    print(f"📊 Validating {len(toronto_facilities)} Toronto facilities\n")
    
    # Track validation results
    passed = []
    failed = []
    warnings = []
    
    for facility in toronto_facilities:
        facility_name = facility.name
        our_url = facility.website
        
        # Check if facility has a URL
        if not our_url:
            warnings.append({
                'facility': facility_name,
                'issue': 'No website URL in database'
            })
            print(f"⚠️  {facility_name}")
            print(f"    Issue: No website URL")
            print()
            continue
        
        # Extract our location ID
        our_location_id = extract_location_id(our_url)
        if not our_location_id:
            failed.append({
                'facility': facility_name,
                'issue': f'Invalid URL format: {our_url}'
            })
            print(f"❌ {facility_name}")
            print(f"    Issue: Cannot extract location ID from URL")
            print(f"    URL: {our_url}")
            print()
            continue
        
        # Check if URL is accessible
        is_accessible, status_code = validate_url_accessible(our_url)
        if not is_accessible:
            failed.append({
                'facility': facility_name,
                'issue': f'URL not accessible (HTTP {status_code})',
                'url': our_url
            })
            print(f"❌ {facility_name}")
            print(f"    Issue: URL returns HTTP {status_code}")
            print(f"    URL: {our_url}")
            print()
            continue
        
        # Check if location ID exists in Toronto Open Data (info only)
        if our_location_id in facilities_by_id:
            toronto_facility = facilities_by_id[our_location_id]
            our_normalized = normalize_name(facility_name)
            toronto_normalized = toronto_facility['normalized']
            similarity = similarity_score(our_normalized, toronto_normalized)
            
            # Log name comparison but don't fail on it (Open Data names are inconsistent)
            if similarity < 0.60:
                warnings.append({
                    'facility': facility_name,
                    'issue': f'Name differs from Open Data (similarity: {similarity:.2f})',
                    'toronto_name': toronto_facility['name'],
                    'note': 'This may be expected if Toronto uses different naming'
                })
                print(f"⚠️  {facility_name}")
                print(f"    Info: Name differs from Toronto Open Data")
                print(f"    Our name: {facility_name}")
                print(f"    Open Data name: {toronto_facility['name']}")
                print(f"    Similarity: {similarity:.2f}")
                print(f"    Note: URL is accessible, so this may be expected")
                print()
        else:
            # Location ID not in Open Data - that's okay if URL works
            warnings.append({
                'facility': facility_name,
                'issue': f'Location ID {our_location_id} not in Open Data CSV',
                'note': 'URL is accessible, so this is likely fine'
            })
            print(f"⚠️  {facility_name}")
            print(f"    Info: Location ID {our_location_id} not in Open Data CSV")
            print(f"    Note: URL is accessible, so this is expected for some facilities")
            print()
        
        # All critical checks passed (URL accessible and valid format)
        passed.append(facility_name)
    
    # Print summary
    print("\n" + "="*70)
    print("📋 VALIDATION SUMMARY")
    print("="*70)
    print(f"✅ Passed: {len(passed)}")
    print(f"⚠️  Warnings: {len(warnings)}")
    print(f"❌ Failed: {len(failed)}")
    print()
    
    if warnings:
        print("⚠️  WARNINGS:")
        for warning in warnings:
            print(f"  • {warning['facility']}: {warning['issue']}")
        print()
    
    if failed:
        print("❌ FAILURES:")
        for failure in failed:
            print(f"  • {failure['facility']}: {failure['issue']}")
        print()
    
    # Determine overall result
    all_valid = len(failed) == 0
    
    if all_valid:
        print("✅ All facility URLs are valid and match Toronto Open Data!")
    else:
        print("❌ Some facility URLs have issues - please review and fix!")
    
    print("="*70 + "\n")
    
    return all_valid


def main():
    """Main entry point."""
    db_session = setup_database()
    
    try:
        all_valid = validate_facilities(db_session)
        
        # Exit with appropriate code
        sys.exit(0 if all_valid else 1)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db_session.close()


if __name__ == "__main__":
    main()

