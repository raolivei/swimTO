# Emergency Deployment Guide

## Overview

swimTO uses **Flux-First with Emergency Override** deployment strategy. This means:

- **Normal operations**: FluxCD manages all deployments via GitOps
- **Emergency situations**: Direct kubectl deployment when Flux is unavailable

## 🚨 When to Use Emergency Deployment

Use emergency deployment **ONLY** when:

- ✅ FluxCD is completely down
- ✅ Critical production issue requires immediate fix
- ✅ Cluster-wide GitOps failure
- ✅ You need to deploy before pushing to Git (rare!)

**DO NOT USE** for:

- ❌ Normal deployments (use GitOps)
- ❌ Testing changes (commit to Git first)
- ❌ Convenience (be patient with Flux)

## 🛠️ Emergency Scripts

### 1. Deploy Directly to Cluster

```bash
./scripts/emergency-deploy.sh
```

This will:
1. Suspend Flux reconciliation
2. Apply all manifests from `k8s/` directory
3. Show deployment status

### 2. Resume Flux Control

**IMPORTANT**: Always resume Flux after emergency deployment!

```bash
./scripts/resume-flux.sh
```

This will:
1. Resume Flux reconciliation
2. Force immediate sync
3. Restore GitOps control

### 3. Validate Manifest Sync

Before emergency deployment, ensure manifests are in sync:

```bash
./scripts/validate-k8s-sync.sh
```

This compares `swimTO/k8s/` with `pi-fleet/clusters/eldertree/swimto/`

## 📋 Emergency Deployment Checklist

1. ⚠️ **Confirm it's truly an emergency**
2. 🔍 **Run validation**: `./scripts/validate-k8s-sync.sh`
3. 🚨 **Deploy**: `./scripts/emergency-deploy.sh`
4. ✅ **Verify**: Check pods and services are running
5. 📝 **Document**: Note what you deployed and why
6. ▶️ **Resume Flux**: `./scripts/resume-flux.sh`
7. 🔄 **Commit changes**: Push to Git if you made changes

## 🔄 Keeping Manifests in Sync

To avoid drift, **always maintain both locations**:

- `swimTO/k8s/` - Direct deployment manifests
- `pi-fleet/clusters/eldertree/swimto/` - Flux-managed manifests

**After any changes**:

```bash
# Copy changes to pi-fleet
cp k8s/*.yaml ../pi-fleet/clusters/eldertree/swimto/

# Validate sync
./scripts/validate-k8s-sync.sh

# Commit both locations
cd ../pi-fleet && git add . && git commit -m "Update swimto manifests"
cd ../swimTO && git add . && git commit -m "Update k8s manifests"
```

## 🔧 How It Works

### Normal Flow (Flux)
```
Git Push → FluxCD → Cluster
```

1. Commit changes to `pi-fleet` repository
2. Flux detects changes (5-10 minute interval)
3. Flux applies changes to cluster
4. Drift is automatically corrected

### Emergency Flow (Direct)
```
kubectl apply → Cluster
```

1. Suspend Flux reconciliation
2. Apply manifests directly
3. Immediate deployment (no waiting)
4. Resume Flux when stable

## 📊 Monitoring

### Check Flux Status
```bash
flux get kustomizations -A
flux logs --follow
```

### Check Deployment Status
```bash
kubectl get pods -n swimto
kubectl logs -n swimto -l app=swimto-api
kubectl logs -n swimto -l app=swimto-web
```

## ⚠️ Important Notes

1. **Flux will correct drift**: When resumed, Flux will reconcile to Git state
2. **Commit your changes**: Emergency changes not in Git will be reverted
3. **Document incidents**: Keep notes on why emergency deployment was used
4. **Validate before deploy**: Always run `validate-k8s-sync.sh` first

## 🆘 Troubleshooting

### Flux Won't Suspend
```bash
# Check if Flux is running
kubectl get pods -n flux-system

# If Flux is already down, just apply manifests
kubectl apply -f k8s/
```

### Manifests Out of Sync
```bash
# See differences
./scripts/validate-k8s-sync.sh

# Manual sync
diff -r k8s/ ../pi-fleet/clusters/eldertree/swimto/
```

### Can't Resume Flux
```bash
# Check Flux status
flux check

# Force reconcile
kubectl annotate -n flux-system kustomization/flux-system reconcile.fluxcd.io/requestedAt="$(date +%s)" --overwrite
```

## 📚 See Also

- [FluxCD Documentation](https://fluxcd.io/docs/)
- [pi-fleet README](../pi-fleet/README.md)
- [Cluster Documentation](../pi-fleet/clusters/eldertree/README.md)



