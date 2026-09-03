-- Add city field to facilities for multi-city GTA expansion.
-- All existing rows are Toronto; DEFAULT 'Toronto' backfills them atomically.
-- Phase 1 of #263 (GTA multi-city Epic).
ALTER TABLE facilities
    ADD COLUMN IF NOT EXISTS city VARCHAR(50) NOT NULL DEFAULT 'Toronto';

-- Ensure the column-level default is set even when ADD COLUMN was a no-op
-- (e.g. cluster rebuilt from a backup that already had the column but lost
-- the DEFAULT).  This is idempotent and safe to re-run.
ALTER TABLE facilities ALTER COLUMN city SET DEFAULT 'Toronto';

CREATE INDEX IF NOT EXISTS ix_facilities_city ON facilities (city);
