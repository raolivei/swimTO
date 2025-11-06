# Facility URL Fix

## Issue

Facility links in the schedule and map views were pointing to incorrect Toronto facility pages. The URLs used the old format with sequential complex IDs that didn't match the actual facilities:

```
https://www.toronto.ca/data/parks/prd/facilities/complex/1/index.html  (WRONG)
https://www.toronto.ca/data/parks/prd/facilities/complex/2/index.html  (WRONG)
https://www.toronto.ca/data/parks/prd/facilities/complex/3/index.html  (WRONG)
...
```

These complex IDs (1, 2, 3, ...) were auto-generated and did not correspond to the correct facility pages.

## Root Cause

The incorrect URLs were stored in the database from a previous data migration. The `toronto_pools_data.py` file was already correct (most facilities had `website: None`), but the database had stale incorrect data.

## Solution

1. **Created fix script**: `data-pipeline/jobs/fix_facility_urls.py`
   - Identifies all facilities with incorrect `complex/` URLs
   - Removes these URLs by setting them to NULL
   - Prevents broken links in the UI

2. **Ran the fix**: Removed 42 incorrect facility URLs from the database

3. **Verified the fix**: Confirmed that:
   - Facilities without valid website URLs now have `website: NULL`
   - No broken links will appear in the UI
   - Facilities with valid external websites (e.g., Miles Nadal JCC, Toronto Pan Am Sports Centre) retain their correct URLs

4. **Data refresh**: Ran `daily_refresh.py` to ensure database is synced with correct curated data

## Correct URL Format

The new correct format for Toronto facility pages is:
```
https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=XXX&title=FACILITY-NAME
```

Where `XXX` is the actual location ID from Toronto's system (e.g., 797 for Norseman).

## Facilities After Fix

### Facilities WITH correct website URLs (8 total):
- **Canlan Ice Sports - York**: https://www.icesports.com/york
- **Miles Nadal JCC**: https://mnjcc.org
- **Norseman Community School and Pool**: https://www.toronto.ca/explore-enjoy/.../location/?id=797&title=Norseman-Community-School-and-Pool
- **North York YMCA**: https://ymcagta.org/find-a-y/north-york-ymca
- **Toronto Athletic Club**: https://www.tac.com
- **Toronto Pan Am Sports Centre**: https://www.tpasc.ca
- **Variety Village**: https://www.varietyvillage.ca
- **York Recreation Centre**: https://www.toronto.ca/explore-enjoy/.../location/?id=3326&title=York-Recreation-Centre

### Facilities WITHOUT website URLs:
- 41 facilities correctly have no website URL
- No broken links will appear for these facilities
- Users can still see facility information (name, address, phone, etc.)
- Users can click on addresses to open in Google Maps or Apple Maps

## Prevention

The fix script can be run anytime to clean up incorrect URLs:
```bash
cd /Users/roliveira/WORKSPACE/raolivei/swimTO
source .venv/bin/activate
python3 data-pipeline/jobs/fix_facility_urls.py
```

To add correct URLs for facilities, update `data-pipeline/sources/toronto_pools_data.py` with the proper location URLs.

## Related Files

- `data-pipeline/jobs/fix_facility_urls.py` - Fix script
- `data-pipeline/sources/toronto_pools_data.py` - Curated facility data
- `apps/web/src/pages/ScheduleView.tsx` - Schedule view with facility links
- `apps/web/src/pages/MapView.tsx` - Map view with facility links

## Date

November 6, 2025

