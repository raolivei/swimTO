.PHONY: help setup dev test clean docker-up docker-down reseed-db validate-schedules deploy-local

help:
	@echo "SwimTO - Available commands:"
	@echo ""
	@echo "  make setup             - Initial setup (run once)"
	@echo "  make dev               - Start development environment"
	@echo "  make test              - Run all tests"
	@echo "  make validate-schedules - Validate app schedules against live sources"
	@echo "  make docker-up         - Start Docker services"
	@echo "  make docker-down       - Stop Docker services"
	@echo "  make reseed-db         - Reseed database with fresh demo data"
	@echo "  make clean             - Clean build artifacts"
	@echo ""

setup:
	@echo "🏊‍♂️ Setting up SwimTO..."
	./scripts/dev-setup.sh

dev:
	@echo "🚀 Starting development environment..."
	./scripts/local-dev.sh

test:
	@echo "🧪 Running all tests..."
	./scripts/test-all.sh

docker-up:
	@echo "🐳 Starting Docker services..."
	docker-compose up -d

docker-down:
	@echo "🐳 Stopping Docker services..."
	docker-compose down

reseed-db:
	@echo "🏊 Reseeding database with fresh data..."
	./scripts/reseed-database.sh

validate-schedules:
	@echo "✅ Validating schedules against live sources..."
	bash -c "source .venv/bin/activate && cd data-pipeline && python jobs/validate_schedules.py"

clean:
	@echo "🧹 Cleaning build artifacts..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
	rm -rf apps/api/htmlcov apps/api/.coverage
	rm -rf apps/web/coverage
	@echo "✅ Clean complete"

