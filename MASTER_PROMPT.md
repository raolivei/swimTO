# 🏊‍♂️ SwimTO — MASTER PROMPT (V4.0 for Raspberry Pi k3s)

You are an expert full-stack engineer + open-data integrator building a **commercial product**.

Build a monorepo called **swimto** that aggregates and displays **indoor community-pool drop-in swim schedules** for the City of Toronto.

---

## 🔒 Business Model & Licensing

### Strategic Direction

**This is now a COMMERCIAL product with a hybrid business approach:**

1. **Repository Status: PRIVATE**

   - GitHub repository must be set to private immediately
   - Protects intellectual property and future development
   - Controls access to codebase

2. **Monetization Model**

   - **Price:** $0.99 one-time purchase
   - **Distribution:** QR code at facilities or via app stores
   - **Value Proposition:** Convenience, reliability, and supporting local development

3. **Licensing**

   - Fully proprietary from inception (v1.0.0+)
   - All rights reserved by Rafael Oliveira
   - Commercial use only with explicit permission
   - No open-source release planned initially

4. **Future Considerations**
   - Build user base first
   - May open-source later for community contributions
   - Evaluate dual-licensing model (commercial + open source)

### User Value Proposition

What users pay for:

- ✅ Reliable, always-updated schedule data
- ✅ Fast, mobile-optimized experience
- ✅ Self-hosted infrastructure (no ads, no tracking)
- ✅ Support for local developer
- ✅ Continued maintenance and improvements

### Action Items

**Immediate:**

- [ ] Make GitHub repository private
- [ ] Update LICENSE file to proprietary license
- [ ] Remove public references/links to repository
- [ ] Consider trademark for "SwimTO" name

**Short Term:**

- [ ] Set up payment processing (Stripe, Apple Pay, Google Pay)
- [ ] Create QR code distribution mechanism
- [ ] Design purchase/download flow
- [ ] Add privacy-respecting analytics

**Medium Term:**

- [ ] Evaluate app store distribution (Apple App Store, Google Play)
- [ ] Build marketing materials
- [ ] Gather user feedback and iterate

---

## 🎯 Technical Goals

1. Collect → Normalize → Display drop-in swim schedules for all indoor pools.

2. Prefer official City of Toronto Open Data APIs / datasets before scraping.

3. Run fully self-hosted on Rafael's Raspberry Pi k3s cluster.

4. Deploy automatically via a self-hosted GitHub Actions runner.

5. **Use Helm charts where applicable** - Prefer Helm charts for deployments when suitable charts exist. Keep setup simple and low-maintenance — minimal YAML, update ≈ once per year.

---

## 🔐 Vault: Single Source of Truth

**CRITICAL PRINCIPLE: Vault is the single source of truth for ALL secrets and sensitive configuration.**

### Core Rules

1. **Always use Vault** - Any secret, API key, password, token, or sensitive configuration MUST be stored in Vault
2. **Never hardcode secrets** - No secrets in code, config files, environment variables, or deployment manifests
3. **Vault first** - When adding new features requiring secrets, store them in Vault first, then reference via External Secrets Operator
4. **External Secrets Operator** - Automatically syncs secrets from Vault to Kubernetes secrets every 24 hours
5. **No alternatives** - Do not use Kubernetes secrets directly, ConfigMaps for secrets, or any other secret management solution

### What Goes in Vault

- Database passwords and connection strings
- API keys (OpenAI, Leonardo.ai, external services)
- OAuth credentials (client IDs, client secrets)
- Admin tokens and secret keys
- Service account credentials
- TLS certificates and keys
- Any other sensitive configuration values

### Workflow

1. **Store in Vault** → Use `vault kv put` or scripts like `update-vault-api-keys.sh`
2. **Sync to Kubernetes** → External Secrets Operator automatically creates Kubernetes secrets
3. **Reference in Deployments** → Use `secretKeyRef` in deployment manifests
4. **Never commit secrets** → All secrets live only in Vault

### When in Doubt

**If you're unsure whether something should go in Vault:**

- **Ask yourself:** "Is this sensitive or could it be used maliciously?"
- **If yes:** Put it in Vault
- **If no:** Use ConfigMap for non-sensitive configuration

**Remember:** Vault is the source of truth. All other systems (Kubernetes, applications, CI/CD) consume from Vault, never the other way around.

---

## 🧠 Data Ingestion

| Step | Action                                                                           |
| ---- | -------------------------------------------------------------------------------- |
| 1    | Query open.toronto.ca for datasets ("swim", "drop-in", "recreation", "aquatic"). |
| 2    | If a dataset with schedule times exists, use it directly.                        |
| 3    | Always pull facility metadata from pools.xml.                                    |
| 4    | Crawl facility pages (e.g. Mary McCormick, Norseman, Pam McConnell).             |
| 5    | Detect hidden JSON / XHR endpoints via Playwright (locationId, weekStart).       |
| 6    | If none → parse HTML weekly tables ("For the week of …") with BeautifulSoup.     |
| 7    | Normalize → dedupe → store in PostgreSQL (or local SQLite).                      |

