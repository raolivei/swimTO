#!/bin/bash
set -e

# Load port assignments
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
source "$WORKSPACE_ROOT/.env.ports" 2>/dev/null || true

# Use assigned ports or defaults
SWIMTO_API_PORT=${SWIMTO_API_PORT:-8000}
SWIMTO_WEB_PORT=${SWIMTO_WEB_PORT:-5173}
SWIMTO_POSTGRES_PORT=${SWIMTO_POSTGRES_PORT:-5432}
SWIMTO_REDIS_PORT=${SWIMTO_REDIS_PORT:-6379}

echo "🏊‍♂️ SwimTO - Local Development Mode"
echo "===================================="
echo ""
echo "Using assigned ports:"
echo "  - Frontend:  http://localhost:$SWIMTO_WEB_PORT"
echo "  - API:       http://localhost:$SWIMTO_API_PORT"
echo "  - PostgreSQL: localhost:$SWIMTO_POSTGRES_PORT"
echo "  - Redis:     localhost:$SWIMTO_REDIS_PORT"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    jobs -p | xargs -r kill 2>/dev/null || true
    docker-compose down
    exit 0
}

trap cleanup EXIT INT TERM

# Check for port conflicts
check_port() {
    local port=$1
    local service=$2
    if lsof -i :$port > /dev/null 2>&1 && ! docker ps | grep -q "swimto"; then
        echo "⚠️  Port $port ($service) may be in use by another service"
        echo "   Run '$WORKSPACE_ROOT/scripts/check-ports.sh' to check"
    fi
}

check_port $SWIMTO_API_PORT "swimTO-api"
check_port $SWIMTO_WEB_PORT "swimTO-web"

# Start services
echo "Starting database and redis..."
POSTGRES_PORT=$SWIMTO_POSTGRES_PORT REDIS_PORT=$SWIMTO_REDIS_PORT \
    docker-compose up -d db redis

echo "Waiting for services to be ready..."
sleep 5

# Start API
echo "Starting API..."
cd apps/api
source ../../venv/bin/activate 2>/dev/null || true
export DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:$SWIMTO_POSTGRES_PORT/pools"
export REDIS_URL="redis://localhost:$SWIMTO_REDIS_PORT"
export ADMIN_TOKEN="dev-token-change-me"
uvicorn app.main:app --reload --host 0.0.0.0 --port $SWIMTO_API_PORT &
API_PID=$!
cd ../..

# Start Frontend
echo "Starting frontend..."
cd apps/web
PORT=$SWIMTO_WEB_PORT npm run dev &
WEB_PID=$!
cd ../..

echo ""
echo "✅ Development environment is running!"
echo ""
echo "Access points:"
echo "  - Frontend:  http://localhost:$SWIMTO_WEB_PORT"
echo "  - API:       http://localhost:$SWIMTO_API_PORT"
echo "  - API Docs:  http://localhost:$SWIMTO_API_PORT/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait

