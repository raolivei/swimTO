# 📊 SwimTO - Data Ingestion Guide

This document describes how SwimTO collects, normalizes, and stores pool schedule data.

## Overview

SwimTO uses a multi-source approach to gather the most complete and accurate pool schedule data:

1. **Primary**: City of Toronto Open Data Portal
2. **Secondary**: Facility metadata from pools.xml
3. **Tertiary**: Web scraping facility pages

## Data Sources

### 1. Toronto Open Data Portal

**URL**: https://open.toronto.ca  
**API**: CKAN API

**Datasets Used:**
- Recreation facilities
- Pool schedules (when available)
- Facility metadata

**Implementation**: `data-pipeline/sources/open_data.py`

```python
client = OpenDataClient()
datasets = client.find_pool_datasets()
```

**License**: Open Government Licence – Toronto

### 2. Pools XML

**URL**: https://www.toronto.ca/data/parks/prd/facilities/recreationcentres/index.xml

**Contains:**
- Facility IDs
- Names and addresses
- Geographic coordinates
- Contact information
- Facility types

**Implementation**: `data-pipeline/sources/pools_xml_parser.py`

```python
parser = PoolsXMLParser()
facilities = parser.fetch_and_parse()
```

### 3. Facility Web Pages

**Example URLs:**
- https://www.toronto.ca/data/parks/prd/facilities/complex/...
- Individual recreation center pages

**Contains:**
- Weekly schedules
- Session times
- Program types
- Special notes

**Implementation**: `data-pipeline/sources/facility_scraper.py`

```python
scraper = FacilityScraper()
data = scraper.scrape_facility_page(url)
```

## Ingestion Pipeline

### Architecture

```
┌─────────────────┐
│  Open Data API  │
└────────┬────────┘
         │
         v
┌─────────────────┐     ┌──────────────┐
│   Pools XML     │────>│  Normalize   │
└─────────────────┘     └──────┬───────┘
                               │
┌─────────────────┐            v
│  Web Scraping   │────>┌──────────────┐
└─────────────────┘     │  PostgreSQL  │
                        └──────────────┘
```

### Process Flow

1. **Discovery**: Search Open Data Portal for relevant datasets
2. **Facility Metadata**: Fetch and parse pools.xml
3. **Schedule Extraction**: Scrape facility web pages
4. **Normalization**: Convert to canonical format
5. **Deduplication**: Hash-based session deduplication
6. **Storage**: Save to PostgreSQL

### Canonical Data Format

#### Facility

```python
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
    "website": "https://...",
    "source": "pools_xml"
}
```

#### Session

```python
{
    "facility_id": "FAC001",
    "swim_type": "LANE_SWIM",
    "date": "2025-11-05",
    "start_time": "18:00:00",
    "end_time": "20:00:00",
    "notes": "Lanes 1-4 available",
    "source": "web_scrape",
    "hash": "a1b2c3..."  # For deduplication
}
```

### Swim Type Classification

Sessions are classified into types:

| Type | Description | Keywords |
|------|-------------|----------|
| `LANE_SWIM` | Lane swimming for fitness | "lane", "length" |
| `RECREATIONAL` | Family/recreational swim | "recreation", "family", "leisure" |
| `ADULT_SWIM` | Adult-only sessions | "adult", "19+" |
| `SENIOR_SWIM` | Senior-specific sessions | "senior", "55+" |
| `OTHER` | Other types | Everything else |

**Implementation**: `data-pipeline/sources/facility_scraper.py`

```python
def _normalize_swim_type(self, text: str) -> str:
    text_lower = text.lower()
    if 'lane' in text_lower:
        return "LANE_SWIM"
    elif 'recreation' in text_lower:
        return "RECREATIONAL"
    # ...
```

## Schedule Format Detection

Facility pages use various formats:

### Format 1: Weekly Tables

```html
<table>
  <tr>
    <th>Day</th>
    <th>Time</th>
    <th>Program</th>
  </tr>
  <tr>
    <td>Monday</td>
    <td>6:00 PM - 8:00 PM</td>
    <td>Lane Swim</td>
  </tr>
</table>
```

### Format 2: "For the Week of..."

```html
<h3>For the week of November 5, 2025</h3>
<ul>
  <li>Monday 6:00 PM - 8:00 PM: Lane Swim</li>
  <li>Wednesday 6:00 PM - 8:00 PM: Lane Swim</li>
</ul>
```

### Format 3: Hidden JSON/XHR

Some facilities load schedules via JavaScript:

```javascript
fetch('/api/schedule?locationId=123&weekStart=2025-11-05')
```

**Detection**: Playwright-based JavaScript execution (future enhancement)

## Deduplication Strategy

Sessions are deduplicated using SHA-256 hashes:

```python
def generate_session_hash(
    facility_id: str, 
    date: str, 
    start_time: str, 
    swim_type: str
) -> str:
    content = f"{facility_id}:{date}:{start_time}:{swim_type}"
    return hashlib.sha256(content.encode()).hexdigest()
```

