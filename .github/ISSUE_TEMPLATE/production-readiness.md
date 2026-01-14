# 🚀 Production Readiness: Pre-Launch Checklist for 100 Users/Day

## Overview

This issue tracks all critical components needed before launching swimTO to market with an expected load of 100 users per day browsing lightly.

## Current Status

**✅ Working:**
- Basic deployment on k3s cluster (eldertree)
- HTTPS with Cloudflare Origin Certificates
- OAuth authentication (Google)
- Daily data refresh via CronJob
- Health checks and liveness probes
- CI/CD pipelines
- Database and Redis caching

## Critical Gaps (Must Have Before Launch)

### 1. 🔴 Automated Database Backups
**Priority:** Critical  
**Status:** Manual backup process exists, no automation

- [ ] Create `k8s/postgres-backup-cronjob.yaml` for daily automated backups
- [ ] Create `scripts/backup-postgres.sh` backup script
- [ ] Create `scripts/restore-postgres.sh` restore script
- [ ] Configure 7-day backup retention policy
- [ ] Test restore process end-to-end
- [ ] Document backup/restore procedures in `docs/DISASTER_RECOVERY.md`

**Files to Create:**
- `k8s/postgres-backup-cronjob.yaml`
- `scripts/backup-postgres.sh`
- `scripts/restore-postgres.sh`

---

### 2. 🔴 API Rate Limiting
**Priority:** Critical  
**Status:** Explicitly documented as missing in `docs/API.md`

- [ ] Add rate limiting middleware to FastAPI
- [ ] Configure limits: 100 requests/minute per IP, 1000/day per authenticated user
- [ ] Add rate limit headers to responses
- [ ] Update API documentation with rate limit information
- [ ] Test rate limiting behavior

**Files to Update:**
- `apps/api/app/main.py` - Add rate limiting middleware
- `apps/api/requirements.txt` - Add `slowapi` or `fastapi-limiter`
- `docs/API.md` - Document rate limits

---

### 3. 🔴 Error Tracking & Alerting
**Priority:** Critical  
**Status:** No error tracking service configured

- [ ] Integrate Sentry SDK (or similar) in FastAPI backend
- [ ] Add error boundary with reporting in React frontend
- [ ] Create `k8s/sentry-secret.yaml` for Sentry DSN
- [ ] Configure alerting rules for critical errors
- [ ] Test error reporting end-to-end

**Files to Create/Update:**
- `apps/api/app/main.py` - Add Sentry integration
- `apps/web/src/lib/error-handler.ts` - Frontend error boundary
- `k8s/sentry-secret.yaml` - Store Sentry DSN

---

### 4. 🔴 Legal Pages (Terms of Service & Privacy Policy)
**Priority:** Critical  
**Status:** Referenced in strategy but not implemented

- [ ] Create `apps/web/src/pages/TermsOfService.tsx`
- [ ] Create `apps/web/src/pages/PrivacyPolicy.tsx`
- [ ] Ensure compliance with Canadian privacy laws (PIPEDA)
- [ ] Add footer links to legal pages
- [ ] Add route configuration for legal pages

**Files to Create:**
- `apps/web/src/pages/TermsOfService.tsx`
- `apps/web/src/pages/PrivacyPolicy.tsx`

**Files to Update:**
- `apps/web/src/components/Layout.tsx` - Add footer links
- `apps/web/src/App.tsx` - Add routes

---

### 5. 🔴 Payment Processing
**Priority:** Critical  
**Status:** Planned in `PROJECT_STRATEGY.md` but not implemented

- [ ] Implement Stripe Checkout integration
- [ ] Create purchase flow UI
- [ ] Add license validation middleware
- [ ] Create payment success/failure pages
- [ ] Test payment flow in Stripe test mode
- [ ] Store Stripe keys in `k8s/stripe-secret.yaml`

**Files to Create:**
- `apps/api/app/routes/payment.py` - Payment endpoints
- `apps/web/src/pages/Purchase.tsx` - Purchase page
- `apps/web/src/components/PaymentForm.tsx` - Payment UI
- `k8s/stripe-secret.yaml` - Store Stripe keys

---

## High Priority (First Week After Launch)

### 6. 🟡 Monitoring & Observability
**Priority:** High  
**Status:** Prometheus dependencies installed but not configured

- [ ] Enable Prometheus instrumentator in FastAPI app
- [ ] Set up basic Grafana dashboards (API latency, error rates, DB health)
- [ ] Configure alerting rules for critical metrics
- [ ] Document monitoring setup

**Files to Update:**
- `apps/api/app/main.py` - Add Prometheus instrumentator

