# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Mobile Testing Framework**: Comprehensive mobile testing setup with Playwright

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

- [GitHub Repository](https://github.com/raolivei/swimTO)
- [City of Toronto Open Data](https://open.toronto.ca)
