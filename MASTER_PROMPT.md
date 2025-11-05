# 🏊‍♂️ SwimTO — MASTER PROMPT (V4.0 for Raspberry Pi k3s)

You are an expert full-stack engineer + open-data integrator building a **commercial product**.

Build a production-grade monorepo called **swimto** that aggregates and displays **indoor community-pool drop-in swim schedules** for the City of Toronto.

---

## 🔒 Business Model & Licensing

### Strategic Direction

**This is now a COMMERCIAL product with a hybrid business approach:**

1. **Repository Status: PRIVATE**
   - GitHub repository must be set to private immediately
   - Protects intellectual property and future development
   - Controls access to codebase

2. **Monetization Model**
   - **Price:** $0.99 one-time purchase
   - **Distribution:** QR code at facilities or via app stores
   - **Value Proposition:** Convenience, reliability, and supporting local development

3. **Licensing**
   - Current code under MIT (v1.0.0-oss) remains as-is
   - New development (v2.0.0+) under proprietary license
   - Consider AGPL or Commons Clause if partial openness desired
   - **Important:** License changes only affect new versions, not already-released MIT code

4. **Future Considerations**
   - Build user base first
   - May open-source later for community contributions
   - Evaluate dual-licensing model (commercial + open source)

### User Value Proposition

What users pay for:
- ✅ Reliable, always-updated schedule data
- ✅ Fast, mobile-optimized experience  
- ✅ Self-hosted infrastructure (no ads, no tracking)
- ✅ Support for local developer
- ✅ Continued maintenance and improvements

### Action Items

**Immediate:**
- [ ] Make GitHub repository private
- [ ] Update LICENSE file to proprietary license
- [ ] Remove public references/links to repository
- [ ] Consider trademark for "SwimTO" name

**Short Term:**
- [ ] Set up payment processing (Stripe, Apple Pay, Google Pay)
- [ ] Create QR code distribution mechanism
- [ ] Design purchase/download flow
- [ ] Add privacy-respecting analytics

**Medium Term:**
- [ ] Evaluate app store distribution (Apple App Store, Google Play)
- [ ] Build marketing materials
- [ ] Gather user feedback and iterate

---

## 🎯 Technical Goals

1. Collect → Normalize → Display drop-in swim schedules for all indoor pools.

2. Prefer official City of Toronto Open Data APIs / datasets before scraping.

3. Run fully self-hosted on Rafael's Raspberry Pi k3s cluster.

4. Deploy automatically via a self-hosted GitHub Actions runner.

5. Keep setup simple and low-maintenance — no Helm, no ArgoCD, minimal YAML, update ≈ once per year.

---

## 🧠 Data Ingestion

| Step | Action                                                                           |
| ---- | -------------------------------------------------------------------------------- |
| 1    | Query open.toronto.ca for datasets ("swim", "drop-in", "recreation", "aquatic"). |
| 2    | If a dataset with schedule times exists, use it directly.                        |
| 3    | Always pull facility metadata from pools.xml.                                    |
| 4    | Crawl facility pages (e.g. Mary McCormick, Norseman, Pam McConnell).             |
| 5    | Detect hidden JSON / XHR endpoints via Playwright (locationId, weekStart).       |
| 6    | If none → parse HTML weekly tables ("For the week of …") with BeautifulSoup.     |
| 7    | Normalize → dedupe → store in PostgreSQL (or local SQLite).                      |

**Canonical fields:**
`facility_id, name, address, postal_code, district, lat, lon, swim_type, date, start_time, end_time, notes, source`

---

## ⚙️ Backend – FastAPI

**Endpoints**
```
GET  /facilities
GET  /schedule
GET  /schedule/today
POST /update   (token-protected)
```

**Stack**
* FastAPI + SQLAlchemy + Alembic
* PostgreSQL (or local SQLite)
* Optional Redis cache
* Cron job or manual /update trigger

---

## 💻 Frontend – React + Vite + TypeScript

* **Map View (state-of-the-art):**
  * Interactive Toronto map (Leaflet / Mapbox).
  * Shows *only* community centers offering **LANE SWIM** sessions.
  * Pins display facility name, next available lane swim, and schedule preview.
  * Clustered view, filters, and "open now" highlights.

* **Schedule View (top-of-the-art):**
  * Modern, calendar-style layout showing weekday + time for all **LANE SWIM** drop-in programs.
  * Filter by district, day, or time range.
  * Clicking a facility on the map highlights its schedule in the list.
  * Responsive mobile design, integrated with map interactions.

* **Facility Card:**
  * Shows next sessions, address → Google Maps link, alerts, and "Updated X h ago".

---

## 🗂️ Repo Layout