**Canonical fields:**
`facility_id, name, address, postal_code, district, lat, lon, swim_type, date, start_time, end_time, notes, source`

---

## ⚙️ Backend – FastAPI

**Endpoints**

```
GET  /facilities
GET  /schedule
GET  /schedule/today
POST /update   (token-protected)
```

**Stack**

- FastAPI + SQLAlchemy + Alembic
- PostgreSQL (or local SQLite)
- Optional Redis cache
- Cron job or manual /update trigger

---

## 💻 Frontend – React + Vite + TypeScript

- **Map View (state-of-the-art):**

  - Interactive Toronto map (Leaflet / Mapbox).
  - Shows _only_ community centers offering **LANE SWIM** sessions.
  - Pins display facility name, next available lane swim, and schedule preview.
  - Clustered view, filters, and "open now" highlights.

- **Schedule View (top-of-the-art):**

  - Modern, calendar-style layout showing weekday + time for all **LANE SWIM** drop-in programs.
  - Filter by district, day, or time range.
  - Clicking a facility on the map highlights its schedule in the list.
  - Responsive mobile design, integrated with map interactions.

- **Facility Card:**
  - Shows next sessions, address → Google Maps link, alerts, and "Updated X h ago".

---

## 🗂️ Repo Layout

```
swimto/
├─ apps/
│  ├─ api/          ← FastAPI backend
│  └─ web/          ← React frontend
├─ data-pipeline/   ← discovery + ETL
├─ k8s/             ← bare YAMLs for k3s
├─ .github/workflows/
├─ docker-compose.yml
├─ MASTER_PROMPT.md     ← This file - project guide
├─ PROJECT_STRATEGY.md  ← Business model & licensing
├─ COPYRIGHT            ← Proprietary copyright notice
└─ README.md
```

---

## 🧩 Data Model

```sql
CREATE TABLE facilities (
  facility_id TEXT PRIMARY KEY,
  name TEXT, address TEXT, postal_code TEXT,
  district TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
  is_indoor BOOLEAN, source TEXT, raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  facility_id TEXT REFERENCES facilities(facility_id),
  swim_type TEXT, date DATE, start_time TIME, end_time TIME,
  notes TEXT, source TEXT, hash TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🧰 Docker & Local Stack

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
  api:
    build: ./apps/api
    environment:
      DATABASE_URL: postgresql+psycopg://postgres:postgres@db:5432/pools
    ports: ["8000:8000"]
  web:
    build: ./apps/web
    ports: ["5173:5173"]
```

---

## ☁️ k3s Deployment (Raspberry Pi) with Vault Secrets

### Overview

SwimTO is deployed to a Raspberry Pi k3s cluster (eldertree) using Kubernetes manifests. **Use Helm charts where applicable** for better maintainability and reusability. When Helm charts are not available or not suitable, use raw YAML manifests. **ALL secrets are managed through Vault** and automatically synced to Kubernetes via External Secrets Operator. This ensures no hardcoded secrets in deployment files and centralized secret management.

### Prerequisites

- k3s cluster running (eldertree control plane)
- Vault deployed and accessible
- External Secrets Operator installed and configured
- ClusterSecretStore configured for Vault
- kubectl configured with `~/.kube/config-eldertree`

### Vault Secrets Configuration

**All SwimTO secrets are stored in Vault at these paths:**

- `secret/swimto/postgres` - PostgreSQL password
- `secret/swimto/database` - Complete database URL
- `secret/swimto/redis` - Redis URL
- `secret/swimto/app` - Admin token and secret key
- `secret/swimto/api-keys` - OpenAI and Leonardo.ai API keys (optional)
- `secret/swimto/oauth` - Google OAuth credentials (optional)

**Setting Secrets in Vault:**

```bash
# Get Vault pod
VAULT_POD=$(kubectl get pods -n vault -l app.kubernetes.io/name=vault -o jsonpath='{.items[0].metadata.name}')

# Set PostgreSQL password
POSTGRES_PWD=$(python3 -c 'import secrets; print(secrets.token_urlsafe(16))')
kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN=root && vault kv put secret/swimto/postgres password=$POSTGRES_PWD"

# Set database URL
kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN=root && vault kv put secret/swimto/database url=postgresql+psycopg://postgres:$POSTGRES_PWD@postgres-service:5432/pools"

# Set Redis URL
kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN=root && vault kv put secret/swimto/redis url=redis://redis-service:6379"

# Set admin token and secret key
kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN=root && vault kv put secret/swimto/app admin-token=\$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))') secret-key=\$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"

# Set API keys (optional - use placeholders if not available)
kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN=root && vault kv put secret/swimto/api-keys openai-api-key=placeholder-openai-key leonardo-api-key=placeholder-leonardo-key"

# Set OAuth credentials (optional)
kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN=root && vault kv put secret/swimto/oauth google-client-id=placeholder-client-id google-client-secret=placeholder-client-secret"
```

