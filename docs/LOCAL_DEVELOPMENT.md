# 🏊‍♂️ SwimTO - Local Development Guide

This guide will help you set up SwimTO for local development and testing.

## Prerequisites

- **Docker** and **Docker Compose** (for services)
- **Python 3.11+** (for API development)
- **Node.js 20+** (for frontend development)
- **Git** (for version control)

## Quick Start

### Option 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
./scripts/dev-setup.sh
```

This script will:

- Check prerequisites
- Create environment files
- Set up necessary directories
- Start database and Redis
- Install Python dependencies (optional)

### Option 2: Manual Setup

#### 1. Clone and Navigate

```bash
git clone https://github.com/raolivei/swimTO.git
cd swimTO
```

#### 2. Create Environment Files

```bash
# API environment
cp apps/api/.env.example apps/api/.env

# Web environment
cp apps/web/.env.example apps/web/.env
```

Edit these files as needed. Defaults work for local development.

#### 3. Start Infrastructure

```bash
docker-compose up -d db redis
```

## Development Workflows

### Backend (API) Development

#### Setup

```bash
cd apps/api

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
make dev
```

#### Running the API

```bash
# Option 1: Using make
make run

# Option 2: Direct uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

#### Running Tests

```bash
# Run all tests
make test

# Run with coverage
make test-cov

# Run specific test file
pytest tests/test_facilities.py -v
```

#### Linting and Formatting

```bash
# Format code
make format

# Run linters
make lint
```

#### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
make migrate

# Or directly
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Frontend (Web) Development

#### Setup

```bash
cd apps/web

# Install dependencies
npm install
```

#### Running the Frontend

```bash
# Development server with hot reload
npm run dev
```

The frontend will be available at:

- **Frontend**: http://localhost:5173

#### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm test -- --run

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

#### Linting

```bash
# Run ESLint
npm run lint

# Build for production (type checking)
npm run build
```

### Data Pipeline Development

#### Running Data Ingestion

```bash
cd data-pipeline

# Activate venv if not already
source ../venv/bin/activate

# Run daily refresh job
python jobs/daily_refresh.py
```

## Running Everything Together

### Option 1: Docker Compose (Simplest)

```bash
# Start all services
docker-compose up

# In detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Option 2: Local Development Mode

Run the convenience script:

```bash
./scripts/local-dev.sh
```

This starts:

- PostgreSQL (Docker)
- Redis (Docker)
- API (local Python)
- Frontend (local Node)

Press `Ctrl+C` to stop all services.

## Testing

### Run All Tests

```bash
./scripts/test-all.sh
```

This runs:

- API tests with coverage
- Frontend tests with coverage

### Individual Test Commands

```bash
# API tests only
cd apps/api && make test

# Frontend tests only
cd apps/web && npm test

# Integration tests (if applicable)
cd tests/integration && pytest
```

## Database Management

### Access PostgreSQL

```bash
# Using psql in Docker
docker-compose exec db psql -U postgres -d pools

# Or connect directly
psql -h localhost -U postgres -d pools
# Password: postgres
```

### Reset Database

```bash
# Stop services
docker-compose down

# Remove volume
docker volume rm swimto_postgres_data

# Restart
docker-compose up -d db
cd apps/api && make migrate
```

## Troubleshooting

### Port Conflicts

If ports 5432, 6379, 8000, or 5173 are already in use:

**Option 1**: Stop conflicting services

```bash
# Find process using port
lsof -i :8000
kill -9 <PID>
```

**Option 2**: Change ports in `docker-compose.yml` and environment files

### Database Connection Issues

```bash
# Check if database is running
docker-compose ps

# Check logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### API Import Errors

```bash
# Ensure you're in the virtual environment
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements-dev.txt
```

### Frontend Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## Development Tools

### Useful Commands

```bash
# Check API health
curl http://localhost:8000/health

# Test an endpoint
curl http://localhost:8000/facilities

# Trigger manual data update (requires admin token)
curl -X POST http://localhost:8000/update \
  -H "Authorization: Bearer dev-token-change-me"

# View database tables
docker-compose exec db psql -U postgres -d pools -c "\dt"

# Check Redis keys
docker-compose exec redis redis-cli KEYS '*'
```

### IDE Setup

#### VS Code

Recommended extensions:

- Python
- Pylance
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- REST Client

#### PyCharm

- Enable Django support for better Python autocomplete
- Configure pytest as test runner
- Set up black and flake8 as external tools

## Git Workflow

### Feature Branch Strategy

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# For backend work
git checkout -b feature/api/endpoint-name

# For frontend work
git checkout -b feature/web/component-name

# For infrastructure
git checkout -b infra/k8s-setup

# For data pipeline
git checkout -b feature/pipeline/scraper-improvement
```

### Commit Guidelines

Follow conventional commits:

```bash
git commit -m "feat(api): add facility search endpoint"
git commit -m "fix(web): resolve map marker clustering"
git commit -m "docs: update deployment guide"
git commit -m "test(api): add schedule endpoint tests"
```

## Getting Help

- Check existing issues on GitHub
- Review logs: `docker-compose logs -f`
- Run tests to verify setup: `./scripts/test-all.sh`

---

## 🚀 Next Steps

**Build features?** → [API Reference](API.md) | [Architecture](ARCHITECTURE.md)  
**Contributing?** → [Contributing Guidelines](CONTRIBUTING.md)  
**Mobile testing?** → [Mobile Testing Guide](MOBILE_TESTING.md)  
**Deploy?** → [Deployment Guide](DEPLOYMENT_PI.md)  
**Overview?** → [README](../README.md)
