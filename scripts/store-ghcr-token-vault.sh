#!/bin/bash
# Store GHCR token in Vault
# Usage: ./scripts/store-ghcr-token-vault.sh [vault-root-token]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get GHCR token from environment or prompt
if [ -z "$GHCR_TOKEN" ]; then
    echo -e "${YELLOW}GHCR_TOKEN environment variable not set${NC}"
    echo -e "${YELLOW}Please provide your GitHub Personal Access Token:${NC}"
    read -s GHCR_TOKEN
    if [ -z "$GHCR_TOKEN" ]; then
        echo -e "${RED}Error: GHCR token is required${NC}"
        exit 1
    fi
fi

VAULT_PATH="secret/swimto/ghcr-token"

echo -e "${GREEN}🔐 Storing GHCR token in Vault at ${VAULT_PATH}...${NC}"

# Set KUBECONFIG
if [ -z "$KUBECONFIG" ]; then
    if [ -f ~/.kube/config-eldertree ]; then
        export KUBECONFIG=~/.kube/config-eldertree
        echo -e "${YELLOW}Using KUBECONFIG=~/.kube/config-eldertree${NC}"
    else
        echo -e "${RED}Error: KUBECONFIG not set and ~/.kube/config-eldertree not found${NC}"
        exit 1
    fi
fi

# Get Vault pod
VAULT_POD=$(kubectl get pods -n vault -l app.kubernetes.io/name=vault -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -z "$VAULT_POD" ]; then
    echo -e "${RED}Error: Vault pod not found${NC}"
    exit 1
fi

echo -e "${GREEN}Found Vault pod: $VAULT_POD${NC}"

# Check if Vault is sealed
SEAL_STATUS=$(kubectl exec -n vault $VAULT_POD -- vault status -format=json 2>/dev/null | grep -o '"sealed":[^,]*' | cut -d: -f2 | tr -d ' "' || echo "true")
if [ "$SEAL_STATUS" = "true" ]; then
    echo -e "${RED}Error: Vault is sealed. Please unseal it first:${NC}"
    echo "  cd ~/WORKSPACE/raolivei/pi-fleet"
    echo "  ./scripts/operations/unseal-vault.sh"
    exit 1
fi

echo -e "${GREEN}Vault is unsealed${NC}"

# Get SwimTO project token (preferred) or root token (fallback)
if [ -n "$1" ]; then
    VAULT_TOKEN="$1"
    echo -e "${GREEN}Using provided token${NC}"
else
    # Try to get project-specific token first
    VAULT_TOKEN=$(kubectl get secret vault-token-swimto -n external-secrets -o jsonpath='{.data.token}' 2>/dev/null | base64 -d 2>/dev/null || echo "")
    
    if [ -z "$VAULT_TOKEN" ]; then
        echo -e "${YELLOW}Project-specific token not found. Trying root token...${NC}"
        VAULT_TOKEN=$(kubectl get secret vault-token -n external-secrets -o jsonpath='{.data.token}' 2>/dev/null | base64 -d 2>/dev/null || echo "")
        
        if [ -z "$VAULT_TOKEN" ]; then
            echo -e "${YELLOW}Root token not found in external-secrets namespace${NC}"
            echo -e "${YELLOW}Please provide the Vault token:${NC}"
            read -s VAULT_TOKEN
            if [ -z "$VAULT_TOKEN" ]; then
                echo -e "${RED}Error: Token is required${NC}"
                exit 1
            fi
        else
            echo -e "${GREEN}Found root token in external-secrets namespace${NC}"
        fi
    else
        echo -e "${GREEN}Found SwimTO project token in external-secrets namespace${NC}"
    fi
fi

# Store the token
echo -e "${GREEN}Storing GHCR token in Vault...${NC}"
kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN='${VAULT_TOKEN}' && vault kv put ${VAULT_PATH} token='${GHCR_TOKEN}'"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully stored GHCR token in Vault at ${VAULT_PATH}${NC}"
    
    # Verify it was stored
    echo -e "${GREEN}Verifying storage...${NC}"
    STORED_TOKEN=$(kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN='${VAULT_TOKEN}' && vault kv get -field=token ${VAULT_PATH} 2>/dev/null" || echo "")
    
    if [ "$STORED_TOKEN" = "$GHCR_TOKEN" ]; then
        echo -e "${GREEN}✅ Verification successful!${NC}"
    else
        echo -e "${YELLOW}⚠️  Verification failed, but token may still be stored${NC}"
    fi
else
    echo -e "${RED}❌ Failed to store token in Vault${NC}"
    exit 1
fi

