#!/bin/bash
# Setup GHCR secret for swimto namespace
# This script creates a docker-registry secret for pulling images from ghcr.io

set -eo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Setting up GHCR secret for swimto namespace${NC}"

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
    fi
fi

# Option 1: Get token from Vault
echo -e "${GREEN}Checking Vault for GHCR token...${NC}"
VAULT_POD=$(kubectl get pods -n vault -l app.kubernetes.io/name=vault -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ -n "$VAULT_POD" ]; then
    VAULT_TOKEN=$(kubectl logs -n vault $VAULT_POD 2>/dev/null | grep "Root Token" | tail -1 | awk '{print $NF}')
    if [ -z "$VAULT_TOKEN" ]; then
        VAULT_TOKEN="root"
    fi
    
    GHCR_TOKEN=$(kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN='${VAULT_TOKEN}' && vault kv get -field=token secret/canopy/ghcr-token 2>/dev/null" || echo "")
    
    if [ -n "$GHCR_TOKEN" ]; then
        echo -e "${GREEN}Found GHCR token in Vault${NC}"
        kubectl create secret docker-registry ghcr-secret \
            --docker-server=ghcr.io \
            --docker-username=raolivei \
            --docker-password="$GHCR_TOKEN" \
            -n swimto \
            --dry-run=client -o yaml | kubectl apply -f -
        echo -e "${GREEN}✅ Created ghcr-secret in swimto namespace${NC}"
        exit 0
    fi
fi

# Option 2: Prompt for token
echo -e "${YELLOW}GHCR token not found in Vault${NC}"
echo -e "${YELLOW}You can either:${NC}"
echo -e "  1. Make the repository public on GitHub (no auth needed)"
echo -e "  2. Provide a GitHub Personal Access Token"
echo ""
read -p "Enter GitHub Personal Access Token (or press Enter to skip): " GHCR_TOKEN

if [ -n "$GHCR_TOKEN" ]; then
    kubectl create secret docker-registry ghcr-secret \
        --docker-server=ghcr.io \
        --docker-username=raolivei \
        --docker-password="$GHCR_TOKEN" \
        -n swimto \
        --dry-run=client -o yaml | kubectl apply -f -
    echo -e "${GREEN}✅ Created ghcr-secret in swimto namespace${NC}"
    
    # Optionally store in Vault
    read -p "Store token in Vault? (y/n): " STORE_IN_VAULT
    if [ "$STORE_IN_VAULT" = "y" ] && [ -n "$VAULT_POD" ]; then
        kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN='${VAULT_TOKEN}' && vault kv put secret/canopy/ghcr-token token='${GHCR_TOKEN}'" 2>/dev/null
        echo -e "${GREEN}✅ Stored token in Vault${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No token provided. Make sure the repository is public or create the secret manually.${NC}"
    echo -e "${YELLOW}To make repository public:${NC}"
    echo -e "  Go to https://github.com/raolivei/swimTO/packages"
    echo -e "  Click on the package → Package settings → Change visibility to public"
fi


