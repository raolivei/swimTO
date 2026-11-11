# 🏗️ SwimTO - System Architecture

Software is licensed under [MIT](../LICENSE); municipal data has separate source terms.

This document describes the overall architecture of the SwimTO application.

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                        User                              │
└───────────────────┬─────────────────────────────────────┘
                    │
                    v
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Map View   │  │  Schedule   │  │    About    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└───────────────────┬─────────────────────────────────────┘
                    │ REST API
                    v
┌─────────────────────────────────────────────────────────┐
│                  Backend (FastAPI)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │Facilities│  │ Schedule │  │  Update  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└───────────────────┬─────────────┬───────────────────────┘
                    │             │
                    v             v
        ┌───────────────┐  ┌─────────────┐
        │  PostgreSQL   │  │    Redis    │
        └───────────────┘  └─────────────┘
                    ^
                    │
        ┌───────────────────────┐
        │   Data Pipeline       │
        │  (Python Scripts)     │
        └───────┬───────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
    v                       v
┌──────────┐          ┌─────────────┐
│Open Data │          │ Web Scraping│
│  Portal  │          │  (Facility  │
└──────────┘          │    Pages)   │
                      └─────────────┘
```

## Components

### 1. Frontend (React + TypeScript)

**Location**: `apps/web/`

**Tech Stack:**

- React 18
- TypeScript
- Vite (build tool)
- Tailwind CSS
- TanStack Query (data fetching)
- React Router (routing)
- Leaflet (maps)

**Key Features:**

- Interactive map with facility markers
- Weekly schedule calendar view
- Filtering by swim type, district, time
- Responsive mobile design

**Architecture:**

```
src/
├── components/      # Reusable UI components
├── pages/          # Route-level pages
├── lib/            # Utilities and API client
├── types/          # TypeScript types
└── tests/          # Component tests
```

### 2. Backend (FastAPI)

**Location**: `apps/api/`

**Tech Stack:**

- FastAPI (web framework)
- SQLAlchemy (ORM)
- Alembic (migrations)
- Pydantic (validation)
- PostgreSQL (database)
- Redis (caching)

**API Endpoints:**

- `GET /facilities` - List facilities
- `GET /schedule` - Get schedule with filters
- `GET /schedule/today` - Today's sessions
- `POST /update` - Trigger data refresh (admin)
- `GET /health` - Health check

**Architecture:**

```
app/
├── routes/         # API endpoint handlers
├── models.py       # SQLAlchemy models
├── schemas.py      # Pydantic schemas
├── database.py     # DB connection
├── config.py       # Configuration
└── main.py         # FastAPI app
```

### 3. Data Pipeline

**Location**: `data-pipeline/`

**Tech Stack:**

- Python 3.11+
- Requests (HTTP client)
- BeautifulSoup4 (HTML parsing)
- Playwright (JavaScript rendering - future)
- SQLAlchemy (database)

**Data Sources:**

1. **Toronto Open Data API** (Primary) - Official drop-in programs data
   - Updates daily at 8:00 AM
   - Authoritative source from City of Toronto
   - Endpoint: `https://ckan0.cf.opendata.inter.prod-toronto.ca`
2. **Pools XML** - Facility metadata
3. **Curated Facility Data** - toronto_pools_data.py
4. **Web Scraper** (Legacy/Fallback) - Facility web pages

**Jobs:**

- `daily_refresh.py` - Daily schedule update (uses Toronto Open Data API)
- `test_toronto_api.py` - Validation and testing tool
- Runs at 3 AM via Kubernetes CronJob

**Architecture:**

```
data-pipeline/
├── sources/
│   ├── toronto_drop_in_api.py # Toronto Open Data parser (PRIMARY)
│   ├── open_data.py           # Open Data API client
│   ├── pools_xml_parser.py    # XML parser
│   ├── toronto_pools_data.py  # Curated facility list
│   └── facility_scraper.py    # Web scraper (LEGACY)
├── jobs/
│   ├── daily_refresh.py       # Daily update job
│   ├── test_toronto_api.py    # API validation
│   └── seed_demo_schedules.py # Demo data (DEPRECATED)
├── models.py                  # Database models
└── config.py                  # Configuration
```

### 4. Database (PostgreSQL)

**Schema:**

```sql
facilities (
    facility_id     TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    address         TEXT,
    postal_code     TEXT,
    district        TEXT,
    latitude        FLOAT,
    longitude       FLOAT,
    is_indoor       BOOLEAN,
    phone           TEXT,
    website         TEXT,
    source          TEXT,
    raw             JSONB,
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP
)

sessions (
    id              BIGSERIAL PRIMARY KEY,
    facility_id     TEXT REFERENCES facilities,
    swim_type       TEXT NOT NULL,
    date            DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    notes           TEXT,
    source          TEXT,
    hash            TEXT UNIQUE,
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP,
    UNIQUE(facility_id, date, start_time, swim_type)
)
```

### 5. Cache (Redis)

**Purpose:**

- API response caching
- Rate limiting (future)
- Session storage (future)

**TTL**: 1 hour for most cached data

## Deployment Architectures

### Local Development

```
┌─────────────┐
│ Docker      │
│ ┌─────────┐ │
│ │PostgreSQL│ │
│ └─────────┘ │
│ ┌─────────┐ │
│ │  Redis  │ │
│ └─────────┘ │
└─────────────┘

┌─────────────┐      ┌─────────────┐
│ API (local) │──────│ Web (local) │
│   :8000     │      │   :5173     │
└─────────────┘      └─────────────┘
```

### Docker Compose

```
┌───────────────────────────────────┐
│      Docker Compose Network        │
│  ┌──────┐  ┌──────┐  ┌──────┐   │
│  │  DB  │  │Redis │  │ API  │   │
│  └──────┘  └──────┘  └──────┘   │
│              ┌──────┐             │
│              │ Web  │             │
│              └──────┘             │
└───────────────────────────────────┘
```

