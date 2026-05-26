-- Migration: Add is_free_entry column to facilities table
-- Date: 2026-05-26
-- Description: Add boolean field to indicate whether a pool has free entry

-- Add is_free_entry column (defaults to FALSE for paid entry)
ALTER TABLE facilities
ADD COLUMN is_free_entry BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN facilities.is_free_entry IS 'Indicates whether the facility has free entry (TRUE) or requires payment (FALSE)';

-- Create index for filtering by free entry
CREATE INDEX idx_facilities_is_free_entry ON facilities(is_free_entry);
