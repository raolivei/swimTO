# Build and Deploy SwimTO Images

## Quick Fix: Build Images on Pi Node

Since SSH isn't configured, you'll need to run these commands directly on the Pi node (192.168.2.83).

### Option 1: Run Script on Pi (Easiest)

1. **Copy the script to the Pi** (via USB drive, or manually type it):

```bash
# On the Pi node, navigate to swimTO directory
cd ~/swimTO  # or wherever your swimTO code is

# Copy the build script content, or transfer it via USB
# Then run:
chmod +x scripts/build-and-import-images.sh
./scripts/build-and-import-images.sh
```

### Option 2: Manual Commands on Pi

Run these commands directly on the Pi node:

```bash
cd ~/swimTO  # Navigate to swimTO directory

# Build API image
docker build -t swimto-api:latest ./apps/api

# Build Web image (production)
docker build -t swimto-web:latest --target production ./apps/web

# Import into k3s
docker save swimto-api:latest | sudo k3s ctr images import -
docker save swimto-web:latest | sudo k3s ctr images import -

# Verify images
sudo k3s ctr images ls | grep swimto

# Restart deployments to pick up new images
kubectl rollout restart deployment/swimto-api -n swimto
kubectl rollout restart deployment/swimto-web -n swimto

# Check pods
kubectl get pods -n swimto -w
```

### Option 3: Use GitHub Actions (If Runner is Set Up)

If you have a GitHub Actions self-hosted runner on the Pi:

1. Push the code to trigger the workflow
2. The workflow will automatically build and import images

### Option 4: Build Locally and Transfer

If you can build ARM64 images locally:

```bash
# On your local machine (if Docker supports ARM64 builds)
cd /Users/roliveira/WORKSPACE/raolivei/swimTO

# Build for ARM64
docker buildx build --platform linux/arm64 -t swimto-api:latest -o type=docker,dest=- ./apps/api | docker load
docker buildx build --platform linux/arm64 -t swimto-web:latest --target production -o type=docker,dest=- ./apps/web | docker load

# Save images
docker save swimto-api:latest | gzip > swimto-api.tar.gz
docker save swimto-web:latest | gzip > swimto-web.tar.gz

# Transfer to Pi (when SSH is configured)
scp swimto-api.tar.gz swimto-web.tar.gz user@192.168.2.83:/tmp/

# On Pi: Load images
gunzip -c /tmp/swimto-api.tar.gz | sudo k3s ctr images import -
gunzip -c /tmp/swimto-web.tar.gz | sudo k3s ctr images import -
```

## Current Status

- ✅ Deployment files updated with `imagePullPolicy: Never`
- ✅ Build script created: `scripts/build-and-import-images.sh`
- ⚠️ Images need to be built on Pi node (192.168.2.83)

## After Building Images

Once images are imported, verify:

```bash
kubectl get pods -n swimto
kubectl describe pod -n swimto -l app=swimto-web
kubectl describe pod -n swimto -l app=swimto-api
```

The pods should start successfully once the images are available in k3s.
