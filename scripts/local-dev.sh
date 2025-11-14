#!/bin/bash
set -e

echo "🏊‍♂️ SwimTO - Local Development Mode"
echo "===================================="
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

# Start services
echo "Starting database and redis..."
docker-compose up -d db redis

echo "Waiting for services to be ready..."
sleep 5

# Start API
echo "Starting API..."
cd apps/api
source ../../venv/bin/activate 2>/dev/null || true
export DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/pools"
export REDIS_URL="redis://localhost:6379"
export ADMIN_TOKEN="dev-token-change-me"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
API_PID=$!
cd ../..

# Start Frontend
echo "Starting frontend..."
cd apps/web
npm run dev &
WEB_PID=$!
cd ../..

echo ""
echo "✅ Development environment is running!"
echo ""
echo "Access points:"
echo "  - Frontend:  http://localhost:5173"
echo "  - API:       http://localhost:8000"
echo "  - API Docs:  http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait

