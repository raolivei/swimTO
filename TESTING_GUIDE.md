# Testing Guide: Map Markers and Schedule Data Fixes

## Prerequisites

1. Docker Desktop must be running
2. All containers should be up:
   ```bash
   docker-compose up -d
   ```
3. Verify containers are healthy:
   ```bash
   docker-compose ps
   ```

## Step 1: Run the Reseed Script

### Option A: Using Make
```bash
make reseed-db
```

### Option B: Using Shell Script
```bash
./scripts/reseed-database.sh
```

### Option C: Direct Execution
```bash
docker-compose exec api python /data-pipeline/jobs/reseed_all.py
```

### Expected Output
You should see:
```
======================================================================
COMPLETE DATABASE RESEEDING
======================================================================
Clearing existing data...
✓ Existing data cleared
Seeding facilities...
✓ Added 40 facilities
Generating varied demo schedules...
✓ Generated 4000+ varied demo sessions
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

## Step 2: Verify Database Contents

Run these commands to verify the data was seeded correctly:

### Check Facility Count
```bash
docker-compose exec -T db psql -U postgres -d pools -c "SELECT COUNT(*) as total_facilities FROM facilities;"
```
**Expected**: 40 facilities

### Check Facilities with Coordinates
```bash
docker-compose exec -T db psql -U postgres -d pools -c "SELECT COUNT(*) FROM facilities WHERE latitude IS NOT NULL AND longitude IS NOT NULL;"
```
**Expected**: 40 facilities with coordinates

### Check Session Count
```bash
docker-compose exec -T db psql -U postgres -d pools -c "SELECT COUNT(*) as total_sessions FROM sessions;"
```
**Expected**: 4000+ sessions

### Check Unique LANE_SWIM Times
```bash
docker-compose exec -T db psql -U postgres -d pools -c "SELECT DISTINCT start_time FROM sessions WHERE swim_type = 'LANE_SWIM' ORDER BY start_time;"
```
**Expected**: Multiple different times (06:00, 07:00, 08:30, 11:30, 12:00, 17:00, 17:30, 19:00, 20:00, 20:30)

### Check Facilities with LANE_SWIM
```bash
docker-compose exec -T db psql -U postgres -d pools -c "SELECT COUNT(DISTINCT facility_id) FROM sessions WHERE swim_type = 'LANE_SWIM';"
```
**Expected**: 40 facilities

## Step 3: Test the Frontend

### 3.1 Map View Tests

Navigate to: http://localhost:5173/map

#### Test 1: Markers Appear
- [ ] Map loads without errors
- [ ] Multiple markers (blue pins) appear on the map
- [ ] Markers are distributed across Toronto (not all in one location)

#### Test 2: Summary Display
- [ ] Bottom-left shows "Showing 40 pools with lane swim" (or similar count)
- [ ] Number is greater than 4

#### Test 3: Marker Interaction
- [ ] Click on a marker
- [ ] Popup appears with facility name
- [ ] Address is displayed
- [ ] "Next Session" shows a date and time
- [ ] Session count is displayed (e.g., "15 upcoming sessions")

#### Test 4: Sidebar Details
- [ ] Click a marker to open sidebar
- [ ] Sidebar shows facility name, address, phone
- [ ] Next session details are visible
- [ ] Close button (×) works

#### Test 5: Map Controls
- [ ] Zoom in/out buttons work
- [ ] Can pan/drag the map
- [ ] Clicking map (not marker) deselects facility

### 3.2 Schedule View Tests

Navigate to: http://localhost:5173/schedule

#### Test 6: Table View - Facility Count
- [ ] Switch to "Table View" (icon button at top)
- [ ] Table shows rows for many facilities (not just 4)
- [ ] Facilities are listed alphabetically
- [ ] Each row shows community center name

#### Test 7: Table View - Time Variety
- [ ] Look at Monday column
- [ ] Different facilities show different times
- [ ] NOT all showing "7:00 AM - 8:30 AM"
- [ ] See times like:
  - [ ] 6:00 AM - 7:30 AM
  - [ ] 7:00 AM - 8:30 AM
  - [ ] 8:30 AM - 10:00 AM
  - [ ] 5:00 PM - 6:30 PM
  - [ ] 7:00 PM - 8:30 PM

#### Test 8: Table View - Day Variety
- [ ] Look at a single facility row
- [ ] Different days show different times (not identical across all days)
- [ ] Some days may have multiple time slots
- [ ] Some days may show "—" (no session)

#### Test 9: List View
- [ ] Switch to "List View"
- [ ] Sessions are grouped by date
- [ ] Each date shows multiple facilities
- [ ] Time slots vary across facilities
- [ ] Swim type badges appear (LANE_SWIM, etc.)

#### Test 10: Filter by Swim Type
- [ ] Click "Recreational" filter button
- [ ] Sessions update to show recreational swims only
- [ ] Click "Lane Swim" to go back
- [ ] Table updates correctly

### 3.3 Console Check

Open browser Developer Tools (F12) and check Console tab:

- [ ] No errors in red
- [ ] No warnings about missing data
- [ ] API requests succeed (check Network tab)

## Step 4: API Endpoint Tests

Test the API directly using curl:

### Test Facilities Endpoint
```bash
curl -s 'http://localhost:8000/facilities?has_lane_swim=true' | python3 -m json.tool | head -50
```

**Expected**:
- JSON array with 40+ facility objects
- Each facility has `facility_id`, `name`, `latitude`, `longitude`
- Each facility has `session_count` > 0
- Each facility has `next_session` object

### Test Schedule Endpoint
```bash
curl -s 'http://localhost:8000/schedule?swim_type=LANE_SWIM&limit=20' | python3 -m json.tool
```

**Expected**:
- JSON array with 20 session objects
- Each session has `facility_id`, `date`, `start_time`, `end_time`
- Each session has `facility` object with details
- Different `start_time` values (not all the same)

### Test Health Endpoint
```bash
curl -s 'http://localhost:8000/health' | python3 -m json.tool
```

**Expected**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-11-05T..."
}
```

