-- Migration: Add has_indoor and has_outdoor columns to facilities table
-- Date: 2026-06-09
-- Description: Support facilities with indoor pools, outdoor pools, or both

ALTER TABLE facilities
ADD COLUMN has_indoor BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE facilities
ADD COLUMN has_outdoor BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill from legacy is_indoor flag
UPDATE facilities
SET has_indoor = is_indoor,
    has_outdoor = NOT is_indoor;

COMMENT ON COLUMN facilities.has_indoor IS 'Facility offers indoor pool swimming';
COMMENT ON COLUMN facilities.has_outdoor IS 'Facility offers outdoor pool swimming';

CREATE INDEX idx_facilities_pool_type ON facilities(has_indoor, has_outdoor);
