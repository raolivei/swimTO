# Changelog

All notable changes to the SwimTO project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

No unreleased changes yet.

## [0.2.1] - 2025-11-05

### Fixed
- Enhanced error handling UI in MapView with styled alert component
- Enhanced error handling UI in ScheduleView with consistent styling
- Added retry functionality for failed API calls with exponential backoff (2 retries with exponential backoff)
- Improved loading states with better visual feedback
- Fixed navigation highlighting using React Router's NavLink with proper active state detection
- Added `end` prop to Home link to prevent matching all routes
- Added aria-label for main navigation for accessibility
- Added detailed error messages with technical details in expandable section

### Added
- Comprehensive CHANGELOG.md following Keep a Changelog format
- Structured logging with loguru in backend facilities endpoints
- Better error handling in backend with SQLAlchemy-specific error handling
- Loading spinner with "Retrying..." state during refetch

### Improved
- Error UI design with border accent, icons, and better typography
- Navigation hover states with opacity transition on logo
- Backend error messages for better debugging

## [0.2.0] - 2025-11-05

### Added

#### Frontend (`apps/web/`)
- **Interactive Map View** with Leaflet integration
  - Clickable markers for all Toronto pools with lane swim
  - Popup details with next session information
  - Sidebar panel with full facility details
  - Real-time session count display
  - Google Maps integration for directions
  - Filter pools with valid coordinates
- **Schedule View** with calendar-style layout
  - Filter by swim type (Lane, Recreational, etc.)
  - Filter by district, date, and time range
  - Group sessions by date for easy browsing
  - Show facility details for each session
  - Responsive design for mobile and desktop
- **Navigation** with React Router
  - Home page with feature highlights
  - About page with project information
  - Responsive header with active route highlighting
  - Mobile-friendly navigation menu
- **Modern UI** with Tailwind CSS
  - Consistent design system
  - Primary color scheme (blue/teal)
  - Responsive layout utilities
  - Loading spinners and states
- **Testing Infrastructure**
  - Vitest setup with React Testing Library
  - ESLint for code quality
  - Test setup with jsdom environment
- **Build System**
  - Vite for fast development and builds
  - TypeScript for type safety
  - Multi-stage Docker build (development & production)
  - nginx for production serving

#### Backend (`apps/api/`)
- **RESTful API** with FastAPI
  - `GET /facilities` - List all facilities with optional filters
  - `GET /facilities/{id}` - Get specific facility details
  - `GET /schedule` - Get schedule with filters (date, swim_type, district, time)
  - `GET /schedule/today` - Today's sessions
  - `POST /update` - Trigger data refresh (admin only)
  - `GET /health` - Health check endpoint
- **Database Layer** with SQLAlchemy
  - PostgreSQL 16 support
  - Facility and Session models
  - Alembic migrations for schema versioning
  - Efficient queries with eager loading
- **Data Enrichment**
  - Attach next session to each facility
  - Calculate session counts for facilities
  - Filter facilities with lane swim availability
- **API Features**
  - Automatic OpenAPI documentation at `/docs`
  - ReDoc documentation at `/redoc`
  - Pydantic schemas for request/response validation
  - Global exception handling with logging
  - CORS middleware configuration
- **Testing**
  - pytest test suite with 100% critical path coverage
  - Test fixtures for database and API client
  - Mocked external dependencies
  - Code coverage reporting
- **Code Quality**
  - black for code formatting
  - flake8 for linting
  - mypy for type checking
  - Makefile for common tasks

#### Data Pipeline (`data-pipeline/`)
- **Data Sources**
  - Toronto Open Data API (CKAN) integration
  - pools.xml parser for facility metadata
  - Web scraper for facility schedules
- **Data Processing**
  - Facility data normalization
  - Session deduplication using content hashes
  - Date/time parsing and standardization
  - Swim type classification
- **Ingestion Jobs**
  - Daily refresh job with comprehensive logging
  - Configurable date range (default: 56 days)
  - Error handling and retry logic
- **Supported Data**
  - Indoor pools only
  - Drop-in swim sessions
  - Lane swim, recreational swim, and other types
  - Facility addresses, phone numbers, districts

