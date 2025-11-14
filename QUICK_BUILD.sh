#!/bin/bash
# Quick build script - Copy and run this on the Pi node (192.168.2.83)
# Usage: Copy this entire script and run it on the Pi

set -e

REGISTRY="ghcr.io"
IMAGE_PREFIX="${REGISTRY}/raolivei"

echo "🐳 Building SwimTO images for ${REGISTRY}..."

# Navigate to swimTO directory (adjust path as needed)
cd ~/swimTO 2>/dev/null || cd /home/*/swimTO 2>/dev/null || {
    echo "Error: Please navigate to the swimTO directory first"
    exit 1
}

# Build images
echo "Building API image..."
docker build -t ${IMAGE_PREFIX}/swimto-api:latest ./apps/api

echo "Building Web image..."
docker build -t ${IMAGE_PREFIX}/swimto-web:latest --target production ./apps/web

# Push to GitHub Container Registry
echo "Pushing images to ${REGISTRY}..."
docker push ${IMAGE_PREFIX}/swimto-api:latest
docker push ${IMAGE_PREFIX}/swimto-web:latest

# Pull into k3s
echo "Pulling images into k3s..."
sudo k3s ctr images pull ${IMAGE_PREFIX}/swimto-api:latest
sudo k3s ctr images pull ${IMAGE_PREFIX}/swimto-web:latest

# Verify
echo "Verifying images..."
sudo k3s ctr images ls | grep ${IMAGE_PREFIX}

# Restart deployments
echo "Restarting deployments..."
kubectl rollout restart deployment/swimto-api -n swimto
kubectl rollout restart deployment/swimto-web -n swimto

echo "✅ Done! Check pods with: kubectl get pods -n swimto"

