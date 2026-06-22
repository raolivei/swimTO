# Database Migrations

This directory contains SQL migration scripts for the swimTO database schema.

## Migration Naming Convention

Migrations are numbered sequentially:
- `001_description.sql` - First migration
- `002_description.sql` - Second migration
- etc.

## How to Apply Migrations

### Manual Application (Development)

Connect to your local PostgreSQL database and run the migration:

```bash
# Using psql
psql -U postgres -d pools -f apps/api/migrations/004_add_toronto_location_id.sql

# Or using the connection from .env
export $(cat apps/api/.env | grep DATABASE_URL | xargs)
psql $DATABASE_URL -f apps/api/migrations/004_add_toronto_location_id.sql
```

### Production Deployment

Migrations are applied automatically during deployment via Kubernetes Job or manual execution.

## Current Migrations

### 001_add_age_columns.sql
- **Date**: 2026-02-01
- **Purpose**: Add `age_min` and `age_max` columns to sessions table for infant/child swim filtering
- **Changes**: 
  - Add nullable INTEGER columns
  - Create index on `age_max`

### 002_add_is_free_entry.sql
- **Date**: 2026-05-26
- **Purpose**: Track whether facilities have free entry
- **Changes**:
  - Add `is_free_entry` BOOLEAN column (defaults to FALSE)
  - Create index for filtering

### 003_add_pool_type_flags.sql
- **Date**: 2026-06-09
- **Purpose**: Support facilities with indoor pools, outdoor pools, or both
- **Changes**:
  - Add `has_indoor` and `has_outdoor` BOOLEAN columns
  - Backfill from legacy `is_indoor` flag
  - Create composite index

### 004_add_toronto_location_id.sql
- **Date**: 2026-06-20
- **Purpose**: Add Toronto Open Data LocationID for stable facility matching
- **Changes**:
  - Add nullable `toronto_location_id` INTEGER column
  - Create index for efficient lookups
  - Backfill from existing website URLs (phase 1)
  - Backfill from session raw data (phase 2)
- **Impact**: Enables stable join key for drop-in programs (replaces brittle name matching)
- **Related Issues**: #180, #181

## Verification After Migration

After applying migration 004, verify the backfill coverage:

```sql
-- Check coverage
SELECT
    COUNT(*) FILTER (WHERE toronto_location_id IS NOT NULL) AS with_location_id,
    COUNT(*) FILTER (WHERE toronto_location_id IS NULL) AS without_location_id,
    COUNT(*) AS total_facilities
FROM facilities;

-- Show facilities without LocationID (expected: YMCA, private pools)
SELECT facility_id, name, source, website
FROM facilities
WHERE toronto_location_id IS NULL
ORDER BY name;

-- Show sample of matched facilities
SELECT facility_id, name, toronto_location_id, source
FROM facilities
WHERE toronto_location_id IS NOT NULL
ORDER BY toronto_location_id
LIMIT 10;
```

Expected results:
- **With LocationID**: Toronto Parks & Recreation facilities (~50-70)
- **Without LocationID**: YMCA locations, private facilities, some outdoor-only pools

## Rollback

Migrations can be rolled back manually if needed:

```sql
-- Rollback 004_add_toronto_location_id.sql
DROP INDEX IF EXISTS idx_facilities_toronto_location_id;
ALTER TABLE facilities DROP COLUMN IF EXISTS toronto_location_id;
```

## Future Migrations

When creating a new migration:

1. **Number sequentially** - Use next available number (005, 006, etc.)
2. **Document thoroughly** - Include date, description, backfill strategy
3. **Test locally first** - Apply to dev database and verify
4. **Update this README** - Add entry to "Current Migrations" section
5. **Update models** - Keep SQLAlchemy models in sync:
   - `apps/api/app/models.py`
   - `data-pipeline/models.py`
6. **Update schemas** - Keep Pydantic schemas in sync:
   - `apps/api/app/schemas.py`

## Related Documentation

- Main docs: `/docs/ARCHITECTURE.md`
- Data pipeline: `/data-pipeline/README.md`
- API models: `/apps/api/app/models.py`