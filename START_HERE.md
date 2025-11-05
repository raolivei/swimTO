# 🏊‍♂️ START HERE - SwimTO Development Guide

## 🚀 Quick Start (5 Minutes)

### 1. Prerequisites Check

Make sure you have:
- [x] Docker Desktop installed and running
- [x] Git installed

That's it! Everything else runs in containers.

### 2. Setup

```bash
# Run the automated setup
./scripts/dev-setup.sh
```

This creates environment files and starts PostgreSQL and Redis.

### 3. Start Everything

```bash
# Option A: Docker Compose (recommended for first time)
docker-compose up

# Option B: Or use make
make dev
```

### 4. Open Your Browser

- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

## 🧪 Running Tests

```bash
# Run all tests (API + Frontend)
./scripts/test-all.sh

# Or use make
make test
```

## 📁 Project Overview

### What You Have

```
swimTO/
├── apps/api/          → FastAPI backend (Python)
├── apps/web/          → React frontend (TypeScript)
├── data-pipeline/     → Data ingestion scripts
├── k8s/               → Kubernetes manifests for Pi
├── docs/              → Comprehensive documentation
└── scripts/           → Helper scripts
```

### Key Features

1. **Backend API** (FastAPI)
   - `/facilities` - Get all pool facilities
   - `/schedule` - Get swim schedules
   - `/schedule/today` - Today's sessions
   - Full API docs at `/docs`

2. **Frontend** (React)
   - Interactive map with all pools
   - Weekly schedule calendar
   - Filter by swim type, district, time
   - Mobile responsive

3. **Data Pipeline**
   - Scrapes Toronto Open Data
   - Daily refresh at 3 AM (k8s CronJob)
   - Manual trigger via `/update` endpoint

## 🛠️ Development Workflow

### Backend Development

```bash
cd apps/api

# Install dependencies (in virtualenv)
python3 -m venv venv
source venv/bin/activate
make dev

# Run API locally
make run

# Run tests
make test

# Format code
make format

# Run linters
make lint
```

### Frontend Development

```bash
cd apps/web

# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

### Full Stack Development

```bash
# Terminal 1: Start database services
docker-compose up db redis

# Terminal 2: Start API
cd apps/api
source venv/bin/activate
make run

# Terminal 3: Start frontend
cd apps/web
npm run dev
```

## 📊 Working with Data

### Trigger Data Ingestion

```bash
# Via API (requires admin token)
curl -X POST http://localhost:8000/update \
  -H "Authorization: Bearer change-me-in-production"

# Or run directly
python data-pipeline/jobs/daily_refresh.py
```

### Access Database

```bash
# Using docker-compose
docker-compose exec db psql -U postgres -d pools

# Run queries
SELECT COUNT(*) FROM facilities;
SELECT COUNT(*) FROM sessions;
```

## 🎯 Common Tasks

### Add a New API Endpoint

1. Create branch: `git checkout -b feature/api/new-endpoint`
2. Add route in `apps/api/app/routes/`
3. Add schema in `apps/api/app/schemas.py`
4. Add test in `apps/api/tests/`
5. Run tests: `cd apps/api && make test`
6. Update `docs/API.md`

### Add a New Frontend Component

1. Create branch: `git checkout -b feature/web/new-component`
2. Create component in `apps/web/src/components/`
3. Add types in `apps/web/src/types/`
4. Add test in `apps/web/src/tests/`
5. Run tests: `cd apps/web && npm test`

### Update Kubernetes Manifests

1. Create branch: `git checkout -b infra/k8s/your-change`
2. Update YAML in `k8s/`
3. Test: `kubectl apply -f k8s/ --dry-run=client`
4. Update `docs/DEPLOYMENT_PI.md`

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check what's running
docker-compose ps

# View logs
docker-compose logs -f

# Restart everything
docker-compose down
docker-compose up
```

### Port Already in Use

Edit `docker-compose.yml` and change ports:

```yaml
ports:
  - "5433:5432"  # Change first number only
```

