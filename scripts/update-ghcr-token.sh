#!/bin/bash
# Update GHCR token in Vault with a token that has write:packages scope
# This script helps you create a GitHub Personal Access Token and store it in Vault

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Updating GHCR token in Vault${NC}"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Check if KUBECONFIG is set or use default
if [ -z "$KUBECONFIG" ]; then
    if [ -f ~/.kube/config-eldertree ]; then
        export KUBECONFIG=~/.kube/config-eldertree
        echo -e "${YELLOW}Using KUBECONFIG=~/.kube/config-eldertree${NC}"
    else
        echo -e "${YELLOW}Warning: KUBECONFIG not set and ~/.kube/config-eldertree not found${NC}"
        echo -e "${YELLOW}Using default kubectl config${NC}"
    fi
fi

# Get Vault pod
echo -e "${GREEN}Finding Vault pod...${NC}"
VAULT_POD=$(kubectl get pods -n vault -l app.kubernetes.io/name=vault -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ -z "$VAULT_POD" ]; then
    echo -e "${RED}Error: Vault pod not found. Is Vault deployed?${NC}"
    exit 1
fi

echo -e "${GREEN}Found Vault pod: ${VAULT_POD}${NC}"

# Get Vault token
echo -e "${GREEN}Getting Vault token...${NC}"
VAULT_TOKEN=$(kubectl logs -n vault $VAULT_POD 2>/dev/null | grep "Root Token" | tail -1 | awk '{print $NF}')

if [ -z "$VAULT_TOKEN" ]; then
    echo -e "${YELLOW}Warning: Could not find root token in logs. Using 'root' as default for dev mode.${NC}"
    VAULT_TOKEN="root"
fi

# Prompt for GitHub token
echo ""
echo -e "${YELLOW}To push images to GHCR, you need a GitHub Personal Access Token with 'write:packages' scope.${NC}"
echo -e "${YELLOW}Create one at: https://github.com/settings/tokens/new${NC}"
echo ""
echo -e "${BLUE}Required scopes:${NC}"
echo -e "  - write:packages (to push container images)"
echo -e "  - read:packages (to pull container images)"
echo ""

# Check if token is provided as argument
if [ $# -eq 1 ]; then
    GITHUB_TOKEN="$1"
    echo -e "${GREEN}Using provided token${NC}"
else
    # Try to use gh CLI token if available
    if command -v gh &> /dev/null; then
        echo -e "${YELLOW}Checking if 'gh auth token' has write:packages scope...${NC}"
        CURRENT_TOKEN=$(gh auth token 2>/dev/null || echo "")
        if [ -n "$CURRENT_TOKEN" ]; then
            SCOPES=$(gh auth status 2>&1 | grep -i "Token scopes" | head -1 || echo "")
            if echo "$SCOPES" | grep -q "write:packages\|repo"; then
                echo -e "${GREEN}Found token with appropriate scopes${NC}"
                GITHUB_TOKEN="$CURRENT_TOKEN"
            else
                echo -e "${YELLOW}Current token doesn't have write:packages scope${NC}"
                read -p "Enter GitHub Personal Access Token (or press Enter to use current token anyway): " GITHUB_TOKEN
                GITHUB_TOKEN=${GITHUB_TOKEN:-$CURRENT_TOKEN}
            fi
        else
            read -p "Enter GitHub Personal Access Token: " GITHUB_TOKEN
        fi
    else
        read -p "Enter GitHub Personal Access Token: " GITHUB_TOKEN
    fi
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}Error: GitHub token is required${NC}"
    exit 1
fi

# Store token in Vault
echo ""
echo -e "${GREEN}Storing token in Vault...${NC}"
if kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN='${VAULT_TOKEN}' && vault kv put secret/canopy/ghcr-token token='${GITHUB_TOKEN}'" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Token stored in Vault${NC}"
else
    echo -e "${RED}❌ Failed to store token in Vault${NC}"
    exit 1
fi

# Force ExternalSecret to sync
echo ""
echo -e "${GREEN}Forcing ExternalSecret to sync...${NC}"
kubectl annotate externalsecret ghcr-secret -n swimto force-sync=$(date +%s) --overwrite 2>&1 | grep -v "Warning" || true

# Wait a moment for sync
sleep 3

# Verify secret was updated
echo ""
echo -e "${GREEN}Verifying secret sync...${NC}"
if kubectl get secret ghcr-secret -n swimto > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Secret synced successfully${NC}"
    echo ""
    echo -e "${YELLOW}The ExternalSecret will automatically sync the new token.${NC}"
    echo -e "${YELLOW}You can now push images to GHCR using:${NC}"
    echo -e "  docker login ghcr.io -u raolivei --password-stdin < <(echo '$GITHUB_TOKEN')"
    echo -e "  docker push ghcr.io/raolivei/swimto-api:latest"
    echo -e "  docker push ghcr.io/raolivei/swimto-web:latest"
else
    echo -e "${YELLOW}⚠️  Secret sync may take a moment. Check with:${NC}"
    echo -e "  kubectl get externalsecret ghcr-secret -n swimto"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ GHCR token updated in Vault${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"

