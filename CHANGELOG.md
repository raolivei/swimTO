# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Versioning

**Current Status**: Pre-release (0.x.x versions)

- **0.x.x**: Development versions - API may change, features are stabilizing
- **1.0.0**: First production-ready release - will be tagged when ready for public use

---

## [0.8.0] - 2026-04-01

### Fixed

- **Map marker clicks (definitive fix)**: Replaced `Marker` + `DivIcon` with `CircleMarker` for all pool markers. `CircleMarker` renders as a native SVG `<circle>` in Leaflet's overlay pane — click/tap events are always reliable without any transparent-div, z-index, or pointer-events complexity.

---

## [0.7.9] - 2026-02-01

### Fixed

- **Map marker clicks**: Overlay containers (search bar, zoom controls, FABs) were positioned at z-index 10 with large invisible transparent areas that intercepted every click/tap before it could reach Leaflet markers beneath them. Fixed by adding `pointer-events: none` to each container and `pointer-events: auto` to interactive children only.
- **Touch tap reliability on iOS**: Changed `.leaflet-container` `touch-action` from `none` to `manipulation`, eliminating the 300 ms double-tap delay so Leaflet's click synthesis fires immediately on tap — swipe-back navigation still suppressed via `overscroll-behavior: none`.
- **OAuth redirect_uri persistence**: Stored `swimto_oauth_redirect_uri` in `localStorage` instead of `sessionStorage` so it survives cross-origin redirects on iOS Safari.

---

## [0.7.8] - 2026-02-17

### Changed

- **Happening Now Sorting**: Sessions happening now appear at the top
  - Facilities with currently active sessions are prioritized first
  - Within each facility, happening-now sessions sorted before upcoming ones
  - Secondary sort by start time for consistent ordering

---

## [0.7.7] - 2026-02-17

### Fixed

- **Happening Now Filter**: Hide sessions that have already ended
  - Only shows sessions currently in progress (yellow highlight) or starting later today
  - Previously showed all of today's sessions including past ones

---

## [0.7.6] - 2026-02-17

### Added

- **Dynamic Filter Buttons**: Filter buttons now show only swim types that exist in the data
  - Computed dynamically from API response instead of hardcoded list
  - Added `AQUATIC_FITNESS` swim type with label, abbreviation, and cyan color styling

### Changed

- **Improved "Happening Now" Filter**: Now shows all of today's sessions
  - Sessions literally in progress still highlighted in yellow
  - Sessions happening later today display with normal styling
- **Smart Age Filters**: Hide infant/child age filters when adult/senior swim types are selected

### Fixed

- **Local Development**: Simplified Vite proxy configuration
  - Default proxy target now points to production API for easier local development
  - Removed trailing slash logic that was causing 404 errors
- **API Tests**: Fixed test URLs to not use trailing slashes (matching API routes)
- **Trailing Slash Handling**: Added TrailingSlashMiddleware to API
  - Strips trailing slashes from request paths to prevent 404 errors
- **Mobile UI**: Age filter chips now always visible, renamed "Filters" to "Swim Types"

---

## [0.7.5] - 2026-02-02

### Changed

- **📱 Mobile Schedule View**: Improved layout groups sessions by facility
  - Sessions are now grouped under facility headers instead of repeating facility name for each time slot
  - Compact 2-column grid displays time slots within each facility card
  - More efficient use of screen space on mobile devices

### Fixed

- **🌙 Dark Mode Styling**: Fixed facility header visibility in dark mode
  - Changed invalid `dark:bg-gray-750` to valid `dark:bg-gray-700` Tailwind class
  - Improved text contrast for facility names (`dark:text-white`)
  - Better address text visibility (`dark:text-gray-300`)

---

## [0.7.4] - 2026-01-27

### Fixed

- **🔐 OAuth Error Handling**: Improved Google OAuth callback error handling
  - Added detailed error messages for common OAuth failures (redirect_uri_mismatch, invalid_grant)
  - Added proper handling for unexpected Google API responses
  - Added database error handling with proper rollback
  - Now returns specific error messages instead of generic 500 errors
  - Added troubleshooting documentation for OAuth 500 errors

