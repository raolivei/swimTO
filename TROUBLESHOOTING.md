# Troubleshooting Guide

## Quick Fixes

### App shows "Failed to Load Facilities"

**Symptoms:** Map and Schedule pages show network errors

**Solution:**
```bash
# 1. Check if containers are running
docker ps

# 2. Create database tables if missing
docker exec swimto-api python -c "from app.database import engine; from app.models import Base; Base.metadata.create_all(bind=engine)"

# 3. Add sample data
docker exec -i swimto-api python <<'EOF'
from app.database import SessionLocal
from app.models import Facility, Session
from datetime import date, time, timedelta

db = SessionLocal()
facilities = [
    {"facility_id": "001", "name": "Regent Park Aquatic Centre", "address": "402 Shuter St, Toronto", "latitude": 43.6614, "longitude": -79.3658, "district": "Downtown", "is_indoor": True, "phone": "416-392-0740"},
    {"facility_id": "002", "name": "North Toronto Memorial Community Centre", "address": "200 Eglinton Ave W, Toronto", "latitude": 43.7064, "longitude": -79.4000, "district": "Midtown", "is_indoor": True, "phone": "416-395-7930"},
    {"facility_id": "003", "name": "Etobicoke Olympium", "address": "590 Rathburn Rd, Etobicoke", "latitude": 43.6527, "longitude": -79.5739, "district": "Etobicoke", "is_indoor": True, "phone": "416-394-8345"},
    {"facility_id": "004", "name": "Scarborough Centennial Recreation Centre", "address": "1967 Ellesmere Rd, Scarborough", "latitude": 43.7350, "longitude": -79.2425, "district": "Scarborough", "is_indoor": True, "phone": "416-396-4040"},
]
for f_data in facilities:
    db.merge(Facility(**f_data))

today = date.today()
for i in range(7):
    session_date = today + timedelta(days=i)
    for facility in facilities:
        db.add(Session(facility_id=facility["facility_id"], date=session_date, start_time=time(7, 0), end_time=time(8, 30), swim_type="LANE_SWIM"))
db.commit()
print(f"✅ Added {len(facilities)} facilities")
EOF

# 4. Restart API
docker restart swimto-api && sleep 3

# 5. Test
curl -sL "http://localhost:8000/facilities?has_lane_swim=true" | grep -c name
```

### API returns empty data

Check database has data:
```bash
docker exec swimto-api python -c "from app.database import SessionLocal; from app.models import Facility; print(SessionLocal().query(Facility).count())"
```

### Frontend can't reach API

Check VITE_API_URL in docker-compose.yml:
```yaml
environment:
  VITE_API_URL: http://localhost:8000
```

## Common Issues

### 1. Database tables don't exist
```
sqlalchemy.exc.ProgrammingError: relation "facilities" does not exist
```
**Fix:** Run table creation (see above)

### 2. Pydantic validation errors
```
PydanticUndefinedAnnotation: name 'SessionResponse' is not defined
```
**Fix:** Already fixed in schemas.py with `model_rebuild()`

### 3. Missing dependencies in data pipeline
```
ModuleNotFoundError: No module named 'requests'
```
**Fix:** 
```bash
docker exec swimto-api pip install requests beautifulsoup4 lxml
```

### 4. City of Toronto XML 404
```
Error fetching pools.xml: 404 Client Error
```
**Status:** Known issue - City changed URL structure. Use sample data for now.

## Health Checks

```bash
# API health
curl http://localhost:8000/health

# Check facilities
curl -sL "http://localhost:8000/facilities?has_lane_swim=true" | head -100

# Check database
docker exec swimto-db psql -U postgres -d pools -c "SELECT COUNT(*) FROM facilities;"

# Check logs
docker logs swimto-api --tail 50
docker logs swimto-web --tail 50
```

## Reset Everything

```bash
# Stop all
docker-compose down -v

# Start fresh
docker-compose up -d

# Wait for health checks
sleep 10

# Initialize database (run the commands from "Quick Fixes" above)
```

