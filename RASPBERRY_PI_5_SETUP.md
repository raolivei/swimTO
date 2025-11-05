# 🥧 SwimTO on Raspberry Pi 5 - Quick Setup Guide

This is the simplest way to get SwimTO running on your **Raspberry Pi 5 (8GB RAM)**.

## 📦 What You Need

- ✅ Raspberry Pi 5 with 8GB RAM (like [this one](https://www.amazon.ca/gp/product/B0D95QBKJ4))
- ✅ Raspberry Pi OS (64-bit) installed
- ✅ Network connection
- ⏱️ About 10 minutes

## 🚀 Quick Setup (5 Steps)

### 1. Update Your Pi

```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

### 2. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install docker-compose-plugin

# Verify
docker --version
docker compose version
```

### 3. Clone SwimTO

```bash
cd ~
git clone https://github.com/raolivei/swimTO.git
cd swimTO
```

### 4. Configure & Start

```bash
# Create environment file with secure token
cat > apps/api/.env << EOF
DATABASE_URL=postgresql+psycopg://postgres:postgres@db:5432/pools
REDIS_URL=redis://redis:6379
ADMIN_TOKEN=$(openssl rand -hex 32)
CITY_BASE_URL=https://www.toronto.ca
OPEN_DATA_BASE_URL=https://open.toronto.ca
INGEST_WINDOW_DAYS=56
LOG_LEVEL=info
EOF

# Start all services
docker compose up -d

# View logs
docker compose logs -f
```

### 5. Load Initial Data

```bash
# Wait for services to start (~30 seconds)
sleep 30

# Trigger data ingestion
ADMIN_TOKEN=$(grep ADMIN_TOKEN apps/api/.env | cut -d= -f2)
curl -X POST http://localhost:8000/update \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 🎉 Done! Access Your App

Get your Pi's IP address:
```bash
hostname -I | awk '{print $1}'
```

Then visit:
- **Web App**: http://[YOUR_PI_IP]:5173
- **API**: http://[YOUR_PI_IP]:8000
- **API Docs**: http://[YOUR_PI_IP]:8000/docs

Example: `http://192.168.1.100:5173`

## 🔄 Auto-Start on Boot (Optional)

To make SwimTO start automatically when your Pi boots:

```bash
# Create systemd service
sudo tee /etc/systemd/system/swimto.service > /dev/null << EOF
[Unit]
Description=SwimTO Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$HOME/swimTO
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
User=$USER

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl enable swimto.service
sudo systemctl start swimto.service

# Check status
sudo systemctl status swimto.service
```

## 📋 Common Commands

```bash
# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f api
docker compose logs -f web

# Restart everything
docker compose restart

# Stop everything
docker compose down

# Update to latest version
cd ~/swimTO
git pull
docker compose down
docker compose up -d --build
```

## 💾 Backup Your Database

```bash
# Create backup
docker compose exec db pg_dump -U postgres pools > backup-$(date +%Y%m%d).sql

# Restore from backup
docker compose exec -T db psql -U postgres pools < backup-20251105.sql
```

## 🐛 Troubleshooting

### Services won't start
```bash
# Check what's running
docker compose ps

# Check logs for errors
docker compose logs

# Restart
docker compose down
docker compose up -d
```

### Can't access from other devices
```bash
# Check if ports are open
sudo ufw status

# If firewall is enabled, allow ports
sudo ufw allow 5173/tcp
sudo ufw allow 8000/tcp
```

### Database issues
```bash
# Check database logs
docker compose logs db

# Restart database
docker compose restart db
```

### Update not working
```bash
# Check if update endpoint is accessible
curl http://localhost:8000/health

# Verify admin token
cat apps/api/.env | grep ADMIN_TOKEN

# Try manual update
ADMIN_TOKEN=$(grep ADMIN_TOKEN apps/api/.env | cut -d= -f2)
curl -v -X POST http://localhost:8000/update \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 🔧 Performance Tips for Raspberry Pi 5

### Use USB SSD for Database (Optional, for better performance)

```bash
# Format USB SSD
sudo mkfs.ext4 /dev/sda1

# Create mount point
sudo mkdir -p /mnt/usb-ssd

# Mount it
sudo mount /dev/sda1 /mnt/usb-ssd

# Add to fstab for auto-mount
echo '/dev/sda1 /mnt/usb-ssd ext4 defaults 0 0' | sudo tee -a /etc/fstab

# Update docker-compose.yml to use USB SSD
# Change the postgres volume to:
#   volumes:
#     - /mnt/usb-ssd/postgres:/var/lib/postgresql/data
```

## 📚 More Information

- **Full Deployment Guide**: [docs/DEPLOYMENT_PI.md](docs/DEPLOYMENT_PI.md)
- **API Documentation**: [docs/API.md](docs/API.md)
- **Development Guide**: [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## ❓ Questions?

Check the [TROUBLESHOOTING.md](TROUBLESHOOTING.md) guide or open an issue on GitHub.

---

**Why Raspberry Pi 5?**

The Pi 5 with 8GB RAM is perfect for SwimTO:
- ✅ 2-3× faster than Pi 4
- ✅ Enough RAM to run full stack comfortably
- ✅ Low power consumption (~10W)
- ✅ Runs Docker Compose smoothly
- ✅ Plenty of resources for future features

**Why Docker Compose (not Kubernetes)?**

For a single Pi, Docker Compose is simpler and just as reliable:
- ✅ Easier to set up and manage
- ✅ Less resource overhead
- ✅ Still production-ready with auto-restart
- ✅ Can always switch to k3s later if needed

