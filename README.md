# 🏊‍♂️ SwimTO

**SwimTO** aggregates and displays indoor community pool drop-in swim schedules for the City of Toronto.

> **⚠️ COMMERCIAL PROJECT:** This is proprietary software. All rights reserved. See [LICENSE](LICENSE) and [PROJECT_STRATEGY.md](PROJECT_STRATEGY.md) for details.

## 🎯 Overview

SwimTO collects, normalizes, and presents lane swim schedules from Toronto's community pools, helping residents find convenient swimming times near them.

### Features

- 🗺️ **Interactive Map View** - Toronto-focused map showing all community centers with lane swim sessions
- 📅 **Schedule View** - Calendar-style layout with weekday + time slots for lane swim programs
- 🔄 **Auto-refresh** - Daily updates from City of Toronto Open Data sources
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

**Note:** This is a private repository. Access is restricted to authorized developers only.

```bash
# If you have access, clone the repository
git clone git@github.com:raolivei/swimTO.git
cd swimTO

# Start all services
docker compose up

# Access the application
# Frontend: http://localhost:5173
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
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

This is a private commercial project. Contributions are not currently accepted from external developers.

For authorized developers, see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development workflow and branching strategy.

## 📄 License

**Proprietary License** - All rights reserved. See [LICENSE](LICENSE) and [COPYRIGHT](COPYRIGHT) files for full details.

This software is commercial and may not be copied, modified, or distributed without explicit written permission from Rafael Oliveira.

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
