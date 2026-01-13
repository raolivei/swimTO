# Stage 1: Dependencies (cached unless requirements change)
FROM python:3.11-slim AS dependencies

WORKDIR /app

# Install system dependencies (cached layer)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python deps (cached unless requirements change)
COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy data-pipeline requirements and install
COPY data-pipeline/requirements.txt /tmp/data-pipeline-requirements.txt
RUN pip install --no-cache-dir -r /tmp/data-pipeline-requirements.txt

# Stage 2: Runtime (only code changes trigger rebuild of this layer)
FROM dependencies AS runtime

WORKDIR /app

# Copy application code
COPY apps/api/ .

# Copy data-pipeline
COPY data-pipeline /data-pipeline

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8000

# Run migrations (skip if alembic directory doesn't exist) and start server
CMD ["sh", "-c", "alembic upgrade head 2>/dev/null || true && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