### Raspberry Pi k3s

```
┌─────────────────────────────────────┐
│       Kubernetes Cluster (k3s)      │
│                                     │
│  ┌────────────────────────────┐   │
│  │      Namespace: swimto      │   │
│  │                             │   │
│  │  ┌───────┐  ┌───────┐     │   │
│  │  │  API  │  │  Web  │     │   │
│  │  │ Pod×2 │  │ Pod×2 │     │   │
│  │  └───────┘  └───────┘     │   │
│  │       │          │          │   │
│  │       v          v          │   │
│  │  ┌───────┐  ┌───────┐     │   │
│  │  │Postgre│  │ Redis │     │   │
│  │  │  SQL  │  │       │     │   │
│  │  └───────┘  └───────┘     │   │
│  │                             │   │
│  │  ┌─────────────────────┐  │   │
│  │  │  CronJob (3 AM)     │  │   │
│  │  │  Data Refresh       │  │   │
│  │  └─────────────────────┘  │   │
│  └────────────────────────────┘   │
│                                     │
│  NodePort Services:                 │
│  - Web: :30080                      │
│  - API: :30800                      │
└─────────────────────────────────────┘
```

## Data Flow

### User Request Flow

```
1. User → Frontend (Browser)
2. Frontend → API (REST)
3. API → Database (SQL Query)
4. Database → API (Results)
5. API → Frontend (JSON)
6. Frontend → User (UI Render)
```

### Data Ingestion Flow

```
1. CronJob Trigger (3 AM daily)
2. Update Facilities:
   a. Ingest curated facility data (toronto_pools_data.py)
   b. Fetch pools.xml → Parse → Update facility metadata
3. Ingest Official Schedules (Toronto Open Data API):
   a. Fetch drop-in programs from CKAN API
   b. Fetch locations metadata
   c. Filter for swim-related activities
   d. Parse schedules (days, times, date ranges)
   e. Match API locations to existing facilities
   f. Generate session records for next 4 weeks
4. Deduplicate sessions (hash-based)
5. Insert new sessions to database
6. Log results and unmatched locations
```

**Data Update Frequency:**

- City of Toronto updates API: Daily at 8:00 AM
- SwimTO refreshes data: Daily at 3:00 AM (local time)
- Effective lag: ~19 hours (tolerant to cancellations/changes)

**Data Accuracy:**

- Source: Official City of Toronto Open Data Portal
- Same data powering toronto.ca website
- 100% match with city's published schedules
- Known limitations: Last-minute cancellations may not reflect

## Security Considerations

### Authentication

- Admin endpoints require Bearer token
- Token stored in environment variables
- No public write access

### Data Validation

- Pydantic schemas validate all inputs
- SQL injection prevented by ORM
- XSS prevented by React's escaping

### Network Security

- CORS configured for specific origins
- Rate limiting (future enhancement)
- HTTPS recommended for production

### Secrets Management

- Environment variables for sensitive data
- Kubernetes Secrets for cluster deployment
- Never commit secrets to repository

## Scalability

### Horizontal Scaling

**API**: Can run multiple replicas (stateless)

```bash
kubectl scale deployment swimto-api -n swimto --replicas=5
```

**Web**: Can run multiple replicas (static assets)

```bash
kubectl scale deployment swimto-web -n swimto --replicas=3
```

**Database**: Single primary (read replicas possible)

### Vertical Scaling

Adjust resource limits in k8s manifests:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### Performance Optimization

1. **Caching**: Redis for API responses
2. **Database Indexes**: On frequently queried fields
3. **CDN**: For static assets (future)
4. **Connection Pooling**: SQLAlchemy pool
5. **Lazy Loading**: React code splitting

## Monitoring & Observability

### Logging

- **API**: Structured logs via Loguru
- **Data Pipeline**: Detailed ingestion logs
- **Kubernetes**: Pod logs via kubectl

### Health Checks

- **API**: `/health` endpoint
- **Kubernetes**: Liveness/readiness probes

### Metrics (Future)

- Request rate
- Response times
- Error rates
- Database query performance
- Ingestion success rate

## Technology Choices

### Why FastAPI?

- Modern Python web framework
- Automatic API documentation
- Type checking with Pydantic
- High performance (async)

### Why React?

- Component-based architecture
- Rich ecosystem
- Excellent TypeScript support
- Good performance

### Why PostgreSQL?

- Robust relational database
- JSON support (JSONB)
- Geospatial extensions (future)
- Proven reliability

### Why k3s?

- Lightweight Kubernetes
- Perfect for Raspberry Pi
- Full k8s compatibility
- Low resource usage

## Future Enhancements

### Planned Features

1. **User Accounts**: Save favorite pools
2. **Notifications**: Alert when new sessions added
3. **Mobile App**: Native iOS/Android apps
4. **Real-time Updates**: WebSocket for live updates
5. **Analytics**: Usage statistics
6. **ML Predictions**: Predict busy times

### Technical Improvements

1. **GraphQL API**: Flexible data fetching
2. **Event Sourcing**: Track all data changes
3. **Microservices**: Split into smaller services
4. **Service Mesh**: Istio for advanced networking
5. **Monitoring**: Prometheus + Grafana

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [k3s Documentation](https://docs.k3s.io/)

---

## 🚀 Next Steps

**Start building?** → [Local Development Guide](LOCAL_DEVELOPMENT.md)  
**API details?** → [API Reference](API.md)  
**Deploy?** → [Deployment Guide](DEPLOYMENT_PI.md)  
**Contributing?** → [Contributing Guidelines](CONTRIBUTING.md)  
**Overview?** → [README](../README.md)
