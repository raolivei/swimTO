# SwimTO - AI Assistant Context

> **Note**: This file works with Claude Code. See workspace [CLAUDE.md](../CLAUDE.md) for workspace-wide conventions and memory system details.

## Quick Reference

- **Project Type**: Commercial web application (proprietary)
- **Purpose**: Indoor community pool drop-in swim schedules for Toronto
- **Deployed to**: `eldertree` Raspberry Pi k3s cluster
- **Namespace**: `swimto`
- **Tech Stack**: FastAPI (Python) + React/Vite (TypeScript)
- **Secrets Management**: HashiCorp Vault (single source of truth)
- **Ports**: 5173 (web), 8000 (api) - see `../workspace-config/ports/.env.ports`

## Critical Rules

### Security
- **ALWAYS use HTTPS** for production and OAuth (Google blocks HTTP on private IPs)
- **ALL secrets go in Vault** - Never hardcode credentials, API keys, or tokens
- **External Secrets Operator** syncs from Vault to Kubernetes every 24h
- OAuth redirect URIs: `https://` only (never `http://192.168.x.x`)

### Git Workflow
- **NEVER commit directly to main** - Always use feature branches
- **Create focused branches** - One feature/fix per branch (e.g., `feature/api/endpoint-name`)
- **Never run git commands at workspace root** - Always `cd swimTO/` first
- Branch prefixes: `feature/api/`, `feature/web/`, `feature/pipeline/`, `fix/`, `infra/k8s/`, `docs/`

