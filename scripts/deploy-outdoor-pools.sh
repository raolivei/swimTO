#!/usr/bin/env bash
# Deploy Outdoor Pools feature (v0.8.3) to Eldertree swimto namespace.
# Run from a machine with KUBECONFIG=~/.kube/config-eldertree and cluster reachability.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATION="${ROOT}/apps/api/migrations/003_add_pool_type_flags.sql"

echo "=== SwimTO Outdoor Pools deploy (v0.8.3) ==="

if [[ -z "${KUBECONFIG:-}" ]]; then
  export KUBECONFIG="${HOME}/.kube/config-eldertree"
fi

echo "1. Run DB migration 003..."
"${ROOT}/scripts/run-migration.sh" "${MIGRATION}"

echo "2. Ensure migration 002 (is_free_entry) is applied..."
if ! kubectl exec -n swimto deploy/postgres -- psql -U postgres -d pools -tAc \
  "SELECT 1 FROM information_schema.columns WHERE table_name='facilities' AND column_name='is_free_entry'" | grep -q 1; then
  "${ROOT}/scripts/run-migration.sh" "${ROOT}/apps/api/migrations/002_add_is_free_entry.sql"
fi

echo "3. Reconcile Flux (swimto HelmRelease) — optional, may take several minutes..."
flux reconcile helmrelease swimto -n swimto --with-source --timeout=10m || true

echo "4. Wait for API rollout..."
kubectl rollout status deployment/swimto-api -n swimto --timeout=300s || \
  kubectl rollout status deployment/swimto-swimto-api -n swimto --timeout=300s || true

echo "5. Trigger data refresh (Ourland + pool type flags)..."
kubectl create job --from=cronjob/swimto-data-refresh "swimto-refresh-outdoor-$(date +%s)" -n swimto || \
  kubectl create job --from=cronjob/swimto-data-refresh "swimto-refresh-manual-$(date +%s)" -n swimto

echo "6. Verify API pool_type filter..."
curl -fsS "https://swimto.app/api/facilities?pool_type=outdoor&has_lane_swim=true" | head -c 200
echo ""
echo "=== Done. Open https://swimto.app/map and test All / Indoor / Outdoor filter ==="
