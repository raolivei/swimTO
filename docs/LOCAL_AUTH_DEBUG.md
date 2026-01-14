# Local Authentication Debugging Guide

## Issue Fixed

The authentication was failing with "Mixed Content" errors because the frontend was trying to make HTTP requests from an HTTPS page. This has been fixed in `apps/web/src/lib/api.ts` to always use the same protocol as the page.

## Quick Start for Local Debugging

### 1. Start Local Development Environment

```bash
cd /Users/roliveira/WORKSPACE/raolivei/swimTO

# Option A: Use the convenience script (recommended)
./scripts/local-dev.sh

# Option B: Manual setup
# Start database and Redis
docker-compose up -d db redis

# In terminal 1: Start API
cd apps/api
source ../../venv/bin/activate  # or create venv if needed
export DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/pools"
export REDIS_URL="redis://localhost:6379"
export GOOGLE_CLIENT_ID="<your-google-client-id>"
export GOOGLE_CLIENT_SECRET="<your-google-client-secret>"
export GOOGLE_REDIRECT_URI="http://localhost:5173/auth/callback"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# In terminal 2: Start Frontend
cd apps/web
# Make sure VITE_API_URL is NOT set (or commented out in .env)
npm run dev
```

### 2. Verify Configuration

**Frontend (`apps/web/.env`):**
```env
# VITE_API_URL should be commented out or unset
# This allows Vite proxy to handle /api requests
```

**Backend (`apps/api/.env`):**
```env
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
```

### 3. Test Authentication

1. Open http://localhost:5173 in your browser
2. Click the "Login" button
3. You should be redirected to Google OAuth
4. After authentication, you should be redirected back to the app

### 4. Debugging Tips

#### Check Browser Console
- Open Developer Tools (F12)
- Check the Console tab for errors
- Check the Network tab to see API requests

#### Verify API is Running
```bash
curl http://localhost:8000/health
curl http://localhost:8000/auth/google-url
```

#### Check API Logs
The API should show:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
DEBUG:    Received request for Google auth URL
```

#### Common Issues

**Issue: "Mixed Content" errors**
- **Fix**: The API client now automatically uses HTTPS when the page is HTTPS
- **For local**: Use `http://localhost:5173` (HTTP is OK for localhost)

**Issue: "Unable to connect to authentication server"**
- Check if API is running: `curl http://localhost:8000/health`
- Check if VITE_API_URL is set incorrectly in `.env`
- Check browser console for network errors

**Issue: "Google OAuth not configured"**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `apps/api/.env`
- Restart the API after changing `.env` file

**Issue: Redirect URI mismatch**
- Ensure `GOOGLE_REDIRECT_URI` in `.env` matches Google Cloud Console
- For local: `http://localhost:5173/auth/callback`
- Check Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs

### 5. Testing Production Build Locally

To test the production build behavior:

```bash
cd apps/web
npm run build
npm run preview
```

Then access at http://localhost:3000

**Note**: For production builds, the API URL is determined at build time. Make sure `VITE_API_URL` is not set (or set to relative `/api`) so it uses the same origin.

## Protocol Fix Details

The fix in `apps/web/src/lib/api.ts` ensures:
- When page is HTTPS, API requests use HTTPS (except localhost)
- When page is HTTP (localhost), API requests use HTTP
- Relative URLs (`/api`) always use the same protocol as the page
- Prevents "Mixed Content" security errors

## Next Steps

After verifying local authentication works:
1. Test the fix in production (rebuild and deploy)
2. Verify HTTPS authentication works on `swimto.eldertree.xyz`
3. Check that all API requests use HTTPS when page is HTTPS



