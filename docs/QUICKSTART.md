# 🚀 SwimTO - Quickstart Guide

Get SwimTO running locally in 5 minutes!

## Prerequisites

- Docker & Docker Compose installed
- Git installed

## Steps

### 1. Clone the Repository

```bash
git clone https://github.com/raolivei/swimTO.git
cd swimTO
```

### 2. Run Setup Script

```bash
./scripts/dev-setup.sh
```

This will:
- Create environment files
- Start PostgreSQL and Redis
- Set up directories

### 3. Start All Services

```bash
docker-compose up
```

Wait for services to start (~30 seconds).

### 4. Access the Application

Open in your browser:

- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

## What's Next?

### Add Sample Data (Optional)

The database starts empty. To populate it:

```bash
# Trigger data ingestion (requires admin token)
curl -X POST http://localhost:8000/update \
  -H "Authorization: Bearer change-me-in-production"
```

Or run the ingestion script directly:

```bash
# From project root
source venv/bin/activate  # If using venv
python data-pipeline/jobs/daily_refresh.py
```

### Explore the App

1. **Map View** (`/map`): See all pools with lane swim on an interactive map
2. **Schedule View** (`/schedule`): Browse upcoming sessions by date
3. **API** (`/docs`): Interactive API documentation

### Development

- **Backend**: See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md#backend-api-development)
- **Frontend**: See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md#frontend-web-development)
- **Testing**: Run `./scripts/test-all.sh`

## Troubleshooting

### Port Already in Use

Change ports in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"  # Change 5432 to 5433
```

### Database Connection Failed

Check if database is running:

```bash
docker-compose ps
docker-compose logs db
```

Restart if needed:

```bash
docker-compose restart db
```

### Frontend Not Loading

Ensure all services are running:

```bash
docker-compose ps

# Should show all services as "Up"
```

## Quick Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Run tests
./scripts/test-all.sh

# Access database
docker-compose exec db psql -U postgres -d pools
```

## Next Steps

- Read the [full development guide](./LOCAL_DEVELOPMENT.md)
- Check out the [API documentation](./API.md)
- Learn about [deployment to Raspberry Pi](./DEPLOYMENT_PI.md)

## Getting Help

- **Issues**: https://github.com/raolivei/swimTO/issues
- **Documentation**: Check the `docs/` directory
- **Logs**: `docker-compose logs -f`

Happy swimming! 🏊‍♂️

