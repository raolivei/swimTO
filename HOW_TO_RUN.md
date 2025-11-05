# 🚀 How to Run SwimTO

There are **two ways** to run SwimTO:

- 🐳 **Docker Compose** - For local development and production (Raspberry Pi)
- 🐍 **Python venv** - For running data pipeline scripts directly

---

## 🐳 Docker Compose (RECOMMENDED)

**Best for:** Local development, testing, and production deployment

### Start All Services

```bash
docker-compose up
```

This starts:
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ FastAPI backend (port 8000)
- ✅ React frontend (port 5173)

### Stop All Services

```bash
docker-compose down
```

### URLs

- **Web:** http://localhost:5173
- **API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### Initial Data Load

```bash
# Trigger data ingestion
curl -X POST http://localhost:8000/update \
  -H "Authorization: Bearer change-me-in-production"
```

---

## 🐍 Python Virtual Environment

**Best for:** Running data pipeline scripts and development tasks

### Setup (One-time)

```bash
# Activate virtual environment
source swimTO/bin/activate

# Install dependencies
cd apps/api
pip install -r requirements.txt
```

### Run Data Pipeline Scripts

```bash
# Activate venv
source swimTO/bin/activate

# Run a pipeline job
cd data-pipeline
python jobs/daily_refresh.py
```

### Manual Development (without Docker)

If you want to run API/web servers manually:

**Terminal 1 - Start Database:**
```bash
docker-compose up db redis
```

**Terminal 2 - API:**
```bash
source swimTO/bin/activate
cd apps/api
uvicorn app.main:app --reload --host 0.0.0.0
```

**Terminal 3 - Web:**
```bash
cd apps/web
npm run dev
```

---

## 🥧 Running on Raspberry Pi 5 (Production)

**Deploy to Pi:** See [RASPBERRY_PI_5_SETUP.md](RASPBERRY_PI_5_SETUP.md)

The production setup uses Docker Compose - same as local development!

```bash
# On your Raspberry Pi
docker-compose up -d
```

---

## 🔧 Auto Environment Activation (Optional)

### Setup direnv (one-time)

```bash
# Install direnv
brew install direnv

# Add to your ~/.zshrc (or ~/.bashrc)
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc

# Reload shell
source ~/.zshrc

# Allow direnv in this project
cd /path/to/swimTO
direnv allow
```

**What you get:**
- ✅ Automatically activates Python venv when you `cd` into the project
- ✅ No more manual `source swimTO/bin/activate`

---

## 📋 Quick Reference

### Check What's Running

```bash
# Check ports
lsof -i :5173   # Web server
lsof -i :8000   # API server

# Check Docker containers
docker-compose ps
```

### View Logs

```bash
# Docker logs
docker-compose logs -f api
docker-compose logs -f web

# Or specific container
docker logs -f swimto-api
```

### Rebuild Containers

```bash
# Rebuild after changing Dockerfile or dependencies
docker-compose up --build
```

---

## 🐛 Troubleshooting

### "Port already in use"

```bash
# Stop all containers
docker-compose down

# Or kill specific port
lsof -ti:5173 | xargs kill -9
```

### "Python packages missing"

```bash
source swimTO/bin/activate
cd apps/api
pip install -r requirements.txt
```

### "Node packages missing"

```bash
cd apps/web
npm install
```

### "Database connection error"

```bash
# Make sure PostgreSQL is running
docker-compose up db

# Check database is healthy
docker-compose ps db
```

---

## 💡 Recommended Workflow

### Daily Development

```bash
# Start everything with Docker Compose
docker-compose up

# Open in browser:
# - http://localhost:5173 (web)
# - http://localhost:8000/docs (API docs)

# Make changes, servers auto-reload
```

### Running Data Pipeline Jobs

```bash
# Activate venv
source swimTO/bin/activate

# Run specific job
cd data-pipeline
python jobs/daily_refresh.py
```

### Production Deployment

```bash
# On Raspberry Pi
git pull
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```

---

## 📊 Summary

| Use Case | Command |
|----------|---------|
| **Local Development** | `docker-compose up` |
| **Run Pipeline Script** | `source swimTO/bin/activate` → `python jobs/...` |
| **Production (Pi)** | `docker-compose up -d` |
| **Stop Everything** | `docker-compose down` |
| **View Logs** | `docker-compose logs -f` |

---

## 🎉 That's It!

Simple and straightforward:
- ✅ Use **Docker Compose** for running the full stack
- ✅ Use **Python venv** when you want to run scripts directly

No confusion, no complexity! 🚀
