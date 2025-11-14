# 🥧 SwimTO - Raspberry Pi k3s Deployment Guide

This guide walks you through deploying SwimTO on a Raspberry Pi cluster running k3s.

## Prerequisites

### Hardware

- Raspberry Pi 4 (4GB+ RAM recommended)
- MicroSD card (32GB+ recommended) or USB SSD for better performance
- Stable network connection
- Power supply

### Software

- Raspberry Pi OS (64-bit)
- k3s (lightweight Kubernetes)
- Docker
- GitHub Actions self-hosted runner (for CI/CD)

## Initial Setup

### 1. Install Raspberry Pi OS

```bash
# Use Raspberry Pi Imager to install Raspberry Pi OS (64-bit)
# Enable SSH during setup
```

### 2. Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

### 3. Install k3s

```bash
# Install k3s (single node)
curl -sfL https://get.k3s.io | sh -

# Check installation
sudo k3s kubectl get nodes

# Make kubectl accessible without sudo (optional)
sudo chmod 644 /etc/rancher/k3s/k3s.yaml
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
echo 'export KUBECONFIG=/etc/rancher/k3s/k3s.yaml' >> ~/.bashrc
```

### 4. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
```

## Deployment

### Method 1: GitHub Actions (Automated)

#### 1. Set Up Self-Hosted Runner

```bash
# On your Raspberry Pi
cd ~
mkdir actions-runner && cd actions-runner

# Download latest runner
curl -o actions-runner-linux-arm64-2.311.0.tar.gz \
  -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-arm64-2.311.0.tar.gz

# Extract
tar xzf ./actions-runner-linux-arm64-2.311.0.actions-runner-linux-arm64-2.311.0.tar.gz

# Configure (follow prompts)
./config.sh --url https://github.com/raolivei/swimTO --token YOUR_TOKEN

# Install as service
sudo ./svc.sh install
sudo ./svc.sh start

# Check status
sudo ./svc.sh status
```

Labels to add: `self-hosted`, `linux`, `ARM64`

#### 2. Create Secrets

Create `k8s/secret.yaml` from the example:

```bash
cd ~/swimTO
cp k8s/secret.yaml.example k8s/secret.yaml

# Edit with secure values
nano k8s/secret.yaml
```

Generate strong passwords:

```bash
# For POSTGRES_PASSWORD
openssl rand -base64 32

# For ADMIN_TOKEN
openssl rand -hex 32
```

#### 3. Push to Main Branch

```bash
git push origin main
```

GitHub Actions will automatically:

- Build Docker images
- Import them to k3s
- Deploy to cluster

### Method 2: Manual Deployment

#### 1. Clone Repository

```bash
cd ~
git clone https://github.com/raolivei/swimTO.git
cd swimTO
```

#### 2. Build Images

```bash
# Build API
cd apps/api
docker build -t swimto-api:latest .

# Build Web
cd ../web
docker build -t swimto-web:latest .

cd ../..
```

#### 3. Import Images to k3s

```bash
# Save and import API image
docker save swimto-api:latest | sudo k3s ctr images import -

# Save and import Web image
docker save swimto-web:latest | sudo k3s ctr images import -

# Verify
sudo k3s ctr images ls | grep swimto
```

#### 4. Create Kubernetes Resources

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secret (ensure you've created it from example)
kubectl apply -f k8s/secret.yaml

# Apply configuration
kubectl apply -f k8s/configmap.yaml

# Deploy database
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml

# Wait for database
kubectl wait --for=condition=ready pod -l app=postgres -n swimto --timeout=120s

# Run migrations
kubectl run migrations --image=swimto-api:latest --restart=Never -n swimto \
  --env="DATABASE_URL=$(kubectl get secret swimto-secrets -n swimto -o jsonpath='{.data.DATABASE_URL}' | base64 -d)" \
  --command -- alembic upgrade head

# Deploy application
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/web-deployment.yaml

# Set up cron job
kubectl apply -f k8s/cronjob-refresh.yaml
```

#### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -n swimto

# Check services
kubectl get services -n swimto

# View logs
kubectl logs -l app=swimto-api -n swimto --tail=50

# Health check
API_NODE_PORT=$(kubectl get service swimto-api-service -n swimto -o jsonpath='{.spec.ports[0].nodePort}')
curl http://localhost:$API_NODE_PORT/health
```

## Access the Application

### Find Node IP

```bash
# Get Raspberry Pi IP
hostname -I | awk '{print $1}'
```

### Access URLs

```
Frontend: http://<PI_IP>:30080
API:      http://<PI_IP>:30800
API Docs: http://<PI_IP>:30800/docs
```

## Maintenance

### Update Application

```bash
# Pull latest code
cd ~/swimTO
git pull

# Rebuild and redeploy (if manual)
# ... repeat build steps ...

# Or just push to main for automated deployment
```

### View Logs

```bash
# API logs
kubectl logs -l app=swimto-api -n swimto -f

