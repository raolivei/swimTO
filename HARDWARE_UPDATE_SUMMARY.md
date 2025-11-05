# 🥧 Hardware Configuration Update Summary

## What Changed

Updated SwimTO documentation to reflect the actual target hardware: **Raspberry Pi 5 (8GB RAM)**.

## Hardware Specifications

**Selected Device:** [Raspberry Pi 5 Starter Kit (8GB RAM)](https://www.amazon.ca/gp/product/B0D95QBKJ4)

**Specifications:**
- **CPU:** 64-bit quad-core Arm Cortex-A76 @ 2.4GHz
- **Performance:** 2-3× faster than Raspberry Pi 4
- **RAM:** 8GB
- **Storage:** 64GB MicroSD (included) - can upgrade to USB SSD
- **Power:** Low consumption (~10W)

## Recommended Deployment Method

### ✅ Docker Compose (Recommended)

**Why Docker Compose for Raspberry Pi 5?**

1. ✅ **Simpler Setup** - 5-10 minutes vs 30-60 minutes for k3s
2. ✅ **Less Complexity** - Easy commands: `docker compose up`
3. ✅ **Lower Resources** - Less overhead than Kubernetes
4. ✅ **Production Ready** - Auto-restart, health checks, persistent storage
5. ✅ **Perfect for Single Pi** - The Pi 5's 8GB RAM is more than enough

**When to Use k3s Instead:**
- ❌ Not needed for single Pi deployment
- ✅ Only if you plan to add more Pis to a cluster
- ✅ Only if you need advanced Kubernetes features

## Files Updated

### New Files Created

1. **`RASPBERRY_PI_5_SETUP.md`** - Quick setup guide for Pi 5
   - Step-by-step Docker Compose deployment
   - Auto-start on boot configuration
   - Common commands and troubleshooting
   - Performance tips (USB SSD setup)

### Modified Files

2. **`docs/DEPLOYMENT_PI.md`**
   - Updated hardware section for Pi 5
   - Added comparison table (Docker Compose vs k3s)
   - Added full Docker Compose deployment method
   - Reorganized to prioritize Docker Compose
   - Kept k3s instructions for advanced users

3. **`README.md`**
   - Updated feature list to mention Pi 5
   - Reorganized documentation links
   - Updated infrastructure section

4. **`HOW_TO_RUN.md`**
   - Added production deployment section
   - Links to Pi 5 setup guide
   - Clarified local vs production options

## Quick Reference

### For Development (Mac/PC)

```bash
# Option 1: Simple script
./scripts/start-servers.sh

# Option 2: Docker Compose
docker-compose up
```

### For Production (Raspberry Pi 5)

```bash
# Setup (one-time)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo apt install docker-compose-plugin

# Clone and start
git clone https://github.com/raolivei/swimTO.git
cd swimTO
docker compose up -d
```

See [RASPBERRY_PI_5_SETUP.md](RASPBERRY_PI_5_SETUP.md) for complete instructions.

## Deployment Comparison

| Feature | Local Dev Script | Local Docker | Pi 5 Docker Compose | Pi k3s |
|---------|-----------------|--------------|---------------------|---------|
| Setup Time | Instant | 1 min | 10 min | 60 min |
| Hardware | Mac/PC | Mac/PC | Raspberry Pi 5 | Raspberry Pi 5 |
| Database | Need local | ✅ Included | ✅ Included | ✅ Included |
| Production | ❌ No | ⚠️ Maybe | ✅ Yes | ✅ Yes |
| Auto-restart | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| Auto-start boot | ❌ No | ❌ No | ✅ Systemd | ✅ Built-in |
| Complexity | Low | Low | Low | High |
| Multi-node | ❌ No | ❌ No | ❌ No | ✅ Yes |

## Benefits of This Configuration

### Hardware Benefits (Pi 5 vs Pi 4)

- ⚡ **2-3× faster CPU** - Better performance for data processing
- 🧠 **8GB RAM** - Comfortable headroom for all services
- 💾 **USB 3.0** - Can add fast USB SSD for database
- 🔌 **Low power** - ~10W power consumption
- 🌡️ **Better thermals** - Runs cooler than Pi 4

### Docker Compose Benefits

- ✅ **Simple management** - One command to start/stop
- ✅ **Isolated services** - Each service in its own container
- ✅ **Automatic restarts** - Services restart on failure
- ✅ **Easy updates** - `git pull && docker compose up -d --build`
- ✅ **Persistent data** - Database survives restarts
- ✅ **Port management** - Clean port mapping
- ✅ **Log aggregation** - `docker compose logs -f`

## Performance Expectations

With Raspberry Pi 5 (8GB) running Docker Compose:

- **Memory Usage:** ~2-3GB (plenty of headroom)
- **CPU Usage:** 10-20% idle, 40-60% during data refresh
- **Boot to Ready:** ~30 seconds
- **Response Times:** <100ms for API calls
- **Data Refresh:** ~2-5 minutes (runs daily at 4 AM)

## Next Steps

1. **Order Hardware** - Raspberry Pi 5 (8GB) starter kit
2. **Install OS** - Raspberry Pi OS (64-bit)
3. **Follow Guide** - [RASPBERRY_PI_5_SETUP.md](RASPBERRY_PI_5_SETUP.md)
4. **Configure Auto-start** - systemd service for boot startup
5. **Set Up Backups** - Daily database backups

## Optional Enhancements

### Performance
- Add USB SSD for database storage (faster than microSD)
- Configure log rotation to save space
- Set up monitoring (Prometheus/Grafana)

### Access
- Configure dynamic DNS for external access
- Set up Cloudflare Tunnel (no port forwarding needed)
- Enable HTTPS with Let's Encrypt

### Reliability
- Configure automated database backups
- Set up health check monitoring
- Configure email alerts for failures

## Documentation Structure

```
SwimTO/
├── README.md                          # Main documentation
├── RASPBERRY_PI_5_SETUP.md           # 🆕 Quick Pi 5 setup
├── HOW_TO_RUN.md                      # Updated with production option
├── docs/
│   ├── DEPLOYMENT_PI.md               # Updated full deployment guide
│   ├── QUICKSTART.md                  # Local dev quickstart
│   ├── LOCAL_DEVELOPMENT.md           # Development guide
│   └── ...
```

## Summary

- ✅ **Hardware**: Raspberry Pi 5 (8GB RAM) - Perfect for SwimTO
- ✅ **Method**: Docker Compose - Simple and production-ready
- ✅ **Complexity**: Low - Easy to set up and maintain
- ✅ **Performance**: Excellent - Pi 5 handles it easily
- ✅ **Cost**: ~$100-120 CAD - Great value for always-on hosting

The Raspberry Pi 5 with Docker Compose is the ideal deployment strategy for SwimTO! 🎉