### Changelog & Versioning
- **ALWAYS update CHANGELOG.md** when adding features, fixing bugs, or changing Docker images
- **Git tag versions must match Docker image tags** (e.g., git tag `v1.2.3` = image `swimto-api:v1.2.3`)
- Follow [Keep a Changelog](https://keepachangelog.com/) format

### Development
- **Primary method**: Docker Compose (matches production environment)
- **Use Helm charts where applicable** - Prefer Helm over raw YAML when suitable charts exist
- **No emojis** unless explicitly requested
- **No README.md files** unless explicitly requested

## When to Read What

### Getting Started
- **New to project?** → This file + [MASTER_PROMPT.md](MASTER_PROMPT.md) + [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Local development?** → [LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)
- **Contributing?** → [CONTRIBUTING.md](docs/CONTRIBUTING.md)

### Deployment & Operations
- **Deploying to k3s?** → [DEPLOYMENT_PI.md](docs/DEPLOYMENT_PI.md)
- **Vault secrets?** → [MASTER_PROMPT.md](MASTER_PROMPT.md) (section: "Vault: Single Source of Truth")
- **CloudFlare setup?** → [CLOUDFLARE_SETUP.md](docs/CLOUDFLARE_SETUP.md)
- **Disaster recovery?** → [DISASTER_RECOVERY.md](docs/DISASTER_RECOVERY.md)

### Integration & APIs
- **API endpoints?** → [API.md](docs/API.md)
- **Google OAuth?** → [GOOGLE_AUTH_INTEGRATION.md](docs/GOOGLE_AUTH_INTEGRATION.md)
- **Data sources?** → [JSON_API_FACILITIES.md](docs/JSON_API_FACILITIES.md)

### Troubleshooting
- **General issues?** → [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- **Schedule data problems?** → [TROUBLESHOOTING_SCHEDULE.md](docs/TROUBLESHOOTING_SCHEDULE.md)
- **HTTPS/OAuth issues?** → [HTTPS_MIGRATION.md](docs/HTTPS_MIGRATION.md)
- **Mobile testing?** → [MOBILE_TESTING.md](docs/MOBILE_TESTING.md)
- **Local auth debugging?** → [LOCAL_AUTH_DEBUG.md](docs/LOCAL_AUTH_DEBUG.md)
- **Facility URL validation?** → [FACILITY_URL_VALIDATION.md](docs/FACILITY_URL_VALIDATION.md)

### Planning
- **Roadmap?** → [ROADMAP.md](docs/ROADMAP.md)
- **Marketing?** → [MARKETING.md](docs/MARKETING.md)

## Project Structure

```
swimTO/
├── apps/
│   ├── api/              # FastAPI backend (Python)
│   └── web/              # React + Vite frontend (TypeScript)
├── data-pipeline/        # ETL and data discovery (Python)
├── k8s/                  # Kubernetes manifests
├── helm/                 # Helm charts (if applicable)
├── scripts/              # Utility scripts
├── docs/                 # Documentation
├── CLAUDE.md             # This file - AI assistant entry point
├── MASTER_PROMPT.md      # Comprehensive project guide
└── PROJECT_STRATEGY.md   # Business model & licensing
```

## Data Model Overview

**Facilities Table:**
- `facility_id` (PK), `name`, `address`, `postal_code`, `district`
- `latitude`, `longitude`, `is_indoor`, `source`, `raw` (JSONB)

**Sessions Table:**
- `id` (PK), `facility_id` (FK), `swim_type`, `date`, `start_time`, `end_time`
- `notes`, `source`, `hash` (unique), timestamps

## Environment Setup

### Docker Compose (Recommended)

```bash
# Load workspace port assignments
source ../workspace-config/ports/.env.ports

# Start all services
docker-compose up

# Access services
# Frontend: http://localhost:5173
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Local Development (Alternative)

```bash
# Backend
cd apps/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd apps/web
npm install
npm run dev
```

## Common Tasks

### Adding API Endpoint
1. Create branch: `feature/api/add-endpoint`
2. Add route in `apps/api/app/routes/`
3. Add schema in `apps/api/app/schemas.py`
4. Add tests in `apps/api/tests/`
5. Update [API.md](docs/API.md)
6. Update CHANGELOG.md

### Adding Frontend Component
1. Create branch: `feature/web/add-component`
2. Create component in `apps/web/src/components/`
3. Add types in `apps/web/src/types/`
4. Add tests if needed
5. Export from index if reusable
6. Update CHANGELOG.md

### Deploying to Kubernetes
1. Ensure Vault secrets are set (see [MASTER_PROMPT.md](MASTER_PROMPT.md))
2. Verify ExternalSecret is syncing: `kubectl get externalsecret swimto-secrets -n swimto`
3. Apply manifests: `kubectl apply -f k8s/`
4. Monitor: `kubectl get pods -n swimto`

## Vault Integration

**Vault is the single source of truth for ALL secrets.**

### Secret Paths
- `secret/swimto/postgres` - Database password
- `secret/swimto/database` - Complete database URL
- `secret/swimto/redis` - Redis URL
- `secret/swimto/app` - Admin token, secret key
- `secret/swimto/api-keys` - OpenAI, Leonardo.ai keys (optional)
- `secret/swimto/oauth` - Google OAuth credentials (optional)

### Workflow
1. Store secret in Vault → `vault kv put secret/swimto/...`
2. External Secrets Operator syncs to Kubernetes secret `swimto-secrets`
3. Deployments reference via `secretKeyRef`
4. Never commit secrets to git

See [MASTER_PROMPT.md](MASTER_PROMPT.md) section "Vault: Single Source of Truth" for complete details.

## Important Conventions

### Code Style
- **Python**: PEP 8, type hints, Google-style docstrings, FastAPI dependency injection
- **TypeScript**: Strict mode (no `any`), functional components, TanStack Query, Tailwind CSS
- **Commits**: Conventional commits (`feat(api):`, `fix(web):`, `docs:`)

### Testing
- Backend: `cd apps/api && make test`
- Frontend: `cd apps/web && npm test`
- E2E: Playwright tests in `apps/web/tests/e2e/`

### Pre-flight Checks
```bash
# Check port conflicts
../workspace-config/scripts/check-ports.sh

# Ensure Docker is running
docker ps

# Load port assignments
source ../workspace-config/ports/.env.ports
```

## External References

- **Workspace Config**: `../workspace-config/` - Port assignments, conventions, shared scripts
- **Infrastructure**: `../pi-fleet/` - Kubernetes cluster configuration, Vault setup
- **Runbook**: https://docs.eldertree.xyz - eldertree cluster troubleshooting guide

## Search Tips

1. **Copy exact error messages** from logs or terminal
2. **Search docs/ directory** using grep or file search
3. **Check TROUBLESHOOTING.md** first for common issues
4. **Reference MASTER_PROMPT.md** for comprehensive project context
5. **For cluster issues**, check eldertree runbook at https://docs.eldertree.xyz

## Business Context

- **License**: Proprietary (all rights reserved)
- **Monetization**: $0.99 one-time purchase
- **Distribution**: QR codes at facilities or app stores
- **Privacy**: No tracking, no ads, self-hosted
- **Repository**: Private on GitHub

See [PROJECT_STRATEGY.md](PROJECT_STRATEGY.md) for full business model.

## Key Principles

1. **Vault-First** - Single source of truth for secrets
2. **Privacy-First** - No tracking, no data selling
3. **Quality-Focused** - Reliable data, fast performance
4. **Self-Hosted** - Complete infrastructure control
5. **Commercial Viability** - Sustainable through fair pricing
6. **Local Value** - Supporting Toronto swimmers

---

**Last Updated**: 2026-05-07  
**For Comprehensive Context**: See [MASTER_PROMPT.md](MASTER_PROMPT.md)  
**For Troubleshooting**: See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
