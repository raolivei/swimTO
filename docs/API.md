# 🔌 SwimTO API Documentation

REST API for accessing Toronto pool schedules.

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `http://<your-domain>:30800`

## Authentication

Most endpoints are public. The `/update` endpoint requires an admin token.

```
Authorization: Bearer <your-admin-token>
```

## Endpoints

### Health Check

#### GET `/` or `/health`

Check API health and version.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-11-05T12:00:00Z"
}
```

---

### Facilities

#### GET `/facilities`

Get all indoor pool facilities.

**Query Parameters:**
- `district` (string, optional): Filter by district name
- `has_lane_swim` (boolean, optional): Only facilities with lane swim sessions (default: false)

**Response:**
```json
[
  {
    "facility_id": "FAC001",
    "name": "Mary McCormick Recreation Centre",
    "address": "66 Sheridan Ave",
    "postal_code": "M6K 2H3",
    "district": "Toronto-St. Paul's",
    "latitude": 43.6426,
    "longitude": -79.4321,
    "is_indoor": true,
    "phone": "416-392-0335",
    "website": "https://www.toronto.ca/...",
    "source": "pools_xml",
    "created_at": "2025-11-01T10:00:00Z",
    "updated_at": "2025-11-05T03:00:00Z",
    "next_session": {
      "id": 123,
      "facility_id": "FAC001",
      "swim_type": "LANE_SWIM",
      "date": "2025-11-05",
      "start_time": "18:00:00",
      "end_time": "20:00:00",
      "notes": null,
      "source": "web_scrape",
      "created_at": "2025-11-05T03:00:00Z"
    },
    "session_count": 42
  }
]
```

#### GET `/facilities/{facility_id}`

Get a specific facility by ID.

**Parameters:**
- `facility_id` (string, required): Facility ID

**Response:**
```json
{
  "facility_id": "FAC001",
  "name": "Mary McCormick Recreation Centre",
  "address": "66 Sheridan Ave",
  ...
}
```

**Error Response (404):**
```json
{
  "detail": "Facility not found"
}
```

---

### Schedule

#### GET `/schedule`

Get swim schedule with filters.

**Query Parameters:**
- `facility_id` (string, optional): Filter by facility
- `district` (string, optional): Filter by district
- `swim_type` (string, optional): Filter by swim type (LANE_SWIM, RECREATIONAL, etc.)
- `date_from` (date, optional): Start date (YYYY-MM-DD), defaults to today
- `date_to` (date, optional): End date (YYYY-MM-DD)
- `time_from` (time, optional): Earliest start time (HH:MM)
- `time_to` (time, optional): Latest end time (HH:MM)
- `limit` (integer, optional): Max results (1-1000, default: 100)
- `offset` (integer, optional): Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": 123,
    "facility_id": "FAC001",
    "swim_type": "LANE_SWIM",
    "date": "2025-11-05",
    "start_time": "18:00:00",
    "end_time": "20:00:00",
    "notes": "Lanes 1-4 available",
    "source": "web_scrape",
    "created_at": "2025-11-05T03:00:00Z",
    "facility": {
      "facility_id": "FAC001",
      "name": "Mary McCormick Recreation Centre",
      "address": "66 Sheridan Ave",
      ...
    }
  }
]
```

**Examples:**

```bash
# Get all lane swim sessions
curl "http://localhost:8000/schedule?swim_type=LANE_SWIM"

# Get sessions at specific facility
curl "http://localhost:8000/schedule?facility_id=FAC001"

# Get sessions in a date range
curl "http://localhost:8000/schedule?date_from=2025-11-05&date_to=2025-11-12"

# Get morning sessions only
curl "http://localhost:8000/schedule?time_from=06:00&time_to=12:00"

# Combine filters
curl "http://localhost:8000/schedule?swim_type=LANE_SWIM&district=Downtown&limit=50"
```

#### GET `/schedule/today`

Get today's swim schedule.