#### Infrastructure

##### Kubernetes (`k8s/`)
- Namespace configuration (`swimto`)
- ConfigMaps for environment variables
- Secrets template for sensitive data
- **PostgreSQL StatefulSet**
  - Persistent volume for data
  - Health checks
  - Resource limits for Raspberry Pi
- **Redis Deployment**
  - Caching layer
  - Health checks
- **API Deployment**
  - 2 replicas for high availability
  - Liveness and readiness probes
  - Resource limits (100m CPU, 256Mi memory)
  - NodePort service on :30800
- **Web Deployment**
  - nginx-based serving
  - 2 replicas
  - NodePort service on :30080
- **CronJob**
  - Daily data refresh at 3 AM
  - Automatic pool schedule updates

##### CI/CD (`.github/workflows/`)
- **CI Pipeline** (`ci.yml`)
  - Runs on pull requests and dev branch
  - Backend linting and testing with coverage
  - Frontend linting and testing with coverage
  - PostgreSQL test database
  - Codecov integration
- **Deployment Pipeline** (`deploy-pi.yml`)
  - Self-hosted runner for ARM64 (Raspberry Pi)
  - Docker image builds
  - Import images to k3s
  - Apply Kubernetes manifests
  - Run database migrations
  - Health check verification

##### Local Development
- **Docker Compose** setup
  - PostgreSQL with persistent volume
  - Redis for caching
  - API with hot-reload
  - Web development server
  - Service health checks
- **Helper Scripts**
  - `dev-setup.sh` - Automated environment setup
  - `local-dev.sh` - Start all services
  - `test-all.sh` - Run complete test suite
- **Makefiles**
  - Top-level for project-wide commands
  - API-specific for backend tasks
  - Common operations (dev, test, lint, format)

### Documentation
- `README.md` - Project overview and quick start
- `PROJECT_SUMMARY.md` - Comprehensive feature list
- `GIT_COMMIT_SUMMARY.md` - Branching strategy and commit history
- `docs/QUICKSTART.md` - Get started in 5 minutes
- `docs/LOCAL_DEVELOPMENT.md` - Complete development guide
- `docs/DEPLOYMENT_PI.md` - Raspberry Pi deployment guide
- `docs/API.md` - Complete API reference
- `docs/INGESTION.md` - Data pipeline architecture
- `docs/ARCHITECTURE.md` - System design overview
- `docs/CONTRIBUTING.md` - Git workflow and coding standards

### Changed
- Updated project structure to monorepo with `apps/` directory
- Organized infrastructure in separate directories (`k8s/`, `.github/`)
- Improved git branching strategy with feature branches

## [0.1.0] - 2025-11-05

### Added
- Initial project setup
- `.gitignore` for Python, Node.js, Docker, and Kubernetes
- MIT License with proper attribution
- Environment configuration examples (`.env.example`)
- Project documentation structure
- `START_HERE.md` guide for new contributors
- `SETUP_VIRTUALENV.md` for troubleshooting
- Top-level Makefile for common operations
- Basic README with project vision

### Infrastructure
- Git repository initialization
- Branch strategy documentation
- Development environment prerequisites

---

## Version History Summary

- **v0.1.0** - Initial project setup and documentation
- **v0.2.0** - Complete full-stack implementation (frontend, backend, pipeline, infrastructure)
- **v0.2.1** - Bug fixes and UX improvements

---

## Branching Strategy

```
main (production releases)
 └── dev (integration branch)
      ├── feature/pipeline/*     - Data ingestion
      ├── feature/api/*          - Backend API
      ├── feature/web/*          - Frontend application
      ├── infra/k8s/*            - Kubernetes manifests
      ├── infra/ci-cd/*          - CI/CD pipelines
      └── docs/*                 - Documentation
```

---

## Links

- [GitHub Repository](https://github.com/raolivei/swimTO)
- [API Documentation](http://localhost:8000/docs) (when running locally)
- [City of Toronto Open Data](https://open.toronto.ca)

---

## Contributors

Built with ❤️ for Toronto swimmers 🏊‍♂️

