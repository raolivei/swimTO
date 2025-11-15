# GitHub Container Registry (GHCR) Setup Guide

**Status**: ⏳ Waiting for Personal Access Token (PAT)

## What Happened

After restarting Vault pods, all secrets were wiped (dev mode stores in-memory). The GHCR token needs to be recreated.

## Quick Setup Steps

### 1️⃣ Create GitHub Personal Access Token

**Go to**: https://github.com/settings/tokens/new

**Settings**:
- **Note**: `SwimTO GHCR Push`
- **Expiration**: 90 days (or custom)
- **Scopes** (check these):
  - ✅ `write:packages`
  - ✅ `read:packages`
  - ✅ `delete:packages` (optional)

Click **Generate token** and **COPY IT IMMEDIATELY** (you won't see it again!)

### 2️⃣ Store Token in Vault

```bash
# Replace with your actual token
export GHCR_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Store in Vault
export KUBECONFIG=~/.kube/config-eldertree
VAULT_POD=$(kubectl get pods -n vault -l app.kubernetes.io/name=vault -o jsonpath='{.items[0].metadata.name}')

kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN=root && vault kv put secret/canopy/ghcr-token token='${GHCR_TOKEN}'"
```

Expected output:
```
====== Secret Path ======
secret/data/canopy/ghcr-token

======= Metadata =======
Key                Value
---                -----
created_time       2025-11-15T...
custom_metadata    <nil>
deletion_time      n/a
destroyed          false
version            1
```

### 3️⃣ Add Token to GitHub Repository Secrets

**Go to**: https://github.com/raolivei/swimTO/settings/secrets/actions

1. Click **"New repository secret"**
2. **Name**: `CR_PAT`
3. **Value**: (paste the same token)
4. Click **"Add secret"**

### 4️⃣ Verify the Setup

```bash
# Check Vault has the token
kubectl exec -n vault $VAULT_POD -- sh -c "export VAULT_ADDR=http://127.0.0.1:8200 && export VAULT_TOKEN=root && vault kv get secret/canopy/ghcr-token"

# Trigger a workflow run manually
gh workflow run build-and-push.yml --ref main
```

### 5️⃣ Watch the Build

```bash
# Watch the latest workflow run
gh run watch
```

Expected result: ✅ Images pushed to GHCR successfully!

## What's Been Done Already

✅ SwimTO secrets restored in Vault:
- `secret/swimto/postgres` - PostgreSQL password
- `secret/swimto/database` - Database URL
- `secret/swimto/redis` - Redis URL
- `secret/swimto/app` - Admin token and secret key
- `secret/swimto/api-keys` - API keys (placeholders)
- `secret/swimto/oauth` - OAuth credentials (placeholders)

✅ GitHub Actions workflow updated:
- Changed from `GITHUB_TOKEN` to `CR_PAT`
- Committed and pushed to main

✅ Docker images built locally:
- `swimto-api:latest` (533 MB)
- `swimto-web:latest` (946 MB)

## What You Need to Do

⏳ Create the GitHub Personal Access Token (Step 1)  
⏳ Store it in Vault (Step 2)  
⏳ Add it to GitHub repository secrets (Step 3)  
⏳ Test the workflow (Steps 4-5)

## Alternative: Manual Push

If you prefer to push the current images manually:

```bash
# Login to GHCR
echo $GHCR_TOKEN | docker login ghcr.io -u raolivei --password-stdin

# Tag and push
docker tag swimto-api:latest ghcr.io/raolivei/swimto-api:v2.0.1
docker tag swimto-api:latest ghcr.io/raolivei/swimto-api:main
docker tag swimto-web:latest ghcr.io/raolivei/swimto-web:v2.0.1
docker tag swimto-web:latest ghcr.io/raolivei/swimto-web:main

docker push ghcr.io/raolivei/swimto-api:v2.0.1
docker push ghcr.io/raolivei/swimto-api:main
docker push ghcr.io/raolivei/swimto-web:v2.0.1
docker push ghcr.io/raolivei/swimto-web:main
```

## Troubleshooting

### "403 Forbidden" when pushing
- ✅ Make sure the PAT has `write:packages` scope
- ✅ Verify the token is correctly stored in GitHub secrets as `CR_PAT`
- ✅ Check the token hasn't expired

### "No value found" when checking Vault
- The Vault token might be different. Get it from pod logs:
  ```bash
  kubectl logs -n vault $VAULT_POD | grep "Root Token"
  ```

### Workflow still failing
- Check workflow logs:
  ```bash
  gh run view --log-failed
  ```

---

**Next**: Once you have the PAT, follow Steps 1-5 above! 🚀

