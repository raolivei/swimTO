# 🏊‍♂️ SwimTO

**SwimTO** is a production-grade application that aggregates and displays indoor community pool drop-in swim schedules for the City of Toronto.

## 🎯 Overview

SwimTO collects, normalizes, and presents lane swim schedules from Toronto's community pools, helping residents find convenient swimming times near them.

### Features

- 🗺️ **Interactive Map View** - Toronto-focused map showing all community centers with lane swim sessions
- 📅 **Schedule View** - Calendar-style layout with weekday + time slots for lane swim programs
- 🔄 **Auto-refresh** - Daily updates from City of Toronto Open Data sources
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
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

```bash
# Clone the repository
git clone https://github.com/raolivei/swimTO.git
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
- [Troubleshooting](TROUBLESHOOTING.md) - Fix common issues
- [Local Development](docs/LOCAL_DEVELOPMENT.md) - Development setup
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

**Infrastructure:**

- Docker
- Kubernetes (k3s)
- GitHub Actions
- Raspberry Pi cluster

## 📊 Data Sources

This project uses data from the [City of Toronto Open Data Portal](https://open.toronto.ca/):

- Recreation facilities metadata
- Pool schedules (when available via API)
- Facility web pages (fallback)

**License:** Open Government Licence – Toronto

## 🤝 Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development workflow and branching strategy.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- City of Toronto for providing open data
- Toronto community centers for maintaining accurate schedules
