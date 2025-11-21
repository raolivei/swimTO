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

## [0.5.2] - 2025-11-20

### Fixed

- **📅 Date Display Fix**: Fixed today's and yesterday's sessions not appearing in schedule
  - Added explicit date range requests to API (yesterday to 7 days ahead)
  - Improved date matching with fallback logic for format inconsistencies
  - Enhanced visual highlighting for yesterday and today with emphasized time display

### Changed

- **🎨 UI/UX Improvements**: Enhanced sorting and button design
  - "Location enabled" button now acts as sort toggle with beautiful styling
  - Button shows "Sort by location" and toggles between two modes:
    - **OFF (unpressed)**: Favorites first, sorted by location/distance
    - **ON (pressed)**: Pure distance sorting (no favorites priority)
  - Circle indicators: outlined when off, filled when on (better visual feedback)
  - Styled to match "Happening now" button aesthetic (green theme)
  - "Happening now" button moved next to location button for better grouping
  - Community Center header cell made more compact and beautiful with icon

### Improved

- **🔧 Code Simplification**: Refactored sorting logic
  - Created reusable `compareSessions` helper function
  - Eliminated code duplication across multiple sorting locations
  - Cleaner, more maintainable codebase
  - Added public domain ingress resources with Cloudflare Origin Certificate TLS
  - Updated OAuth redirect URI to use `https://swimto.eldertree.xyz/auth/callback`
  - Added new domain to CORS origins for API access
  - Uses Cloudflare Origin Certificates (free, no port forwarding required, 15-year validity)
  - Enables trusted HTTPS for mobile browsers (required for geolocation services)
  - No ACME challenges or port forwarding needed
  - **Infrastructure as Code**: Certificate management via Terraform (automated setup)

---

## [0.5.1] - 2025-11-20

### Fixed

- **🕐 Timezone Fix**: Fixed "today's schedule" returning wrong date due to UTC timezone
  - API now uses Toronto timezone (`America/Toronto`) to determine "today"
  - Fixes issue where schedules for tomorrow were shown when container was in UTC
  - `/schedule/today` endpoint now correctly returns sessions for the current day in Toronto
  - Default `date_from` filter also uses Toronto timezone

### Added

- **⏰ Travel Time Window**: Enhanced "Happening Now" filter with 30-minute travel window

  - Sessions starting within 30 minutes are now included (travel time consideration)
  - Makes the filter more useful for finding sessions you can still make it to
  - Shows sessions from (start_time - 30 min) to end_time

- **🔄 Sort Toggle Button**: Added sort button to toggle between sorting modes
  - **Unpressed (default)**: Favorites sorted first, then chronological order
  - **Pressed**: Favorites sorted first, then by distance (when location enabled)
  - Only appears when location is enabled
  - Clear visual feedback showing current sort mode
  - Works in both list and table view modes

### Changed

- Updated Google OAuth redirect URI to use public domain (`swimto.eldertree.xyz`)
- Added `swimto.eldertree.xyz` to CORS allowed origins
- Added `swimto.eldertree.xyz` to Vite preview allowed hosts
- Switched from Let's Encrypt to Cloudflare Origin Certificates for simpler setup
- **⚡ CI/CD Performance Improvements**:
  - Parallelized Docker image builds (API and Web now build simultaneously)
  - Optimized PR builds to use single platform (`linux/amd64`) for faster feedback
  - Added 30-minute timeout to prevent infinite hangs
  - PR builds now complete in ~2-3 minutes instead of potentially hanging

### Fixed

- **🔒 Mixed Content Security**: Fixed API calls using HTTP on HTTPS pages
  - API client now detects HTTPS pages and uses absolute HTTPS URLs
  - Prevents browser mixed content errors blocking API requests
  - Fixes Google OAuth login failure on production site (`swimto.eldertree.xyz`)
- **🌐 Vite Host Checking**: Disabled strict host checking for production
  - Set `strictHost: false` in Vite preview config
  - Allows requests from any host (security handled by Kubernetes ingress/TLS)
  - Fixes "host not allowed" error for `swimto.eldertree.xyz`

---

## [0.5.0] - 2025-11-17

### Fixed

