#!/bin/bash

# Local (Non-Docker) Testing Script for SwimTO
# Tests the web frontend and API endpoints (when available)

set -e

cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

echo "💻 SwimTO Local Testing"
echo "======================="
echo ""

# Get local IP for mobile testing
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

echo "🔍 Checking local servers..."
echo ""

# Check if web server is running
WEB_RUNNING=false
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    WEB_RUNNING=true
    echo "✅ Web server is running on port 5173"
else
    echo "❌ Web server is NOT running"
    echo "   To start: cd apps/web && npm run dev:mobile"
fi

# Check if API server is running  
API_RUNNING=false
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    API_RUNNING=true
    echo "✅ API server is running on port 8000"
else
    echo "⚠️  API server is NOT running"
    echo "   To start: source swimTO/bin/activate && cd apps/api && python -m uvicorn app.main:app --reload --host 0.0.0.0"
fi

if ! $WEB_RUNNING && ! $API_RUNNING; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ No services are running!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Quick start options:"
    echo ""
    echo "1️⃣  Use startup script (recommended):"
    echo "   ./scripts/start-servers.sh"
    echo ""
    echo "2️⃣  Use Docker (full stack):"
    echo "   docker-compose up"
    echo ""
    echo "3️⃣  Start manually (two terminals):"
    echo "   Terminal 1: cd apps/web && npm run dev:mobile"
    echo "   Terminal 2: cd apps/api && source ../../swimTO/bin/activate && python -m uvicorn app.main:app --reload --host 0.0.0.0"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Running Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if $API_RUNNING; then
    echo "🔧 Testing API Endpoints..."
    echo ""
    
    # Health check
    API_HEALTH=$(curl -s http://localhost:8000/health)
    echo "   Health: $API_HEALTH"
    
    # Facilities
    FACILITIES_COUNT=$(curl -s http://localhost:8000/facilities | grep -o "\[" | wc -l || echo "0")
    if [ "$FACILITIES_COUNT" -gt 0 ]; then
        echo "   ✅ GET /facilities - OK"
    else
        echo "   ⚠️  GET /facilities - Empty or failed"
    fi
    
    # Schedule
    SCHEDULE_COUNT=$(curl -s http://localhost:8000/schedule | grep -o "\[" | wc -l || echo "0")
    if [ "$SCHEDULE_COUNT" -gt 0 ]; then
        echo "   ✅ GET /schedule - OK"
    else
        echo "   ⚠️  GET /schedule - Empty (expected if no data)"
    fi
    
    echo ""
fi

if $WEB_RUNNING; then
    echo "🌐 Testing Web Server..."
    echo ""
    
    # Check if page loads
    if curl -s http://localhost:5173 | grep -q "SwimTO\|root"; then
        echo "   ✅ Homepage loads"
    else
        echo "   ❌ Homepage failed to load"
    fi
    
    # Check if assets are accessible
    if curl -s http://localhost:5173/src/main.tsx > /dev/null 2>&1; then
        echo "   ✅ Assets are accessible"
    else
        echo "   ⚠️  Some assets may not be accessible"
    fi
    
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Mobile Testing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Your local IP: $LOCAL_IP"
echo ""
if $WEB_RUNNING; then
    echo "📱 Test on mobile device (same WiFi):"
    echo "   http://$LOCAL_IP:5173"
    echo ""
fi

if $WEB_RUNNING; then
    echo "🧪 Run automated mobile tests:"
    echo "   cd apps/web"
    echo "   npx playwright install  # first time only"
    echo "   npm run test:mobile"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if $WEB_RUNNING && $API_RUNNING; then
    echo "✅ All services are running!"
elif $WEB_RUNNING; then
    echo "⚠️  Web is running, but API is offline"
    echo "   Some features may not work without API"
elif $API_RUNNING; then
    echo "⚠️  API is running, but web is offline"
fi
echo ""
echo "🌐 URLs:"
if $WEB_RUNNING; then
    echo "   Web:      http://localhost:5173"
    echo "   Mobile:   http://$LOCAL_IP:5173"
fi
if $API_RUNNING; then
    echo "   API:      http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
fi
echo ""
echo "✅ Local testing complete!"