### Database Connection Failed

```bash
# Restart database
docker-compose restart db

# Wait a few seconds
sleep 5

# Try again
docker-compose up
```

### Tests Failing

```bash
# Backend
cd apps/api
pip install -r requirements-dev.txt
make test

# Frontend
cd apps/web
rm -rf node_modules
npm install
npm test
```

## 📚 Documentation

- **Quick Start**: [docs/QUICKSTART.md](docs/QUICKSTART.md)
- **Full Dev Guide**: [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)
- **API Reference**: [docs/API.md](docs/API.md)
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Data Pipeline**: [docs/INGESTION.md](docs/INGESTION.md)
- **Contributing**: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- **Pi Deployment**: [docs/DEPLOYMENT_PI.md](docs/DEPLOYMENT_PI.md)

## 🚢 Deployment to Raspberry Pi

See the full guide: [docs/DEPLOYMENT_PI.md](docs/DEPLOYMENT_PI.md)

Quick overview:
1. Install k3s on your Pi
2. Set up GitHub Actions self-hosted runner
3. Create `k8s/secret.yaml` from example
4. Push to `main` branch → auto-deploys!

## 🧪 Testing Strategy

### What's Tested

**Backend (pytest)**
- Health endpoints
- Facility CRUD operations
- Schedule queries with filters
- Error handling
- Authentication

**Frontend (Vitest)**
- Component rendering
- User interactions
- API integration
- Utility functions

### Running Tests

```bash
# Everything
make test

# With coverage
cd apps/api && make test-cov
cd apps/web && npm run test:coverage

# Watch mode (during development)
cd apps/api && pytest --watch
cd apps/web && npm test
```

## 🔑 Key Commands Reference

```bash
# Setup
./scripts/dev-setup.sh              # First-time setup

# Development
make dev                            # Start everything
docker-compose up                   # Start services
docker-compose down                 # Stop services

# Testing
make test                           # Run all tests
./scripts/test-all.sh              # Run all tests (verbose)

# Backend
cd apps/api
make run                            # Start API
make test                           # Run tests
make format                         # Format code
make lint                           # Run linters

# Frontend
cd apps/web
npm run dev                         # Start dev server
npm test                            # Run tests
npm run lint                        # Run linter
npm run build                       # Production build

# Database
docker-compose exec db psql -U postgres -d pools

# Cleanup
make clean                          # Remove build artifacts
docker-compose down -v              # Remove volumes too
```

## 💡 Tips & Best Practices

### Git Workflow

```bash
# Always work on feature branches
git checkout -b feature/api/your-feature
git checkout -b feature/web/your-feature
git checkout -b infra/k8s/your-change

# Commit with conventional commits
git commit -m "feat(api): add search endpoint"
git commit -m "fix(web): resolve map issue"

# Push and create PR to 'dev' branch
git push origin feature/your-feature
```

### Code Quality

- Run linters before committing
- Write tests for new features
- Update documentation
- Use type hints (Python) and TypeScript

### Development Flow

1. Create feature branch
2. Make changes
3. Run tests locally
4. Push to GitHub
5. CI runs automatically
6. Create PR → code review
7. Merge to dev
8. Deploy to Pi from main

## 🎓 Learning Resources

- **FastAPI**: https://fastapi.tiangolo.com/
- **React**: https://react.dev/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Kubernetes**: https://kubernetes.io/docs/
- **k3s**: https://docs.k3s.io/

## 🤝 Need Help?

1. Check the [docs/](docs/) folder
2. View logs: `docker-compose logs -f`
3. Run health check: `curl http://localhost:8000/health`
4. Open an issue on GitHub

## 🎉 Next Steps

1. ✅ Run `./scripts/dev-setup.sh`
2. ✅ Start services: `docker-compose up`
3. ✅ Open http://localhost:5173
4. ✅ Explore the API at http://localhost:8000/docs
5. ✅ Run tests: `make test`
6. ✅ Read [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)
7. ✅ Start building!

**Happy coding! 🏊‍♂️**

