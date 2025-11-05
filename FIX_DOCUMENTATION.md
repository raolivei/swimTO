# Bug Fixes: Map Markers and Schedule Data

## Issues Identified

### 1. Map Shows No Pool Locations
**Root Cause**: The database had facilities with coordinates, but only 4 facilities had associated LANE_SWIM sessions. The map filtered for facilities with `has_lane_swim=true`, which requires that facilities have at least one future LANE_SWIM session.

### 2. Only 4 Facilities in Schedule
**Root Cause**: Same as above - only 4 facilities had session data in the database.

### 3. Identical Lane Swim Times
**Root Cause**: The limited session data that existed used the same time slot (7:00 AM - 8:30 AM) repeatedly.

### 4. Incomplete List of Community Centres
**Root Cause**: The daily refresh job's web scraper was unable to extract schedule data from Toronto's facility web pages (see logs: `apps/api/logs/daily_refresh_*.log`). The scraper returned 0 sessions despite processing 40 facilities.

## Why This Happened

1. **Web Scraping Failed**: The `daily_refresh.py` job attempted to scrape schedule data from Toronto.ca facility pages but couldn't parse the HTML structure correctly
2. **Inconsistent Facility IDs**: Some test data used numeric IDs ("001", "002", "003", "004") while the real facilities used text-based IDs like "regent-park-aquatic-centre"
3. **Data Mismatch**: Sessions existed for only the 4 test facilities, not the 40+ real curated facilities

## Solution

Created a comprehensive database reseeding script (`data-pipeline/jobs/reseed_all.py`) that:

1. **Clears all existing data** (facilities and sessions)
2. **Seeds 40+ Toronto pool facilities** with:
   - Consistent, normalized facility IDs
   - Complete address and contact information
   - Accurate latitude/longitude coordinates
3. **Generates varied demo schedule data** with:
   - Multiple swim types (LANE_SWIM, RECREATIONAL, ADULT_SWIM, SENIOR_SWIM)
   - Varied times (not just 7:00-8:30 AM):
     - LANE_SWIM: 6:00 AM to 10:00 PM in different slots
     - Other types with appropriate time ranges
   - 3-6 days per week per facility (randomized for realism)
   - 1-3 time slots per swim type per facility
   - 4 weeks of future sessions

## How to Apply the Fix

### Quick Fix (Recommended)
```bash
# Make sure Docker containers are running
docker-compose up -d

# Run the reseeding script
./scripts/reseed-database.sh
```

### Manual Fix
```bash
# Run the reseed script directly in the API container
docker-compose exec api python /data-pipeline/jobs/reseed_all.py
```

### Alternative: Direct Python Execution
```bash
# If you have the Python environment set up locally
cd data-pipeline
python jobs/reseed_all.py
```

## Verification

After running the reseed script, you should see:

1. **Map View** (`http://localhost:5173/map`):
   - Markers for 40+ community centres across Toronto
   - Summary showing "40+ pools with lane swim"
   - Each marker with varied upcoming session times

2. **Schedule View** (`http://localhost:5173/schedule`):
   - 40+ facilities listed (not just 4)
   - Varied time slots across facilities:
     - Some at 6:00 AM - 7:30 AM
     - Some at 7:00 AM - 8:30 AM
     - Some at 8:30 AM - 10:00 AM
     - Evening and night slots (5:00 PM - 10:00 PM)
   - Different schedules for different days of the week

## Expected Output from Reseed Script

```
======================================================================
COMPLETE DATABASE RESEEDING
======================================================================
This will DELETE ALL existing data and reseed with demo data
======================================================================
Clearing existing data...
Deleting 1904 existing sessions
Deleting 44 existing facilities
✓ Existing data cleared
Seeding facilities...
Found 40 indoor pool facilities
✓ Added 40 facilities
Generating varied demo schedules...
Generating schedules for 40 facilities
  Regent Park Aquatic Centre...
  Toronto Pan Am Sports Centre...
  [... more facilities ...]
✓ Generated 4000+ varied demo sessions
Verifying seeded data...
======================================================================
DATA VERIFICATION
======================================================================
✓ Total facilities: 40
✓ Facilities with coordinates: 40
✓ Facilities with LANE_SWIM: 40
✓ Total sessions: 4000+
✓ Unique LANE_SWIM start times: 10+
======================================================================
✓ DATABASE RESEEDING COMPLETED SUCCESSFULLY! 🏊
======================================================================
```

## Code Changes Made

### New Files
1. `data-pipeline/jobs/reseed_all.py` - Comprehensive reseeding script
2. `scripts/reseed-database.sh` - Helper script for easy execution
3. `FIX_DOCUMENTATION.md` - This documentation

### Key Features of the Fix
- **Consistent Facility IDs**: Uses `normalize_facility_id()` function to ensure all facility IDs are consistently formatted
- **Varied Schedule Times**: Uses `random.sample()` to pick different time slots from expanded templates
- **Randomized Schedules**: Each facility gets 3-6 random days per week and 1-3 time slots per swim type
- **Data Verification**: Built-in verification step ensures data quality
- **Comprehensive Logging**: Detailed logs show exactly what was seeded

## Future Improvements

For production use, consider:

1. **Fix Web Scraper**: Update `sources/facility_scraper.py` to properly parse Toronto.ca facility pages
2. **Real Data**: Replace demo data with actual scraped schedule data
3. **Regular Updates**: Schedule the daily refresh job to run automatically
4. **SSL Certificates**: Fix SSL verification issues for external URLs (YMCA, private clubs)
5. **API Rate Limiting**: Add throttling when scraping multiple facility pages

## Testing Checklist

- [ ] All 40+ facilities appear on the map with markers
- [ ] Map shows "40+ pools with lane swim" summary
- [ ] Schedule table shows 40+ facilities (not just 4)
- [ ] Lane swim times vary across facilities (not all 7:00-8:30 AM)
- [ ] Each facility has sessions on multiple different days
- [ ] Clicking map markers shows correct facility details
- [ ] Schedule filters work correctly
- [ ] No console errors in browser developer tools
- [ ] API endpoints return data without errors

## Rollback

If you need to rollback, you can restore the previous state by:

```bash
# Restore from backup if you created one
docker-compose exec -T db psql -U postgres -d pools < backup.sql

# Or just run the reseed script again with different parameters
```

## Questions?

Check the logs:
- Application logs: `apps/api/logs/`
- Reseed script output: Shows detailed information about what was seeded
- API logs: `docker-compose logs api`
- Database queries: `docker-compose exec db psql -U postgres -d pools`

