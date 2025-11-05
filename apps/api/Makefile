.PHONY: help install dev test test-cov lint format clean run migrate

help:
	@echo "SwimTO API - Available commands:"
	@echo "  make install    - Install production dependencies"
	@echo "  make dev        - Install development dependencies"
	@echo "  make test       - Run tests"
	@echo "  make test-cov   - Run tests with coverage report"
	@echo "  make lint       - Run linters"
	@echo "  make format     - Format code"
	@echo "  make clean      - Clean cache and build files"
	@echo "  make run        - Run development server"
	@echo "  make migrate    - Run database migrations"

install:
	pip install -r requirements.txt

dev:
	pip install -r requirements-dev.txt

test:
	pytest

test-cov:
	pytest --cov-report=html
	@echo "Coverage report generated in htmlcov/index.html"

lint:
	flake8 app tests
	mypy app
	black --check app tests
	isort --check app tests

format:
	black app tests
	isort app tests

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf htmlcov .coverage .pytest_cache

run:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

migrate:
	alembic upgrade head

