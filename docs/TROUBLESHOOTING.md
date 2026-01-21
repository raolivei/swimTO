# SwimTO Troubleshooting Guide

This document covers common issues with the SwimTO deployment and how to resolve them.

## Common Issues

### 1. API Pods Crashing on Startup

**Symptoms:**

- Pods in `CrashLoopBackOff` state
- Logs show database connection errors during import
- `Base.metadata.create_all()` called at module import time

**Cause:**
Database table creation was happening at module import time, causing crashes if the database wasn't immediately available.

**Solution:**
This has been fixed by moving database table creation to the startup event. The code now:

- Creates tables in the `startup_event` handler (not at import time)
- Handles exceptions gracefully if tables already exist
- Allows the app to start even if database is temporarily unavailable

**Files:**

- `apps/api/app/main.py` - Startup event handler
- `apps/api/app/database.py` - Database connection with timeouts

### 2. Health Check Failures

**Symptoms:**

- Readiness/liveness probes failing
- Pods not becoming ready
- Health endpoint returns errors

**Cause:**
Health check was too strict or timing out during database connection attempts.

**Solution:**
The health check has been made resilient:

- Returns HTTP 200 even if database is unavailable (status: "degraded")
- Uses short timeout (2 seconds) for database checks
- Non-blocking async implementation
- Kubernetes probes have increased timeouts (60s initial delay, 15s period)

**Files:**

- `apps/api/app/routes/health.py` - Resilient health check
- `k8s/api-deployment.yaml` - Updated probe timeouts

### 3. Database Connection Issues

**Symptoms:**

- Connection timeouts
- Stale connection errors
- Long startup times

**Cause:**
Database connection pool not configured for Kubernetes environment.

**Solution:**
Database connection now includes:

- Connection timeout (10 seconds)
- Statement timeout (5 seconds)
- Connection pool recycling (1 hour)
- Pre-ping enabled to check connections before use

**Files:**

- `apps/api/app/database.py` - Connection settings

### 4. Login/Auth 307 Redirect Errors

**Symptoms:**

- Login button shows "Unable to connect to authentication server"
- API logs show `307 Temporary Redirect` for `/auth/google-url/`
- CORS errors in browser console after redirect

**Cause:**
FastAPI's default `redirect_slashes=True` redirects requests with trailing slashes (e.g., `/auth/google-url/` → `/auth/google-url`). This 307 redirect can break CORS on some browser/proxy configurations.

**Solution:**
This has been fixed in v0.7.1 by adding `redirect_slashes=False` to the FastAPI app:

```python
app = FastAPI(
    title=settings.app_name,
    redirect_slashes=False  # Prevent 307 redirects that break CORS
)
```

**Files:**

- `apps/api/app/main.py` - FastAPI app configuration

**Verification:**
```bash
# Check API logs for 307 redirects
kubectl logs -n swimto -l app=swimto-api --tail=50 | grep "307"

# Should see 200 OK instead of 307 after fix
```

### 5. Double Scrollbar Issue

**Symptoms:**

- Two vertical scrollbars visible on page
- Nested scroll areas

**Cause:**
Conflicting height/min-height settings between Layout component (`min-h-dvh`) and page components (e.g., `min-h-[calc(100dvh-8rem)]`).

**Solution:**
Fixed in v0.7.1 by:
- Removing conflicting `min-h-[calc(100dvh-8rem)]` from page components
- Simplifying CSS overflow handling in `index.css`

**Files:**

- `apps/web/src/index.css` - Simplified overflow settings
- `apps/web/src/pages/ScheduleView.tsx` - Removed conflicting min-height
- `apps/web/src/components/Layout.tsx` - Uses `min-h-dvh` for full viewport height

### 6. Image Pull Errors

**Symptoms:**

- `ImagePullBackOff` errors
- Authentication failures pulling from GHCR

**Cause:**
Missing or incorrect GitHub Container Registry credentials.

**Solution:**

1. Ensure `ghcr-secret` exists in the `swimto` namespace
2. Secret should contain GitHub Personal Access Token with `read:packages` permission
3. Deployment uses `imagePullSecrets` to reference the secret

**Files:**

- `k8s/api-deployment.yaml` - Image pull secrets configuration

### 7. Tailscale/k3s Routing Conflict (Cross-Node Networking Failure)

**Symptoms:**

- API pods can't reach PostgreSQL on different nodes
- DNS resolution failing inside pods: `Temporary failure in name resolution`
- `kubectl exec` works but pod can't reach external services
- Connection timeouts to services on other nodes
- Works when pods are on the same node

**Cause:**
Tailscale adds routes in routing table 52 that intercept k3s pod/service CIDR traffic:
- `10.42.0.0/16` (pod network) routed through Tailscale
- `10.43.0.0/16` (service network) routed through Tailscale

This breaks Flannel VXLAN overlay networking between nodes.

**Diagnosis:**
```bash
# SSH to the affected node and check routing table 52
ssh raolivei@node-2.eldertree.local
ip route show table 52 | grep -E "10\.4[23]"
# If you see these routes, Tailscale is intercepting k3s traffic:
# 10.42.0.0/16 dev tailscale0
# 10.43.0.0/16 dev tailscale0
```

**Solution:**

1. Remove the conflicting routes:
```bash
sudo ip route del 10.42.0.0/16 table 52 2>/dev/null
sudo ip route del 10.43.0.0/16 table 52 2>/dev/null
```

