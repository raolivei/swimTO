#!/bin/bash
# Emergency deployment script for swimTO
# Use this when Flux is down or you need immediate deployment
set -e

PROJECT="swimto"
NAMESPACE="swimto"

echo "🚨 EMERGENCY DEPLOYMENT MODE - swimTO"
echo "======================================"
echo "This will:"
echo "  1. Suspend Flux reconciliation"
echo "  2. Apply manifests directly to cluster"
echo "  3. Bypass GitOps workflow"
echo ""
echo "⚠️  WARNING: This is for emergencies only!"
echo "    Remember to resume Flux when done."
echo ""
read -p "Continue with emergency deployment? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

# Check if flux is available
if ! command -v flux &> /dev/null; then
    echo "❌ flux CLI not found. Install from: https://fluxcd.io/docs/installation/"
    exit 1
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found"
    exit 1
fi

# Suspend Flux reconciliation
echo ""
echo "⏸️  Suspending Flux reconciliation..."
flux suspend kustomization flux-system --namespace flux-system || {
    echo "⚠️  Failed to suspend Flux (might already be suspended or not running)"
}

# Apply manifests in correct order
echo ""
echo "📦 Applying manifests to cluster..."
echo ""

MANIFESTS=(
    "k8s/namespace.yaml"
    "k8s/configmap.yaml"
    "k8s/postgres-pvc.yaml"
    "k8s/postgres-deployment.yaml"
    "k8s/redis-deployment.yaml"
    "k8s/api-deployment.yaml"
    "k8s/web-deployment.yaml"
    "k8s/ingress.yaml"
    "k8s/cronjob-refresh.yaml"
)

for manifest in "${MANIFESTS[@]}"; do
    if [ -f "$manifest" ]; then
        echo "  ✓ Applying $manifest"
        kubectl apply -f "$manifest"
    else
        echo "  ⚠️  Skipping $manifest (not found)"
    fi
done

echo ""
echo "✅ Emergency deployment complete!"
echo ""
echo "📊 Deployment status:"
kubectl get pods -n $NAMESPACE

echo ""
echo "⚠️  IMPORTANT: Resume Flux when ready:"
echo "    ./scripts/resume-flux.sh"
echo ""
echo "💡 To check logs:"
echo "    kubectl logs -n $NAMESPACE -l app=swimto-api"
echo "    kubectl logs -n $NAMESPACE -l app=swimto-web"

