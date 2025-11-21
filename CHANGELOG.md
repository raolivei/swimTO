# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Versioning

**Current Status**: Pre-release (0.x.x versions)

- **0.x.x**: Development versions - API may change, features are stabilizing
- **1.0.0**: First production-ready release - will be tagged when ready for public use

---

## [Unreleased]

### Added

- **🌐 Public Domain Support**: Configured `swimto.eldertree.xyz` with Cloudflare Origin Certificates
- **Favorites**: Star icon to favorite facilities, persists via localStorage, gold map markers
- **Real-Time Updates Page**: Explains daily refresh process and data sources
- **Clickable Widgets**: Homepage cards link to respective pages
- **Clickable Facility Names**: Link to official websites
- **Maps Modal**: Choose Google Maps or Apple Maps when clicking distance
- **Map Search**: Search facilities by name, address, or district
- **Dark Mode**: Auto-detection, manual toggle, dark map tiles, WCAG AA compliant
- **Mobile Testing**: Playwright tests for network, schedule, map (5 device types)
- **PWA Support**: Web manifest, iOS meta tags, theme colors
- **Mobile UI**: Full-width sidebar, 44x44px touch targets, safe area insets
- **CSS**: Mobile styles, prevent zoom on input, touch-action support
- **Dev Tools**: `npm run dev:mobile` and `npm run test:mobile` commands

### Fixed

- **Schedule Rendering**: Fixed `filteredSessions` used before definition
- **Date Timezone**: Fixed off-by-one day error, dates parse as local time
- **Mobile Network**: Fixed API connectivity, updated docker-compose to use network IP
- **Facility Coordinates**: Geocoded 47 facilities using Nominatim API
- **Website URLs**: Updated 2 facilities to new Toronto.ca format, removed 40 broken links
- **Schedule Table**: "+X more" buttons now expandable
- **Mobile Logo**: Reduced spacing, smaller icon (32px), hidden tagline
- **Error Messages**: Improved with troubleshooting steps and iPhone-specific suggestions

### Changed

- **Data Quality**: Removed 1,904 demo sessions, verified 2,325 real sessions
- Enhanced accessibility, error handling, responsive navigation

---

## [0.5.0] - 2025-11-20

### Added

- **🔄 Sort Toggle**: Button toggles between favorites-first and distance-only sorting modes
- **⏰ Travel Time Window**: "Happening Now" filter includes sessions starting within 30 minutes (travel time consideration)
- **🎨 Enhanced UI**: Improved sorting button design with visual feedback
  - Location button cycles between distance-only and favorites-first sorting
  - Circle indicators: outlined when off, filled when on
  - Community Center header cell made more compact with icon
  - Dynamic header subtitle based on active sort mode

### Fixed

- **🕐 Timezone**: API now uses Toronto timezone (`America/Toronto`) to determine "today"
- **🔒 Mixed Content**: API client detects HTTPS pages and uses absolute HTTPS URLs
- **🌐 Vite Host**: Disabled strict host checking for production
- **📅 Date Display**: Fixed today's and yesterday's sessions not appearing in schedule
  - Added explicit date range requests (yesterday to 7 days ahead)
  - Improved date matching with fallback logic for format inconsistencies
  - Enhanced visual highlighting for yesterday and today with emphasized time display

### Changed

- Updated OAuth redirect URI to `swimto.eldertree.xyz`
- Added domain to CORS origins and Vite preview allowed hosts
- Switched from Let's Encrypt to Cloudflare Origin Certificates
- **⚡ CI/CD Performance**: Parallelized Docker builds, optimized PR builds (~2-3 min), added 30-min timeout

### Changed (Technical)

- **🔧 Code Refactoring**: Refactored sorting logic with reusable `compareSessions` helper function
- **🌐 Infrastructure**: Added Cloudflare Origin Certificate TLS for public domain
  - Certificate management via Terraform
  - Updated OAuth redirect URI to `https://swimto.eldertree.xyz/auth/callback`

---

## [0.4.0] - 2025-11-17

### Added