- **🔐 HTTPS/TLS Support**: Enabled secure HTTPS for all connections
  - Implemented self-signed certificate management with cert-manager
  - Configured automatic HTTP to HTTPS redirect
  - **Fixes Google OAuth login** (requires secure context)
  - **Fixes Geolocation API** (requires HTTPS in browsers)
  - Updated OAuth redirect URI to use `https://swimto.eldertree.local/auth/callback`
- **📱 Mobile View Optimization**: Perfected mobile experience
  - **Smart default**: List view automatically selected on mobile (< 768px)
  - **Removed clutter**: Hidden view toggle buttons on mobile - list view is optimal
  - Table view reserved for desktop where horizontal space is abundant
  - Clean, card-based layout perfect for vertical scrolling
  - No more horizontal scrolling or cut-off text
  - Touch-optimized buttons and spacing
  - Steve Jobs-level attention to mobile UX

### Added

- **Location Request Button**: New "Enable Location" button for easier geolocation access
  - Appears in Schedule view toolbar when location is not enabled
  - Added to Map view with clear call-to-action
  - Replaces automatic location request on page load
  - Users can now control when to grant location permission
  - Includes refresh button when location is already active
- **HTTP-only Ingress for WireGuard Access**: Added IP-based access for mobile VPN users
  - Allows direct IP access (192.168.2.83) via WireGuard VPN
  - HTTP-only ingress rules for IP-based access
  - Hostname access (swimto.eldertree.local) uses HTTPS with TLS

### Changed

- **Improved Subtitle**: Changed to "Find drop-in swim times at Toronto's community pools"
  - More concise and action-oriented
  - Clearer description of app functionality
  - Better keyword placement for discoverability

### Technical

- **Docker Workflow Refactor**: Optimized to single build-and-push job
  - Builds multi-platform images once (linux/amd64, linux/arm64)
  - Conditionally pushes based on event type
  - Improved GitHub Actions cache utilization for faster builds
  - Better separation of concerns and visibility in Actions UI
  - Pull requests now only build (no registry push)

---

## [0.4.0] - 2025-11-15

### Added

- **"Happening Now" Filter**: New interactive filter to show only currently active swim sessions
  - Converted yellow legend into clickable button with visual feedback
  - Active state shows enhanced border and shadow
  - Filters sessions in real-time to show only those in progress
  - Combines with favorites and distance sorting hierarchies
  - Works in both list and table view modes

### Changed

- **Automatic Distance Sorting**: Location-based sorting now happens automatically when available
  - Removed manual "Sort by distance" button for cleaner UX
  - Distance calculation and sorting happens automatically on location access
  - Displays "Sorted by distance" indicator when location is active
  - Maintains sorting hierarchy: Favorites → Distance → Chronological
  - Simpler interface without toggle buttons
- **Profile Page Banner**: Redesigned with artistic swimming pool theme
  - Added water-inspired gradient (cyan to blue)
  - Swimming pool lane dividers with dashed markers
  - Animated water bubbles (large and small) with pulse effects
  - Flowing water wave animations at multiple speeds
  - Caustic light effects mimicking underwater light patterns
  - Removed redundant logout button (already in header)
  - Enhanced visual appeal and thematic consistency

### Fixed

- **Facility Website Links**: Fixed all incorrect location IDs using official Toronto Open Data
  - **CRITICAL FIX**: Corrected 35 facilities with wrong location IDs (e.g., Mary McCormick: 522 → 100)
  - Used Toronto Parks & Recreation Facilities CSV from Open Data as authoritative source
  - Final 3 manual corrections: Leaside (789), Centennial (537), Scarborough Civic (1099)
  - Merged duplicate Joseph J. Piccininni facility entries
  - **All 42 Toronto facilities now have correct website links**

### Technical

- Added `prioritizeHappeningNow` state for filter functionality
- Updated session filtering logic to support "happening now" mode
- Removed `sortByDistance` state in favor of automatic behavior
- Simplified location control UI components
- Rewrote `fix_all_facility_urls.py` to use Toronto Open Data Parks & Recreation Facilities CSV
- Implemented fuzzy name matching algorithm for facility data reconciliation
- Integrated Toronto Open Data API (CKAN) as authoritative source for location IDs
- Added wave animation keyframes to `index.css`
- Updated facility and session sorting functions for cleaner logic

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
