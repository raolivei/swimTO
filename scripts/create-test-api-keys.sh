#!/bin/bash
# Create realistic test API keys and OAuth credentials for SwimTO
# These are example/test values - replace with real values when available

set -eo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔑 Creating test API keys and OAuth credentials in Vault${NC}"

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

# Generate realistic-looking test API keys
echo -e "${GREEN}Generating test API keys...${NC}"

# OpenAI API key format: sk- followed by random alphanumeric (51 chars total)
OPENAI_KEY="sk-test-$(python3 -c 'import secrets, string; print("".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(48)))' 2>/dev/null || openssl rand -hex 24 | tr -d '\n')"

# Leonardo.ai API key format: random hex string (64 chars)
LEONARDO_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))' 2>/dev/null || openssl rand -hex 32 | tr -d '\n')

# Google OAuth Client ID format: numbers.apps.googleusercontent.com
GOOGLE_CLIENT_ID="$(python3 -c 'import secrets; print(secrets.randbelow(999999999999))' 2>/dev/null || echo $RANDOM$RANDOM$RANDOM).apps.googleusercontent.com"

# Google OAuth Client Secret format: GOCSPX- followed by random (40 chars total)
GOOGLE_CLIENT_SECRET="GOCSPX-$(python3 -c 'import secrets, string; print("".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(33)))' 2>/dev/null || openssl rand -hex 16 | tr -d '\n')"

echo -e "${GREEN}✅ Test values generated${NC}"

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

# Update API keys
echo ""
echo -e "${GREEN}Storing API keys in Vault...${NC}"
set_vault_secret "secret/swimto/api-keys" "openai-api-key=${OPENAI_KEY}" "leonardo-api-key=${LEONARDO_KEY}"

# Update OAuth credentials
echo ""
echo -e "${GREEN}Storing OAuth credentials in Vault...${NC}"
set_vault_secret "secret/swimto/oauth" "google-client-id=${GOOGLE_CLIENT_ID}" "google-client-secret=${GOOGLE_CLIENT_SECRET}"

# Summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Test API keys and OAuth credentials created in Vault${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Generated Values:${NC}"
echo -e "  OpenAI API Key: ${OPENAI_KEY:0:20}..."
echo -e "  Leonardo API Key: ${LEONARDO_KEY:0:20}..."
echo -e "  Google Client ID: ${GOOGLE_CLIENT_ID}"
echo -e "  Google Client Secret: ${GOOGLE_CLIENT_SECRET:0:20}..."
echo ""
echo -e "${YELLOW}⚠️  Note: These are TEST values. Replace with real credentials when available.${NC}"
echo ""
echo -e "${GREEN}External Secrets Operator will automatically sync these secrets${NC}"
echo -e "${GREEN}to Kubernetes within 24 hours, or immediately on ExternalSecret update.${NC}"


<<<<<<< HEAD

=======
>>>>>>> origin/main