2. Make persistent with systemd service:
```bash
cat <<EOF | sudo tee /etc/systemd/system/fix-tailscale-k3s-routes.service
[Unit]
Description=Fix Tailscale routes that conflict with k3s
After=tailscaled.service k3s.service
Wants=tailscaled.service

[Service]
Type=oneshot
ExecStart=/bin/bash -c "sleep 30 && ip route del 10.42.0.0/16 table 52 2>/dev/null; ip route del 10.43.0.0/16 table 52 2>/dev/null"
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable fix-tailscale-k3s-routes.service
```

**Files:**

- See eldertree-docs runbook `NET-006` for full details

### 8. API Route 404 Errors (Trailing Slash Mismatch)

**Symptoms:**

- `/api/facilities` returns 404
- `/api/schedule` returns 404
- Endpoints work with trailing slash (`/api/facilities/`) but not without

**Cause:**
API routes defined with `"/"` require trailing slash. Frontend calls without trailing slash.

**Solution:**
Fixed in v0.7.3 by changing route definitions from `"/"` to `""`:

```python
# Before (requires trailing slash)
@router.get("/", response_model=List[FacilityWithSessions])

# After (accepts both)
@router.get("", response_model=List[FacilityWithSessions])
```

**Files:**

- `apps/api/app/routes/facilities.py` - Changed `"/"` to `""`
- `apps/api/app/routes/schedule.py` - Changed `"/"` to `""`

### 9. Traefik Ingress /api Prefix Not Stripped

**Symptoms:**

- `/api/auth/google-url` returns 404
- API logs show request to `/api/auth/google-url` instead of `/auth/google-url`
- Direct pod access works but ingress routing fails

**Cause:**
Traefik middleware not properly stripping `/api` prefix before forwarding to API service.

**Solution:**
Create Traefik middleware to strip `/api` prefix:

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: api-strip-prefix-clean
  namespace: swimto
spec:
  stripPrefix:
    prefixes:
      - /api
```

Apply to ingress:
```yaml
metadata:
  annotations:
    traefik.ingress.kubernetes.io/router.middlewares: swimto-api-strip-prefix-clean@kubernetescrd
```

**Verification:**
```bash
# Check middleware exists
kubectl get middleware -n swimto

# Test through ingress
curl https://swimto.app/api/health
# Should return health status (API receives /health)
```

### 10. OAuth Callback Routed to API Instead of Frontend

**Symptoms:**

- Google OAuth login redirects to `/auth/callback`
- Browser shows 404 or API error instead of frontend handling the callback
- Login flow broken after Google authentication succeeds

**Cause:**
Ingress routes `/auth/callback` to API service instead of web (frontend) service.

**Solution:**
Add explicit path rule in ingress to route `/auth/callback` to frontend:

```yaml
spec:
  rules:
  - host: swimto.app
    http:
      paths:
      # OAuth callback MUST go to frontend
      - backend:
          service:
            name: swimto-web-service
            port:
              number: 3000
        path: /auth/callback
        pathType: Prefix
      # API routes
      - backend:
          service:
            name: swimto-api-service
            port:
              number: 8000
        path: /api
        pathType: Prefix
      # Default to frontend
      - backend:
          service:
            name: swimto-web-service
            port:
              number: 3000
        path: /
        pathType: Prefix
```

**Note:** Path order matters in Kubernetes Ingress. More specific paths should come first.

## Deployment Configuration

### Probe Settings

The API deployment uses the following probe settings for resilience:

```yaml
livenessProbe:
  initialDelaySeconds: 60 # Allow time for app startup and DB connection
  periodSeconds: 15 # Check every 15 seconds
  timeoutSeconds: 5 # 5 second timeout

readinessProbe:
  initialDelaySeconds: 60 # Allow time for app startup and DB connection
  periodSeconds: 15 # Check every 15 seconds
  timeoutSeconds: 5 # 5 second timeout
```

### Image Pull Policy

The deployment uses `imagePullPolicy: Always` to ensure the latest image is pulled, which is important after fixes are deployed.

## Health Check Behavior

The health endpoint (`/health`) is designed to be resilient:

- **Always returns HTTP 200** - So Kubernetes probes succeed
- **Status field** - "healthy" if DB connected, "degraded" if DB unavailable
- **Database field** - Shows connection status: "connected", "disconnected", "timeout", or "error"
- **Non-blocking** - Uses async with timeout to prevent hanging

This allows pods to be marked as ready even if the database is temporarily unavailable, preventing cascading failures.

## Database Migrations

Database migrations are handled by Alembic:

- Migrations run automatically in the Dockerfile CMD
- If Alembic directory doesn't exist, migration is skipped (no error)
- Migrations run before starting the server

**Files:**

- `apps/api/Dockerfile` - Migration command
- `k8s/api-deployment.yaml` - Migration check in startup script

## Monitoring

### Check Pod Status

```bash
export KUBECONFIG=~/.kube/config-eldertree

# Check all swimto pods
kubectl get pods -n swimto

# Check API pod specifically
kubectl get pods -n swimto -l app=swimto-api

# Check pod logs
kubectl logs -n swimto -l app=swimto-api --tail=50
```

### Check Health Endpoint

```bash
# Port-forward to API
kubectl port-forward -n swimto svc/swimto-api-service 8000:8000

# Test health endpoint
curl http://localhost:8000/health
```

### Check Database Connection

```bash
# Check if database pod is running
kubectl get pods -n swimto -l app=postgres

# Check database logs
kubectl logs -n swimto -l app=postgres --tail=50
```

## Related Files

- **API Deployment:** `k8s/api-deployment.yaml`
- **Health Check:** `apps/api/app/routes/health.py`
- **Database Config:** `apps/api/app/database.py`
- **Startup Handler:** `apps/api/app/main.py`
- **Dockerfile:** `apps/api/Dockerfile`
