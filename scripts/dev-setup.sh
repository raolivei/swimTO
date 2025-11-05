#!/bin/bash
set -e

echo "🏊‍♂️ SwimTO - Development Setup"
echo "================================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites met"
echo ""

# Create environment files
echo "Creating environment files..."

if [ ! -f apps/api/.env ]; then
    cp apps/api/.env.example apps/api/.env
    echo "✅ Created apps/api/.env"
else
    echo "⏭️  apps/api/.env already exists"
fi

if [ ! -f apps/web/.env ]; then
    cp apps/web/.env.example apps/web/.env
    echo "✅ Created apps/web/.env"
else
    echo "⏭️  apps/web/.env already exists"
fi

echo ""

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p data/cache
mkdir -p logs
echo "✅ Directories created"
echo ""

# Start services
echo "Starting services with Docker Compose..."
docker-compose up -d db redis

echo "Waiting for database to be ready..."
sleep 5

echo "✅ Services started"
echo ""

# Install Python dependencies (optional, for local development)
if command -v python3 &> /dev/null; then
    echo "Installing Python dependencies (optional)..."
    if [ -d "venv" ]; then
        echo "Virtual environment already exists"
    else
        python3 -m venv venv
        echo "✅ Created virtual environment"
    fi
    
    source venv/bin/activate
    pip install --upgrade pip > /dev/null
    pip install -r apps/api/requirements-dev.txt > /dev/null
    pip install -r data-pipeline/requirements.txt > /dev/null
    echo "✅ Python dependencies installed"
    deactivate
else
    echo "⏭️  Python3 not found, skipping Python dependencies"
fi

echo ""
echo "✅ Development setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start all services:    docker-compose up"
echo "  2. Run API locally:       cd apps/api && make run"
echo "  3. Run frontend locally:  cd apps/web && npm install && npm run dev"
echo "  4. Run tests:             cd apps/api && make test"
echo ""
echo "Access points:"
echo "  - Frontend:  http://localhost:5173"
echo "  - API:       http://localhost:8000"
echo "  - API Docs:  http://localhost:8000/docs"
echo "  - Database:  localhost:5432"
echo ""

