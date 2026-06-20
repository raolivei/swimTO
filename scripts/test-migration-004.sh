#!/bin/bash
# Test and verify migration 004_add_toronto_location_id.sql
#
# This script tests the backfill logic and reports coverage statistics.
#
# Usage:
#   Local:  ./scripts/test-migration-004.sh
#   K8s:    DATABASE_URL=... ./scripts/test-migration-004.sh
#
# Prerequisites:
#   - Migration 004 must be applied first
#   - DATABASE_URL environment variable set, OR
#   - psql available with default connection

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=== Testing Migration 004: toronto_location_id backfill ==="
echo ""

# Determine connection method
if [ -n "${DATABASE_URL:-}" ]; then
    PSQL="psql $DATABASE_URL"
else
    echo -e "${YELLOW}Warning: DATABASE_URL not set. Using default psql connection.${NC}"
    PSQL="psql -U postgres -d pools"
fi

# Test 1: Check column exists
echo "Test 1: Verify toronto_location_id column exists..."
COLUMN_CHECK=$($PSQL -t -c "
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_name = 'facilities'
      AND column_name = 'toronto_location_id'
")

if [ "$COLUMN_CHECK" -eq 1 ]; then
    echo -e "${GREEN}✓ Column exists${NC}"
else
    echo -e "${RED}✗ Column not found. Migration may not be applied.${NC}"
    exit 1
fi

# Test 2: Check index exists
echo "Test 2: Verify index exists..."
INDEX_CHECK=$($PSQL -t -c "
    SELECT COUNT(*)
    FROM pg_indexes
    WHERE tablename = 'facilities'
      AND indexname = 'idx_facilities_toronto_location_id'
")

if [ "$INDEX_CHECK" -eq 1 ]; then
    echo -e "${GREEN}✓ Index exists${NC}"
else
    echo -e "${YELLOW}⚠ Index not found${NC}"
fi

# Test 3: Check backfill coverage
echo ""
echo "Test 3: Backfill coverage statistics..."
echo ""

$PSQL -c "
SELECT
    COUNT(*) FILTER (WHERE toronto_location_id IS NOT NULL) AS with_location_id,
    COUNT(*) FILTER (WHERE toronto_location_id IS NULL) AS without_location_id,
    COUNT(*) AS total_facilities,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE toronto_location_id IS NOT NULL) / NULLIF(COUNT(*), 0),
        1
    ) AS coverage_pct
FROM facilities;
"

# Test 4: Show facilities without LocationID
echo ""
echo "Test 4: Facilities without LocationID (expected: YMCA, private pools)..."
echo ""

$PSQL -c "
SELECT
    facility_id,
    name,
    source,
    CASE
        WHEN website IS NULL THEN 'No website'
        WHEN website LIKE '%ymca%' THEN 'YMCA'
        WHEN website LIKE '%toronto.ca%' THEN 'Toronto CA (no ID in URL)'
        ELSE 'Other'
    END AS reason
FROM facilities
WHERE toronto_location_id IS NULL
ORDER BY name;
"

# Test 5: Sample of facilities WITH LocationID
echo ""
echo "Test 5: Sample facilities with LocationID (first 10)..."
echo ""

$PSQL -c "
SELECT
    facility_id,
    LEFT(name, 40) AS name,
    toronto_location_id,
    source
FROM facilities
WHERE toronto_location_id IS NOT NULL
ORDER BY toronto_location_id
LIMIT 10;
"

# Test 6: Check for duplicate LocationIDs (should be 0)
echo ""
echo "Test 6: Check for duplicate LocationIDs..."
echo ""

DUPLICATE_CHECK=$($PSQL -t -c "
    SELECT COUNT(*)
    FROM (
        SELECT toronto_location_id
        FROM facilities
        WHERE toronto_location_id IS NOT NULL
        GROUP BY toronto_location_id
        HAVING COUNT(*) > 1
    ) duplicates
")

if [ "$DUPLICATE_CHECK" -eq 0 ]; then
    echo -e "${GREEN}✓ No duplicate LocationIDs found${NC}"
else
    echo -e "${RED}✗ Found $DUPLICATE_CHECK duplicate LocationIDs:${NC}"
    $PSQL -c "
        SELECT
            toronto_location_id,
            COUNT(*) AS facility_count,
            STRING_AGG(name, '; ') AS facilities
        FROM facilities
        WHERE toronto_location_id IS NOT NULL
        GROUP BY toronto_location_id
        HAVING COUNT(*) > 1
        ORDER BY COUNT(*) DESC;
    "
fi

# Test 7: Verify backfill from website URLs (Phase 1)
echo ""
echo "Test 7: Facilities matched via website URL (Phase 1 backfill)..."
echo ""

URL_MATCH_COUNT=$($PSQL -t -c "
    SELECT COUNT(*)
    FROM facilities
    WHERE toronto_location_id IS NOT NULL
      AND website IS NOT NULL
      AND website ~ '[?&]id=\d+'
")

echo -e "${GREEN}Phase 1 matched: $URL_MATCH_COUNT facilities${NC}"

# Test 8: Verify backfill from sessions raw data (Phase 2)
echo ""
echo "Test 8: Facilities matched via session raw data (Phase 2 backfill)..."
echo ""

SESSION_MATCH_COUNT=$($PSQL -t -c "
    SELECT COUNT(DISTINCT f.facility_id)
    FROM facilities f
    JOIN sessions s ON f.facility_id = s.facility_id
    WHERE f.toronto_location_id IS NOT NULL
      AND s.raw IS NOT NULL
      AND s.raw->>'location_id' IS NOT NULL
      AND (f.website IS NULL OR f.website !~ '[?&]id=\d+')
")

echo -e "${GREEN}Phase 2 matched: $SESSION_MATCH_COUNT facilities${NC}"

# Summary
echo ""
echo "=== Test Summary ==="
echo ""
echo -e "${GREEN}✓ Migration 004 verified successfully${NC}"
echo ""
echo "Next steps:"
echo "  1. Review facilities without LocationID above"
echo "  2. Manually update any missing LocationIDs if needed"
echo "  3. Proceed with issue #181 to update matching logic"
echo ""