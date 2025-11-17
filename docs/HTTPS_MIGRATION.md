# HTTPS Migration for SwimTO v0.5.0

## 🔐 Security Fixes Summary

This update **fixes 3 critical issues** by enabling HTTPS:

1. **Google OAuth Login** ❌→✅ (OAuth requires secure context)
2. **Geolocation API** ❌→✅ (Browser requires HTTPS)
3. **Secure Communications** ✅ (All traffic now encrypted)

---

## Changes Made

### Infrastructure (`pi-fleet` repo)

**Branch**: `feature/enable-swimto-https`

#### 1. Updated Ingress Configuration
- **File**: `clusters/eldertree/swimto/ingress.yaml`
- Added TLS/HTTPS support with cert-manager
- Configured automatic HTTP to HTTPS redirect
- Uses self-signed cluster issuer: `selfsigned-cluster-issuer`
- Certificate stored in secret: `swimto-tls`

#### 2. Updated ConfigMap
- **File**: `clusters/eldertree/swimto/configmap.yaml`
- Added `GOOGLE_REDIRECT_URI: "https://swimto.eldertree.local/auth/callback"`

#### 3. Infrastructure Components (Already Enabled)
- ✅ cert-manager (TLS certificate management)
- ✅ issuers (ClusterIssuer for self-signed certificates)
- ✅ Traefik (Ingress controller with websecure entrypoint)

### Application (`swimTO` repo)

**Branch**: `feature/enable-https-and-fix-auth`

#### Updated Documentation
- **File**: `CHANGELOG.md`
- Documented HTTPS fixes and their impact on OAuth and Geolocation

---

## Deployment Steps

### 1. Merge Both Branches

```bash
# Merge pi-fleet changes
cd ~/WORKSPACE/raolivei/pi-fleet
git checkout main
git merge feature/enable-swimto-https
git push origin main

# Merge swimTO changes
cd ~/WORKSPACE/raolivei/swimTO
git checkout main
git merge feature/enable-https-and-fix-auth
git push origin main
```

### 2. Update Google OAuth Console

**CRITICAL**: Update your Google Cloud Console OAuth consent screen:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, update:
   - ❌ Remove: `http://swimto.eldertree.local/auth/callback`
   - ✅ Add: `https://swimto.eldertree.local/auth/callback`
4. Keep `http://localhost:5173/auth/callback` for local development
5. Click **Save**

### 3. Apply to Cluster

Flux CD will automatically sync the changes within 5 minutes. To force immediate sync:

```bash
# Force Flux reconciliation
flux reconcile source git flux-system
flux reconcile kustomization infrastructure
flux reconcile kustomization swimto
```

### 4. Verify Certificate

```bash
# Check certificate is issued
kubectl get certificate -n swimto

# Should show:
# NAME         READY   SECRET       AGE
# swimto-tls   True    swimto-tls   1m

# Check ingress
kubectl get ingress -n swimto

# Check TLS secret
kubectl get secret swimto-tls -n swimto
```

### 5. Test HTTPS Access

```bash
# From eldertree node
curl -k https://swimto.eldertree.local

# Or from your machine (if connected via WireGuard)
curl -k https://swimto.eldertree.local
```

**Note**: The `-k` flag ignores the self-signed certificate warning. Your browser will show a warning too - this is expected for self-signed certificates.

### 6. Accept Self-Signed Certificate in Browser

1. Navigate to: https://swimto.eldertree.local
2. Browser will show "Your connection is not private" warning
3. Click "Advanced" → "Proceed to swimto.eldertree.local (unsafe)"
4. Certificate will be remembered for this session

---

## Verification Checklist

After deployment, verify these fixes:

- [ ] HTTPS loads without redirect loops
- [ ] HTTP automatically redirects to HTTPS
- [ ] Google OAuth login works (no "unsupported URI" error)
- [ ] Geolocation "Enable Location" button works
- [ ] Map centers on user location when granted
- [ ] Schedule shows distance sorting when location active

---

## Technical Details

### Middleware Chain

**API Ingress** (`/api/*`):
1. `redirect-https` → Forces HTTPS
2. `api-path-rewrite` → Strips `/api` prefix and adds trailing slash

**Web Ingress** (`/*`):
1. `redirect-https` → Forces HTTPS

### TLS Configuration

- **Certificate Type**: Self-signed (via cert-manager)
- **Issuer**: `selfsigned-cluster-issuer` (ClusterIssuer)
- **Secret**: `swimto-tls` (auto-created by cert-manager)
- **Validity**: 90 days (auto-renewed)
- **Hosts**: `swimto.eldertree.local`

### Why Self-Signed?

For internal cluster access (`.eldertree.local`), self-signed certificates are appropriate:
- ✅ Encrypts traffic (TLS)
- ✅ Enables secure context for OAuth and Geolocation
- ✅ No external CA required (Let's Encrypt doesn't support internal domains)
- ✅ Auto-renewed by cert-manager

For **production with public domain**, you would use Let's Encrypt:
- Change issuer to `letsencrypt-prod` (ACME)
- Use public DNS domain
- Automatic browser-trusted certificates

---

## Rollback Plan

If issues occur:

```bash
# Revert pi-fleet
cd ~/WORKSPACE/raolivei/pi-fleet
git revert HEAD
git push origin main

# Flux will auto-sync back to HTTP
```

---

## Future: Production HTTPS

For public deployment with a real domain (e.g., `swimto.com`):

1. **Get a public domain**
2. **Update DNS** to point to your cluster IP
3. **Update issuer** from `selfsigned-cluster-issuer` to `letsencrypt-prod`
4. **Update ingress** host from `swimto.eldertree.local` to `swimto.com`
5. **cert-manager** will automatically get a browser-trusted certificate from Let's Encrypt

---

## References

- [cert-manager Documentation](https://cert-manager.io/docs/)
- [Google OAuth 2.0 Best Practices](https://developers.google.com/identity/protocols/oauth2)
- [Geolocation API Security](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API#security_considerations)