**Benefits:**
- Prevents duplicate sessions
- Allows re-ingestion without duplicates
- Unique constraint in database

## Scheduling

### Daily Refresh Job

**File**: `data-pipeline/jobs/daily_refresh.py`

**Schedule**: Daily at 3 AM (via Kubernetes CronJob)

**Process:**
1. Update facility metadata from pools.xml
2. Scrape schedules from facility websites
3. Normalize and deduplicate
4. Update database
5. Log results

**Manual Trigger:**

```bash
# Direct execution
python data-pipeline/jobs/daily_refresh.py

# Via API
curl -X POST http://localhost:8000/update \
  -H "Authorization: Bearer your-admin-token"
```

## Data Quality

### Validation

- **Dates**: Must be in YYYY-MM-DD format
- **Times**: Must be in HH:MM format
- **Coordinates**: Must be within Toronto bounds (approx)
- **Swim Type**: Must be one of predefined types

### Error Handling

- **Missing data**: Skip facility/session, log warning
- **Invalid format**: Log error, continue processing
- **Network errors**: Retry with exponential backoff
- **Parse errors**: Log detailed error, continue

### Logging

```python
# Example log output
INFO: Starting daily refresh job
INFO: Fetching pools.xml from https://...
INFO: Parsed 45 facilities from XML
INFO: Processing Mary McCormick Recreation Centre
DEBUG: Found 12 sessions for facility FAC001
INFO: Ingested 42 facilities
INFO: Processed 384 new sessions
INFO: Daily refresh completed successfully
```

**Log Levels:**
- `DEBUG`: Detailed processing information
- `INFO`: Normal operations
- `WARNING`: Missing data, but processing continues
- `ERROR`: Failures that require attention

## Caching

Optional caching layer for development:

```python
# config.py
cache_dir: str = "data/cache"
enable_cache: bool = True
cache_ttl_hours: int = 24
```

**Cached Data:**
- Open Data API responses
- Pools XML content
- Web page HTML

**Benefits:**
- Faster development/testing
- Reduces API load
- Offline development possible

## Troubleshooting

### No Sessions Found

**Possible causes:**
1. Facility website changed format
2. Schedule not published yet
3. Facility temporarily closed

**Debug:**
```bash
# Check facility website manually
curl https://www.toronto.ca/data/parks/prd/facilities/complex/...

# Run scraper with debug logging
LOG_LEVEL=DEBUG python data-pipeline/jobs/daily_refresh.py
```

### Incorrect Swim Types

**Cause**: Classification keywords not matching

**Fix**: Update `_normalize_swim_type()` in `facility_scraper.py`

### Duplicate Sessions

**Cause**: Hash generation not working properly

**Fix**: Check `generate_session_hash()` implementation

## Future Enhancements

### Planned Improvements

1. **Playwright Integration**: Handle JavaScript-rendered schedules
2. **ML Classification**: Use ML to classify session types
3. **Change Detection**: Alert when schedules change
4. **Historical Data**: Track schedule changes over time
5. **API Polling**: Direct API access when available
6. **Facility Status**: Detect closures/renovations

### Contributing

See data pipeline contribution guidelines:

```bash
# Create branch
git checkout -b feature/pipeline/your-improvement

# Make changes
# Add tests
# Update documentation

# Submit PR
git push origin feature/pipeline/your-improvement
```

## Data Retention

- **Active sessions**: All future sessions
- **Past sessions**: Retained for 90 days
- **Facilities**: Retained indefinitely
- **Logs**: Retained for 30 days

## Privacy & Compliance

- **No personal data**: Only public schedule information
- **No tracking**: No user data collected
- **Open License**: All data from City of Toronto Open Data
- **Attribution**: Properly credited in UI and documentation

## Performance

### Optimization Strategies

1. **Parallel Processing**: Scrape multiple facilities concurrently
2. **Rate Limiting**: Respect source server limits
3. **Incremental Updates**: Only update changed data
4. **Batch Inserts**: Bulk database operations

### Current Performance

- **Full refresh**: ~10-15 minutes for all facilities
- **Facilities processed**: ~45-50
- **Sessions ingested**: ~300-500 per run
- **Database size**: ~50MB for 8 weeks of data

## Monitoring

### Metrics to Track

- Successful facility scrapes
- Failed scrape attempts
- Sessions added/updated
- Processing time
- Error rates

### Alerts

Set up alerts for:
- Zero sessions ingested (possible failure)
- High error rates (>10%)
- Processing timeout (>30 minutes)

## References

- [City of Toronto Open Data Portal](https://open.toronto.ca)
- [Open Government Licence](https://open.toronto.ca/open-data-license/)
- [BeautifulSoup Documentation](https://www.crummy.com/software/BeautifulSoup/)
- [Requests Documentation](https://requests.readthedocs.io/)