**Files to Create (Optional):**
- `k8s/prometheus-deployment.yaml`
- `k8s/grafana-deployment.yaml`

---

### 7. 🟡 Privacy-Respecting Analytics
**Priority:** High  
**Status:** Planned but not implemented

- [ ] Implement privacy-respecting analytics (Plausible or self-hosted)
- [ ] Configure no-cookie, aggregated-only tracking
- [ ] Add analytics component to frontend
- [ ] Document analytics approach in Privacy Policy

**Files to Create:**
- `apps/web/src/lib/analytics.ts`
- `apps/web/src/components/Analytics.tsx`

---

### 8. 🟡 Resource Scaling & Performance
**Priority:** High  
**Status:** Single replica deployments, no autoscaling

- [ ] Create `k8s/api-hpa.yaml` - HPA for API (scale 1-3 replicas)
- [ ] Create `k8s/web-hpa.yaml` - HPA for Web (scale 1-2 replicas)
- [ ] Perform load testing for 100 concurrent users
- [ ] Optimize based on load test results

**Files to Create:**
- `k8s/api-hpa.yaml`
- `k8s/web-hpa.yaml`

---

## Medium Priority (First Month)

### 9. 🟢 Log Aggregation & Management
**Priority:** Medium  
**Status:** Basic logging to stdout only

- [ ] Configure structured logging (JSON format)
- [ ] Set up centralized log storage (or document kubectl logs usage)
- [ ] Configure log retention policy
- [ ] Document log access procedures

**Files to Update:**
- `apps/api/app/config.py` - Configure structured logging

---

### 10. 🟢 Disaster Recovery & Documentation
**Priority:** Medium  
**Status:** Basic deployment docs exist, no DR plan

- [ ] Create `docs/DISASTER_RECOVERY.md` - DR procedures
- [ ] Create `docs/RUNBOOK.md` - Operations runbook
- [ ] Create `docs/INCIDENT_RESPONSE.md` - Incident handling
- [ ] Document recovery time objectives (RTO) and recovery point objectives (RPO)

**Files to Create:**
- `docs/DISASTER_RECOVERY.md`
- `docs/RUNBOOK.md`
- `docs/INCIDENT_RESPONSE.md`

---

### 11. 🟢 Security Hardening
**Priority:** Medium  
**Status:** Basic security in place, needs review

- [ ] Add security headers middleware (CSP, HSTS, X-Frame-Options)
- [ ] Configure request size limits
- [ ] Audit input validation across all endpoints
- [ ] Review and update CORS configuration

**Files to Update:**
- `apps/api/app/main.py` - Add security headers
- `apps/web/vite.config.ts` - Configure security headers
- `k8s/ingress.yaml` - Add security annotations

---

### 12. 🟢 Performance Optimization
**Priority:** Medium  
**Status:** Basic caching with Redis, needs optimization

- [ ] Enable gzip compression middleware
- [ ] Optimize database queries (audit slow queries)
- [ ] Review and optimize Redis caching strategy
- [ ] Consider CDN for static assets
- [ ] Optimize frontend build for production

**Files to Update:**
- `apps/api/app/main.py` - Add compression middleware
- `apps/web/vite.config.ts` - Optimize build
- Database query review in `apps/api/app/routes/`

---

## Testing Requirements

Before launch, perform:

- [ ] **Load Testing:** 100 concurrent users
- [ ] **Payment Flow Testing:** Test mode end-to-end
- [ ] **Backup/Restore Testing:** Verify data recovery
- [ ] **Error Scenario Testing:** DB down, API failures
- [ ] **Security Audit:** OWASP Top 10 review

---

## Success Criteria

- [ ] 99% uptime over 7 days
- [ ] <500ms API response time (p95)
- [ ] Zero data loss (backups verified)
- [ ] Payment processing working
- [ ] Legal pages accessible
- [ ] Error tracking capturing issues
- [ ] Rate limiting preventing abuse

---

## Estimated Effort

- **Critical items (1-5):** 2-3 days
- **High priority (6-8):** 2-3 days
- **Medium priority (9-12):** 3-4 days
- **Total:** ~7-10 days of focused work

---

## Related Documentation

- [PROJECT_STRATEGY.md](../PROJECT_STRATEGY.md) - Business model and go-to-market strategy
- [docs/ROADMAP.md](../docs/ROADMAP.md) - Future roadmap
- [docs/DEPLOYMENT_PI.md](../docs/DEPLOYMENT_PI.md) - Deployment guide
- [docs/API.md](../docs/API.md) - API reference

---

**Labels:** `production`, `critical`, `enhancement`, `infrastructure`

**Milestone:** v1.0.0 Launch











