-- Add city field to facilities for multi-city GTA expansion.
-- All existing rows are Toronto; DEFAULT 'Toronto' backfills them atomically.
-- Phase 1 of #263 (GTA multi-city Epic).
ALTER TABLE facilities
    ADD COLUMN IF NOT EXISTS city VARCHAR(50) NOT NULL DEFAULT 'Toronto';

CREATE INDEX IF NOT EXISTS ix_facilities_city ON facilities (city);