---

## [0.7.3] - 2026-01-20

### Fixed

- **🛣️ API Route Trailing Slash**: Fixed 404 errors on `/api/facilities` and `/api/schedule`
  - Changed route definitions from `"/"` to `""` in facilities and schedule routers
  - Routes now work without requiring trailing slash
- **🔐 Auth Endpoint Routing**: Fixed Traefik middleware to properly strip `/api` prefix
  - Created `api-strip-prefix-clean` middleware using `replacePathRegex`
  - Fixes 404 on `/api/auth/google-url` endpoint

---

## [0.7.2] - 2026-01-20

### Fixed

- **🌐 OAuth Domain Support**: Added `https://swimto.app` to allowed OAuth origins
  - Enables Google OAuth login when accessing the app via swimto.app domain
  - Fixed redirect URI mismatch that was causing "Origin parameter not in allowed list" errors

### Infrastructure

- **🔧 Cluster Networking**: Fixed critical networking issue on eldertree cluster
  - Resolved Tailscale routing table conflict that blocked pod-to-pod cross-node communication
  - Added systemd service to prevent route conflicts on node-2 reboot
  - Fixed ingress routing to properly handle /auth and /health paths

---

## [0.7.1] - 2026-01-20

### Fixed

- **🔐 Login 307 Redirect**: Fixed FastAPI trailing slash redirects breaking CORS on auth endpoints
  - Added `redirect_slashes=False` to FastAPI app configuration
  - Prevents 307 redirects that break OAuth flow on some environments

- **📜 Double Scrollbar**: Fixed double scrollbar appearing on some pages
  - Removed conflicting `min-h-[calc(100dvh-8rem)]` from ScheduleView
  - Simplified CSS overflow handling

### Changed

- **Footer Branding**: Updated footer to show "Made with ❤ by Pitanga" as text link to pitanga.cloud
  - Removed Pitanga logo icon for cleaner appearance

---

## [0.7.0] - 2026-01-18

### Added

