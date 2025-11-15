#!/bin/bash
# Create GHCR secret manually for swimto namespace
# This creates a docker-registry secret for pulling images from ghcr.io

set -eo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔐 Creating GHCR secret for swimto namespace${NC}"
echo ""
echo -e "${YELLOW}To create a GitHub Personal Access Token:${NC}"
echo -e "  1. Go to: https://github.com/settings/tokens"
echo -e "  2. Click 'Generate new token (classic)'"
echo -e "  3. Select scope: 'read:packages'"
echo -e "  4. Generate and copy the token"
echo ""
read -p "Enter GitHub Personal Access Token: " GHCR_TOKEN

if [ -z "$GHCR_TOKEN" ]; then
    echo -e "${RED}Error: Token is required${NC}"
    exit 1
fi

# Create the secret
kubectl create secret docker-registry ghcr-secret \
    --docker-server=ghcr.io \
    --docker-username=raolivei \
    --docker-password="$GHCR_TOKEN" \
    -n swimto \
    --dry-run=client -o yaml | kubectl apply -f -

echo -e "${GREEN}✅ Created ghcr-secret in swimto namespace${NC}"
echo ""
echo -e "${YELLOW}Now updating deployments to use the secret...${NC}"

# Update deployments to use imagePullSecrets
cd "$(dirname "$0")/.."

# Add imagePullSecrets back to deployments
kubectl patch deployment swimto-api -n swimto --type='json' -p='[{"op": "add", "path": "/spec/template/spec/imagePullSecrets", "value": [{"name": "ghcr-secret"}]}]' 2>&1
kubectl patch deployment swimto-web -n swimto --type='json' -p='[{"op": "add", "path": "/spec/template/spec/imagePullSecrets", "value": [{"name": "ghcr-secret"}]}]' 2>&1

echo -e "${GREEN}✅ Updated deployments${NC}"
echo ""
echo -e "${YELLOW}Restarting deployments...${NC}"
kubectl rollout restart deployment/swimto-api -n swimto
kubectl rollout restart deployment/swimto-web -n swimto

echo -e "${GREEN}✅ Done! Check pods with: kubectl get pods -n swimto${NC}"



