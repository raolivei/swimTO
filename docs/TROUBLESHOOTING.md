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

### 4. Image Pull Errors

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