- **Location Request Button**: "Enable Location" button replaces automatic location request on page load
- **WireGuard Access**: HTTP-only ingress for IP-based VPN access (allows direct IP access via WireGuard VPN)

### Fixed

- **🔐 HTTPS/TLS**: Enabled secure HTTPS with cert-manager, fixes OAuth login and Geolocation API requirements
- **📱 Mobile UX**: List view auto-selected on mobile (< 768px), hidden view toggle buttons, touch-optimized interface

### Changed

- Subtitle updated to: "Find drop-in swim times at Toronto's community pools"

### Changed (Technical)

- **Docker Workflow**: Refactored to single build-and-push job, multi-platform builds (linux/amd64, linux/arm64), PR builds only (no registry push)

---

## [0.3.0] - 2025-11-15

### Added

- **"Happening Now" Filter**: Interactive filter button showing only currently active swim sessions
- **Profile Banner Redesign**: Artistic swimming pool theme with water-inspired gradients, animated bubbles, wave animations, and caustic light effects

### Changed

- **Distance Sorting**: Automatic when location available, removed manual "Sort by distance" button for cleaner UX
- **Sorting Hierarchy**: Maintains favorites → distance → chronological order automatically

### Fixed

- **Facility Links**: Fixed 35 incorrect location IDs using Toronto Open Data (all 42 facilities now have correct website links)
- **Google OAuth**: Fixed profile picture CORS issue and login flow
- **Schedule Highlighting**: Fixed session highlighting issues

### Changed (Technical)

- Added `prioritizeHappeningNow` state for filter functionality
- Removed `sortByDistance` state in favor of automatic behavior
- Implemented fuzzy name matching algorithm for facility data reconciliation
- Updated session filtering logic to support "happening now" mode

---

## [0.2.2] - 2025-11-14

### Fixed

- **Docker Network Connectivity**: Fixed frontend unable to connect to backend API in Docker environment
- **FastAPI Redirects**: Resolved 307 redirects by ensuring proper trailing slash handling in Vite proxy
- **Environment Variables**: Fixed `.env` file with hardcoded network IP causing connection failures

### Changed (Technical)

- Added Vite proxy handler to automatically add trailing slashes to API paths
- Enhanced `api.ts` to properly handle empty `VITE_API_URL` environment variable
- Configured `docker-compose.yml` to explicitly unset `VITE_API_URL` for web service
- Improved environment variable handling to treat empty strings as unset values
- All API requests now return `200 OK` instead of `307 Temporary Redirect`

---

## [0.2.0] - 2025-11-04

### Changed

- **Commercial Release**: Project transitioned to fully proprietary license, made GitHub repository private

### Added

- PROJECT_STRATEGY.md documenting business model and go-to-market strategy
- COPYRIGHT file with proprietary notice
- LICENSE file with commercial terms
- CHANGELOG.md for version tracking
- GitHub Actions workflows for deployment and testing
- Enhanced security contexts in Kubernetes manifests
- Detailed error messages with expandable technical details

### Fixed

- Enhanced error handling UI with styled components and retry functionality
- Fixed navigation using NavLink with proper active states
- Added exponential backoff for failed API calls (2 retries)

### Changed (Technical)

- Updated README.md to reflect commercial status and private repository
- Updated MASTER_PROMPT.md with updated licensing information
- Updated all version references to 0.2.0

---

## [0.1.0] - 2025-11-04

### Added

- **Frontend**: React app with interactive map (Leaflet), schedule view, routing
- **Backend**: FastAPI with REST endpoints, PostgreSQL database, Redis caching
- **Data Pipeline**: Toronto Open Data ingestion, XML parser, web scraper
- **Infrastructure**: Kubernetes manifests, Docker Compose, CI/CD pipelines
- **Documentation**: API reference, deployment guides, architecture docs

---

## Links

- GitHub Repository: Private
- [City of Toronto Open Data](https://open.toronto.ca)

---

**Note:** This is a proprietary commercial project. All rights reserved. See LICENSE and COPYRIGHT files for details.
