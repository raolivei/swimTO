-- Migration: Add age_min and age_max columns to sessions table
-- Description: Adds integer columns for age filtering (infant/child swim sessions)
-- Date: 2026-02-01

-- Add age_min column (minimum age in years)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS age_min INTEGER;

-- Add age_max column (maximum age in years)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS age_max INTEGER;

-- Create index on age_max for efficient filtering
CREATE INDEX IF NOT EXISTS ix_sessions_age_max ON sessions(age_max);

-- Verify the migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sessions' 
  AND column_name IN ('age_min', 'age_max');
