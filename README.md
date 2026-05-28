# 🏊‍♂️ SwimTO

![Version](https://img.shields.io/badge/version-0.8.2-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![Node](https://img.shields.io/badge/node-20+-green.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react)
![PR Checks](https://github.com/raolivei/swimTO/actions/workflows/pr.yml/badge.svg)
![Build](https://github.com/raolivei/swimTO/actions/workflows/build-and-push.yml/badge.svg)

**SwimTO** is a Toronto public pool schedule platform serving real users. Aggregates and displays indoor community pool drop-in swim schedules for the City of Toronto.

> **Live at:** https://swimto.eldertree.xyz  
> **Open Source:** MIT Licensed. Free to use, modify, and deploy. See [LICENSE](LICENSE) for details.

## 🎯 Overview

SwimTO collects, normalizes, and presents lane swim schedules from Toronto's community pools, helping residents find convenient swimming times near them.

### Features

- 🗺️ **Interactive Map View** - Toronto-focused map showing all community centers with lane swim sessions
- 📅 **Schedule View** - Calendar-style layout with weekday + time slots for lane swim programs
- 💰 **Free Pool Filtering** - Filter to show only pools with free entry (badge + checkbox filter)
- ⭐ **Favorites** - Star facilities to save favorites, displayed with gold markers on map
- 🔄 **Auto-refresh** - Daily updates from City of Toronto Open Data sources
- 📱 **Mobile-First Design** - Fully responsive with PWA support, tested on iOS and Android
- 🌙 **Dark Mode** - Auto-detection with manual toggle, WCAG AA compliant
- 📍 **Smart Location** - Distance sorting and filtering by radius when location enabled
- 🕐 **Happening Now** - Filter to show only currently active swim sessions
- 🎨 **Swim Type Filters** - Filter by lane swim, family swim, adult swim, aquatic fitness
- 🔐 **Google OAuth** - Optional login to sync favorites and preferences across devices
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

#### Recommended: Docker Compose (Primary Method)

```bash
# Clone the repository
git clone git@github.com:raolivei/swimTO.git
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

**Production:**
- Live Site: https://swimto.eldertree.xyz

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

- [Quickstart](docs/QUICKSTART.md) - Get running in 5 minutes
- [Mobile Testing Quick Start](MOBILE_TESTING_QUICK_START.md) - Test on mobile devices 📱
- [Troubleshooting](TROUBLESHOOTING.md) - Fix common issues
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

- React 18.3
- TypeScript
- Vite 6.4
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

This project uses **official data** from the [City of Toronto Open Data Portal](https://open.toronto.ca/):

- **Primary Source:** [Registered Programs and Drop-in Courses](https://open.toronto.ca/dataset/registered-programs-and-drop-in-courses-offering/)
  - Official API updated daily at 8:00 AM
  - Same data powering toronto.ca website
  - 100% accurate swim schedules
- **Secondary Sources:**
  - Recreation facilities metadata (facility locations, addresses)
  - Curated facility list (toronto_pools_data.py)

**Data Update Frequency:** Daily at 3:00 AM via automated CronJob

**License:** Open Government Licence – Toronto

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development workflow and branching strategy.

Please follow the existing code style and conventions. All PRs require:
- Passing tests
- Type checking (TypeScript)
- Linting (ESLint, Ruff)
- Clear commit messages

## 📄 License

**MIT License** - Free to use, modify, and distribute. See [LICENSE](LICENSE) for full details.

SwimTO is open-source software. You're free to run your own instance, contribute improvements, or fork the project.

## 🙏 Acknowledgments

- City of Toronto for providing open data
- Toronto community centers for maintaining accurate schedules

---

## 📈 Observability (Eldertree production)

Production metrics and Grafana dashboards are **not** in this repo — they live in [`pi-fleet`](https://github.com/raolivei/pi-fleet) (DRY). See [`workspace-config/docs/OBSERVABILITY_STANDARDS.md`](../workspace-config/docs/OBSERVABILITY_STANDARDS.md).

- API scrape: `prometheus.io/*` on the SwimTO Service in `pi-fleet/clusters/eldertree/swimto/`
- Dashboard: `https://grafana.eldertree.local/d/swimto-dashboard`

## 🔧 Current Status

**Version:** 0.8.2  
**Status:** In active development, serving real users  
**Live Site:** https://swimto.eldertree.xyz  

**Recent Updates:**
- Free vs paid pool tagging infrastructure (Phase 1 complete)
- Interactive map with reliable click/tap handling
- Happening now filter with smart sorting
- Mobile-optimized UI with accessibility improvements
- OAuth support across multiple domains
- Rate limiting, metrics, and security headers

**Next Milestones:**
- Phase 2: Research and tag actual free Toronto pools
- Enhanced user preferences and notifications
- Performance optimizations for mobile devices

## 🚀 Next Steps

**New here?** → [Local Development Guide](docs/LOCAL_DEVELOPMENT.md) to get started  
**Building features?** → [API Reference](docs/API.md) | [Architecture](docs/ARCHITECTURE.md)  
**Ready to deploy?** → [Deployment Guide](docs/DEPLOYMENT_PI.md)  
**Contributing?** → [Contributing Guidelines](docs/CONTRIBUTING.md)  
**Testing mobile?** → [Mobile Testing Guide](docs/MOBILE_TESTING.md)
