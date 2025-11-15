# Facility URL Validation

## Overview

Weekly automated validation to ensure all facility URLs in the SwimTO database are correct and accessible.

## What It Does

The validation job (`validate_facility_urls.py`) performs the following checks:

1. **URL Accessibility**: Verifies each facility URL returns HTTP 200
2. **URL Format**: Ensures URLs have valid `/location/?id=XXX` format
3. **Location ID Extraction**: Extracts and validates location IDs
4. **Cross-Reference**: Compares against Toronto Open Data (informational only)

## Validation Criteria

### ✅ PASS Criteria (must meet ALL)
- URL exists in database
- URL has valid format with location ID
- URL is accessible (HTTP 200)

### ⚠️ WARN Criteria (informational)
- Facility name differs from Toronto Open Data
- Location ID not found in Open Data CSV
- *These are common and expected due to Toronto's inconsistent naming*

### ❌ FAIL Criteria (any of these)
- No URL in database
- Invalid URL format
- URL not accessible (404, 500, timeout, etc.)

## Running Locally

### Test Current URLs

```bash
# From swimTO directory
docker-compose exec api python3 /data-pipeline/jobs/validate_facility_urls.py
```

### Exit Codes

- `0`: All validations passed
- `1`: One or more validations failed

## Automated Execution

### Kubernetes CronJob

**Location**: `pi-fleet/clusters/eldertree/swimto/facility-url-validator-cronjob.yaml`

**Schedule**: Every Monday at 2:00 AM
```
0 2 * * 1
```

### Deployment

```bash
# Deploy the CronJob
kubectl apply -f pi-fleet/clusters/eldertree/swimto/facility-url-validator-cronjob.yaml

# Check CronJob status
kubectl get cronjobs -n swimto

# View recent job runs
kubectl get jobs -n swimto -l app=swimto-facility-url-validator

# View logs from last run
kubectl logs -n swimto -l app=swimto-facility-url-validator --tail=100
```

### Manual Trigger

To run validation immediately without waiting for the schedule:

```bash
kubectl create job -n swimto \
  --from=cronjob/swimto-facility-url-validator \
  swimto-facility-url-validator-manual-$(date +%s)
```

## Monitoring

### Check Job History

```bash
# View recent jobs
kubectl get jobs -n swimto

# View logs from specific job
kubectl logs -n swimto job/swimto-facility-url-validator-<timestamp>
```

### Job Failures

If the validation job fails (exit code 1):

1. Check the logs to identify failing facilities
2. Verify the facility URLs manually in browser
3. Update incorrect URLs in database
4. Clear Redis cache
5. Rerun validation

## Expected Warnings

The following warnings are **normal** and don't indicate problems:

- **Name mismatches**: Toronto Open Data uses different naming conventions (e.g., "GREENWOOD PARK" vs "Greenwood Community Centre")
- **Missing from Open Data**: Some facilities like "Scarborough Civic Centre Aquatic Complex" (ID 1099) aren't in the Open Data CSV but have valid URLs

## Maintenance

### Updating the Script

1. Edit `data-pipeline/jobs/validate_facility_urls.py`
2. Test locally with `docker-compose exec api python3 /data-pipeline/jobs/validate_facility_urls.py`
3. Rebuild and push API Docker image
4. CronJob will use new image on next run

### Updating the Schedule

Edit the `schedule` field in `facility-url-validator-cronjob.yaml`:

```yaml
spec:
  schedule: "0 2 * * 1"  # Change this
```

Apply changes:
```bash
kubectl apply -f pi-fleet/clusters/eldertree/swimto/facility-url-validator-cronjob.yaml
```

## Data Sources

- **Our Database**: `facilities` table in SwimTO PostgreSQL database
- **Toronto Open Data**: [Parks & Recreation Facilities CSV](https://open.toronto.ca/dataset/parks-and-recreation-facilities/)

## Why This Matters

Facility URLs are **critical** for users to:
- Find facility locations and contact information
- Access official schedules and closures
- Verify pool amenities and hours

Invalid URLs create a poor user experience and reduce trust in the app.

## Related Documentation

- [Facility URL Fix Script](../data-pipeline/jobs/fix_all_facility_urls.py)
- [Google Auth Integration](GOOGLE_AUTH_INTEGRATION.md)
- [Deployment Summary](DEPLOYMENT_SUMMARY.md)

