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

---

## [0.5.1] - 2025-11-20

### Fixed

- **🕐 Timezone**: API now uses Toronto timezone (`America/Toronto`) to determine "today"
- **🔒 Mixed Content**: API client detects HTTPS pages and uses absolute HTTPS URLs
- **🌐 Vite Host**: Disabled strict host checking for production
- **📅 Date Display**: Fixed today's and yesterday's sessions not appearing
  - Added explicit date range requests (yesterday to 7 days ahead)
  - Improved date matching with fallback logic
  - Enhanced visual highlighting for yesterday and today

### Added

- **⏰ Travel Time Window**: "Happening Now" filter includes sessions starting within 30 minutes
- **🔄 Sort Toggle**: Button toggles between favorites-first and distance-only sorting

### Changed

- Updated OAuth redirect URI to `swimto.eldertree.xyz`
- Added domain to CORS origins and Vite preview allowed hosts
- Switched to Cloudflare Origin Certificates
- **🎨 UI/UX**: Enhanced sorting and button design
  - Location button toggles between distance-only and favorites-first sorting
  - Circle indicators: outlined when off, filled when on
  - Styled to match "Happening now" button aesthetic
  - Community Center header cell made more compact with icon
- **⚡ CI/CD**: Parallelized Docker builds, optimized PR builds (~2-3 min), added 30-min timeout

### Improved

- **🔧 Code**: Refactored sorting logic with reusable `compareSessions` helper
- **🌐 Infrastructure**: Added Cloudflare Origin Certificate TLS for public domain
  - Updated OAuth redirect URI to `https://swimto.eldertree.xyz/auth/callback`
  - Added domain to CORS origins
  - Certificate management via Terraform

---

## [0.5.0] - 2025-11-17

### Fixed

- **🔐 HTTPS/TLS**: Enabled secure HTTPS with cert-manager, fixes OAuth and Geolocation API
- **📱 Mobile**: List view auto-selected on mobile (< 768px), hidden view toggle, touch-optimized

### Added

- **Location Request Button**: "Enable Location" button replaces automatic request
- **WireGuard Access**: HTTP-only ingress for IP-based VPN access

### Changed

- Subtitle: "Find drop-in swim times at Toronto's community pools"

### Technical

- **Docker Workflow**: Single build-and-push job, multi-platform builds, PR builds only (no push)

---

## [0.4.0] - 2025-11-15

### Added

- **"Happening Now" Filter**: Interactive filter showing only currently active sessions

### Changed

- **Distance Sorting**: Automatic when location available, removed manual button
- **Profile Banner**: Redesigned with water theme, gradients, bubbles, wave animations

### Fixed

- **Facility Links**: Fixed 35 incorrect location IDs using Toronto Open Data (all 42 facilities correct)

### Technical

- Added `prioritizeHappeningNow` state, removed `sortByDistance`, fuzzy name matching for facilities

---

## [0.3.0] - 2025-11-15

### Fixed

- **Docker Network**: Fixed frontend API connectivity, resolved FastAPI 307 redirects with trailing slash handling

### Technical

- Added Vite proxy handler for trailing slashes, improved env variable handling

---

## [0.1.5] - 2025-01-XX

### Added

- Kubernetes ingress, build/deployment docs, GHCR/Vault secret management scripts

### Changed

- Updated GitHub Actions, Dockerfiles, Kubernetes manifests, frontend components

## [Unreleased]

### Added

- **Favorites**: Star icon to favorite facilities, persists via localStorage, gold map markers
- **Real-Time Updates Page**: Explains daily refresh process and data sources
- **Clickable Widgets**: Homepage cards link to respective pages
- **Clickable Facility Names**: Link to official websites
- **Maps Modal**: Choose Google Maps or Apple Maps when clicking distance
- **Map Search**: Search facilities by name, address, or district
- **Dark Mode**: Auto-detection, manual toggle, dark map tiles, WCAG AA compliant

### Fixed

- **Facility Coordinates**: Geocoded 47 facilities using Nominatim API
- **Website URLs**: Updated 2 facilities to new Toronto.ca format, removed 40 broken links
- **Schedule Table**: "+X more" buttons now expandable
- **Mobile Logo**: Reduced spacing, smaller icon (32px), hidden tagline
- **Error Messages**: Improved with troubleshooting steps and iPhone-specific suggestions

### Technical

- Updated ScheduleView to request 1000 sessions, added favorites utilities, error classification

---

## [0.2.0] - 2025-11-05

### Changed

- **Commercial Release**: Transitioned to proprietary license, made repo private

### Added

- PROJECT_STRATEGY.md, COPYRIGHT, LICENSE files
- GitHub Actions workflows, enhanced Kubernetes security contexts

### Updated

- README.md, MASTER_PROMPT.md, all version references to 0.2.0

## [Unreleased]

### Fixed

- **Schedule Rendering**: Fixed `filteredSessions` used before definition
- **Date Timezone**: Fixed off-by-one day error, dates parse as local time
- **Mobile Network**: Fixed API connectivity, updated docker-compose to use network IP

### Added

- **Mobile Testing**: Playwright tests for network, schedule, map (5 device types)
- **PWA Support**: Web manifest, iOS meta tags, theme colors
- **Mobile UI**: Full-width sidebar, 44x44px touch targets, safe area insets
- **CSS**: Mobile styles, prevent zoom on input, touch-action support
- **Dev Tools**: `npm run dev:mobile` and `npm run test:mobile` commands

### Improved

- **Data Quality**: Removed 1,904 demo sessions, verified 2,325 real sessions
- Enhanced accessibility, error handling, responsive navigation

## [0.1.2] - 2025-11-05

### Fixed

- Enhanced error handling UI, NavLink active states, exponential backoff (2 retries)

### Added

- CHANGELOG.md, detailed error messages with expandable technical details

## [0.1.0] - 2025-11-05

### Added

- **Frontend**: React app with Leaflet map, schedule view, routing
- **Backend**: FastAPI, PostgreSQL, Redis caching
- **Data Pipeline**: Toronto Open Data ingestion, XML parser, web scraper
- **Infrastructure**: Kubernetes manifests, Docker Compose, CI/CD pipelines
- **Documentation**: API reference, deployment guides, architecture docs

## [0.0.1] - 2025-11-05

### Added

- Initial project structure, Git setup, basic documentation, license and environment config

---

## Links

- GitHub Repository: Private
- [City of Toronto Open Data](https://open.toronto.ca)

---

**Note:** This is a proprietary commercial project. All rights reserved. See LICENSE and COPYRIGHT files for details.
