#!/bin/bash
# Check if GHCR token exists in Vault

set -eo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Checking Vault for GHCR token...${NC}"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Set KUBECONFIG if not set
if [ -z "$KUBECONFIG" ]; then
    if [ -f ~/.kube/config-eldertree ]; then
        export KUBECONFIG=~/.kube/config-eldertree
        echo -e "${YELLOW}Using KUBECONFIG=~/.kube/config-eldertree${NC}"
    fi
fi

# Get Vault pod
VAULT_POD=$(kubectl get pods -n vault -l app.kubernetes.io/name=vault -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ -z "$VAULT_POD" ]; then
    echo -e "${RED}Error: Vault pod not found${NC}"
    exit 1
fi

# Get Vault token (prefer project-specific token, fallback to root)
VAULT_TOKEN=$(kubectl get secret vault-token-swimto -n external-secrets -o jsonpath='{.data.token}' 2>/dev/null | base64 -d 2>/dev/null || echo "")

if [ -z "$VAULT_TOKEN" ]; then
    VAULT_TOKEN=$(kubectl get secret vault-token -n external-secrets -o jsonpath='{.data.token}' 2>/dev/null | base64 -d 2>/dev/null || echo "")
    if [ -z "$VAULT_TOKEN" ]; then
        VAULT_TOKEN="root"
    fi
fi

# Try to get token from Vault
GHCR_TOKEN=$(kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN='${VAULT_TOKEN}' && vault kv get -field=token secret/swimto/ghcr-token 2>/dev/null" || echo "")

if [ -n "$GHCR_TOKEN" ]; then
    echo -e "${GREEN}✅ Found GHCR token in Vault!${NC}"
    echo ""
    echo "Token value: ${GHCR_TOKEN:0:10}...${GHCR_TOKEN: -4}"
    echo ""
    echo "You can use this token value to add it to GitHub repository secrets:"
    echo "  1. Go to: https://github.com/raolivei/swimTO/settings/secrets/actions"
    echo "  2. Click 'New repository secret'"
    echo "  3. Name: CR_PAT"
    echo "  4. Value: (use the token above)"
    echo ""
    echo "Full token: $GHCR_TOKEN"
else
    echo -e "${YELLOW}⚠️  GHCR token not found in Vault${NC}"
    echo ""
    echo "You'll need to regenerate the existing 'swimTO' token:"
    echo "  1. Go to: https://github.com/settings/tokens"
    echo "  2. Find the 'swimTO' token"
    echo "  3. Click 'Delete' (this will invalidate it)"
    echo "  4. Click 'Generate new token (classic)'"
    echo "  5. Name: swimTO"
    echo "  6. Scopes: write:packages, read:packages, delete:packages"
    echo "  7. Copy the token immediately"
    echo "  8. Add it to GitHub secrets as CR_PAT"
fi

