FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8000

# Run migrations (skip if alembic directory doesn't exist) and start server
CMD ["sh", "-c", "alembic upgrade head 2>/dev/null || true && uvicorn app.main:app --host 0.0.0.0 --port 8000"]

