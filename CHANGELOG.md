# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed

- **Schedule Data Ingestion**: Fixed missing schedule data for facilities like Norseman by ensuring `ingest_json_api_schedules()` is properly integrated into the daily refresh pipeline
- **Week Navigation**: Fixed "Next Week" showing no sessions by increasing API limit from 100 to 1000 sessions in the frontend
- **Data Coverage**: Schedule view now properly displays sessions for multiple weeks ahead instead of just the first few days

### Technical

- Cleared Redis cache to serve fresh schedule data
- Updated frontend `ScheduleView.tsx` to request 1000 sessions instead of default 100
- Added `limit` and `offset` parameters to `ScheduleFilters` TypeScript interface

---

## [2.0.0] - 2025-11-05

### Changed

- **Commercial Release**: Project transitioned to fully proprietary license
- Updated version to 2.0.0 to reflect commercial nature
- Made GitHub repository private
- Added comprehensive licensing documentation

### Added

- PROJECT_STRATEGY.md documenting business model and go-to-market strategy
- COPYRIGHT file with proprietary notice
- LICENSE file with commercial terms
- GitHub Actions workflows for deployment and testing
- Enhanced security contexts in Kubernetes manifests
- Improved .gitignore for better coverage

### Updated

- README.md to reflect commercial status and private repository
- MASTER_PROMPT.md with updated licensing information
- All version references to 2.0.0
- Documentation to note private/commercial nature

## [Unreleased]

### Fixed

- **Schedule Page Rendering**: Fixed critical bug where `filteredSessions` was used before being defined, causing blank schedule page
- **Date Timezone Issues**: Fixed off-by-one day error in schedule display
  - Dates now parse as local time instead of UTC, preventing timezone shift bugs
  - Tuesday data now correctly appears on Tuesday (not Wednesday)
  - Updated `ScheduleView.tsx` and `utils.ts` to handle YYYY-MM-DD format correctly
- **Mobile Network Connectivity**: Fixed mobile devices unable to connect to API
  - Updated `docker-compose.yml` to use network IP (192.168.2.48) instead of localhost
  - Web container now properly exposes API for devices on local network
  - Added CORS configuration for network IP access

### Added

- **Mobile Testing Framework**: Comprehensive automated testing to catch mobile-specific issues

  - `playwright.config.mobile.ts`: Mobile-specific Playwright configuration
  - `mobile-network.spec.ts`: Tests for API connectivity, CORS, network IP vs localhost
  - `mobile-schedule.spec.ts`: Tests for schedule dates, timezone handling, week navigation
  - `mobile-map.spec.ts`: Tests for facility markers, map interaction, geolocation
  - Support for testing on real network IP to simulate actual mobile devices
  - Automated tests for 5 device types (iPhone 14 Pro, iPhone SE, Samsung, iPad, Landscape)

- **Mobile Testing Documentation**

  - Environment variable support (TEST_BASE_URL, API_BASE_URL) for network testing
  - Comprehensive test coverage for issues that would have caught today's bugs
  - Network request monitoring and logging in tests
  - Screenshot and video capture on test failures

- **Mobile Testing Framework**: Comprehensive mobile testing setup with Playwright (existing)

  - Mobile test suite for iPhone, Android, and tablet devices
  - Automated tests for responsive design and touch interactions
  - Mobile testing helper script (`scripts/mobile-test.sh`)
  - Detailed mobile testing guide (`docs/MOBILE_TESTING.md`)
  - Quick start guide for mobile testing (`MOBILE_TESTING_QUICK_START.md`)

- **PWA Support**: Progressive Web App features for better mobile experience

  - Web app manifest for installability
  - iOS-specific meta tags for home screen support
  - Theme color and app icons configuration

- **Mobile UI Improvements**

  - Full-width sidebar on mobile devices (MapView)
  - Improved touch targets (minimum 44x44px)
  - Better tap highlighting and feedback
  - Safe area insets for notched devices
  - Smooth scrolling and touch gestures
  - Hidden stats overlay when sidebar is open on mobile

- **CSS Enhancements**

  - Mobile-specific styles for better touch interactions
  - Prevent accidental zoom on input focus (iOS)
  - Touch-action support for map pinch zoom
  - Minimum font sizes for readability
  - Prevent horizontal overflow

- **Development Tools**
  - New `npm run dev:mobile` command for network-accessible dev server
  - New `npm run test:mobile` command for mobile-specific tests
  - Playwright configuration with multiple device profiles
  - Mobile testing checklist and documentation

### Improved

- **Data Quality**: Removed 1,904 demo sessions, leaving 2,325 real sessions with diverse times
  - Verified swim times now show proper variety (7:00 AM, 12:00 PM, 8:00 PM, etc.)
  - Data pipeline confirmed fetching 5,218 swim programs from Toronto Open Data
- Enhanced accessibility with proper ARIA labels on mobile controls
- Better error handling display on mobile devices
- Responsive navigation with better touch targets
- Map interaction improved for touch devices

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

- GitHub Repository: Private
- [City of Toronto Open Data](https://open.toronto.ca)

---

**Note:** This is a proprietary commercial project. All rights reserved. See LICENSE and COPYRIGHT files for details.
