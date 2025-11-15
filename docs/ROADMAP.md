# SwimTO - Future Roadmap & Vision

## Current State (v0.3.0)

### ✅ Completed Features
- **Real-time Schedule Data**: Automated data pipeline fetching Toronto pool schedules
- **Interactive Map**: Geolocation-based facility discovery with distance calculation
- **Favorites System**: Full-featured favorites with localStorage (guest) + backend sync (authenticated)
- **User Authentication**: Google OAuth integration with session management
- **Dark Mode**: System-aware theme with manual toggle and localStorage persistence
- **PWA Foundation**: Manifest configured for "Add to Home Screen" support
- **Responsive UI**: Mobile-first design with Playwright mobile tests
- **Smart Filtering**: By swim type, facility, distance, and availability
- **Data Pipeline**: Automated daily refresh via CronJob
- **Production Deployment**: Running on k3s with GitOps (Flux CD)

### 🏗️ Architecture
```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser   │────▶│   Web (Nginx)│────▶│   API (FastAPI)│
│   (React)   │     │   Port 3000  │     │   Port 8000    │
└─────────────┘     └──────────────┘     └────────┬───────┘
                                                   │
                            ┌──────────────────────┴──────────┐
                            │                                 │
                       ┌────▼─────┐                    ┌─────▼────┐
                       │PostgreSQL│                    │  Redis   │
                       │ Database │                    │  Cache   │
                       └──────────┘                    └──────────┘
                            ▲
                            │
                    ┌───────┴────────┐
                    │  Data Pipeline │
                    │   (CronJob)    │
                    └────────────────┘
```

---

## 🎯 Short-term Goals (v0.4.0 - Q1 2026)

### User Experience Enhancements
- [ ] **Push Notifications**: Alert users when favorite pools open sessions
- [ ] **Session Reminders**: Calendar integration for scheduled swims
- [ ] **Offline Mode**: Service worker for cached schedule access
- [ ] **Share Schedules**: Deep linking to specific facilities/sessions
- [ ] **Accessibility Audit**: WCAG 2.1 AA compliance review

### Data Improvements
- [ ] **Historical Data**: Track session availability trends over time
- [ ] **Crowd Predictions**: ML-based busy time forecasts
- [ ] **Price Information**: Drop-in fees, monthly passes, and family rates
- [ ] **Amenities Data**: Pool length, lane count, temperature, accessibility features
- [ ] **Program Details**: Lessons, aquafit, swim clubs information

### Technical Debt
- [x] **Mobile Testing**: Playwright mobile test suite ✅
- [ ] **Desktop E2E Tests**: Complete Playwright coverage
- [ ] **Performance Monitoring**: Prometheus + Grafana dashboards
- [ ] **Error Tracking**: Sentry integration
- [ ] **API Rate Limiting**: Protect against abuse
- [ ] **Service Worker**: Enable offline capabilities

---

## 🚀 Mid-term Vision (v0.5.0 - v0.9.0 - 2026)

### Expansion
- [ ] **Multi-city Support**: Expand beyond Toronto (Ottawa, Vancouver, etc.)
- [ ] **Activity Types**: Add tennis courts, gyms, community centers
- [ ] **Social Features**: User reviews and ratings
- [ ] **Advanced Search**: Natural language queries ("outdoor heated pools near me")

### Mobile Apps
- [ ] **Native iOS App**: Swift/SwiftUI
- [ ] **Native Android App**: Kotlin/Jetpack Compose
- [ ] **App Store Deployment**: TestFlight beta program

### API Platform
- [ ] **Public API**: REST + GraphQL endpoints
- [ ] **Developer Portal**: Documentation and API keys
- [ ] **Webhooks**: Real-time schedule change notifications
- [ ] **Third-party Integrations**: Calendar apps, fitness trackers

---

## 🌟 Long-term Vision (v1.0.0+)

### Smart Assistant
- **AI-powered Recommendations**: Personalized swim schedule suggestions
- **Voice Commands**: "Alexa, find me a lane swim tonight"
- **Automated Booking**: Integration with city booking systems (if available)

### Community Platform
- **Swim Groups**: Connect with other swimmers
- **Events**: Pool parties, swim meets, lessons
- **Challenges**: Gamification and achievement badges

### Municipal Partnership
- **Official Data Feed**: Direct integration with city systems
- **Real-time Capacity**: Live pool occupancy data
- **Dynamic Scheduling**: Show cancellations/updates instantly

---

## 🛠️ Development & Deployment

### Current Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Python 3.11 + FastAPI + SQLAlchemy
- **Database**: PostgreSQL 17 + Redis 4.6
- **Infrastructure**: Kubernetes (k3s) + Flux CD + Vault
- **CI/CD**: GitHub Actions → GHCR → GitOps

### Deployment Process
1. **Development**: Local Docker Compose environment
2. **Build**: GitHub Actions builds and pushes images to GHCR
3. **Deploy**: Flux CD syncs manifests from `pi-fleet` repo
4. **Monitor**: Kubernetes health checks + liveness probes

```bash
# Force immediate deployment
kubectl rollout restart deployment/swimto-api -n swimto
kubectl rollout restart deployment/swimto-web -n swimto

# Or sync with Flux
flux reconcile kustomization swimto --with-source
```

### Contributing
See [CONTRIBUTING.md](../CONTRIBUTING.md) for development setup and guidelines.

---

## 📊 Success Metrics

### v1.0.0 Launch Criteria
- [ ] **Uptime**: 99.5% availability over 30 days
- [ ] **Performance**: <500ms API response time (p95)
- [ ] **Coverage**: All Toronto indoor pools (50+ facilities)
- [ ] **Users**: 1,000+ monthly active users
- [ ] **Mobile**: Native apps on iOS and Android
- [ ] **Testing**: >80% code coverage
- [ ] **Documentation**: Complete API docs and user guides

---

## 💡 Innovation Ideas (Backlog)

- **AR Navigation**: Indoor pool wayfinding
- **Water Quality Data**: Chlorine levels, temperature tracking
- **Accessibility Features**: Screen reader optimization, high contrast
- **Sustainability**: Track carbon footprint of pool visits
- **Family Mode**: Coordinated scheduling for families
- **Coaching Integration**: Connect with swim instructors
- **Health Tracking**: Integration with Apple Health / Google Fit

---

## 🤝 Partnership Opportunities

1. **City of Toronto**: Official data partnership
2. **Toronto Parks & Recreation**: Cross-promotion
3. **Swim Clubs**: Member benefits and integrations
4. **Fitness Apps**: Strava, MyFitnessPal integration
5. **Tourism Toronto**: Promote aquatic facilities to visitors

---

## 📝 Notes

- All versions before v1.0.0 are considered **pre-release** (0.x.x)
- Breaking changes may occur between minor versions
- Public API will be stable starting at v1.0.0
- Community feedback drives prioritization

**Last Updated**: November 15, 2025  
**Version**: 0.3.0  
**Maintainer**: @raolivei

