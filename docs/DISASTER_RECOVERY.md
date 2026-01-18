# Disaster Recovery Guide

This document outlines backup and recovery procedures for swimTO.

## Overview

| Component | Backup Method | Frequency | Retention | RTO | RPO |
|-----------|---------------|-----------|-----------|-----|-----|
| PostgreSQL | Automated pg_dump | Daily @ 3AM UTC | 7 days | 30 min | 24 hours |
| Redis | N/A (cache only) | N/A | N/A | 5 min | N/A |
| Application | Git + GHCR | On push | Unlimited | 10 min | Real-time |

**RTO** = Recovery Time Objective (maximum downtime)  
**RPO** = Recovery Point Objective (maximum data loss)

## Database Backups

### Automated Backups

The `postgres-backup` CronJob runs daily at 3:00 AM UTC:

```yaml
# k8s/postgres-backup-cronjob.yaml
schedule: "0 3 * * *"
```

Backups are stored in the `swimto-backups` PVC with 7-day retention.

### Manual Backup

To create an immediate backup:

```bash
# Trigger backup job manually
kubectl create job --from=cronjob/postgres-backup manual-backup-$(date +%Y%m%d) -n swimto

# Watch job progress
kubectl logs -f job/manual-backup-$(date +%Y%m%d) -n swimto

# List backups
kubectl exec -n swimto deploy/swimto-api -- ls -la /backups/
```

### List Available Backups

```bash
kubectl exec -n swimto deploy/swimto-api -- ls -lh /backups/swimto_*.sql.gz
```

### Verify Backup Integrity

```bash
kubectl exec -n swimto deploy/swimto-api -- sha256sum -c /backups/swimto_YYYYMMDD_HHMMSS.sql.gz.sha256
```

## Database Restore

### Prerequisites

1. Access to the Kubernetes cluster (`kubectl`)
2. Database credentials (from `swimto-secrets`)
3. Backup file in `/backups/` on API pod

### Restore Procedure

**WARNING: Restoring will DROP the existing database and all data!**

#### Step 1: Scale down API to prevent writes

```bash
kubectl scale deployment swimto-api --replicas=0 -n swimto
```

#### Step 2: Identify backup to restore

```bash
# List available backups
kubectl exec -n swimto deploy/postgres -- ls -lh /backups/

# Use latest backup
BACKUP_FILE="latest"

# Or specify a specific backup
BACKUP_FILE="/backups/swimto_20260118_030000.sql.gz"
```

#### Step 3: Run restore

```bash
# Interactive restore (requires confirmation)
kubectl exec -it -n swimto deploy/postgres -- /scripts/restore-postgres.sh ${BACKUP_FILE}
```

Or for automated restore (dangerous!):

```bash
# Create a restore job
kubectl run restore-db -n swimto --rm -it \
  --image=postgres:16-alpine \
  --env="PGPASSWORD=$(kubectl get secret swimto-secrets -n swimto -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d)" \
  --env="POSTGRES_HOST=postgres" \
  --env="POSTGRES_USER=swimto" \
  --env="POSTGRES_DB=swimto" \
  --command -- sh -c "
    gunzip -c /backups/swimto_latest.sql.gz | psql -h postgres -U swimto -d swimto
  "
```

#### Step 4: Verify restore

```bash
# Check table counts
kubectl exec -n swimto deploy/postgres -- psql -U swimto -d swimto -c "
SELECT 'facilities' as table_name, COUNT(*) FROM facilities
UNION ALL SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL SELECT 'users', COUNT(*) FROM users;
"
```

#### Step 5: Scale API back up

```bash
kubectl scale deployment swimto-api --replicas=1 -n swimto
```

#### Step 6: Verify application

```bash
# Check health endpoint
kubectl exec -n swimto deploy/swimto-api -- curl -s http://localhost:8000/health

# Check API logs
kubectl logs -n swimto deploy/swimto-api --tail=50
```

## Complete System Recovery

For a full system recovery (new cluster):

### 1. Deploy Infrastructure

```bash
# Apply namespace and secrets first
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml  # Or use External Secrets

# Apply storage
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-backup-cronjob.yaml  # Includes backup PVC

# Deploy PostgreSQL
kubectl apply -f k8s/postgres-deployment.yaml

# Deploy Redis
kubectl apply -f k8s/redis-deployment.yaml
```

### 2. Restore Database

```bash
# Copy backup to cluster (if restoring from external source)
kubectl cp swimto_backup.sql.gz swimto/postgres-xxx:/backups/

# Run restore
kubectl exec -it -n swimto deploy/postgres -- /scripts/restore-postgres.sh /backups/swimto_backup.sql.gz
```

### 3. Deploy Application

```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/web-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

### 4. Verify System

```bash
# Check all pods are running
kubectl get pods -n swimto

# Check ingress is configured
kubectl get ingress -n swimto

# Test endpoints
curl -s https://api.swimto.app/health
curl -s https://swimto.app/
```

## Incident Response

### Database Corruption

1. Scale down API: `kubectl scale deployment swimto-api --replicas=0 -n swimto`
2. Identify last good backup
3. Follow restore procedure above
4. Review logs for root cause
5. Scale API back up

### Pod Failure (API/Web)

1. Check pod status: `kubectl get pods -n swimto`
2. Check pod logs: `kubectl logs -n swimto deploy/swimto-api`
3. Force restart: `kubectl rollout restart deployment/swimto-api -n swimto`
4. If persistent: check events and describe pod

### Cluster-Wide Outage

1. Verify cluster health: `kubectl get nodes`
2. Check system namespaces: `kubectl get pods -n kube-system`
3. If cluster is recoverable, applications should auto-restart
4. If not recoverable, deploy to new cluster using procedures above

## Backup Verification Checklist

Run monthly:

- [ ] Verify backup CronJob is running
- [ ] Test restore to staging environment
- [ ] Verify backup size is reasonable (not empty)
- [ ] Check backup retention is working
- [ ] Document any issues and remediation

## Contacts

- **On-call**: @raolivei
- **Escalation**: N/A (solo project)
- **Infrastructure**: eldertree k3s cluster

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-18 | 1.0 | Initial document |
