# Cloudflare Origin Certificate Setup for swimto.eldertree.xyz

## Overview

swimto.eldertree.xyz is now configured to use **Cloudflare Origin Certificates** instead of Let's Encrypt. This provides:

- ✅ **No port forwarding required** - Works behind NAT/firewall
- ✅ **No ACME challenges** - No need to expose ports 80/443
- ✅ **15-year validity** - Set it and forget it
- ✅ **Free** - No cost
- ✅ **Trusted by Cloudflare** - Works seamlessly with Cloudflare proxy

## What Was Changed

### Infrastructure (`pi-fleet` repository)

1. **Updated Ingress Configuration** (`clusters/eldertree/swimto/ingress.yaml`)
   - Removed Let's Encrypt cert-manager annotations
   - Changed TLS secret to `swimto-cloudflare-origin-tls`
   - Updated comments to reflect Cloudflare Origin Certificate setup

2. **Created Setup Guide** (`clusters/eldertree/swimto/CLOUDFLARE_ORIGIN_CERT_SETUP.md`)
   - Complete step-by-step instructions
   - Troubleshooting guide
   - Certificate renewal instructions

3. **Created Helper Script** (`scripts/store-cloudflare-origin-cert.sh`)
   - Automated script to store certificate in Kubernetes
   - Validates certificate format
   - Provides verification steps

### Application (`swimTO` repository)

1. **Updated CHANGELOG.md**
   - Documented switch from Let's Encrypt to Cloudflare Origin Certificates
   - Updated configuration details

2. **ConfigMaps Already Updated**
   - OAuth redirect URI: `https://swimto.eldertree.xyz/auth/callback`
   - CORS origins include new domain

## Next Steps (Required)

### 1. Generate Cloudflare Origin Certificate

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select `eldertree.xyz` domain
3. Go to **SSL/TLS** → **Origin Server**
4. Click **Create Certificate**
5. Configure:
   - **Private key type**: RSA (2048)
   - **Hostnames**: 
     - `*.eldertree.xyz` (wildcard)
     - `eldertree.xyz` (root domain)
   - **Validity**: 15 years
6. Click **Create**
7. **Copy both** the Origin Certificate and Private Key

### 2. Store Certificate in Kubernetes

Save the certificate and key to files, then run:

```bash
cd ~/WORKSPACE/raolivei/pi-fleet
./scripts/store-cloudflare-origin-cert.sh origin.pem origin.key swimto
```

Or manually:

```bash
export KUBECONFIG=~/.kube/config-eldertree

kubectl create secret tls swimto-cloudflare-origin-tls \
  --cert=origin.pem \
  --key=origin.key \
  -n swimto
```

### 3. Configure Cloudflare SSL/TLS Mode

1. In Cloudflare Dashboard → **SSL/TLS** → **Overview**
2. Set encryption mode to **Full (strict)**
3. This ensures Cloudflare validates your origin certificate

### 4. Enable Cloudflare Proxy

1. Go to **DNS** → **Records**
2. Find `swimto.eldertree.xyz` record
3. Ensure **proxy status** is **Proxied** (orange cloud icon)
4. This enables Cloudflare's automatic HTTPS

### 5. Update Google OAuth Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   - `https://swimto.eldertree.xyz/auth/callback`
4. Keep `http://localhost:5173/auth/callback` for local development
5. Click **Save**

### 6. Deploy Changes

If using FluxCD (automatic sync):

```bash
cd ~/WORKSPACE/raolivei/pi-fleet
git add clusters/eldertree/swimto/ingress.yaml
git commit -m "Configure swimto.eldertree.xyz with Cloudflare Origin Certificate"
git push origin main

# Flux will sync automatically, or force sync:
flux reconcile source git flux-system
flux reconcile kustomization swimto
```

Or apply manually:

```bash
kubectl apply -f clusters/eldertree/swimto/ingress.yaml
```

### 7. Verify Setup

```bash
# Check secret exists
kubectl get secret swimto-cloudflare-origin-tls -n swimto

# Check ingress configuration
kubectl describe ingress swimto-web-public -n swimto

# Test HTTPS endpoint
curl -v https://swimto.eldertree.xyz

# Should show valid SSL certificate and successful HTTPS connection
```

## Verification Checklist

- [ ] Cloudflare Origin Certificate generated
- [ ] Certificate stored in Kubernetes secret `swimto-cloudflare-origin-tls`
- [ ] Cloudflare SSL/TLS mode set to "Full (strict)"
- [ ] DNS record has proxy enabled (orange cloud)
- [ ] Google OAuth redirect URI updated
- [ ] Ingress deployed and using correct secret
- [ ] HTTPS endpoint accessible and working
- [ ] OAuth login works
- [ ] Geolocation services work on mobile

## Troubleshooting

See the detailed troubleshooting guide in:
`pi-fleet/clusters/eldertree/swimto/CLOUDFLARE_ORIGIN_CERT_SETUP.md`

## Benefits Over Let's Encrypt

| Feature | Let's Encrypt | Cloudflare Origin |
|---------|---------------|-------------------|
| Port forwarding | Required (80/443) | Not required |
| ACME challenges | Required | Not required |
| Certificate validity | 90 days | 15 years |
| Renewal | Automatic (every 90 days) | Manual (every 15 years) |
| Setup complexity | Medium | Low |
| Works behind NAT | No | Yes |

## References

- [Cloudflare Origin Certificates Documentation](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/)
- [Setup Guide](../pi-fleet/clusters/eldertree/swimto/CLOUDFLARE_ORIGIN_CERT_SETUP.md)
- [Helper Script](../pi-fleet/scripts/store-cloudflare-origin-cert.sh)

