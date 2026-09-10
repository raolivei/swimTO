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
#
# Outdoor pool entries below auto-generated from Toronto Open Data discovery
# (see jobs/discover_swim_facilities.py and issue #178 epic). All locations
# verified to publish swim schedules at .../swim/info.json.
JSON_API_FACILITIES = {
    "norseman-community-school-and-pool": {
        "location_id": 797,
        "name": "Norseman Community School and Pool",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=797&title=Norseman-Community-School-and-Pool"
    },
    "ourland-park-outdoor-pool": {
        "location_id": 857,
        "name": "Ourland Park Outdoor Pool",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=857&title=Ourland-Park"
    },
    # --- Outdoor pools (auto-discovered, issue #178) ---
    "alexandra-park": {
        "location_id": 31,
        "name": "Alexandra Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=31",
    },
    "amesbury-sports-complex": {
        "location_id": 480,
        "name": "Amesbury Sports Complex",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=480",
    },
    "amos-waites-park": {
        "location_id": 939,
        "name": "Amos Waites Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=939",
    },
    "broadlands-community-recreation-centre": {
        "location_id": 7,
        "name": "Broadlands Community Recreation Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=7",
    },
    "christie-pits-park": {
        "location_id": 196,
        "name": "Christie Pits Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=196",
    },
    "dennis-flynn-park": {
        "location_id": 2642,
        "name": "Dennis Flynn Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=2642",
    },
    "domenico-diluca-community-recreation-centre": {
        "location_id": 760,
        "name": "Domenico DiLuca Community Recreation Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=760",
    },
    "donald-d.-summerville-olympic-pools": {
        "location_id": 437,
        "name": "Donald D. Summerville Olympic Pools",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=437",
    },
    "driftwood-community-recreation-centre": {
        "location_id": 575,
        "name": "Driftwood Community Recreation Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=575",
    },
    "earlscourt-park": {
        "location_id": 514,
        "name": "Earlscourt Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=514",
    },
    "eringate-park": {
        "location_id": 840,
        "name": "Eringate Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=840",
    },
    "fairbank-memorial-park": {
        "location_id": 502,
        "name": "Fairbank Memorial Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=502",
    },
    "fairhaven-park": {
        "location_id": 1007,
        "name": "Fairhaven Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=1007",
    },
    "flagstaff-park": {
        "location_id": 963,
        "name": "Flagstaff Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=963",
    },
    "gihon-spring-park": {
        "location_id": 843,
        "name": "Gihon Spring Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=843",
    },
    "gord-and-irene-risk-community-recreation-centre": {
        "location_id": 642,
        "name": "Gord and Irene Risk Community Recreation Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=642",
    },
    "goulding-community-recreation-centre": {
        "location_id": 643,
        "name": "Goulding Community Recreation Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=643",
    },
    "grandravine-community-recreation-centre": {
        "location_id": 647,
        "name": "Grandravine Community Recreation Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=647",
    },
    "halbert-park": {
        "location_id": 768,
        "name": "Halbert Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=768",
    },
    "heron-park-community-recreation-centre": {
        "location_id": 633,
        "name": "Heron Park Community Recreation Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=633",
    },
    "high-park-pool": {
        "location_id": 77,
        "name": "High Park Pool",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=77",
    },
    "irving-w.-chapley-community-centre": {
        "location_id": 664,
        "name": "Irving W. Chapley Community Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=664",
    },
    "kidstown---water-park": {
        "location_id": 352,
        "name": "Kidstown - Water Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=352",
    },
    "knob-hill-park": {
        "location_id": 690,
        "name": "Knob Hill Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=690",
    },
    "lambton---kingsway-park": {
        "location_id": 847,
        "name": "Lambton - Kingsway Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=847",
    },
    "lawrence-heights-community-centre": {
        "location_id": 675,
        "name": "Lawrence Heights Community Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=675",
    },
    "leaside-park": {
        "location_id": 425,
        "name": "Leaside Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=425",
    },
    "ledbury-park": {
        "location_id": 678,
        "name": "Ledbury Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=678",
    },
    "maryvale-park": {
        "location_id": 704,
        "name": "Maryvale Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=704",
    },
    "mcgregor-park-community-centre": {
        "location_id": 506,
        "name": "McGregor Park Community Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=506",
    },
    "mitchell-field-community-centre": {
        "location_id": 693,
        "name": "Mitchell Field Community Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=693",
    },
    "monarch-park": {
        "location_id": 145,
        "name": "Monarch Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=145",
    },
    "north-toronto-memorial-community-centre": {
        "location_id": 189,
        "name": "North Toronto Memorial Community Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=189",
    },
    "northwood-community-centre": {
        "location_id": 703,
        "name": "Northwood Community Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=703",
    },
    "oakdale-community-centre": {
        "location_id": 780,
        "name": "Oakdale Community Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=780",
    },
    "oconnor-community-centre": {
        "location_id": 1093,
        "name": "O'Connor Community Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=1093",
    },
    "oriole-community-centre": {
        "location_id": 714,
        "name": "Oriole Community Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=714",
    },
    "park-lawn-park": {
        "location_id": 858,
        "name": "Park Lawn Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=858",
    },
    "parkway-forest-park": {
        "location_id": 718,
        "name": "Parkway Forest Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=718",
    },
    "pine-point-park": {
        "location_id": 859,
        "name": "Pine Point Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=859",
    },
    "riverdale-park-east": {
        "location_id": 343,
        "name": "Riverdale Park East",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=343",
    },
    "roding-community-centre": {
        "location_id": 744,
        "name": "Roding Community Centre",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=744",
    },
    "rotary-peace-park": {
        "location_id": 867,
        "name": "Rotary Peace Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=867",
    },
    "silver-creek-park": {
        "location_id": 877,
        "name": "Silver Creek Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=877",
    },
    "smithfield-park": {
        "location_id": 869,
        "name": "Smithfield Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=869",
    },
    "smythe-park": {
        "location_id": 504,
        "name": "Smythe Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=504",
    },
    "stan-wadlow-park": {
        "location_id": 421,
        "name": "Stan Wadlow Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=421",
    },
    "stanley-park-south---toronto": {
        "location_id": 2750,
        "name": "Stanley Park South - Toronto",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=2750",
    },
    "sunnyside-gus-ryder-outdoor-pool": {
        "location_id": 433,
        "name": "Sunnyside Gus Ryder Outdoor Pool",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=433",
    },
    "wedgewood-park---etobicoke": {
        "location_id": 773,
        "name": "Wedgewood Park - Etobicoke",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=773",
    },
    "west-deane-park": {
        "location_id": 873,
        "name": "West Deane Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=873",
    },
    "westgrove-park": {
        "location_id": 876,
        "name": "Westgrove Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=876",
    },
    "westmount-park": {
        "location_id": 2006,
        "name": "Westmount Park",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=2006",
    },
    "weston-lions-pool": {
        "location_id": 508,
        "name": "Weston Lions Pool",
        "url": "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=508",
    },
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

