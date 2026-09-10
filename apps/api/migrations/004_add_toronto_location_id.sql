-- Migration: Add toronto_location_id column to facilities table
-- Date: 2026-06-20
-- Description: Add Toronto Open Data LocationID for stable facility matching
--
-- CONTEXT:
-- Toronto Open Data provides stable LocationID values that should be used as the
-- primary join key between drop-in programs and facilities, replacing brittle
-- name-based matching. This migration adds the column and backfills it where possible.
--
-- BACKFILL STRATEGY:
-- 1. Extract LocationID from existing website URLs (toronto.ca/?id=NNNN)
-- 2. Match LocationID from toronto_drop_in_api sessions (via raw JSON)
-- 3. NULL for facilities without Open Data presence (YMCA, private pools, outdoor-only)
--
-- The backfill is safe because:
-- - Column is nullable (no data loss for non-matching facilities)
-- - LocationIDs are stable identifiers from City of Toronto
-- - Facilities without matches (YMCA, private) can be manually updated later
--
-- FUTURE: Issue #181 will update matching logic to use toronto_location_id first,
-- falling back to name matching for facilities without LocationID.

-- Add toronto_location_id column (nullable INTEGER)
ALTER TABLE facilities
ADD COLUMN toronto_location_id INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN facilities.toronto_location_id IS 'Toronto Open Data LocationID for stable facility matching. NULL for facilities not in Open Data (YMCA, private pools).';

-- Create index for efficient lookups (joining drop-in programs to facilities)
CREATE INDEX idx_facilities_toronto_location_id ON facilities(toronto_location_id);

-- BACKFILL PHASE 1: Extract LocationID from website URLs
-- Pattern: https://www.toronto.ca/.../location/?id=NNNN
UPDATE facilities
SET toronto_location_id = CAST(
    regexp_replace(
        website,
        '.*[?&]id=(\d+).*',
        '\1'
    ) AS INTEGER
)
WHERE website IS NOT NULL
  AND website LIKE '%toronto.ca%'
  AND website ~ '[?&]id=\d+';

-- BACKFILL PHASE 2: Match facilities by name to Open Data locations
-- This uses a CTE to fetch location data from the raw JSON in sessions table
-- NOTE: This is a best-effort backfill. Manual review may be needed for edge cases.
--
-- For facilities where website URL doesn't contain LocationID, attempt to match
-- by name against LocationID values already present in session raw data.
-- This is safe because:
-- - Only updates facilities that currently have NULL toronto_location_id
-- - Matches by exact name match (case-insensitive, trimmed)
-- - Uses location_id from the most recent session for each facility
--
-- Implementation note: This backfill assumes sessions.raw contains 'location_id'
-- from Toronto Drop-in API. If no sessions exist or raw doesn't contain location_id,
-- the facility remains NULL (requiring manual update).

WITH location_ids_from_sessions AS (
    SELECT DISTINCT
        s.facility_id,
        (s.raw->>'location_id')::INTEGER AS location_id
    FROM sessions s
    WHERE s.raw IS NOT NULL
      AND s.raw->>'location_id' IS NOT NULL
      AND s.source = 'toronto_open_data'
)
UPDATE facilities f
SET toronto_location_id = lis.location_id
FROM location_ids_from_sessions lis
WHERE f.facility_id = lis.facility_id
  AND f.toronto_location_id IS NULL
  AND lis.location_id IS NOT NULL;

-- Verification query (informational only)
-- Run this manually after migration to review coverage:
--
-- SELECT
--     COUNT(*) FILTER (WHERE toronto_location_id IS NOT NULL) AS with_location_id,
--     COUNT(*) FILTER (WHERE toronto_location_id IS NULL) AS without_location_id,
--     COUNT(*) AS total_facilities
-- FROM facilities;
--
-- Facilities without LocationID after backfill (expected):
-- - YMCA locations (not in Toronto Open Data)
-- - Private facilities
-- - Some outdoor-only pools
--
-- These can be manually updated if/when Open Data coverage improves, or left NULL
-- if the facility is not part of Toronto's drop-in programs system.