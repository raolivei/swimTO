# Repository audit — 2026-11-10

Tracks [#321](https://github.com/raolivei/swimTO/issues/321) and
[#322](https://github.com/raolivei/swimTO/issues/322). Findings below are observations,
not claims that a proposed change has already merged.

## CI investigation

The last five workflow executions before November 2026 match the reported
3/5 result. Three were successful Dependabot metadata jobs, not application tests.

| Run | Workflow | Result / evidence |
| --- | --- | --- |
| [41191135906](https://github.com/raolivei/swimTO/actions/runs/41191135906) | Build and Push Docker Images | Failed API dependency install: Python 3.15 ARM64 had no `psycopg-binary==3.2.3` wheel. |
| [41191135899](https://github.com/raolivei/swimTO/actions/runs/41191135899) | Pull Request Checks | Playwright 1.56.1 could not install Chromium dependencies on Ubuntu 26.04. VERSION check passed. |
| [41191082810](https://github.com/raolivei/swimTO/actions/runs/41191082810) | Dependabot Updates | Passed. |
| [41191082755](https://github.com/raolivei/swimTO/actions/runs/41191082755) | Dependabot Updates | Passed. |
| [41191082664](https://github.com/raolivei/swimTO/actions/runs/41191082664) | Dependabot Updates | Passed. |

The failed proposal was [#320](https://github.com/raolivei/swimTO/pull/320), now
closed without merging. The production Dockerfile remains `python:3.11-slim`.
Dependabot now stays on that supported minor; a runtime upgrade requires a
coordinated dependency update and ARM64 build. This leaves 3.11 patch updates enabled.

The browser-test runner was pinned to Ubuntu 24.04 in
[#323](https://github.com/raolivei/swimTO/pull/323). Evidence on its final head:
[regression checks 42719290715](https://github.com/raolivei/swimTO/actions/runs/42719290715)
passed API tests, municipal ingestion tests, VERSION and Playwright;
[image checks 42719290368](https://github.com/raolivei/swimTO/actions/runs/42719290368)
passed both image builds. The subsequent
[production build 42720205104](https://github.com/raolivei/swimTO/actions/runs/42720205104)
published both `v0.11.0` images successfully. No shared workflow defect was found
in these two failures.

## Licensing and generated status documents

The repository was public, but [#167](https://github.com/raolivei/swimTO/pull/167)
was closed without merging. Its proposed MIT conversion had not taken effect;
`LICENSE` and `COPYRIGHT` still restricted reuse. Rafael explicitly authorized
completing the MIT conversion on 2026-11-10. This change applies MIT to the
software and keeps municipal data attribution separate. README and contributor
guidance are aligned. [#168](https://github.com/raolivei/swimTO/issues/168) also
tracks external TomeVault follow-up; that communication/indexing is not verified
by this audit.

The root cleanup report, two deployment reports and original MASTER_PROMPT are
preserved under [docs/archive/2025](archive/2025/) with historical banners. The
original prompt is not current agent guidance. Changelog entries remain historical.

## Minimum usage metrics

Reuse the existing Prometheus/Grafana stack; no third-party tracker or browser
fingerprint is needed. The live `/api/metrics` exposes route-template labels
(`handler`, `method`, grouped `status`), with no IP, email, query, facility ID or
user ID labels. Existing aggregate DB gauges refresh every five minutes.

| Measure | Existing signal | Interpretation |
| --- | --- | --- |
| Successful schedule reads per day | `sum(increase(http_requests_total{namespace="swimto",handler="/schedule",method="GET",status="2xx"}[1d]))` | Requests, including refreshes, retries and bots; not unique people. |
| Successful pool searches per day | Same expression with `handler="/facilities"` | API reads; one map interaction can issue several requests. |
| Registered accounts | `max(swimto_db_users_total{namespace="swimto"})` | Current DB count; use max because replicas observe the same DB. |
| Signups today / this week | `max(swimto_db_users_signups_today{namespace="swimto"})` / `max(swimto_db_users_signups_week{namespace="swimto"})` | Boundaries are America/Toronto. |

Signup panels already exist in pi-fleet's `helm/monitoring-stack/dashboards/swimto-dashboard.json`.
HTTP metrics are provided by the existing FastAPI instrumentator and Service
scrape annotations. Daily/weekly active users, referral attribution, and client
page-view counts are not implemented; do not relabel HTTP traffic as DAU/WAU.
Metrics add no person-level identifier or cookie. This statement describes
metrics only: OAuth accounts and normal operational logs have their own data
handling. Use existing monitoring retention; do not export user records for analytics.

## Ingress scope

The live Helm release has two hostless ingresses, `swimto-api-ip` and
`swimto-web-ip`. They are explicitly declared under **IP-based (no host, low
priority)** in pi-fleet's `clusters/eldertree/swimto/helmrelease.yaml`, with router
priority `10`. Kubernetes renders the absent host as `*`; it is not a literal
wildcard-domain rule. Their intended purpose is direct-IP fallback.

Named routes exist separately for `swimto.app`, `www.swimto.app`,
`api.swimto.app`, `swimto.eldertree.local`, and the legacy public domain.
The fallback also matches otherwise-unclaimed Host headers; this is broader
than the named routes and is an explicit infrastructure choice, not an auth
boundary. The audit leaves the declared fallback unchanged. Any removal or
restriction must be a pi-fleet PR that preserves named-host routing and verifies
LAN/public access; never delete or patch Helm-owned ingresses directly.
