# Issues Found on https://swimto.eldertree.xyz/schedule

## Critical Issues

### 1. **API Backend Not Available (503 Error)**

**Status**: 🔴 Critical - **VERIFIED**  
**Error**: `HTTP/2 503 - "no available server"`  
**Location**: `/api/schedule` endpoint  
**Impact**: Schedule page cannot load any data - page appears empty

**Root Cause**: **GHCR Authentication Failure (403 Forbidden)**

- API pod: `ImagePullBackOff` - Cannot pull image `ghcr.io/raolivei/swimto-api:v0.5.2`
- Web pod: `ImagePullBackOff` - Cannot pull image `ghcr.io/raolivei/swimto-web:v0.5.1`
- **Specific Error**: `failed to authorize: failed to fetch oauth token: unexpected status from GET request to https://ghcr.io/token?scope=repository%3Araolivei%2Fswimto-api%3Apull&service=ghcr.io: 403 Forbidden`

**Verified Details**:

- Image pull secret exists: `ghcr-secret` ✅
- Secret configured in deployment: ✅
- **Token is invalid/expired**: ❌ (403 Forbidden from GHCR)

**Diagnostic Steps**:

```bash
export KUBECONFIG=~/.kube/config-eldertree

# Check if API pod is running
kubectl get pods -n swimto -l app=swimto-api

# Check API pod logs
kubectl logs -n swimto -l app=swimto-api --tail=50

# Check API service
kubectl get svc -n swimto swimto-api-service

# Check ingress routing
kubectl get ingress -n swimto
kubectl describe ingress -n swimto
```

**Fix Required**:

1. **Update GHCR token** - Token in `ghcr-secret` is expired/invalid
2. Verify token has correct permissions (read access to `raolivei/swimto-api` and `raolivei/swimto-web`)
3. Restart deployments after updating token
4. Verify images exist at specified tags (`v0.5.2` and `v0.5.1`)

**Fix Steps**:

```bash
export KUBECONFIG=~/.kube/config-eldertree

# 1. Get new GHCR token (Personal Access Token with read:packages permission)
#    GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
#    Create token with: read:packages scope

# 2. Update token in Vault (if using External Secrets)
#    Or update secret directly:
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=raolivei \
  --docker-password=YOUR_NEW_TOKEN \
  --namespace=swimto \
  --dry-run=client -o yaml | kubectl apply -f -

# 3. Restart deployments
kubectl rollout restart deployment/swimto-api -n swimto
kubectl rollout restart deployment/swimto-web -n swimto

# 4. Verify pods start
kubectl get pods -n swimto -w
```

---

### 2. **Cloudflare Tunnel Error 1033 (Previously Identified)**

**Status**: 🔴 Critical  
**Error**: Cloudflare Tunnel cannot resolve the host  
**Impact**: Site may be intermittently unavailable

**Fix**: See `pi-fleet/clusters/eldertree/swimto/CLOUDFLARE_TUNNEL_FIX.md`

---

## Potential Issues (Based on Code Review)

### 3. **API Path Rewrite Middleware Configuration**

**Status**: ⚠️ Needs Verification  
**Location**: Ingress configuration  
**Concern**: The API path rewrite middleware removes `/api` prefix, but the API routes expect `/schedule` not `/schedule/`

**Check**: Verify that requests to `/api/schedule` are correctly routed to the API service at `/schedule`

**Expected Flow**:

- Request: `GET /api/schedule`
- Middleware rewrites to: `GET /schedule`
- API receives: `GET /schedule` ✅

**Verification**:

```bash
# Test from within cluster
kubectl run -it --rm test-curl --image=curlimages/curl:latest --restart=Never -- \
  curl -v http://swimto-api-service.swimto.svc.cluster.local:8000/schedule
```

---

### 4. **CORS Configuration**

**Status**: ⚠️ Needs Verification  
**Location**: API ConfigMap  
**Concern**: CORS origins may not include `https://swimto.eldertree.xyz`

**Check**: Verify CORS origins in ConfigMap include:

- `https://swimto.eldertree.xyz`
- `http://swimto.eldertree.xyz` (for redirects)

**Current Config** (from earlier review):

```yaml
CORS_ORIGINS: '["http://localhost:5173","http://localhost:3000","https://swimto.eldertree.local","http://swimto.eldertree.local","https://swimto.eldertree.xyz","http://swimto.eldertree.xyz","https://swimto.local","http://swimto.local"]'
```

✅ This looks correct, but verify it's actually applied to the API pod.

---

### 5. **API Timeout Configuration**

**Status**: ⚠️ Monitor  
**Location**: API client configuration  
**Current**: 30 second timeout

**Note**: If API is slow to respond, requests may timeout. Monitor API response times.

---

### 6. **Error Handling on Empty Page**

**Status**: ℹ️ UX Issue  
**Location**: ScheduleView.tsx  
**Current Behavior**: Page shows empty content when API fails

**Issue**: The page may show a blank/empty state instead of a clear error message if:

- API returns empty array
- API returns 503 but error handling doesn't catch it
- Network request fails silently

**Recommendation**: Ensure error boundary catches all API failures and displays user-friendly error message.

---

## Testing Checklist

### Immediate Actions

- [ ] Check API pod status: `kubectl get pods -n swimto`
- [ ] Check API pod logs: `kubectl logs -n swimto -l app=swimto-api`
- [ ] Check API service: `kubectl get svc -n swimto`
- [ ] Check ingress: `kubectl get ingress -n swimto`
- [ ] Test API directly: `curl https://swimto.eldertree.xyz/api/health`
- [ ] Test API schedule: `curl https://swimto.eldertree.xyz/api/schedule`

### Verification Steps

- [ ] Verify API path rewrite middleware is working
- [ ] Verify CORS headers are correct
- [ ] Test from browser console: `fetch('/api/schedule').then(r => r.json())`
- [ ] Check browser network tab for actual request/response
- [ ] Verify Cloudflare Tunnel is connected

---

## Priority Order

1. **🔴 Critical**: Fix API backend availability (503 error)
2. **🔴 Critical**: Fix Cloudflare Tunnel connection (Error 1033)
3. **⚠️ High**: Verify API path rewrite middleware
4. **⚠️ Medium**: Verify CORS configuration
5. **ℹ️ Low**: Improve error handling UX

---

## Quick Diagnostic Script

```bash
#!/bin/bash
export KUBECONFIG=~/.kube/config-eldertree

echo "=== swimTO API Diagnostic ==="
echo ""

echo "1. API Pod Status:"
kubectl get pods -n swimto -l app=swimto-api

echo ""
echo "2. API Service:"
kubectl get svc -n swimto swimto-api-service

echo ""
echo "3. API Pod Logs (last 20 lines):"
kubectl logs -n swimto -l app=swimto-api --tail=20

echo ""
echo "4. Ingress Configuration:"
kubectl get ingress -n swimto -o yaml | grep -A 5 "swimto.eldertree.xyz"

echo ""
echo "5. Test API from cluster:"
kubectl run -it --rm test-api --image=curlimages/curl:latest --restart=Never -- \
  curl -s http://swimto-api-service.swimto.svc.cluster.local:8000/health || echo "Failed to reach API"

echo ""
echo "6. Test from external:"
curl -I https://swimto.eldertree.xyz/api/health
```
