# 🏊‍♂️ SwimTO

![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![Node](https://img.shields.io/badge/node-20+-green.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)
![React](https://img.shields.io/badge/React-18.2-61DAFB.svg?logo=react)
![PR Checks](https://github.com/raolivei/swimTO/actions/workflows/pr.yml/badge.svg)
![Build](https://github.com/raolivei/swimTO/actions/workflows/build-and-push.yml/badge.svg)

**SwimTO** aggregates municipal pool drop-in swim schedules across Toronto, Mississauga, Brampton, Vaughan, Richmond Hill, and Markham.

**Open source under the [MIT License](LICENSE).** Municipal data has its own terms; see [COPYRIGHT](COPYRIGHT) for attribution.

## 🎯 Overview

SwimTO collects, normalizes, and presents official municipal swim schedules, helping GTA residents find convenient swimming times near them. See [local review](docs/LOCAL_REVIEW.md) for verified coverage and the preview workflow.

### Features

- 🗺️ **Interactive Map View** - GTA-wide pool map with city and swim-type filters
- 📅 **Schedule View** - Calendar-style layout with weekday + time slots for lane swim programs
- 🔄 **Auto-refresh** - Daily ingestion from official municipal recreation calendars and seasonal timetables
- 📱 **Mobile-First Design** - Fully responsive with PWA support, tested on iOS and Android
- 🧪 **Comprehensive Testing** - Automated mobile testing with Playwright across multiple devices
- 🏗️ **Self-hosted** - Runs on Raspberry Pi k3s cluster

## 🏗️ Architecture

```
swimto/
├── apps/
│   ├── api/              # FastAPI backend
│   └── web/              # React + Vite frontend
├── data-pipeline/        # ETL and data discovery
├── k8s/                  # Kubernetes manifests
├── infrastructure/       # Terraform (if needed)
├── .github/workflows/    # CI/CD
├── docker-compose.yml    # Local development
└── docs/                 # Documentation
```

## 🚀 Quick Start

### Local Development

The repository is public. Contributions are welcome; see [Contributing](docs/CONTRIBUTING.md).

#### Recommended: Docker Compose (Primary Method)

```bash
# Clone the repository
git clone https://github.com/raolivei/swimTO.git
cd swimTO

# Load port assignments from workspace-config
source ../workspace-config/ports/.env.ports

# Start all services with hot reload
docker-compose up

# Or start in detached mode
docker-compose up -d
```

**Access:**
- Frontend: http://localhost:5173
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

**Benefits:**
- Consistent environment (matches production)
- Hot reload enabled via volume mounts
- No local Python/Node version conflicts
- Single command to start everything

See `../workspace-config/docs/DOCKER_COMPOSE_GUIDE.md` for complete guide.

#### Alternative: Local Development (Fallback)

```bash
# Start database and Redis
docker-compose up -d db redis

# Start API (in one terminal)
cd apps/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Start Frontend (in another terminal)
cd apps/web
npm install
npm run dev
```

### Initial Data Load

```bash
# Trigger data ingestion
curl -X POST http://localhost:8000/update \
  -H "Authorization: Bearer your-admin-token"
```

## 📚 Documentation

- [Quickstart](docs/LOCAL_DEVELOPMENT.md) - Get running in 5 minutes
- [Mobile Testing Quick Start](docs/MOBILE_TESTING.md) - Test on mobile devices 📱
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Fix common issues
- [Local Development](docs/LOCAL_DEVELOPMENT.md) - Development setup
- [Mobile Testing Guide](docs/MOBILE_TESTING.md) - Comprehensive mobile testing
- [Deployment](docs/DEPLOYMENT_PI.md) - Raspberry Pi k3s guide
- [API Reference](docs/API.md) - Endpoints and usage
- [Architecture](docs/ARCHITECTURE.md) - System design
- [Contributing](docs/CONTRIBUTING.md) - Development workflow

## 🛠️ Tech Stack

**Backend:**

- FastAPI
- PostgreSQL
- SQLAlchemy + Alembic
- Playwright (web scraping)
- BeautifulSoup4

**Frontend:**

- React 18
- TypeScript
- Vite
- Leaflet (maps)
- TanStack Query
- Tailwind CSS
- PWA Support (installable)

**Infrastructure:**

- Docker
- Kubernetes (k3s)
- GitHub Actions
- Raspberry Pi cluster

**Testing:**

- Vitest (unit tests)
- Playwright (E2E & mobile testing)
- Testing Library (React components)

## 📊 Data Sources

Official sources include Toronto Open Data and the Parks JSON API, Mississauga's ActiveNet calendar, Brampton/Vaughan/Markham's PerfectMind calendars, and Richmond Hill's published seasonal timetable. The existing daily CronJob refreshes these sources. Check the municipal booking portal before travelling: closures and source changes can affect availability.

Coverage is verified for six cities, not every GTA municipality or pool. The current Toronto Open Data feed includes 51 scheduled swimming locations; the integrated feeds add 45 pools outside Toronto. The catalog also retains outdoor and older facilities that may have no upcoming sessions. See [local review and coverage](docs/LOCAL_REVIEW.md) and [Toronto discovery](docs/JSON_API_FACILITIES.md).

## 🤝 Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for the development workflow, tests, and local review requirements. Use issues to report incorrect schedules with a municipal source link.

## 📄 License

Software: [MIT License](LICENSE). Municipal schedules and location data retain their source terms; see [COPYRIGHT](COPYRIGHT).

## 🙏 Acknowledgments

- City of Toronto for providing open data
- Toronto community centers for maintaining accurate schedules

---

## 🚀 Next Steps

**New here?** → [Local Development Guide](docs/LOCAL_DEVELOPMENT.md) to get started  
**Building features?** → [API Reference](docs/API.md) | [Architecture](docs/ARCHITECTURE.md)  
**Ready to deploy?** → [Deployment Guide](docs/DEPLOYMENT_PI.md)  
**Contributing?** → [Contributing Guidelines](docs/CONTRIBUTING.md)  
**Testing mobile?** → [Mobile Testing Guide](docs/MOBILE_TESTING.md)
