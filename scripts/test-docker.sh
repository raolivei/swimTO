#!/bin/bash

# Docker Testing Script for SwimTO
# Tests all services running in Docker

set -e

cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

echo "🐳 SwimTO Docker Testing"
echo "========================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start services if not running
echo "📦 Starting Docker services..."
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to be ready (30 seconds)..."
sleep 30

echo ""
echo "🔍 Checking Docker container status..."
docker-compose ps

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Running Service Health Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test PostgreSQL
echo "1️⃣  Testing PostgreSQL..."
if docker exec swimto-db pg_isready -U postgres > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL is healthy"
else
    echo "   ❌ PostgreSQL is not responding"
fi

# Test Redis
echo ""
echo "2️⃣  Testing Redis..."
if docker exec swimto-redis redis-cli ping | grep -q PONG; then
    echo "   ✅ Redis is healthy"
else
    echo "   ❌ Redis is not responding"
fi

# Test API
echo ""
echo "3️⃣  Testing API Server..."
API_HEALTH=$(curl -s http://localhost:8000/health || echo '{"status":"error"}')
echo "   Response: $API_HEALTH"
if echo "$API_HEALTH" | grep -q "healthy\|unhealthy"; then
    echo "   ✅ API is responding"
    
    # Test API endpoints
    echo ""
    echo "   Testing API endpoints:"
    
    # Facilities endpoint
    if curl -s http://localhost:8000/facilities | grep -q "\["; then
        echo "   ✅ GET /facilities - OK"
    else
        echo "   ❌ GET /facilities - Failed"
    fi
    
    # Schedule endpoint
    if curl -s http://localhost:8000/schedule | grep -q "\["; then
        echo "   ✅ GET /schedule - OK"
    else
        echo "   ⚠️  GET /schedule - Empty (expected if no data)"
    fi
    
    # API docs
    if curl -s http://localhost:8000/docs | grep -q "Swagger"; then
        echo "   ✅ GET /docs - OK"
    else
        echo "   ❌ GET /docs - Failed"
    fi
else
    echo "   ❌ API is not responding"
fi

# Test Web Server
echo ""
echo "4️⃣  Testing Web Server..."
if curl -s http://localhost:5173 | grep -q "SwimTO\|root"; then
    echo "   ✅ Web server is responding"
    echo "   📱 Access at: http://localhost:5173"
else
    echo "   ❌ Web server is not responding"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 URLs:"
echo "   Web:      http://localhost:5173"
echo "   API:      http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📱 For mobile testing:"
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
echo "   Web:      http://$LOCAL_IP:5173"
echo "   API:      http://$LOCAL_IP:8000"
echo ""
echo "📝 View logs:"
echo "   docker-compose logs -f api"
echo "   docker-compose logs -f web"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""
echo "✅ Docker testing complete!"

