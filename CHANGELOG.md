# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Versioning

**Current Status**: Pre-release (0.x.x versions)

- **0.x.x**: Development versions - API may change, features are stabilizing
- **1.0.0**: First production-ready release - will be tagged when ready for public use

---

## [0.3.0] - 2025-11-15

### Fixed

- **Docker Network Connectivity**: Fixed frontend unable to connect to backend API in Docker environment
  - Fixed `.env` file with hardcoded network IP causing connection failures
  - Updated `api.ts` to properly handle empty `VITE_API_URL` environment variable with `.trim()` fallback
  - Enhanced Vite proxy configuration to automatically add trailing slashes to API paths
  - Configured `docker-compose.yml` to explicitly unset `VITE_API_URL` for web service
  - Resolved FastAPI 307 redirects by ensuring proper trailing slash handling in proxy
  - App now correctly uses Docker internal networking (`/api` → `http://api:8000`)
  - Fixes both local Docker development and mobile device access on same network

### Technical

- Added `configure` handler in `vite.config.ts` to intercept proxy requests and add trailing slashes
- Proxy now automatically transforms `/schedule?params` to `/schedule/?params` for FastAPI compatibility
- Environment variable handling improved to treat empty strings as unset values
- All API requests now return `200 OK` instead of `307 Temporary Redirect`

---

## [0.1.5] - 2025-01-XX

### Added
- Kubernetes ingress configuration for external access
- Build and deployment documentation (BUILD_AND_DEPLOY.md)
- Quick build script (QUICK_BUILD.sh)
- Kubernetes build job manifest (k8s/build-job.yaml)
- GitHub Container Registry (GHCR) secret external configuration
- Scripts for GHCR secret management:
  - create-ghcr-secret.sh
  - setup-ghcr-secret.sh
  - update-ghcr-token.sh
- Vault secrets management scripts:
  - setup-vault-secrets.sh
  - update-vault-api-keys.sh
- Scripts for building and importing container images (build-and-import-images.sh)
- Test API keys creation script (create-test-api-keys.sh)

### Changed
- Updated GitHub Actions workflow for Pi deployment
- Updated MASTER_PROMPT.md with project documentation
- Updated API Dockerfile and configuration
- Updated web Dockerfile and nginx configuration
- Updated Kubernetes deployment manifests (api-deployment.yaml, web-deployment.yaml)
- Updated Kubernetes ConfigMap and CronJob configurations
- Updated secret.yaml.example
- Updated frontend components (AuthContext, hooks, utils, ScheduleView)

## [Unreleased]

### Added

- **Favorites System**: Users can now favorite facilities in both schedule and map views
  - Click star icon to add/remove favorites
  - Favorites persist across sessions using localStorage
  - Favorites automatically appear at the top of lists
  - Gold map markers distinguish favorite facilities on the map
- **Real-Time Updates Page**: New dedicated page explaining how SwimTO keeps data current
  - Details on daily automatic refresh process
  - Information about data sources (City of Toronto Open Data)
  - Technical details about caching and infrastructure
- **Clickable Homepage Widgets**: Feature cards on homepage now link to their respective pages
  - Interactive Map → `/map`
  - Smart Schedules → `/schedule`
  - Real-Time Updates → `/real-time-updates`
- **Clickable Community Center Names**: Facility names now link to their official websites
  - Opens in new tab with proper rel attributes
  - Hover effects indicate clickability
  - Applied to schedule view (list and table) and map view (popup and sidebar)
- **Maps App Choice Modal**: Distance displays now open a modal to choose map app
  - Click distance to choose between Google Maps or Apple Maps
  - Beautiful modal UI with icons and hover effects
  - Works in both schedule view and map view
  - Modal closes on backdrop click or Cancel button
- **Map Search Functionality**: Search for community centers by name
  - Search bar at top of map view
  - Filters facilities by name, address, or district
  - Highlighted facilities show with larger red marker
  - Shows count of search results
  - Clear button to reset search
  - First match auto-selected and centered