**Query Parameters:**
- `swim_type` (string, optional): Filter by swim type

**Response:**
Same format as `/schedule` but filtered to today's date.

**Example:**
```bash
curl "http://localhost:8000/schedule/today?swim_type=LANE_SWIM"
```

---

### Update

#### POST `/update`

Trigger manual data refresh (admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Data refresh completed successfully",
  "facilities_updated": 45,
  "sessions_added": 382,
  "timestamp": "2025-11-05T12:00:00Z"
}
```

**Error Responses:**

401 Unauthorized:
```json
{
  "detail": "Authorization header missing"
}
```

403 Forbidden:
```json
{
  "detail": "Invalid token"
}
```

500 Internal Server Error:
```json
{
  "detail": "Update failed: <error message>"
}
```

**Example:**
```bash
curl -X POST "http://localhost:8000/update" \
  -H "Authorization: Bearer your-admin-token"
```

---

## Data Models

### Swim Types

- `LANE_SWIM`: Lane swimming for fitness
- `RECREATIONAL`: Recreational/family swim
- `ADULT_SWIM`: Adult-only sessions
- `SENIOR_SWIM`: Senior-specific sessions
- `OTHER`: Other types

### Date/Time Formats

- **Date**: ISO 8601 date format (YYYY-MM-DD)
- **Time**: 24-hour format (HH:MM:SS)
- **DateTime**: ISO 8601 with UTC timezone (YYYY-MM-DDTHH:MM:SSZ)

---

## Rate Limiting

Currently no rate limiting is implemented. Use responsibly.

## CORS

CORS is enabled for:
- `http://localhost:5173`
- `http://localhost:3000`

Configure additional origins in `.env`:
```
CORS_ORIGINS=["http://localhost:5173","https://yourdomain.com"]
```

## Error Handling

All errors follow this format:

```json
{
  "detail": "Error message"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Interactive Documentation

When running the API, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These provide interactive API documentation where you can test endpoints directly.

## Examples

### Python

```python
import requests

# Get facilities with lane swim
response = requests.get('http://localhost:8000/facilities', params={
    'has_lane_swim': True
})
facilities = response.json()

# Get today's schedule
response = requests.get('http://localhost:8000/schedule/today', params={
    'swim_type': 'LANE_SWIM'
})
sessions = response.json()

# Trigger update (with admin token)
response = requests.post(
    'http://localhost:8000/update',
    headers={'Authorization': 'Bearer your-admin-token'}
)
result = response.json()
```

### JavaScript

```javascript
// Get facilities
const facilities = await fetch('http://localhost:8000/facilities?has_lane_swim=true')
  .then(res => res.json());

// Get schedule
const schedule = await fetch('http://localhost:8000/schedule?swim_type=LANE_SWIM')
  .then(res => res.json());
```

### cURL

```bash
# Health check
curl http://localhost:8000/health

# Get facilities
curl "http://localhost:8000/facilities?has_lane_swim=true"

# Get today's schedule
curl "http://localhost:8000/schedule/today"

# Trigger update
curl -X POST "http://localhost:8000/update" \
  -H "Authorization: Bearer your-admin-token"
```

## Versioning

Currently at v1.0.0. Future versions may introduce:
- `/v2/` prefix for breaking changes
- Deprecation notices in response headers

## Support

For issues or questions:
- GitHub Issues: https://github.com/raolivei/swimTO/issues
- Check logs: `docker-compose logs api` or `kubectl logs -l app=swimto-api -n swimto`

---

## 🚀 Next Steps

**Try locally?** → [Local Development Guide](LOCAL_DEVELOPMENT.md)  
**Understand the system?** → [Architecture Overview](ARCHITECTURE.md)  
**Deploy?** → [Deployment Guide](DEPLOYMENT_PI.md)  
**Contributing?** → [Contributing Guidelines](CONTRIBUTING.md)  
**Back to overview?** → [README](../README.md)

