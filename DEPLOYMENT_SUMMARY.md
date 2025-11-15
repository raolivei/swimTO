# SwimTO v2.0.1 Deployment Summary

**Date:** November 15, 2025  
**Version:** 2.0.1  
**Status:** ✅ Build Complete, Local Testing Successful

---

## 🎯 What Was Fixed

### Primary Issue: Docker Network Connectivity
The frontend was unable to connect to the backend API when running in Docker, showing "Network Connection Failed" errors.

### Root Causes
1. **Hardcoded Network IP**: `.env` file contained `VITE_API_URL=http://172.20.10.5:8000`
2. **FastAPI Trailing Slash Redirects**: API routes returned `307 Temporary Redirect` instead of `200 OK`
3. **Proxy Misconfiguration**: Vite proxy wasn't handling trailing slashes properly

### Solutions Implemented
1. ✅ **Fixed `.env` file**: Commented out hardcoded IP to use Vite proxy
2. ✅ **Enhanced `api.ts`**: Added `.trim()` to properly handle empty `VITE_API_URL`
3. ✅ **Improved Vite proxy**: Added `configure` handler to add trailing slashes
4. ✅ **Updated `docker-compose.yml`**: Explicitly unset `VITE_API_URL` for web service

### Results
- ✅ All API calls return `200 OK` (no more redirects)
- ✅ Frontend connects properly via Docker internal networking
- ✅ Works for both local development and mobile device access
- ✅ Schedule page displays swim sessions correctly
- ✅ Map page shows 21+ pool markers across Toronto

---

## 📦 Built Artifacts

### Docker Images
```
swimto-api:latest    (533 MB) - Built successfully
swimto-web:latest    (946 MB) - Built successfully
```

### Git Repository
- **Branch**: `main`
- **Commit**: `5ba7161` (workflow fixes)
- **Tag**: `v2.0.1`

---

## 🚀 Deployment Options

### Option 1: Docker Compose (Current - Working ✅)
The application is currently running successfully via docker-compose:

```bash
cd /Users/roliveira/WORKSPACE/raolivei/swimTO
docker-compose up -d
```

Access at: `http://localhost:5173`

### Option 2: GitHub Container Registry (GHCR) - Requires Setup

#### Issue
GitHub Actions workflow fails with `403 Forbidden` when pushing to GHCR. This is common with private repositories.

#### Solution
To enable GHCR push for private repositories, you need a Personal Access Token (PAT):

1. **Create a PAT** at https://github.com/settings/tokens
   - Select "Generate new token (classic)"
   - Scopes needed:
     - `write:packages` - Upload packages to GHCR
     - `read:packages` - Download packages from GHCR
     - `delete:packages` - Delete packages (optional)

2. **Add PAT to Repository Secrets**
   - Go to: https://github.com/raolivei/swimTO/settings/secrets/actions
   - Click "New repository secret"
   - Name: `CR_PAT`
   - Value: Your PAT token

3. **Update Workflow** (`.github/workflows/build-and-push.yml`)
   ```yaml
   - name: Log in to GitHub Container Registry
     uses: docker/login-action@v3
     with:
       registry: ${{ env.REGISTRY }}
       username: ${{ github.actor }}
       password: ${{ secrets.CR_PAT }}  # Changed from GITHUB_TOKEN
   ```

### Option 3: Manual GHCR Push (Alternative)

If you want to push the current images manually:

```bash
# Tag the images
docker tag swimto-api:latest ghcr.io/raolivei/swimto-api:v2.0.1
docker tag swimto-web:latest ghcr.io/raolivei/swimto-web:v2.0.1

# Login to GHCR (you'll need a PAT)
echo $CR_PAT | docker login ghcr.io -u raolivei --password-stdin

# Push the images
docker push ghcr.io/raolivei/swimto-api:v2.0.1
docker push ghcr.io/raolivei/swimto-web:v2.0.1
```

### Option 4: K3s Direct Import

If you have a k3s cluster, you can import images directly without GHCR:

```bash
# Save images to tar files
docker save swimto-api:latest | gzip > swimto-api-v2.0.1.tar.gz
docker save swimto-web:latest | gzip > swimto-web-v2.0.1.tar.gz

# On k3s node:
sudo k3s ctr images import swimto-api-v2.0.1.tar.gz
sudo k3s ctr images import swimto-web-v2.0.1.tar.gz

# Update k8s deployments
kubectl set image deployment/swimto-api api=swimto-api:latest -n swimto
kubectl set image deployment/swimto-web web=swimto-web:latest -n swimto
```

---

## 📝 Changelog Entry

Added to `CHANGELOG.md`:

```markdown
## [2.0.1] - 2025-11-15

### Fixed
- **Docker Network Connectivity**: Fixed frontend unable to connect to backend API
  - Fixed `.env` file with hardcoded network IP causing connection failures
  - Updated `api.ts` to properly handle empty `VITE_API_URL` 
  - Enhanced Vite proxy configuration to add trailing slashes
  - Resolved FastAPI 307 redirects
  - App now uses Docker internal networking correctly
```

---

## ✅ Testing Results

### Local Development (Docker Compose)
- ✅ **Home Page**: Loads with correct stats (21+ pools, 503+ sessions)
- ✅ **Map View**: Displays 21 pool markers across Toronto
- ✅ **Schedule View**: Shows swim sessions in table format
- ✅ **API Health**: Returns `200 OK` at `/health`
- ✅ **Network Connectivity**: No more 307 redirects

### Browser Testing
Tested at `http://127.0.0.1:5173`:
- ✅ All pages load correctly
- ✅ No console errors
- ✅ API calls return 200 status
- ✅ Data displays properly

---

## 🎉 Success!

The application is now stable and working correctly in the Docker environment. The networking issues have been resolved, and all API calls are functioning properly.

### Next Steps
1. ✅ **Local Development**: Already working via docker-compose
2. ⏳ **GHCR Push**: Requires PAT setup (see Option 2 above)
3. ⏳ **K3s Deployment**: Can proceed once images are in GHCR or via direct import

---

## 📚 Related Files Changed

```
Modified:
  - CHANGELOG.md (added v2.0.1 entry)
  - docker-compose.yml (VITE_API_URL configuration)
  - apps/web/src/lib/api.ts (added .trim() handling)
  - apps/web/vite.config.ts (enhanced proxy configuration)
  - apps/web/.env (commented out hardcoded IP)
  - .github/workflows/build-and-push.yml (Docker action versions)

Cleaned up:
  - Removed unused logo evolution components
  - Deleted logo-related routes and context providers
```

---

## 🔧 Maintenance Notes

### Docker Compose
- Images are cached locally as `swimto-api:latest` and `swimto-web:latest`
- To rebuild: `docker-compose build`
- To restart: `docker-compose restart`
- To view logs: `docker-compose logs -f`

### GitHub Actions
- Current issue: 403 Forbidden when pushing to GHCR
- Temporary workaround: Build and test locally
- Permanent fix: Add CR_PAT secret (see Option 2)

---

Generated: 2025-11-15T04:42:00Z  
Git Commit: 5ba7161

