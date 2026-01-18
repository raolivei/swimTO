#!/bin/bash
# Postgres Restore Script for swimTO
# Restores from a backup file created by backup-postgres.sh
#
# Usage:
#   ./restore-postgres.sh /path/to/backup.sql.gz
#   ./restore-postgres.sh latest                      # Restore most recent backup
#
# Environment variables:
#   POSTGRES_HOST       - Database host (default: postgres)
#   POSTGRES_PORT       - Database port (default: 5432)
#   POSTGRES_DB         - Database name (default: swimto)
#   POSTGRES_USER       - Database user (default: swimto)
#   PGPASSWORD          - Database password (required)
#   BACKUP_DIR          - Directory containing backups (default: /backups)

set -euo pipefail

# Configuration with defaults
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-swimto}"
POSTGRES_USER="${POSTGRES_USER:-swimto}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

echo "=== swimTO Database Restore ==="

# Check if password is set
if [ -z "${PGPASSWORD:-}" ]; then
    echo "ERROR: PGPASSWORD environment variable is required"
    exit 1
fi

# Determine backup file to restore
BACKUP_FILE="${1:-}"

if [ -z "${BACKUP_FILE}" ]; then
    echo "Usage: $0 <backup-file.sql.gz|latest>"
    echo ""
    echo "Available backups:"
    ls -lt "${BACKUP_DIR}"/swimto_*.sql.gz 2>/dev/null || echo "  (none found in ${BACKUP_DIR})"
    exit 1
fi

if [ "${BACKUP_FILE}" = "latest" ]; then
    BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/swimto_*.sql.gz 2>/dev/null | head -1)
    if [ -z "${BACKUP_FILE}" ]; then
        echo "ERROR: No backup files found in ${BACKUP_DIR}"
        exit 1
    fi
    echo "Using latest backup: ${BACKUP_FILE}"
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERROR: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

# Verify checksum if available
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
if [ -f "${CHECKSUM_FILE}" ]; then
    echo "Verifying backup integrity..."
    if sha256sum -c "${CHECKSUM_FILE}"; then
        echo "Checksum verified successfully"
    else
        echo "WARNING: Checksum verification failed!"
        read -p "Continue anyway? (yes/no): " CONFIRM
        if [ "${CONFIRM}" != "yes" ]; then
            echo "Restore cancelled"
            exit 1
        fi
    fi
else
    echo "WARNING: No checksum file found, skipping verification"
fi

# Confirmation prompt
echo ""
echo "WARNING: This will DROP and recreate the database '${POSTGRES_DB}'"
echo "Target: ${POSTGRES_HOST}:${POSTGRES_PORT}"
echo "Backup: ${BACKUP_FILE}"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "Restore cancelled"
    exit 1
fi

echo ""
echo "Starting restore..."

# Connect to postgres database to drop/create target database
echo "Terminating existing connections..."
psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();" \
    2>/dev/null || true

echo "Dropping database ${POSTGRES_DB} (if exists)..."
psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d postgres -c \
    "DROP DATABASE IF EXISTS ${POSTGRES_DB};"

echo "Creating database ${POSTGRES_DB}..."
psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d postgres -c \
    "CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};"

# Restore from backup
echo "Restoring data from backup..."
gunzip -c "${BACKUP_FILE}" | psql \
    -h "${POSTGRES_HOST}" \
    -p "${POSTGRES_PORT}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --set ON_ERROR_STOP=on \
    -q

echo ""
echo "Verifying restore..."
TABLE_COUNT=$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "Tables restored: ${TABLE_COUNT}"

# Show row counts for key tables
echo ""
echo "Row counts:"
psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c \
    "SELECT 'facilities' as table_name, COUNT(*) as rows FROM facilities
     UNION ALL
     SELECT 'sessions', COUNT(*) FROM sessions
     UNION ALL  
     SELECT 'users', COUNT(*) FROM users;"

echo ""
echo "=== Restore Complete ==="
