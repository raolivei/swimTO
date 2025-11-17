#!/bin/bash
# Resume Flux reconciliation after emergency deployment
set -e

echo "▶️  Resuming Flux GitOps Control"
echo "================================"
echo ""

# Check if flux is available
if ! command -v flux &> /dev/null; then
    echo "❌ flux CLI not found. Install from: https://fluxcd.io/docs/installation/"
    exit 1
fi

echo "🔄 Resuming Flux reconciliation..."
flux resume kustomization flux-system --namespace flux-system

echo ""
echo "⚡ Forcing immediate reconciliation..."
flux reconcile kustomization flux-system --with-source

echo ""
echo "✅ Flux resumed successfully!"
echo ""
echo "📊 GitOps is back in control."
echo "   Any drift from Git will be corrected."
echo ""
echo "💡 Check Flux status:"
echo "    flux get kustomizations -A"
echo "    flux logs --follow"

