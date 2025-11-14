#!/bin/bash
# Setup SwimTO secrets in Vault
# This script generates secure random secrets and stores them in Vault
# External Secrets Operator will automatically sync them to Kubernetes

set -eo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Setting up SwimTO secrets in Vault${NC}"

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

# Get Vault token (check logs for root token in dev mode)
echo -e "${GREEN}Getting Vault token...${NC}"
VAULT_TOKEN=$(kubectl logs -n vault $VAULT_POD 2>/dev/null | grep "Root Token" | tail -1 | awk '{print $NF}')

if [ -z "$VAULT_TOKEN" ]; then
    echo -e "${YELLOW}Warning: Could not find root token in logs. Using 'root' as default for dev mode.${NC}"
    VAULT_TOKEN="root"
fi

# Generate secure random secrets
echo -e "${GREEN}Generating secure random secrets...${NC}"

# PostgreSQL password (32 bytes, base64 encoded)
POSTGRES_PASSWORD=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))' 2>/dev/null || openssl rand -base64 32 | tr -d '\n')

# Admin token (32 bytes, hex encoded)
ADMIN_TOKEN=$(python3 -c 'import secrets; print(secrets.token_hex(32))' 2>/dev/null || openssl rand -hex 32 | tr -d '\n')

# Secret key for JWT signing (32 bytes, base64 encoded)
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))' 2>/dev/null || openssl rand -base64 32 | tr -d '\n')

# Database URL
DATABASE_URL="postgresql+psycopg://postgres:${POSTGRES_PASSWORD}@postgres-service:5432/pools"

# Redis URL
REDIS_URL="redis://redis-service:6379"

echo -e "${GREEN}✅ Secrets generated${NC}"

# Function to set secret in Vault
set_vault_secret() {
    local path=$1
    shift
    echo -e "${YELLOW}Setting ${path}...${NC}"
    # Build the vault command with all key-value pairs, properly quoting values
    local vault_cmd="export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN='${VAULT_TOKEN}' && vault kv put '${path}'"
    for arg in "$@"; do
        # Properly quote the argument to handle special characters
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

# Set secrets in Vault
echo -e "\n${GREEN}Storing secrets in Vault...${NC}"

# PostgreSQL password
set_vault_secret "secret/swimto/postgres" "password=${POSTGRES_PASSWORD}"

# Database URL
set_vault_secret "secret/swimto/database" "url=${DATABASE_URL}"

# Redis URL
set_vault_secret "secret/swimto/redis" "url=${REDIS_URL}"

# App secrets (admin token and secret key)
set_vault_secret "secret/swimto/app" admin-token="${ADMIN_TOKEN}" secret-key="${SECRET_KEY}"

# API keys (optional - using placeholders)
echo -e "\n${YELLOW}Setting optional API keys (using placeholders)...${NC}"
set_vault_secret "secret/swimto/api-keys" openai-api-key="placeholder-openai-key" leonardo-api-key="placeholder-leonardo-key" || true

# OAuth credentials (optional - using placeholders)
echo -e "\n${YELLOW}Setting optional OAuth credentials (using placeholders)...${NC}"
set_vault_secret "secret/swimto/oauth" google-client-id="placeholder-client-id" google-client-secret="placeholder-client-secret" || true

# Verify secrets were set
echo -e "\n${GREEN}Verifying secrets in Vault...${NC}"
if kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN='${VAULT_TOKEN}' && vault kv get secret/swimto/postgres" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Secrets verified${NC}"
else
    echo -e "${RED}❌ Verification failed${NC}"
    exit 1
fi

# Summary
echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ SwimTO secrets have been stored in Vault${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Secret Summary:${NC}"
echo -e "  PostgreSQL Password: ${POSTGRES_PASSWORD:0:20}..."
echo -e "  Admin Token: ${ADMIN_TOKEN:0:20}..."
echo -e "  Secret Key: ${SECRET_KEY:0:20}..."
echo ""
echo -e "${GREEN}External Secrets Operator will automatically sync these secrets${NC}"
echo -e "${GREEN}to Kubernetes within 24 hours, or immediately on ExternalSecret update.${NC}"
echo ""
echo -e "${YELLOW}To force immediate sync, you can:${NC}"
echo -e "  1. Restart the External Secrets Operator pods"
echo -e "  2. Or wait for the next refresh interval (24h)"
echo ""
echo -e "${YELLOW}To verify the Kubernetes secret was created:${NC}"
echo -e "  kubectl get secret swimto-secrets -n swimto"
echo ""
echo -e "${YELLOW}Note: API keys and OAuth credentials are set to placeholders.${NC}"
echo -e "${YELLOW}Update them in Vault when you have real values.${NC}"

