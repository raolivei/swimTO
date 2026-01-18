#!/bin/bash
# Postgres Backup Script for swimTO
# Creates timestamped backups and manages retention
#
# Usage: 
#   ./backup-postgres.sh              # Backup to local /backups directory
#   ./backup-postgres.sh s3           # Also upload to S3 (requires AWS CLI)
#   BACKUP_DIR=/custom/path ./backup-postgres.sh
#
# Environment variables:
#   POSTGRES_HOST       - Database host (default: postgres)
#   POSTGRES_PORT       - Database port (default: 5432)
#   POSTGRES_DB         - Database name (default: swimto)
#   POSTGRES_USER       - Database user (default: swimto)
#   PGPASSWORD          - Database password (required)
#   BACKUP_DIR          - Directory to store backups (default: /backups)
#   RETENTION_DAYS      - How many days to keep backups (default: 7)
#   S3_BUCKET           - S3 bucket for off-site backups (optional)

set -euo pipefail

# Configuration with defaults
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-swimto}"
POSTGRES_USER="${POSTGRES_USER:-swimto}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/swimto_${TIMESTAMP}.sql.gz"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "=== swimTO Database Backup ==="
echo "Timestamp: ${TIMESTAMP}"
echo "Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
echo "Database: ${POSTGRES_DB}"
echo "Backup file: ${BACKUP_FILE}"

# Check if password is set
if [ -z "${PGPASSWORD:-}" ]; then
    echo "ERROR: PGPASSWORD environment variable is required"
    exit 1
fi

# Create backup with compression
echo "Creating backup..."
pg_dump \
    -h "${POSTGRES_HOST}" \
    -p "${POSTGRES_PORT}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --format=plain \
    --no-owner \
    --no-acl \
    --verbose \
    2>&1 | gzip > "${BACKUP_FILE}"

# Verify backup was created and has content
if [ ! -s "${BACKUP_FILE}" ]; then
    echo "ERROR: Backup file is empty or was not created"
    exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Create a checksum for verification
sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"
echo "Checksum created: ${BACKUP_FILE}.sha256"

# Upload to S3 if configured
if [ "${1:-}" = "s3" ] && [ -n "${S3_BUCKET:-}" ]; then
    echo "Uploading to S3: s3://${S3_BUCKET}/swimto-backups/"
    aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/swimto-backups/"
    aws s3 cp "${BACKUP_FILE}.sha256" "s3://${S3_BUCKET}/swimto-backups/"
    echo "S3 upload complete"
fi

# Clean up old backups
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "swimto_*.sql.gz*" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true

# List current backups
echo ""
echo "Current backups in ${BACKUP_DIR}:"
ls -lh "${BACKUP_DIR}"/swimto_*.sql.gz 2>/dev/null || echo "  (none)"

echo ""
echo "=== Backup Complete ==="