- **🔒 API Rate Limiting**: Implemented rate limiting using slowapi
  - 60 requests/minute per IP for public endpoints (`/facilities/*`, `/schedule/*`)
  - Rate limit headers in responses (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
  - Returns 429 Too Many Requests when exceeded

- **📊 Prometheus Metrics**: Enabled Prometheus instrumentation for API monitoring
  - Metrics endpoint at `/metrics`
  - Request latency, error rates, and throughput metrics
  - Ready for Grafana dashboard integration

- **🐛 Sentry Error Tracking**: Optional Sentry integration for error monitoring
  - Automatic exception capture with stack traces
  - FastAPI and Starlette integration
  - Configurable via `SENTRY_DSN` environment variable

- **🔐 Security Headers Middleware**: Added security headers to all API responses
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - HSTS in production (Strict-Transport-Security)

- **📦 GZip Compression**: Added GZip middleware for response compression
  - Compresses responses larger than 1KB
  - Reduces bandwidth usage for API consumers

- **💾 Automated Database Backups**: CronJob for daily PostgreSQL backups
  - Daily backups at 3:00 AM UTC
  - 7-day retention policy with automatic cleanup
  - SHA256 checksums for backup verification
  - Scripts: `backup-postgres.sh`, `restore-postgres.sh`

- **📚 Disaster Recovery Documentation**: Comprehensive DR guide
  - Backup verification procedures
  - Restore procedures (interactive and automated)
  - Full system recovery checklist
  - Incident response guidelines

### Changed

- Updated `requirements.txt` with production dependencies (slowapi, sentry-sdk)
- Updated API documentation with rate limiting information

---

## [Unreleased]

### Added

- **♿ Accessibility Improvements (#81)**: All interactive elements now meet 44px minimum tap target requirement
  - ShareButton and CalendarButton in schedule view
  - Favorite star buttons across list and table views
  - Navigation buttons (prev/next day/week, today)
  - Filter toggle and view mode buttons
  - Distance buttons and modal cancel buttons
  - Close buttons in map sidebar
  - Location controls (Enable, Recenter, Disable)

### Changed

- **📚 Enhanced Z-Index Documentation (#50)**: Updated CSS variables and documentation
  - Added PWA layer documentation (z-2500, z-3000)
  - Added CSS variables for all z-index values
  - Clear layer hierarchy from base content to PWA modals

- **🔐 Multi-Domain OAuth Support**: Google OAuth now works across multiple domains
  - Dynamic redirect URI detection based on request origin
  - Supports `swimto.eldertree.xyz` (public), `swimto.eldertree.local` (internal), and `localhost` (dev)
  - Frontend passes origin to backend for correct redirect URI construction
  - Redirect URI stored in sessionStorage for callback verification
- **⚙️ User Preferences**: New preferences system for personalized experience
  - New `UserPreferences` database model with view, location, and notification preferences
  - REST API endpoints: GET/PUT/PATCH/DELETE `/preferences`
  - Stores: default view mode, swim type filter, dark mode preference
  - Stores: home location (lat/lng/address), default search radius
  - Stores: notification preferences for favorite updates
  - Extensible `extra` JSON field for future preferences

- **🌐 Public Domain Support**: Configured `swimto.eldertree.xyz` with Cloudflare Origin Certificates
  - Added public domain ingress resources with Cloudflare Origin Certificate TLS
  - Updated OAuth redirect URI to use `https://swimto.eldertree.xyz/auth/callback`
  - Added new domain to CORS origins for API access
  - Uses Cloudflare Origin Certificates (free, no port forwarding required, 15-year validity)
  - Enables trusted HTTPS for mobile browsers (required for geolocation services)
  - No ACME challenges or port forwarding needed
  - **Infrastructure as Code**: Certificate management via Terraform (automated setup)
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

- Updated Google OAuth redirect URI to use public domain (`swimto.eldertree.xyz`)
- Added `swimto.eldertree.xyz` to CORS allowed origins
- Added `swimto.eldertree.xyz` to Vite preview allowed hosts
- Switched from Let's Encrypt to Cloudflare Origin Certificates for simpler setup
- **⚡ CI/CD Performance Improvements**:
  - Parallelized Docker image builds (API and Web now build simultaneously)
  - Optimized PR builds to use single platform (`linux/amd64`) for faster feedback
  - Added 30-minute timeout to prevent infinite hangs
  - PR builds now complete in ~2-3 minutes instead of potentially hanging
- **Data Quality**: Removed 1,904 demo sessions, verified 2,325 real sessions
- Enhanced accessibility, error handling, responsive navigation

---

## [0.5.1] - 2025-11-25

### Fixed

- **🔐 Login Visibility**: Increased z-index of login error popup and header to ensuring they appear above the map
- **🔒 HTTPS/Mixed Content**: Forcing HTTPS for API requests when on an HTTPS page to prevent mixed content errors and Google login failures
- **📱 Mobile Layout**: Adjusted sidebar positioning on mobile to prevent overlap with the search bar

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
  - Implemented self-signed certificate management with cert-manager
  - Configured automatic HTTP to HTTPS redirect
  - **Fixes Google OAuth login** (requires secure context)
  - **Fixes Geolocation API** (requires HTTPS in browsers)
  - Updated OAuth redirect URI to use `https://swimto.eldertree.local/auth/callback`
- **📱 Mobile UX**: List view auto-selected on mobile (< 768px), hidden view toggle buttons, touch-optimized interface
  - **Smart default**: List view automatically selected on mobile (< 768px)
  - **Removed clutter**: Hidden view toggle buttons on mobile - list view is optimal
  - Table view reserved for desktop where horizontal space is abundant
  - Clean, card-based layout perfect for vertical scrolling
  - No more horizontal scrolling or cut-off text
  - Touch-optimized buttons and spacing

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