## Step 5: Mobile Responsiveness Tests

### 5.1 Using Browser DevTools
1. Open browser DevTools (F12)
2. Click device toolbar icon (mobile view)
3. Select "iPhone 12 Pro" or similar

#### Map View Mobile
- [ ] Map fills the screen
- [ ] Zoom controls are accessible
- [ ] Summary bar appears at bottom
- [ ] Clicking marker shows sidebar
- [ ] Sidebar overlays map (not side-by-side)
- [ ] Close button works on mobile

#### Schedule View Mobile
- [ ] View toggle buttons are responsive
- [ ] Table scrolls horizontally on mobile
- [ ] List view stacks nicely on mobile
- [ ] Filter buttons wrap appropriately
- [ ] Text is readable (not too small)

### 5.2 Using Actual Mobile Device
If you have a mobile device on the same network:

1. Find your computer's IP address:
   ```bash
   ipconfig getifaddr en0  # macOS
   hostname -I  # Linux
   ```

2. On mobile browser, navigate to:
   - Map: `http://[YOUR-IP]:5173/map`
   - Schedule: `http://[YOUR-IP]:5173/schedule`

3. Repeat mobile tests above

## Step 6: Edge Cases

### Test Empty States
These should already work, but verify:

1. **Schedule with no results**:
   - Apply filters that return no sessions
   - Should show "No sessions found" message
   - "Try adjusting your filters" hint appears

2. **Map zoom levels**:
   - Zoom all the way out - markers should cluster
   - Zoom all the way in - individual facilities visible
   - Markers don't overlap excessively

### Test Large Data
The database now has 4000+ sessions. Verify:

- [ ] Table view loads quickly (< 3 seconds)
- [ ] List view scrolling is smooth
- [ ] Map doesn't lag when panning
- [ ] No browser freezing or performance issues

## Step 7: Cross-Browser Testing

Test in multiple browsers if possible:

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (macOS)
- [ ] Edge

Each browser should:
- Display map correctly
- Show all 40+ facilities
- Display varied times
- Handle interactions smoothly

## Troubleshooting

### Issue: Map shows 0 pools
**Solution**: Reseed script may not have run. Check:
```bash
docker-compose logs api | grep "reseed"
```

### Issue: Only 4 facilities appear
**Solution**: Old data still in database. Clear and reseed:
```bash
docker-compose exec api python /data-pipeline/jobs/reseed_all.py
```

### Issue: Times still all the same
**Solution**: Check database directly:
```bash
docker-compose exec -T db psql -U postgres -d pools -c "SELECT DISTINCT start_time FROM sessions WHERE swim_type = 'LANE_SWIM';"
```
If only one time appears, reseed failed. Check logs.

### Issue: API returns empty array
**Solution**: Database connection issue. Check:
```bash
docker-compose logs api
docker-compose logs db
```

### Issue: Frontend not loading
**Solution**: Check if web container is running:
```bash
docker-compose ps web
docker-compose logs web
```

## Success Criteria

All bugs are fixed if:

✅ Map displays 40+ markers with location pins  
✅ Map summary shows "40+ pools with lane swim"  
✅ Schedule table shows 40+ facilities (not 4)  
✅ Lane swim times vary (6 AM, 7 AM, 8:30 AM, 5 PM, etc.)  
✅ Different days show different schedules  
✅ Each facility has varied times across the week  
✅ No console errors  
✅ API endpoints return data  
✅ Mobile view works correctly  

## Reporting Issues

If tests fail, provide:

1. **Step that failed**: Which test step?
2. **Expected behavior**: What should happen?
3. **Actual behavior**: What actually happened?
4. **Screenshots**: Especially for UI issues
5. **Console errors**: From browser DevTools
6. **API logs**: From `docker-compose logs api`
7. **Database query results**: From verification queries above

## Additional Verification

Run the existing test suites if they exist:

```bash
# API tests
cd apps/api
pytest

# Web tests
cd apps/web
npm test

# E2E tests
npm run test:e2e
```

## Cleanup

After testing, if you want to go back:

```bash
# Backup current state
docker-compose exec -T db pg_dump -U postgres pools > post_fix_backup.sql

# To restore later
docker-compose exec -T db psql -U postgres -d pools < post_fix_backup.sql
```

## Next Steps

Once all tests pass:

1. Mark testing TODO as complete
2. Create pull request to merge `fix/map-markers-and-schedule-data` into `dev`
3. Request code review
4. Plan for fixing the web scraper to get real data
5. Document any additional issues found during testing

