#!/bin/bash
# Setup Google OAuth credentials for SwimTO
# This script helps you configure Google OAuth for public access

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SWIMTO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Set kubeconfig
export KUBECONFIG="${KUBECONFIG:-$HOME/.kube/config-eldertree}"

echo "🔐 Google OAuth Setup for SwimTO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Vault
VAULT_POD=$(kubectl get pods -n vault -l app.kubernetes.io/name=vault -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -z "$VAULT_POD" ]; then
    echo "❌ Error: Vault pod not found"
    exit 1
fi

SEAL_STATUS=$(kubectl exec -n vault $VAULT_POD -- vault status -format=json 2>/dev/null | jq -r '.sealed' || echo "true")
if [ "$SEAL_STATUS" = "true" ]; then
    echo "❌ Error: Vault is sealed. Please unseal it first:"
    echo "   cd ~/WORKSPACE/raolivei/pi-fleet && ./scripts/operations/unseal-vault.sh"
    exit 1
fi

echo "✅ Vault is ready"
echo ""

# Instructions
echo "📋 Before proceeding, you need to:"
echo ""
echo "1. Go to Google Cloud Console: https://console.cloud.google.com/"
echo "2. Select your project (or create a new one)"
echo "3. Navigate to: APIs & Services → Credentials"
echo "4. Create OAuth 2.0 Client ID (or use existing)"
echo "5. Add Authorized redirect URI:"
echo "   https://swimto.eldertree.xyz/auth/callback"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Do you have Google OAuth credentials ready? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please set up Google OAuth credentials first, then run this script again."
    echo ""
    echo "Quick guide:"
    echo "1. Go to: https://console.cloud.google.com/apis/credentials"
    echo "2. Click 'Create Credentials' → 'OAuth client ID'"
    echo "3. Application type: Web application"
    echo "4. Authorized redirect URIs: https://swimto.eldertree.xyz/auth/callback"
    echo "5. Copy the Client ID and Client Secret"
    exit 0
fi

echo ""
echo "Enter your Google OAuth credentials:"
echo ""

read -p "Google Client ID (e.g., 123456789.apps.googleusercontent.com): " GOOGLE_CLIENT_ID
read -p "Google Client Secret (will not be displayed): " -s GOOGLE_CLIENT_SECRET
echo ""

if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ Error: Both Client ID and Client Secret are required"
    exit 1
fi

# Verify redirect URI
REDIRECT_URI="https://swimto.eldertree.xyz/auth/callback"
echo ""
echo "⚠️  IMPORTANT: Make sure this redirect URI is added in Google Cloud Console:"
echo "   $REDIRECT_URI"
echo ""
read -p "Is this redirect URI configured in Google Cloud Console? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "❌ Please add the redirect URI first:"
    echo "   1. Go to: https://console.cloud.google.com/apis/credentials"
    echo "   2. Edit your OAuth 2.0 Client ID"
    echo "   3. Add to 'Authorized redirect URIs': $REDIRECT_URI"
    echo "   4. Save and run this script again"
    exit 1
fi

# Store in Vault
echo ""
echo "💾 Storing OAuth credentials in Vault..."
kubectl exec -n vault $VAULT_POD -- vault kv put secret/swimto/oauth \
    google-client-id="$GOOGLE_CLIENT_ID" \
    google-client-secret="$GOOGLE_CLIENT_SECRET"

echo ""
echo "✅ OAuth credentials stored in Vault!"
echo ""

# Force External Secrets sync
echo "🔄 Forcing External Secrets sync..."
kubectl annotate externalsecret swimto-secrets -n swimto \
    reconcile.external-secrets.io/requestedAt="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --overwrite 2>/dev/null || true

echo "⏳ Waiting for secret sync..."
sleep 5

# Verify
if kubectl get secret swimto-secrets -n swimto -o jsonpath='{.data.GOOGLE_CLIENT_ID}' 2>/dev/null | base64 -d | grep -q "$GOOGLE_CLIENT_ID"; then
    echo "✅ Secrets synced to Kubernetes!"
else
    echo "⚠️  Secrets may still be syncing. Check status:"
    echo "   kubectl get externalsecrets -n swimto"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Restart the API pod to pick up new credentials:"
echo "   kubectl rollout restart deployment/swimto-api -n swimto"
echo ""
echo "2. Test OAuth login at: https://swimto.eldertree.xyz"
echo ""
echo "3. If login still fails, check:"
echo "   - Redirect URI matches exactly: https://swimto.eldertree.xyz/auth/callback"
echo "   - API pod logs: kubectl logs -n swimto deployment/swimto-api"
echo "   - Browser console for errors"
echo ""
