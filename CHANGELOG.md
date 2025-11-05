# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2025-11-05

### Fixed
- Enhanced error handling UI with styled components and retry functionality
- Fixed navigation using NavLink with proper active states
- Added exponential backoff for failed API calls (2 retries)
- Improved backend error logging with structured messages

### Added
- Comprehensive CHANGELOG.md for version tracking
- Detailed error messages with expandable technical details

## [0.2.0] - 2025-11-05

### Added
- **Frontend**: React app with interactive map (Leaflet), schedule view, routing
- **Backend**: FastAPI with REST endpoints, PostgreSQL, Redis caching
- **Data Pipeline**: Toronto Open Data ingestion, XML parser, web scraper
- **Infrastructure**: Kubernetes manifests, Docker Compose, CI/CD pipelines
- **Documentation**: API reference, deployment guides, architecture docs

## [0.1.0] - 2025-11-05

### Added
- Initial project structure
- Git repository setup
- Basic documentation
- License and environment configuration

---

## Links

- [GitHub Repository](https://github.com/raolivei/swimTO)
- [City of Toronto Open Data](https://open.toronto.ca)
