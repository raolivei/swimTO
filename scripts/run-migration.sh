#!/bin/bash
# Run database migration against the SwimTO PostgreSQL database
#
# Usage:
#   Local:  ./scripts/run-migration.sh apps/api/migrations/001_add_age_columns.sql
#   K8s:    kubectl exec -it -n swimto deploy/postgres -- psql -U swimto -d swimto -f /tmp/migration.sql
#
# Prerequisites:
#   - DATABASE_URL environment variable set, OR
#   - Access to the K8s cluster with swimto namespace

set -euo pipefail

MIGRATION_FILE="${1:-}"

if [ -z "$MIGRATION_FILE" ]; then
    echo "Usage: $0 <migration_file.sql>"
    echo ""
    echo "Available migrations:"
    ls -1 apps/api/migrations/*.sql 2>/dev/null || echo "  No migrations found"
    exit 1
fi

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "=== Running migration: $MIGRATION_FILE ==="

# Check if we're running locally or need to use kubectl
if [ -n "${DATABASE_URL:-}" ]; then
    echo "Using DATABASE_URL for local connection..."
    psql "$DATABASE_URL" -f "$MIGRATION_FILE"
else
    echo "No DATABASE_URL set. Attempting kubectl connection..."
    
    # Check if kubectl is available and configured
    if ! command -v kubectl &> /dev/null; then
        echo "Error: kubectl not found. Please set DATABASE_URL or install kubectl."
        exit 1
    fi
    
    # Check if we can access the swimto namespace
    if ! kubectl get namespace swimto &> /dev/null; then
        echo "Error: Cannot access swimto namespace. Check your kubeconfig."
        exit 1
    fi
    
    # Copy migration file to pod and run
    POD=$(kubectl get pods -n swimto -l app=postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ -z "$POD" ]; then
        echo "Error: No postgres pod found in swimto namespace"
        exit 1
    fi
    
    echo "Found postgres pod: $POD"
    
    # Copy migration file to pod
    kubectl cp "$MIGRATION_FILE" "swimto/$POD:/tmp/migration.sql"
    
    # Run migration
    kubectl exec -n swimto "$POD" -- psql -U postgres -d pools -f /tmp/migration.sql
    
    # Clean up
    kubectl exec -n swimto "$POD" -- rm /tmp/migration.sql
fi

echo ""
echo "=== Migration completed successfully ==="