- **Dark Mode Support**: Comprehensive dark mode implementation with automatic system preference detection
  - Automatic detection of system dark mode preference (`prefers-color-scheme`)
  - Manual toggle button (sun/moon icon) in header for user control
  - Preference persistence via localStorage across sessions
  - Dark map tiles (CartoDB Dark theme) for comfortable night viewing
  - Smooth color transitions (300ms) throughout the application
  - Full dark mode styling for all components (schedule view, map view, navigation, cards, tables)
  - WCAG AA compliant color contrast ratios
  - Accessible toggle with proper ARIA labels and keyboard support

### Fixed

- **Facility Coordinates**: Geocoded all 48 facilities for accurate map pin positions
  - Geocoded 47 facilities using Nominatim (OpenStreetMap) API
  - Updated all coordinates to match actual street addresses
  - Fixed York Recreation Centre: (43.627689, -79.545319)
  - Fixed Norseman Community School and Pool: (43.634194, -79.516238)
  - Westway Community Centre: Geocoding failed, kept existing coordinates
  - Created reusable geocoding script for future coordinate updates
  - Map pins now accurately reflect facility locations
- **Website URLs**: Fixed broken facility website links
  - Updated 2 facilities to new Toronto.ca URL format
  - Removed 40 broken old-format URLs that no longer work
  - Old format: `/data/parks/prd/facilities/complex/{id}/index.html`
  - New format: `/explore-enjoy/parks-recreation/.../location/?id={id}&title={name}`
  - Facilities without correct URLs now show no link (instead of broken link)
- **Schedule Table Expandability**: "+X more" buttons in schedule table view now expand to show all sessions
  - Buttons are now clickable with hover effects
  - Shows "Show less" when expanded to collapse
  - Fixes #1: Users couldn't view all sessions in busy time slots
- **Mobile Logo Spacing**: Improved header layout on mobile devices
  - Reduced spacing between logo icon and "SwimTO" text
  - Made logo icon smaller on mobile (32px vs 40px)
  - Hide tagline on mobile to save horizontal space
- **Error Messages**: Significantly improved error handling with specific troubleshooting steps
  - Detects network connection failures, timeouts, DNS errors, server errors
  - Provides iPhone-specific suggestions (e.g., clearing Safari cache)
  - Shows targeted troubleshooting steps for each error type
  - Includes expandable technical details section
  - Fixes #6: Users on iPhone 15 Pro get more helpful error messages

### Technical

- Cleared Redis cache to serve fresh schedule data
- Updated frontend `ScheduleView.tsx` to request 1000 sessions instead of default 100
- Added `limit` and `offset` parameters to `ScheduleFilters` TypeScript interface
- Implemented `getApiErrorMessage()` utility for comprehensive error classification
- Added favorites utilities: `getFavorites()`, `toggleFavorite()`, `isFavorite()`
- Created `RealTimeUpdates.tsx` page component with routing

---

## [0.2.0] - 2025-11-05

### Changed

- **Commercial Release**: Project transitioned to fully proprietary license
- Updated version to 0.2.0 (pre-release, not yet production-ready)
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
- All version references to 0.2.0
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

## [0.1.2] - 2025-11-05

### Fixed

- Enhanced error handling UI with styled components and retry functionality
- Fixed navigation using NavLink with proper active states
- Added exponential backoff for failed API calls (2 retries)
- Improved backend error logging with structured messages

### Added

- Comprehensive CHANGELOG.md for version tracking
- Detailed error messages with expandable technical details

## [0.1.0] - 2025-11-05

### Added

- **Frontend**: React app with interactive map (Leaflet), schedule view, routing
- **Backend**: FastAPI with REST endpoints, PostgreSQL, Redis caching
- **Data Pipeline**: Toronto Open Data ingestion, XML parser, web scraper
- **Infrastructure**: Kubernetes manifests, Docker Compose, CI/CD pipelines
- **Documentation**: API reference, deployment guides, architecture docs

## [0.0.1] - 2025-11-05

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