# Web logs
kubectl logs -l app=swimto-web -n swimto -f

# Database logs
kubectl logs -l app=postgres -n swimto -f

# Cron job logs
kubectl logs -l job-name=swimto-data-refresh -n swimto
```

### Backup Database

```bash
# Create backup
kubectl exec -n swimto $(kubectl get pod -l app=postgres -n swimto -o jsonpath='{.items[0].metadata.name}') \
  -- pg_dump -U postgres pools > backup-$(date +%Y%m%d).sql

# Restore from backup
kubectl exec -i -n swimto $(kubectl get pod -l app=postgres -n swimto -o jsonpath='{.items[0].metadata.name}') \
  -- psql -U postgres pools < backup-20251105.sql
```

### Scale Deployments

```bash
# Scale API
kubectl scale deployment swimto-api -n swimto --replicas=3

# Scale Web
kubectl scale deployment swimto-web -n swimto --replicas=2
```

### Restart Services

```bash
# Restart API
kubectl rollout restart deployment/swimto-api -n swimto

# Restart Web
kubectl rollout restart deployment/swimto-web -n swimto

# Restart Database (careful!)
kubectl rollout restart deployment/postgres -n swimto
```

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod
kubectl describe pod <pod-name> -n swimto

# Check events
kubectl get events -n swimto --sort-by='.lastTimestamp'

# Check resource usage
kubectl top nodes
kubectl top pods -n swimto
```

### Database Connection Issues

```bash
# Check if database is ready
kubectl get pods -l app=postgres -n swimto

# Test connection
kubectl exec -it -n swimto $(kubectl get pod -l app=postgres -n swimto -o jsonpath='{.items[0].metadata.name}') \
  -- psql -U postgres -d pools -c "SELECT 1;"

# Check secret
kubectl get secret swimto-secrets -n swimto -o yaml
```

### Image Pull Issues

```bash
# Verify image exists in k3s
sudo k3s ctr images ls | grep swimto

# Re-import if needed
docker save swimto-api:latest | sudo k3s ctr images import -
```

### Storage Issues

```bash
# Check PVC status
kubectl get pvc -n swimto

# Check available storage
df -h

# For USB SSD, ensure it's mounted properly
lsblk
```

## Performance Optimization

### Use USB SSD for Database

```bash
# Format and mount USB SSD
sudo mkfs.ext4 /dev/sda1
sudo mkdir -p /mnt/usb-ssd
sudo mount /dev/sda1 /mnt/usb-ssd

# Add to fstab for auto-mount
echo '/dev/sda1 /mnt/usb-ssd ext4 defaults 0 0' | sudo tee -a /etc/fstab

# Update PVC to use specific path
# Edit k8s/postgres-pvc.yaml with local-path annotations
```

### Resource Limits

Adjust in deployment YAMLs based on your Pi's specs:

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "200m"
```

### Enable Memory Cgroup

Edit `/boot/cmdline.txt`:

```
cgroup_enable=cpuset cgroup_memory=1 cgroup_enable=memory
```

## Security

### Update Secrets

```bash
# Edit secret
kubectl edit secret swimto-secrets -n swimto

# Or delete and recreate
kubectl delete secret swimto-secrets -n swimto
kubectl apply -f k8s/secret.yaml
```

### Enable Firewall

```bash
# Install UFW
sudo apt install ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow NodePorts
sudo ufw allow 30080/tcp  # Web
sudo ufw allow 30800/tcp  # API

# Enable
sudo ufw enable
```

### SSL/TLS (Optional)

Consider using:

- Cloudflare Tunnel (no port forwarding needed)
- Let's Encrypt with cert-manager
- Traefik Ingress Controller

## Monitoring

### Basic Monitoring

```bash
# Resource usage
kubectl top nodes
kubectl top pods -n swimto

# Pod status
watch kubectl get pods -n swimto

# Logs
kubectl logs -l app=swimto-api -n swimto -f --tail=100
```

### Advanced Monitoring (Optional)

Consider installing:

- Prometheus + Grafana
- K9s (terminal UI for Kubernetes)

```bash
# Install k9s
curl -sS https://webi.sh/k9s | sh
```

## Next Steps

- Set up automated backups
- Configure external access (port forwarding or Cloudflare Tunnel)
- Set up monitoring and alerts
- Review operations documentation for ongoing maintenance

---

## 🚀 Next Steps

**Understand architecture?** → [Architecture Overview](ARCHITECTURE.md)  
**Test locally first?** → [Local Development Guide](LOCAL_DEVELOPMENT.md)  
**API details?** → [API Reference](API.md)  
**Mobile testing?** → [Mobile Testing Guide](MOBILE_TESTING.md)  
**Contributing?** → [Contributing Guidelines](CONTRIBUTING.md)  
**Overview?** → [README](../README.md)
