#!/usr/bin/env python3
"""
Validate facility data for address/coordinate mismatches.

This script checks for:
1. Postal codes that don't match the expected district
2. Coordinates that are significantly different from expected location
3. Facilities with toronto.ca URLs that can be validated against the official source
"""

import sys
sys.path.insert(0, '/Users/roliveira/WORKSPACE/raolivei/swimTO/data-pipeline')

from sources.toronto_pools_data import TORONTO_INDOOR_POOLS

# Toronto postal code prefix to general area mapping
POSTAL_CODE_AREAS = {
    'M1': 'Scarborough',
    'M2': 'North York',
    'M3': 'North York',
    'M4': 'East York / Downtown East',
    'M5': 'Downtown',
    'M6': 'West End / York',
    'M7': 'Etobicoke (Rexdale)',
    'M8': 'Etobicoke (South)',
    'M9': 'Etobicoke / North York West',
}

# Expected coordinate ranges for Toronto (rough bounds)
TORONTO_BOUNDS = {
    'lat_min': 43.58,
    'lat_max': 43.86,
    'lon_min': -79.65,
    'lon_max': -79.10,
}

# District to expected postal code prefixes
DISTRICT_POSTAL_PREFIXES = {
    'Scarborough': ['M1'],
    'North York': ['M2', 'M3', 'M9'],
    'East York': ['M4'],
    'Toronto Centre': ['M4', 'M5', 'M6'],
    'Toronto East': ['M4', 'M5'],
    'Toronto West': ['M6', 'M8'],
    'Etobicoke': ['M8', 'M9'],
    'Etobicoke York': ['M6', 'M9'],
}

def validate_coordinates(lat, lon, name):
    """Check if coordinates are within Toronto bounds."""
    issues = []
    
    if lat < TORONTO_BOUNDS['lat_min'] or lat > TORONTO_BOUNDS['lat_max']:
        issues.append(f"Latitude {lat} outside Toronto bounds")
    
    if lon < TORONTO_BOUNDS['lon_min'] or lon > TORONTO_BOUNDS['lon_max']:
        issues.append(f"Longitude {lon} outside Toronto bounds")
    
    return issues

def validate_postal_code_district(postal_code, district, name):
    """Check if postal code matches expected district."""
    issues = []
    
    if not postal_code or len(postal_code) < 2:
        issues.append("Missing or invalid postal code")
        return issues
    
    prefix = postal_code[:2]
    expected_prefixes = DISTRICT_POSTAL_PREFIXES.get(district, [])
    
    if expected_prefixes and prefix not in expected_prefixes:
        expected_area = POSTAL_CODE_AREAS.get(prefix, 'Unknown')
        issues.append(f"Postal code {postal_code} ({expected_area}) doesn't match district '{district}'")
    
    return issues

def check_coordinate_vs_address(lat, lon, address, postal_code, name):
    """
    Check for obvious coordinate/address mismatches.
    This is a rough heuristic based on longitude (east-west position).
    """
    issues = []
    
    if not postal_code or len(postal_code) < 2:
        return issues
    
    prefix = postal_code[:2]
    
    # Rough longitude expectations by postal code
    # Scarborough (M1): east of -79.30
    # Downtown (M5): around -79.35 to -79.42
    # Etobicoke (M8, M9): west of -79.50
    
    if prefix == 'M1' and lon < -79.35:
        issues.append(f"Postal code {postal_code} (Scarborough) but longitude {lon} suggests western Toronto")
    
    if prefix in ['M8', 'M9'] and lon > -79.45:
        issues.append(f"Postal code {postal_code} (Etobicoke) but longitude {lon} suggests eastern Toronto")
    
    if prefix == 'M5' and (lon < -79.45 or lon > -79.30):
        issues.append(f"Postal code {postal_code} (Downtown) but longitude {lon} seems off")
    
    return issues

def validate_all_facilities():
    """Validate all facilities and report issues."""
    all_issues = []
    
    for facility in TORONTO_INDOOR_POOLS:
        name = facility.get('name', 'Unknown')
        lat = facility.get('latitude')
        lon = facility.get('longitude')
        postal_code = facility.get('postal_code', '')
        district = facility.get('district', '')
        address = facility.get('address', '')
        website = facility.get('website', '')
        
        issues = []
        
        # Check coordinates
        if lat and lon:
            issues.extend(validate_coordinates(lat, lon, name))
            issues.extend(check_coordinate_vs_address(lat, lon, address, postal_code, name))
        else:
            issues.append("Missing coordinates")
        
        # Check postal code vs district
        issues.extend(validate_postal_code_district(postal_code, district, name))
        
        if issues:
            all_issues.append({
                'name': name,
                'address': address,
                'postal_code': postal_code,
                'district': district,
                'lat': lat,
                'lon': lon,
                'website': website,
                'issues': issues,
            })
    
    return all_issues

def main():
    print("=" * 80)
    print("SWIMTO FACILITY DATA VALIDATION REPORT")
    print("=" * 80)
    print()
    
    issues = validate_all_facilities()
    
    if not issues:
        print("✅ No issues found!")
        return
    
    print(f"⚠️  Found {len(issues)} facilities with potential issues:\n")
    
    for i, item in enumerate(issues, 1):
        print(f"{i}. {item['name']}")
        print(f"   Address: {item['address']}")
        print(f"   Postal Code: {item['postal_code']} | District: {item['district']}")
        print(f"   Coordinates: ({item['lat']}, {item['lon']})")
        if item['website']:
            print(f"   Website: {item['website']}")
        print(f"   Issues:")
        for issue in item['issues']:
            print(f"   - ❌ {issue}")
        print()
    
    print("=" * 80)
    print("RECOMMENDED ACTIONS:")
    print("=" * 80)
    print("1. Verify each flagged facility against toronto.ca website")
    print("2. Use Google Maps to verify coordinates match the address")
    print("3. Update incorrect data in toronto_pools_data.py")
    print("4. Re-run this validation script after fixes")
    print()

if __name__ == "__main__":
    main()