### ExternalSecret Resource

The ExternalSecret resource automatically syncs secrets from Vault to Kubernetes:

```yaml
# Located at: pi-fleet/clusters/eldertree/infrastructure/external-secrets/externalsecrets/swimto-secrets.yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: swimto-secrets
  namespace: swimto
spec:
  refreshInterval: 24h
  secretStoreRef:
    name: vault
    kind: ClusterSecretStore
  target:
    name: swimto-secrets
    creationPolicy: Owner
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: secret/swimto/database
        property: url
    - secretKey: REDIS_URL
      remoteRef:
        key: secret/swimto/redis
        property: url
    - secretKey: ADMIN_TOKEN
      remoteRef:
        key: secret/swimto/app
        property: admin-token
    - secretKey: POSTGRES_PASSWORD
      remoteRef:
        key: secret/swimto/postgres
        property: password
    - secretKey: SECRET_KEY
      remoteRef:
        key: secret/swimto/app
        property: secret-key
    - secretKey: OPENAI_API_KEY
      remoteRef:
        key: secret/swimto/api-keys
        property: openai-api-key
    - secretKey: LEONARDO_API_KEY
      remoteRef:
        key: secret/swimto/api-keys
        property: leonardo-api-key
    - secretKey: GOOGLE_CLIENT_ID
      remoteRef:
        key: secret/swimto/oauth
        property: google-client-id
    - secretKey: GOOGLE_CLIENT_SECRET
      remoteRef:
        key: secret/swimto/oauth
        property: google-client-secret
```

**Important:** This ExternalSecret is managed by Flux GitOps in the pi-fleet repository. It automatically syncs secrets every 24 hours.

### Kubernetes Deployment Files

**Files in `/k8s` directory:**

- `namespace.yaml` - Namespace definition
- `api-deployment.yaml` - API deployment and service (2 replicas)
- `web-deployment.yaml` - Web frontend deployment and service (2 replicas)
- `postgres-deployment.yaml` - PostgreSQL database
- `redis-deployment.yaml` - Redis cache
- `postgres-pvc.yaml` - Persistent volume for PostgreSQL (local-path storage)
- `configmap.yaml` - Non-sensitive configuration values
- `cronjob-refresh.yaml` - Daily data refresh job
- `ingress.yaml` - Ingress configuration for external access

**Key Features:**

- All secrets referenced via `secretKeyRef` from `swimto-secrets`
- Optional secrets marked with `optional: true` (API keys, OAuth)
- Resource limits configured for Raspberry Pi constraints
- Security contexts configured (runAsNonRoot, readOnlyRootFilesystem)
- Health checks configured for all services

### Deployment Steps

1. **Ensure Vault secrets are set** (see above)

2. **Verify ExternalSecret is syncing:**

```bash
kubectl get externalsecret swimto-secrets -n swimto
kubectl get secret swimto-secrets -n swimto
```

3. **Deploy all components:**

```bash
export KUBECONFIG=~/.kube/config-eldertree
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/web-deployment.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/cronjob-refresh.yaml
```

4. **Verify deployment:**

```bash
kubectl get pods -n swimto
kubectl get svc -n swimto
kubectl get ingress -n swimto
kubectl logs -f deployment/swimto-api -n swimto
```

### Ingress Configuration

- Host: `swimto.eldertree.local` (or configured domain)
- TLS: Managed by cert-manager with self-signed certificates
- Paths:
  - `/api` → swimto-api-service (port 8000)
  - `/` → swimto-web-service (port 80)

### CI/CD with GitHub Actions

**Self-hosted runner setup:**

```bash
# On Pi cluster
cd ~/actions-runner
./config.sh --url https://github.com/raolivei/swimTO --token YOUR_TOKEN
sudo ./svc.sh install
sudo ./svc.sh start
```

**Workflow:**

1. Build Docker images (swimto-api:latest, swimto-web:latest)
2. Load into k3s: `k3s ctr images import <(docker save swimto-api:latest)`
3. Apply Kubernetes manifests: `kubectl apply -f k8s/`

**Important:** Secrets are NOT managed by CI/CD. They are set manually in Vault and synced automatically by External Secrets Operator.

### Daily Data Refresh

A CronJob runs daily at 3 AM to refresh pool schedule data:

```yaml
# k8s/cronjob-refresh.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: swimto-data-refresh
  namespace: swimto
spec:
  schedule: "0 3 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: data-refresh
              image: swimto-api:latest
              command: ["python", "/data-pipeline/jobs/daily_refresh.py"]
              env:
                - name: DATABASE_URL
                  valueFrom:
                    secretKeyRef:
                      name: swimto-secrets
                      key: DATABASE_URL
```

### Security Best Practices

✅ **Vault is the source of truth** - ALL secrets MUST be stored in Vault first (see "Vault: Single Source of Truth" section above)  
✅ **External Secrets Operator** - Automatic sync from Vault to Kubernetes every 24 hours  
✅ **No hardcoded secrets** - All deployments use `secretKeyRef` from External Secrets Operator  
✅ **Never commit secrets** - Secrets exist only in Vault, never in git repositories  
✅ **Optional secrets** - API keys and OAuth marked as optional in deployments  
✅ **Security contexts** - runAsNonRoot, readOnlyRootFilesystem, capabilities dropped

### Troubleshooting

**Secrets not syncing:**

```bash
kubectl describe externalsecret swimto-secrets -n swimto
kubectl logs -n external-secrets deployment/external-secrets
```

**Pods failing to start:**

```bash
kubectl logs deployment/swimto-api -n swimto
kubectl get secret swimto-secrets -n swimto
```

**Database connection issues:**

```bash
kubectl get pods -n swimto | grep postgres
kubectl logs deployment/postgres -n swimto
```

---

## 🤖 GitHub Actions

```yaml
name: Deploy to Pi k3s
on: [push]
jobs:
  build-deploy:
    runs-on: [self-hosted, linux, arm64]
    steps:
      - uses: actions/checkout@v4
      - name: Build images
        run: |
          docker build -t swimto-api:latest apps/api
          docker build -t swimto-web:latest apps/web
      - name: Load into k3s
        run: |
          k3s ctr images import <(docker save swimto-api:latest)
          k3s ctr images import <(docker save swimto-web:latest)
      - name: Deploy
        run: kubectl apply -f k3s/
```

---

## 🧾 Env Vars

```
DATABASE_URL=postgresql+psycopg://postgres:postgres@db:5432/pools
ADMIN_TOKEN=change-me
CITY_BASE_URL=https://www.toronto.ca
OPEN_DATA_BASE_URL=https://open.toronto.ca
INGEST_WINDOW_DAYS=56
```

---

## 📘 Docs to Generate

- **README.md** – overview + setup + Open Data license + **commercial notice**
- **PROJECT_STRATEGY.md** – business model, licensing strategy, roadmap
- **COPYRIGHT** – proprietary copyright notice
- **INGESTION.md** – data sources + normalization
- **DEPLOYMENT_PI.md** – k3s + runner setup
- **API.md**, **FRONTEND.md**, **OPERATIONS.md**, **SECURITY.md**
- **LICENSE** – update to proprietary for v2.0.0+

---

## ✅ Acceptance Checklist

**Technical:**

- `docker compose up` runs locally
- `/schedule/today` returns real data
- Map + List views render LANE SWIM data correctly
- `/update` triggers refresh
- GitHub Actions deploys to Pi cluster
- Cron keeps data fresh

**Business:**

- Repository is set to private on GitHub
- LICENSE file updated to proprietary
- PROJECT_STRATEGY.md documents business model
- Payment processing mechanism designed
- Distribution strategy (QR codes / app stores) defined
- Analytics/telemetry implemented (privacy-respecting)
- Support/feedback mechanism in place

---

## 🗺️ Enhanced Visualization Goals

1. **Interactive Map (Toronto-focused):**

   - Displays all community centers with **LANE SWIM** sessions.
   - Uses **Leaflet or Mapbox** with clustering, filters, and "open now" highlights.

2. **Top-tier Schedule View:**
   - Calendar-style grid showing **weekday + time slots** for each **LANE SWIM** program.
   - Integrated with the map — selecting a facility highlights its sessions.

---

## 💡 Key Principles

1. **Vault-First:** Vault is the single source of truth for all secrets and sensitive configuration
2. **Privacy-First:** No tracking, no ads, no data selling
3. **Quality-Focused:** Reliable data, fast performance, great UX
4. **Self-Hosted:** Complete control over infrastructure
5. **Commercial Viability:** Sustainable through fair pricing
6. **Local Value:** Supporting Toronto swimmers and local development

---

**Version:** 4.0  
**Last Updated:** November 5, 2025  
**Status:** Development → Commercial Launch  
**License:** Proprietary (all versions)

---

## 🚀 Next Steps

1. Switch GitHub repository to private
2. Create PROJECT_STRATEGY.md document
3. Update LICENSE and add COPYRIGHT
4. Plan payment integration
5. Design QR code distribution system