```
swimto/
├─ apps/
│  ├─ api/          ← FastAPI backend
│  └─ web/          ← React frontend
├─ data-pipeline/   ← discovery + ETL
├─ k8s/             ← bare YAMLs for k3s
├─ .github/workflows/
├─ docker-compose.yml
├─ MASTER_PROMPT.md     ← This file - project guide
├─ PROJECT_STRATEGY.md  ← Business model & licensing
├─ COPYRIGHT            ← Proprietary copyright notice
└─ README.md
```

---

## 🧩 Data Model

```sql
CREATE TABLE facilities (
  facility_id TEXT PRIMARY KEY,
  name TEXT, address TEXT, postal_code TEXT,
  district TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
  is_indoor BOOLEAN, source TEXT, raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  facility_id TEXT REFERENCES facilities(facility_id),
  swim_type TEXT, date DATE, start_time TIME, end_time TIME,
  notes TEXT, source TEXT, hash TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🧰 Docker & Local Stack

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
  api:
    build: ./apps/api
    environment:
      DATABASE_URL: postgresql+psycopg://postgres:postgres@db:5432/pools
    ports: ["8000:8000"]
  web:
    build: ./apps/web
    ports: ["5173:5173"]
```

---

## ☁️ k3s Deployment (Raspberry Pi)

1. Install k3s (master + optional workers).
2. Place YAMLs in /k8s: `deployment-api.yaml`, `deployment-web.yaml`, `service-api.yaml`, `service-web.yaml`, `configmap.yaml`, `secret.yaml`.
3. Use local storage or USB SSD PVC for Postgres.
4. Expose via NodePort (no Ingress).
5. Add a self-hosted GitHub Actions runner on the Pi.
6. Workflow runs: build → load into k3s → `kubectl apply -f k8s/`.
7. Optional daily cron: `python data-pipeline/jobs/daily_refresh.py`.

---

## 🤖 GitHub Actions

```yaml
name: Deploy to Pi k3s
on: [push]
jobs:
  build-deploy:
    runs-on: [self-hosted, linux, arm64]
    steps:
      - uses: actions/checkout@v4
      - name: Build images
        run: |
          docker build -t swimto-api:latest apps/api
          docker build -t swimto-web:latest apps/web
      - name: Load into k3s
        run: |
          k3s ctr images import <(docker save swimto-api:latest)
          k3s ctr images import <(docker save swimto-web:latest)
      - name: Deploy
        run: kubectl apply -f k3s/
```

---

## 🧾 Env Vars

```
DATABASE_URL=postgresql+psycopg://postgres:postgres@db:5432/pools
ADMIN_TOKEN=change-me
CITY_BASE_URL=https://www.toronto.ca
OPEN_DATA_BASE_URL=https://open.toronto.ca
INGEST_WINDOW_DAYS=56
```

---

## 📘 Docs to Generate

* **README.md** – overview + setup + Open Data license + **commercial notice**
* **PROJECT_STRATEGY.md** – business model, licensing strategy, roadmap
* **COPYRIGHT** – proprietary copyright notice
* **INGESTION.md** – data sources + normalization
* **DEPLOYMENT_PI.md** – k3s + runner setup
* **API.md**, **FRONTEND.md**, **OPERATIONS.md**, **SECURITY.md**
* **LICENSE** – update to proprietary for v2.0.0+

---

## ✅ Acceptance Checklist

**Technical:**
* `docker compose up` runs locally
* `/schedule/today` returns real data
* Map + List views render LANE SWIM data correctly
* `/update` triggers refresh
* GitHub Actions deploys to Pi cluster
* Cron keeps data fresh

**Business:**
* Repository is set to private on GitHub
* LICENSE file updated to proprietary
* PROJECT_STRATEGY.md documents business model
* Payment processing mechanism designed
* Distribution strategy (QR codes / app stores) defined
* Analytics/telemetry implemented (privacy-respecting)
* Support/feedback mechanism in place

---

## 🗺️ Enhanced Visualization Goals

1. **Interactive Map (Toronto-focused):**
   * Displays all community centers with **LANE SWIM** sessions.
   * Uses **Leaflet or Mapbox** with clustering, filters, and "open now" highlights.

2. **Top-tier Schedule View:**
   * Calendar-style grid showing **weekday + time slots** for each **LANE SWIM** program.
   * Integrated with the map — selecting a facility highlights its sessions.

---

## 💡 Key Principles

1. **Privacy-First:** No tracking, no ads, no data selling
2. **Quality-Focused:** Reliable data, fast performance, great UX
3. **Self-Hosted:** Complete control over infrastructure
4. **Commercial Viability:** Sustainable through fair pricing
5. **Local Value:** Supporting Toronto swimmers and local development

---

**Version:** 4.0  
**Last Updated:** November 5, 2025  
**Status:** Production + Commercial  
**License:** Proprietary (v2.0.0+), MIT (v1.0.0-oss legacy)

---

## 🚀 Next Steps

1. Switch GitHub repository to private
2. Create PROJECT_STRATEGY.md document
3. Update LICENSE and add COPYRIGHT
4. Plan payment integration
5. Design QR code distribution system

