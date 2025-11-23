#!/bin/bash
# Validate that swimTO/k8s/ matches pi-fleet manifests
# This ensures emergency deployments will match GitOps state

PROJECT="swimTO"
PI_FLEET_PATH="../pi-fleet/clusters/eldertree/swimto"

echo "🔍 Validating K8s Manifest Sync"
echo "================================"
echo "Comparing: $PROJECT/k8s/ ↔ pi-fleet/swimto/"
echo ""

# Check if pi-fleet directory exists
if [ ! -d "$PI_FLEET_PATH" ]; then
    echo "❌ pi-fleet swimto directory not found at: $PI_FLEET_PATH"
    exit 1
fi

# Files to exclude from comparison (only exist in one location)
EXCLUDE_ARGS=(
    --exclude="kustomization.yaml"      # Only in pi-fleet
    --exclude="ghcr-secret-external.yaml"  # Only in pi-fleet
    --exclude="build-job.yaml"          # Only in pi-fleet
    --exclude="secret.yaml.example"     # Only in swimTO/k8s
)

# Compare directories
echo "Checking for differences..."
DIFF_OUTPUT=$(diff -r --brief k8s/ "$PI_FLEET_PATH/" "${EXCLUDE_ARGS[@]}" 2>&1 || true)

if [ -z "$DIFF_OUTPUT" ]; then
    echo "✅ Manifests are in sync!"
    echo ""
    echo "   swimTO/k8s/ matches pi-fleet/clusters/eldertree/swimto/"
    echo "   Emergency deployment will match GitOps state."
    exit 0
else
    echo "⚠️  Manifests differ!"
    echo ""
    echo "$DIFF_OUTPUT"
    echo ""
    echo "❌ Files are out of sync."
    echo ""
    echo "💡 Action required:"
    echo "   1. Review the differences above"
    echo "   2. Sync the files manually"
    echo "   3. Commit changes to both locations"
    echo ""
    echo "   Example: cp k8s/api-deployment.yaml $PI_FLEET_PATH/"
    exit 1
fi



