# Toronto Parks JSON API Integration

## Overview

Some Toronto community centers and pools are **NOT** included in the Toronto Open Data drop-in programs API. These facilities have their schedules available via a JSON API at:

```
https://www.toronto.ca/data/parks/live/locations/{location_id}/swim/
```

## Current Implementation

### Integrated Facilities

| Facility | Location ID | Status |
|----------|-------------|---------|
| Norseman Community School and Pool | 797 | ✅ Active |

### Architecture

```
data-pipeline/
├── sources/
│   ├── toronto_parks_json_api.py      # JSON API parser
│   ├── curated_json_facilities.py     # Facility registry
│   └── facility_scraper.py            # HTML scraper (legacy fallback)
└── jobs/
    └── daily_refresh.py               # Integration point (Step 4)
```

## How to Add a New Facility

### Step 1: Find the Location ID

1. Go to toronto.ca and find the facility's page
2. Look at the URL: `...location/?id=XXX&title=...`
3. The `id=XXX` is the location_id

Example:
```
https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=797&title=Norseman-Community-School-and-Pool
                                                                                                                     ^^^
                                                                                                            location_id = 797
```

### Step 2: Verify JSON API Availability

Test if the facility has JSON API data:

```bash
curl https://www.toronto.ca/data/parks/live/locations/{location_id}/swim/info.json
```

If you get JSON data back (not a 404), the facility is compatible!

### Step 3: Add to Curated List

Edit `data-pipeline/sources/curated_json_facilities.py`:

```python
JSON_API_FACILITIES = {
    # ... existing facilities ...
    
    "facility-name-normalized": {
        "location_id": 123,  # from Step 1
        "name": "Facility Full Name",
        "url": "https://www.toronto.ca/..."  # full URL
    },
}
```

**IMPORTANT:** The `facility_id` key (e.g., `"facility-name-normalized"`) must match the `facility_id` in your database. This is typically the facility name:
- Lowercase
- Spaces replaced with hyphens
- Apostrophes removed

Example: `"Norseman Community School and Pool"` → `"norseman-community-school-and-pool"`

### Step 4: Ensure Facility Exists in Database

The facility must exist in `data-pipeline/sources/toronto_pools_data.py`:

```python
TORONTO_INDOOR_POOLS = [
    # ... existing pools ...
    {
        "name": "Facility Full Name",
        "address": "123 Main St, Toronto, ON M1A 2B3",
        "postal_code": "M1A 2B3",
        "district": "District Name",
        "latitude": 43.xxxx,
        "longitude": -79.xxxx,
        "phone": "416-xxx-xxxx",
        "website": "https://www.toronto.ca/...",
        "is_indoor": True,
        "has_lane_swim": True,
    },
]
```

### Step 5: Test

```bash
cd data-pipeline
source ../.venv/bin/activate

# Test the specific facility
python -c "
from sources.toronto_parks_json_api import TorontoParksJSONAPI
api = TorontoParksJSONAPI()
sessions = api.fetch_facility_schedule(location_id=123, weeks_ahead=1)
print(f'Fetched {len(sessions)} sessions')
for s in sessions[:5]:
    print(f'{s[\"date\"]} {s[\"start_time\"]}-{s[\"end_time\"]} {s[\"swim_type\"]}')
"
```

### Step 6: Run Daily Refresh

```bash
cd data-pipeline
python jobs/daily_refresh.py
```

The JSON API scraper runs as **Step 4** after the Open Data API.

## How It Works

### Data Flow

1. **Fetch metadata** from `info.json` → get available weeks
2. **Fetch each week** from `week1.json`, `week2.json`, etc.
3. **Parse JSON structure**:
   ```json
   {
     "programs": [
       {
         "program": "Swim - Drop-In",
         "days": [
           {
             "title": "Lane Swim",
             "age": "13 years and over",
             "times": [
               {
                 "day": "tuesday",
                 "title": "07:15 AM - 08:10 AM"
               }
             ]
           }
         ]
       }
     ]
   }
   ```
4. **Generate sessions** for each date/time combination
5. **Insert to database** with deduplication (same hash strategy as Open Data API)

### UTF-16 Encoding

The JSON files are UTF-16 LE encoded with BOM. The parser handles this automatically:

```python
if content.startswith(b'\xff\xfe'):
    text = content.decode('utf-16-le')
else:
    text = content.decode('utf-8-sig')
text = text.lstrip('\ufeff')  # Strip BOM
```

### Swim Type Classification

The parser classifies swim types based on program/title keywords:

- `lane` → `LANE_SWIM`
- `leisure`, `family`, `recreational` → `RECREATIONAL`  
- `adult` → `ADULT_SWIM`
- `senior` → `SENIOR_SWIM`
- `aquatic`, `fitness` → `AQUATIC_FITNESS`
- Default → `OTHER`

## Troubleshooting

### "Facility not found in database"

The facility needs to be added to `toronto_pools_data.py` first. The `facility_id` in `curated_json_facilities.py` must match.

### "No sessions found"

1. Check if the JSON API is actually returning data:
   ```bash
   curl https://www.toronto.ca/data/parks/live/locations/{id}/swim/week1.json
   ```
2. Verify the location_id is correct
3. Check logs for parsing errors

### Wrong Times

1. Verify the source data on toronto.ca website
2. Check if the JSON API has been updated
3. Time parsing handles both 12-hour (AM/PM) and 24-hour formats

## Maintenance

### When to Use This vs Open Data API

- **Open Data API** (preferred): Most facilities, official dataset
- **JSON API** (this solution): Facilities missing from Open Data API

Always check Open Data API first. Only add facilities to the JSON API scraper if they're confirmed missing from the drop-in programs dataset.

### Weekly vs Multi-Week Fetching

Current default: 4 weeks ahead

Can be adjusted in `daily_refresh.py`:
```python
sessions = api.fetch_facility_schedule(location_id, weeks_ahead=4)
```

## References

- Open Data API: [`toronto_drop_in_api.py`](../data-pipeline/sources/toronto_drop_in_api.py)
- Legacy HTML Scraper: [`facility_scraper.py`](../data-pipeline/sources/facility_scraper.py)
- Daily Refresh Job: [`daily_refresh.py`](../data-pipeline/jobs/daily_refresh.py)

