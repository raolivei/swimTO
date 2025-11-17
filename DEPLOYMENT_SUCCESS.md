# SwimTO Deployment to Eldertree - SUCCESS ✅

**Date**: November 16, 2025  
**Cluster**: eldertree (Raspberry Pi k3s)  
**Status**: FULLY OPERATIONAL

---

## 🎉 Deployment Summary

SwimTO is now running successfully on the `eldertree` cluster with all core functionality operational.

### ✅ What's Working

1. **Web Frontend** (`swimto-web`)

   - Running on port 3000
   - Accessible via ingress at `http://swimto.eldertree.local/`
   - Serving the React PWA application

2. **API Backend** (`swimto-api`)

   - Running on port 8000
   - Accessible via ingress at `http://swimto.eldertree.local/api/`
   - Health check: `GET /api/health` returns `200 OK`
   - Version: 2.0.0

3. **Database** (PostgreSQL)

   - Running and healthy
   - **48 facilities** loaded
   - **100+ swim sessions** loaded (demo data)
   - All Toronto indoor pools with correct location IDs and URLs

4. **Cache** (Redis)

   - Running and healthy
   - Connected to API for session caching

5. **Ingress** (Traefik)

   - Two separate ingresses configured:
     - `swimto-api`: Routes `/api` to backend (with prefix stripping)
     - `swimto-web`: Routes `/` to frontend
   - HTTP only (TLS disabled - cert-manager not available)

6. **GitOps** (Flux CD)
   - Flux is syncing from `pi-fleet` repository
   - Auto-applies changes from Git
   - Current revision: `main@sha1:fd31105`

---

## 📊 Current State

### Pods

```
NAME                          STATUS    RESTARTS
postgres-8685c85d58-dm4g9     Running   1
redis-59c5db95bd-bjvvl        Running   1
swimto-api-59d496bb8d-t6njl   Running   0
swimto-web-7ddbf4d95f-sbg2g   Running   1
```

### Services

```
postgres-service     ClusterIP   10.43.101.214   5432/TCP
redis-service        ClusterIP   10.43.131.113   6379/TCP
swimto-api-service   ClusterIP   10.43.224.55    8000/TCP
swimto-web-service   ClusterIP   10.43.15.156    3000/TCP
```

### Ingresses

```
swimto-api   traefik   swimto.eldertree.local   192.168.2.83   80
swimto-web   traefik   swimto.eldertree.local   192.168.2.83   80
```

---

## 🔧 Key Fixes Applied

### 1. **Multi-Platform Docker Images**

- Updated GitHub Actions workflow to build for both `linux/amd64` and `linux/arm64`
- Raspberry Pi now pulls compatible ARM64 images from GHCR

### 2. **Data Pipeline Integration**

- Modified `apps/api/Dockerfile` to include `data-pipeline/` directory
- Changed Docker build context from `./apps/api` to `.` (repo root)
- API image now contains database seeding scripts

### 3. **Ingress Routing**

- Created separate ingresses for API and web for better control
- Added Traefik middleware `strip-api-prefix` to remove `/api` prefix before forwarding
- Disabled TLS/HTTPS (cert-manager not available in fresh cluster)

### 4. **Database Initialization**

- Successfully ran `reseed_all.py` job to populate database
- Loaded all 48 Toronto indoor pool facilities with correct data
- Generated demo swim schedules for testing

### 5. **GHCR Authentication**

- Created `ghcr-secret` with GitHub Personal Access Token
- Added `imagePullSecrets` to both API and Web deployments
- Pods can now pull private images from GHCR

### 6. **Flux CD Setup**

- Installed Flux using Helm chart
- Configured GitRepository pointing to `github.com/raolivei/pi-fleet`
- Kustomization auto-syncs `clusters/eldertree/swimto/` manifests
- Disabled infrastructure components to reduce cluster load

---

## 🧪 API Test Results

### Health Check

```bash
curl -H 'Host: swimto.eldertree.local' http://192.168.2.83/api/health
```

```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2025-11-17T03:51:44.025121"
}
```

### Facilities Endpoint

```bash
curl -H 'Host: swimto.eldertree.local' http://192.168.2.83/api/facilities/?limit=3
```

- Returns 48 total facilities
- Includes facility details, next session, and session count
- All facilities have correct Toronto Open Data URLs

### Schedule Endpoint

```bash
curl -H 'Host: swimto.eldertree.local' http://192.168.2.83/api/schedule/?swim_type=LANE_SWIM&limit=3
```

- Returns 100+ LANE_SWIM sessions
- Demo data includes varied times across different facilities
- Sessions span next 30 days

---

## 📁 Repository Changes

### SwimTO Repository

**Commit**: `eae064e` - "Include data-pipeline in API Docker image for database initialization"

**Files Modified**:

1. `apps/api/Dockerfile`

   - Changed COPY paths to work with repo root context
   - Added data-pipeline directory to image

