# Cluster-Based Development Setup for eldertree

## Problem

Currently, all development happens locally (on developer's machine) using Docker Compose and local processes. This means:

- Development environment differs from production (k3s cluster)
- Cannot test cluster-specific features (ingress, service discovery, etc.)
- Requires local Docker and port management
- Changes must be manually built and deployed to test in cluster

## Goal

Set up a development workflow that runs directly in the **eldertree** k3s cluster with hot reloading, allowing:

- ✅ Code changes automatically sync to cluster pods
- ✅ Services hot reload without manual rebuilds/deployments
- ✅ Test in real cluster environment (ingress, services, etc.)
- ✅ Isolated from production (`swimto-dev` namespace)
- ✅ No local Docker/port conflicts

## Architecture

- **Dev Namespace**: `swimto-dev` (isolated from production `swimto` namespace)
- **Tool**: Skaffold for hot reloading and file syncing
- **Workflow**: Code changes → Auto-sync to pods → Hot reload (Vite for web, uvicorn --reload for API)
- **Access**: Port forwarding or dev ingress at `swimto-dev.eldertree.local`

## Implementation Plan

### 1. Create Development Namespace and Resources

**Files to create:**
- `k8s/dev/namespace.yaml` - Dev namespace definition
- `k8s/dev/configmap.yaml` - Dev-specific config (different from production)
- `k8s/dev/postgres-deployment.yaml` - Dev database (can be lighter)
- `k8s/dev/redis-deployment.yaml` - Dev Redis instance
- `k8s/dev/api-deployment.yaml` - API with development settings
- `k8s/dev/web-deployment.yaml` - Web with development settings
- `k8s/dev/ingress.yaml` - Dev ingress (optional, for browser access)

**Key differences from production:**
- Lower resource limits
- Development image tags
- Environment variables for hot reload
- Volume mounts for file syncing (handled by Skaffold)

### 2. Create Development Dockerfiles

**Files to create:**
- `apps/api/Dockerfile.dev` - Development Dockerfile with hot reload support
- `apps/web/Dockerfile.dev` - Development Dockerfile (may reuse existing development stage)

**API Dockerfile.dev:**
- Install dependencies
- Expose port 8000
- Run `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- Don't copy code (Skaffold will sync)

**Web Dockerfile.dev:**
- Use existing development stage from current Dockerfile
- Ensure Vite dev server runs with `--host 0.0.0.0`

### 3. Set Up Skaffold Configuration

**File to create:** `skaffold.yaml`

**Configuration includes:**
- Build configuration for API and Web images
- File sync rules for hot reload:
  - `apps/api/**/*.py` → `/app` in API pod
  - `apps/web/src/**/*.{ts,tsx,css}` → `/app/src` in Web pod
  - `apps/web/public/**/*` → `/app/public` in Web pod
- Deploy configuration using kubectl (not Helm, for simplicity)
- Port forwarding for local access
- Profiles for different environments

**Key Skaffold features:**
- `sync` rules for Python and TypeScript files
- `build.local.push: false` (build on cluster node)
- `deploy.kubectl.manifests` pointing to dev k8s manifests

### 4. Create Development Scripts

**Files to create:**
- `scripts/dev-cluster.sh` - Main script to start cluster dev
- `scripts/dev-cluster-stop.sh` - Stop cluster dev
- `scripts/dev-cluster-logs.sh` - View logs

**dev-cluster.sh:**
- Check kubectl context (must be `eldertree`)
- Check Skaffold installation
- Run `skaffold dev --port-forward`
- Handle cleanup on exit

### 5. Update Development Documentation

**File to update:** `docs/LOCAL_DEVELOPMENT.md`

**Add section:**
- Cluster-based development setup
- Prerequisites (Skaffold, kubectl, eldertree context)
- Quick start guide
- Troubleshooting

### 6. Set Up Database Initialization for Dev

**Consideration:**
- Dev namespace needs its own database
- May want to seed with sample data or copy from production
- Create init job or script for dev database setup

## File Structure

```
swimTO/
├── skaffold.yaml                    # NEW - Skaffold config
├── k8s/
│   ├── dev/                         # NEW - Dev manifests
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── postgres-deployment.yaml
│   │   ├── redis-deployment.yaml
│   │   ├── api-deployment.yaml
│   │   ├── web-deployment.yaml
│   │   └── ingress.yaml
│   └── ... (existing prod manifests)
├── apps/
│   ├── api/
│   │   └── Dockerfile.dev           # NEW - Dev Dockerfile
│   └── web/
│       └── Dockerfile.dev           # NEW or use existing dev stage
├── scripts/
│   ├── dev-cluster.sh               # NEW
│   ├── dev-cluster-stop.sh          # NEW
│   └── dev-cluster-logs.sh          # NEW
└── docs/
    └── LOCAL_DEVELOPMENT.md         # UPDATE - Add cluster dev section
```

## Workflow

1. Developer runs `./scripts/dev-cluster.sh`
2. Skaffold builds dev images (or uses existing)
3. Skaffold deploys to `swimto-dev` namespace
4. Skaffold sets up file syncing and port forwarding
5. Developer makes code changes
6. Skaffold syncs files to pods
7. Services hot reload automatically:
   - Vite detects changes and rebuilds
   - uvicorn detects Python changes and reloads
8. Developer accesses via port-forward or ingress

## Prerequisites

Before implementation, verify:
- [ ] Skaffold is installed (`skaffold version`)
- [ ] kubectl context `eldertree` is configured
- [ ] Cluster has resources for dev namespace
- [ ] Docker is available on cluster nodes (for local builds)

## Testing Checklist

After implementation, verify:
- [ ] `./scripts/dev-cluster.sh` starts successfully
- [ ] API pod starts and hot reloads on Python file changes
- [ ] Web pod starts and hot reloads on TypeScript/CSS changes
- [ ] Port forwarding works (can access services locally)
- [ ] Dev ingress works (can access via `swimto-dev.eldertree.local`)
- [ ] Database is accessible and can be initialized
- [ ] Redis is accessible
- [ ] `./scripts/dev-cluster-stop.sh` cleans up properly
- [ ] Production namespace (`swimto`) is unaffected

## Benefits

- Test in real cluster environment
- No local Docker/port conflicts
- Automatic hot reloading
- Isolated from production
- Easy to switch between local and cluster dev

## Related Files

- `docs/LOCAL_DEVELOPMENT.md` - Current local development guide
- `k8s/` - Existing production Kubernetes manifests
- `docker-compose.yml` - Current local development setup
- `scripts/local-dev.sh` - Current local development script

## Notes

- This setup uses Skaffold for hot reloading, which is well-suited for k3s
- Dev namespace is completely isolated from production
- Can run both local and cluster dev simultaneously (different namespaces)
- Consider adding a `dev` profile to Skaffold for different configurations

