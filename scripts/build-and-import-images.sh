#!/bin/bash
# Build and push SwimTO Docker images to GitHub Container Registry
# This script should be run on the Raspberry Pi cluster

set -eo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# GitHub Container Registry configuration
REGISTRY="ghcr.io"
IMAGE_PREFIX="${REGISTRY}/raolivei"

echo -e "${GREEN}🐳 Building and pushing SwimTO Docker images to ${REGISTRY}${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "apps/api/Dockerfile" ] || [ ! -f "apps/web/Dockerfile" ]; then
    echo -e "${RED}Error: Please run this script from the swimTO root directory${NC}"
    exit 1
fi

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if k3s is available
if ! command -v k3s &> /dev/null && [ ! -f /usr/local/bin/k3s ]; then
    echo -e "${RED}Error: k3s is not installed or not in PATH${NC}"
    exit 1
fi

# Determine k3s command (might need sudo)
K3S_CMD="k3s"
if [ -f /usr/local/bin/k3s ]; then
    K3S_CMD="sudo /usr/local/bin/k3s"
fi

echo -e "${BLUE}Building Docker images...${NC}"
echo ""

# Build API image
echo -e "${YELLOW}Building ${IMAGE_PREFIX}/swimto-api:latest...${NC}"
if docker build -t ${IMAGE_PREFIX}/swimto-api:latest ./apps/api; then
    echo -e "${GREEN}✅ API image built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build API image${NC}"
    exit 1
fi

# Build Web image (production target)
echo ""
echo -e "${YELLOW}Building ${IMAGE_PREFIX}/swimto-web:latest (production)...${NC}"
if docker build -t ${IMAGE_PREFIX}/swimto-web:latest --target production ./apps/web; then
    echo -e "${GREEN}✅ Web image built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build Web image${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Pushing images to ${REGISTRY}...${NC}"
echo ""

# Push API image
echo -e "${YELLOW}Pushing ${IMAGE_PREFIX}/swimto-api:latest...${NC}"
if docker push ${IMAGE_PREFIX}/swimto-api:latest; then
    echo -e "${GREEN}✅ API image pushed successfully${NC}"
else
    echo -e "${RED}❌ Failed to push API image${NC}"
    exit 1
fi

# Push Web image
echo ""
echo -e "${YELLOW}Pushing ${IMAGE_PREFIX}/swimto-web:latest...${NC}"
if docker push ${IMAGE_PREFIX}/swimto-web:latest; then
    echo -e "${GREEN}✅ Web image pushed successfully${NC}"
else
    echo -e "${RED}❌ Failed to push Web image${NC}"
    exit 1
fi

# Pull images into k3s
echo ""
echo -e "${BLUE}Pulling images into k3s...${NC}"
echo ""

# Pull API image
echo -e "${YELLOW}Pulling ${IMAGE_PREFIX}/swimto-api:latest into k3s...${NC}"
if $K3S_CMD ctr images pull ${IMAGE_PREFIX}/swimto-api:latest; then
    echo -e "${GREEN}✅ API image pulled successfully${NC}"
else
    echo -e "${RED}❌ Failed to pull API image${NC}"
    exit 1
fi

# Pull Web image
echo ""
echo -e "${YELLOW}Pulling ${IMAGE_PREFIX}/swimto-web:latest into k3s...${NC}"
if $K3S_CMD ctr images pull ${IMAGE_PREFIX}/swimto-web:latest; then
    echo -e "${GREEN}✅ Web image pulled successfully${NC}"
else
    echo -e "${RED}❌ Failed to pull Web image${NC}"
    exit 1
fi

# Verify images are in k3s
echo ""
echo -e "${BLUE}Verifying images in k3s...${NC}"
if $K3S_CMD ctr images ls | grep -q "${IMAGE_PREFIX}/swimto-api:latest"; then
    echo -e "${GREEN}✅ ${IMAGE_PREFIX}/swimto-api:latest found in k3s${NC}"
else
    echo -e "${RED}❌ ${IMAGE_PREFIX}/swimto-api:latest not found in k3s${NC}"
fi

if $K3S_CMD ctr images ls | grep -q "${IMAGE_PREFIX}/swimto-web:latest"; then
    echo -e "${GREEN}✅ ${IMAGE_PREFIX}/swimto-web:latest found in k3s${NC}"
else
    echo -e "${RED}❌ ${IMAGE_PREFIX}/swimto-web:latest not found in k3s${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Images built and imported successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Verify images: $K3S_CMD ctr images ls | grep ${IMAGE_PREFIX}"
echo -e "  2. Restart deployments: kubectl rollout restart deployment/swimto-api -n swimto"
echo -e "  3. Restart deployments: kubectl rollout restart deployment/swimto-web -n swimto"
echo -e "  4. Check pods: kubectl get pods -n swimto"

