#!/bin/bash
# Update SwimTO API keys and OAuth credentials in Vault
# Usage: ./update-vault-api-keys.sh

set -eo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔑 Update SwimTO API Keys and OAuth Credentials in Vault${NC}"
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

# Function to set secret in Vault
set_vault_secret() {
    local path=$1
    shift
    echo -e "${YELLOW}Setting ${path}...${NC}"
    local vault_cmd="export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN='${VAULT_TOKEN}' && vault kv put '${path}'"
    for arg in "$@"; do
        vault_cmd="${vault_cmd} '${arg}'"
    done
    if kubectl exec -n vault $VAULT_POD -- sh -c "${vault_cmd}" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ${path}${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to set ${path}${NC}"
        return 1
    fi
}

# Prompt for API keys
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}API Keys (Optional - press Enter to skip)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

read -p "OpenAI API Key (or press Enter to skip): " OPENAI_KEY
read -p "Leonardo.ai API Key (or press Enter to skip): " LEONARDO_KEY

# Prompt for OAuth credentials
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Google OAuth Credentials (Optional - press Enter to skip)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

read -p "Google OAuth Client ID (or press Enter to skip): " GOOGLE_CLIENT_ID
read -p "Google OAuth Client Secret (or press Enter to skip): " GOOGLE_CLIENT_SECRET

# Update API keys if provided
if [ -n "$OPENAI_KEY" ] || [ -n "$LEONARDO_KEY" ]; then
    echo ""
    echo -e "${GREEN}Updating API keys in Vault...${NC}"
    
    # Read existing values if not provided
    if [ -z "$OPENAI_KEY" ]; then
        OPENAI_KEY=$(kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN='${VAULT_TOKEN}' && vault kv get -field=openai-api-key secret/swimto/api-keys 2>/dev/null" || echo "")
    fi
    if [ -z "$LEONARDO_KEY" ]; then
        LEONARDO_KEY=$(kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN='${VAULT_TOKEN}' && vault kv get -field=leonardo-api-key secret/swimto/api-keys 2>/dev/null" || echo "")
    fi
    
    # Build command arguments
    local api_args=()
    if [ -n "$OPENAI_KEY" ]; then
        api_args+=("openai-api-key=${OPENAI_KEY}")
    fi
    if [ -n "$LEONARDO_KEY" ]; then
        api_args+=("leonardo-api-key=${LEONARDO_KEY}")
    fi
    
    if [ ${#api_args[@]} -gt 0 ]; then
        set_vault_secret "secret/swimto/api-keys" "${api_args[@]}"
    fi
fi

# Update OAuth credentials if provided
if [ -n "$GOOGLE_CLIENT_ID" ] || [ -n "$GOOGLE_CLIENT_SECRET" ]; then
    echo ""
    echo -e "${GREEN}Updating OAuth credentials in Vault...${NC}"
    
    # Read existing values if not provided
    if [ -z "$GOOGLE_CLIENT_ID" ]; then
        GOOGLE_CLIENT_ID=$(kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN='${VAULT_TOKEN}' && vault kv get -field=google-client-id secret/swimto/oauth 2>/dev/null" || echo "")
    fi
    if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
        GOOGLE_CLIENT_SECRET=$(kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN='${VAULT_TOKEN}' && vault kv get -field=google-client-secret secret/swimto/oauth 2>/dev/null" || echo "")
    fi
    
    # Build command arguments
    local oauth_args=()
    if [ -n "$GOOGLE_CLIENT_ID" ]; then
        oauth_args+=("google-client-id=${GOOGLE_CLIENT_ID}")
    fi
    if [ -n "$GOOGLE_CLIENT_SECRET" ]; then
        oauth_args+=("google-client-secret=${GOOGLE_CLIENT_SECRET}")
    fi
    
    if [ ${#oauth_args[@]} -gt 0 ]; then
        set_vault_secret "secret/swimto/oauth" "${oauth_args[@]}"
    fi
fi

# Summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Secrets updated in Vault${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}External Secrets Operator will automatically sync these secrets${NC}"
echo -e "${GREEN}to Kubernetes within 24 hours, or immediately on ExternalSecret update.${NC}"
echo ""
echo -e "${YELLOW}To force immediate sync, restart External Secrets Operator pods:${NC}"
echo -e "  kubectl rollout restart deployment external-secrets -n external-secrets"

