# 🐍 Setting Up Virtual Environment for SwimTO

## Issue: SSL Certificate Error

You're encountering an SSL certificate verification issue because `pydantic-core` requires compiling Rust code, and the Rust installer can't download due to corporate SSL certificates.

## ✅ **Recommended Solutions**

### **Option 1: Use Docker (Easiest & Recommended)**

This bypasses all local Python issues:

```bash
cd /Users/roliveira/WORKSPACE/raolivei/swimTO

# Start everything in containers
docker-compose up

# Access:
# - Frontend: http://localhost:5173
# - API: http://localhost:8000/docs
```

No Python virtual environment needed! Everything runs in Docker.

---

### **Option 2: Install with Pre-built Wheels**

Try installing with `--only-binary` to avoid compilation:

```bash
cd /Users/roliveira/WORKSPACE/raolivei/swimTO

# Activate your venv
source swimTO/bin/activate

# Install with pre-built wheels only
pip install --only-binary=:all: -r apps/api/requirements.txt

# If that fails for pydantic-core, install a newer version that has wheels
pip install pydantic-core --upgrade
pip install -r apps/api/requirements.txt
```

---

### **Option 3: Fix SSL Certificates**

If you need local Python development:

```bash
# Option 3a: Install certificates for Python 3.13
/Applications/Python\ 3.13/Install\ Certificates.command

# Option 3b: Disable SSL verification (NOT recommended for production)
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org \
  -r apps/api/requirements-dev.txt
```

---

### **Option 4: Use Conda Instead**

Conda has pre-built binaries:

```bash
# Install miniconda if not installed
# Download from: https://docs.conda.io/en/latest/miniconda.html

# Create conda environment
conda create -n swimTO python=3.11 -y
conda activate swimTO

# Install dependencies
conda install -c conda-forge fastapi uvicorn sqlalchemy \
  psycopg2-binary redis-py loguru pytest black -y

pip install -r apps/api/requirements.txt
```

---

## 🚀 **Quick Start (Docker - No Issues)**

The **simplest and most reliable** way:

```bash
# 1. Setup
cd /Users/roliveira/WORKSPACE/raolivei/swimTO
./scripts/dev-setup.sh

# 2. Start everything
docker-compose up

# 3. Access
# Frontend: http://localhost:5173
# API: http://localhost:8000/docs
```

**Benefits:**
- ✅ No Python environment issues
- ✅ No SSL certificate problems
- ✅ No Rust compilation needed
- ✅ Everything works immediately
- ✅ Same environment as production

---

## 🧪 Running Tests with Docker

```bash
# API tests
docker-compose run --rm api pytest

# Or exec into running container
docker-compose exec api pytest
```

---

## 📝 For Pure Python Development (Optional)

If you **really** need a local Python environment:

```bash
# Use Python 3.11 instead of 3.13 (better compatibility)
python3.11 -m venv swimTO-env
source swimTO-env/bin/activate

# Upgrade pip
pip install --upgrade pip

# Try installing
pip install -r apps/api/requirements-dev.txt
```

If SSL issues persist:

```bash
# Set SSL environment variables
export CURL_CA_BUNDLE=""
export REQUESTS_CA_BUNDLE=""

# Or install Rust manually
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Then retry pip install
pip install -r apps/api/requirements-dev.txt
```

---

## 💡 **My Recommendation**

**Use Docker for development.** It's:
- ✅ Simpler
- ✅ More reliable
- ✅ Matches production exactly
- ✅ No environment issues

You can still edit code locally - Docker will hot-reload both the API and frontend!

```bash
# Edit code on your Mac
vim apps/api/app/routes/facilities.py

# Docker automatically reloads
# No virtual environment needed!
```

---

## 🆘 Still Having Issues?

1. **Check Docker**: `docker --version`
2. **Check Docker Compose**: `docker compose version`
3. **Start fresh**:
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

---

## 📚 More Info

- [Docker Setup Guide](docs/LOCAL_DEVELOPMENT.md#docker-compose)
- [Troubleshooting](docs/LOCAL_DEVELOPMENT.md#troubleshooting)
- [Contributing](docs/CONTRIBUTING.md)

