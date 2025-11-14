#!/usr/bin/env python3
"""
Geocode all facility addresses to get accurate coordinates.
This script updates the coordinates in toronto_pools_data.py using Nominatim (OpenStreetMap).
"""
import json
import re
import time
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("❌ Error: requests library is required. Install with: pip install requests")
    sys.exit(1)

# Rate limiting: Nominatim allows 1 request per second
GEOCODE_DELAY = 1.1  # seconds between requests


def geocode_address(address: str) -> tuple[float, float] | None:
    """Geocode an address using Nominatim API."""
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": f"{address}, Toronto, Ontario, Canada",
            "format": "json",
            "limit": 1,
            "addressdetails": 1
        }
        headers = {
            "User-Agent": "SwimTO-Geocoding-Script/1.0 (contact: info@swimto.ca)"
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if data and len(data) > 0:
            lat = float(data[0]["lat"])
            lon = float(data[0]["lon"])
            return (lat, lon)
    except Exception as e:
        print(f"  ⚠️  Error: {e}")
    return None


def update_coordinate_in_file(content: str, facility_name: str, address: str, new_lat: float, new_lon: float) -> str:
    """Update coordinates for a specific facility in the file content."""
    # Escape special regex characters
    escaped_name = re.escape(facility_name)
    escaped_address = re.escape(address)
    
    # Pattern to match the facility entry with this name and address
    # We look for the latitude/longitude lines that come after the address
    pattern = (
        rf'(\{{[^{{}}]*?"name":\s*"{escaped_name}"[^{{}}]*?"address":\s*"{escaped_address}"'
        rf'[^{{}}]*?"latitude":\s*)[\d.-]+'
        rf'(\s*,\s*"longitude":\s*)[\d.-]+'
    )
    
    def replace_coords(match):
        return f'{match.group(1)}{new_lat}{match.group(2)}{new_lon}'
    
    new_content = re.sub(pattern, replace_coords, content, flags=re.DOTALL)
    
    # If that didn't work, try a simpler pattern just matching name
    if new_content == content:
        pattern2 = (
            rf'(\{{[^{{}}]*?"name":\s*"{escaped_name}"'
            rf'[^{{}}]*?"latitude":\s*)[\d.-]+'
            rf'(\s*,\s*"longitude":\s*)[\d.-]+'
        )
        new_content = re.sub(pattern2, replace_coords, content, flags=re.DOTALL)
    
    return new_content


def extract_facilities_from_file(file_path: Path) -> list[dict]:
    """Extract facility data from the Python file by parsing it."""
    content = file_path.read_text()
    
    # Find all facility dictionaries
    facilities = []
    
    # Pattern to match a facility dict
    # We'll look for entries between { and } that contain "name" and "address"
    pattern = r'\{\s*"name":\s*"([^"]+)"[^}]*"address":\s*"([^"]+)"[^}]*"latitude":\s*([\d.-]+)[^}]*"longitude":\s*([\d.-]+)'
    
    matches = re.finditer(pattern, content, re.DOTALL)
    
    for match in matches:
        facilities.append({
            "name": match.group(1),
            "address": match.group(2),
            "latitude": float(match.group(3)),
            "longitude": float(match.group(4)),
        })
    
    return facilities, content


def main():
    """Main geocoding function."""
    script_dir = Path(__file__).parent
    data_file = script_dir.parent / "sources" / "toronto_pools_data.py"
    
    if not data_file.exists():
        print(f"❌ Error: Data file not found at {data_file}")
        sys.exit(1)
    
    print(f"📖 Reading facilities from {data_file.name}...")
    try:
        facilities, original_content = extract_facilities_from_file(data_file)
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        sys.exit(1)
    
    print(f"✅ Found {len(facilities)} facilities\n")
    
    # Geocode each facility
    updated_count = 0
    failed_count = 0
    updated_content = original_content
    
    print(f"📍 Geocoding {len(facilities)} addresses...")
    print("   (Rate limited to 1 request/second - this will take ~1 minute)\n")
    
    for i, facility in enumerate(facilities, 1):
        name = facility["name"]
        address = facility["address"]
        old_lat = facility["latitude"]
        old_lon = facility["longitude"]
        
        print(f"{i}/{len(facilities)} 🔍 {name}")
        print(f"   Address: {address}")
        
        # Geocode
        result = geocode_address(address)
        
        if result:
            new_lat, new_lon = result
            print(f"   ✅ ({old_lat:.6f}, {old_lon:.6f}) → ({new_lat:.6f}, {new_lon:.6f})")
            
            # Update in content
            updated_content = update_coordinate_in_file(
                updated_content, name, address, new_lat, new_lon
            )
            
            updated_count += 1
        else:
            print(f"   ❌ Failed to geocode (keeping existing coordinates)")
            failed_count += 1
        
        # Rate limiting
        if i < len(facilities):
            time.sleep(GEOCODE_DELAY)
        print()
    
    # Backup and write
    backup_file = data_file.with_suffix(".py.backup")
    print(f"📦 Creating backup: {backup_file.name}")
    data_file.rename(backup_file)
    
    print(f"💾 Writing updated coordinates to {data_file.name}...")
    data_file.write_text(updated_content)
    
    print(f"\n✅ Complete!")
    print(f"   ✅ Updated: {updated_count} facilities")
    print(f"   ❌ Failed: {failed_count} facilities")
    print(f"   📦 Backup: {backup_file}")
    print(f"\n💡 Next step: Run 'make reseed' to update the database")


if __name__ == "__main__":
    main()
