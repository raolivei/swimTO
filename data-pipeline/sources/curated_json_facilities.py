"""
Curated list of facilities that use Toronto Parks JSON API for schedules.

These facilities are NOT in the Toronto Open Data drop-in programs API,
but have their schedules available at:
https://www.toronto.ca/data/parks/live/locations/{location_id}/swim/

To find location_id: Look at the facility URL on toronto.ca
Example: ...location/?id=797&title=Norseman... → location_id = 797
"""

# Facilities that need JSON API scraping
# Format: facility_id (from our DB) → location_id (from toronto.ca)
JSON_API_FACILITIES = {
    # Norseman Community School and Pool
    "norseman-community-school-and-pool": {
        "location_id": 797,
        "name": "Norseman Community School and Pool",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=797&title=Norseman-Community-School-and-Pool"
    },
    
    # Add more facilities here as they are discovered
    # Example format:
    # "facility-name": {
    #     "location_id": 123,
    #     "name": "Facility Name",
    #     "url": "https://www.toronto.ca/..."
    # },
}


def get_json_api_facilities():
    """Return list of facilities that use JSON API."""
    return JSON_API_FACILITIES


def get_location_id(facility_id: str) -> int:
    """Get location_id for a facility."""
    facility = JSON_API_FACILITIES.get(facility_id)
    return facility.get('location_id') if facility else None


def needs_json_api_scraping(facility_id: str) -> bool:
    """Check if a facility needs JSON API scraping."""
    return facility_id in JSON_API_FACILITIES

