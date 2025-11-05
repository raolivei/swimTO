# Quick Start: Applying the Bug Fixes

## TL;DR

```bash
# 1. Make sure Docker is running
docker-compose up -d

# 2. Run the fix
make reseed-db

# 3. Verify it worked
# Visit http://localhost:5173/map (should show 40+ pools)
# Visit http://localhost:5173/schedule (should show 40+ facilities with varied times)
```

## What This Fixes

✅ Map showing 0 pools → Now shows 40+  
✅ Only 4 facilities in schedule → Now shows 40+  
✅ All times showing 7:00-8:30 AM → Now shows varied times (6 AM - 10 PM)  
✅ Incomplete centre list → Now includes all Toronto pools

## Quick Verification

### Visual Check
1. **Map**: http://localhost:5173/map
   - Should see many blue markers across Toronto
   - Bottom-left should say "40 pools with lane swim"

2. **Schedule**: http://localhost:5173/schedule
   - Click "Table View" button
   - Should see 40+ rows (not just 4)
   - Times should vary (not all 7:00-8:30 AM)

### Database Check
```bash
# Should return 40
docker-compose exec -T db psql -U postgres -d pools -c "SELECT COUNT(*) FROM facilities;"

# Should return multiple different times
docker-compose exec -T db psql -U postgres -d pools -c "SELECT DISTINCT start_time FROM sessions WHERE swim_type = 'LANE_SWIM' ORDER BY start_time;"
```

## If Something Goes Wrong

1. **Docker not running**: Start it with `docker-compose up -d`
2. **Script fails**: Check logs with `docker-compose logs api`
3. **Map still empty**: Wait 10 seconds and refresh browser
4. **API errors**: Restart with `docker-compose restart api`

## More Information

- **Full details**: See `IMPLEMENTATION_COMPLETE.md`
- **Testing guide**: See `TESTING_GUIDE.md`
- **Technical docs**: See `FIX_DOCUMENTATION.md`
- **Executive summary**: See `BUGFIX_SUMMARY.md`

## That's It!

Run `make reseed-db`, verify the results, and you're done! 🏊