2. `.github/workflows/build-and-push.yml`
   - Changed API build context from `./apps/api` to `.`
   - Added `platforms: linux/amd64,linux/arm64` for multi-platform builds

### Pi-Fleet Repository

**Commits**:

1. `56ad5c4` - "Disable infrastructure for fresh cluster"
2. `33faa08` - "Add imagePullSecrets to swimto deployments"
3. `7f7c002` - "Disable TLS for swimto ingress (cert-manager not available)"
4. `fd31105` - "Fix API routing with separate ingresses and strip prefix middleware"

**Files Modified**:

1. `clusters/eldertree/kustomization.yaml`

   - Commented out `infrastructure` to reduce cluster load

2. `clusters/eldertree/swimto/api-deployment.yaml`

   - Added `imagePullSecrets: - name: ghcr-secret`

3. `clusters/eldertree/swimto/web-deployment.yaml`

   - Added `imagePullSecrets: - name: ghcr-secret`

4. `clusters/eldertree/swimto/ingress.yaml`
   - Replaced single ingress with two separate ingresses
   - Added Traefik middleware for `/api` prefix stripping
   - Disabled TLS configuration

---

## 🚀 Access Information

### From Within Cluster Network

```bash
# Web Frontend
curl -H 'Host: swimto.eldertree.local' http://192.168.2.83/

# API
curl -H 'Host: swimto.eldertree.local' http://192.168.2.83/api/health
```

### DNS Setup Required

To access from browsers, add to `/etc/hosts` or configure DNS:

```
192.168.2.83  swimto.eldertree.local
```

Then open: `http://swimto.eldertree.local/`

---

## 📋 Next Steps (When Infrastructure is Re-enabled)

1. **Enable HTTPS**

   - Install cert-manager
   - Uncomment TLS configuration in ingress
   - Generate self-signed or Let's Encrypt certificates

2. **Re-enable Infrastructure**

   - Vault for secrets management
   - External Secrets Operator to sync from Vault
   - External DNS for automatic DNS management
   - Monitoring stack (if desired)

3. **Setup Scheduled Jobs**

   - CronJob for daily data refresh (already in repo)
   - CronJob for weekly URL validation (already in repo)

4. **Enable Other Projects**
   - Uncomment projects in `clusters/eldertree/kustomization.yaml`
   - Ensure cluster has sufficient resources

---

## 🔍 Troubleshooting

### If API returns 404

```bash
# Check ingress
kubectl get ingress -n swimto

# Check middleware
kubectl get middleware -n swimto

# Restart Traefik
kubectl rollout restart deployment traefik -n kube-system
```

### If pods are in ImagePullBackOff

```bash
# Verify secret exists
kubectl get secret ghcr-secret -n swimto

# Check deployment has imagePullSecrets
kubectl get deployment swimto-api -n swimto -o yaml | grep imagePullSecrets -A 2
```

### If database is empty

```bash
# Run database initialization job
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: swimto-db-init
  namespace: swimto
spec:
  template:
    spec:
      imagePullSecrets:
        - name: ghcr-secret
      containers:
        - name: db-init
          image: ghcr.io/raolivei/swimto-api:latest
          imagePullPolicy: Always
          command: ["python", "/data-pipeline/jobs/reseed_all.py"]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: swimto-secrets
                  key: DATABASE_URL
          envFrom:
            - configMapRef:
                name: swimto-config
      restartPolicy: Never
  backoffLimit: 3
EOF

# Monitor job
kubectl get job swimto-db-init -n swimto -w
```

---

## 📝 Lessons Learned

1. **Fresh k3s Start Recommended**: After cluster instability, wiping etcd and starting fresh was the fastest path to stability

2. **Multi-Platform Builds Essential**: Raspberry Pi requires ARM64 images; always specify `platforms: linux/amd64,linux/arm64`

3. **Data Pipeline in API Image**: Including data-pipeline tools in the API Docker image enables database initialization jobs

4. **Separate Ingresses**: Using separate ingresses for API and web provides better control over routing and middleware

5. **Flux is Lightweight**: Flux CD runs fine even on a constrained cluster and simplifies deployments

6. **Start Minimal**: Deploying only SwimTO (no infrastructure) reduced complexity and prevented cluster overload

---

## ✅ Verification Checklist

- [x] All pods running and healthy
- [x] API health check returns 200
- [x] Database populated (48 facilities, 100+ sessions)
- [x] Web frontend loads
- [x] API endpoints return data
- [x] Ingress routing works (both / and /api)
- [x] Flux CD syncing from Git
- [x] Multi-platform images building
- [x] GHCR authentication working

---

**Deployment completed at**: 2025-11-17 03:52 UTC  
**Time to full operation**: ~2 hours (from fresh cluster start)

🎊 **SwimTO is live on eldertree!** 🎊
