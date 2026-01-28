# 📣 Marketing Readiness: Pre-Launch Checklist for Organic Growth

## Overview

This issue tracks all components needed to make swimTO marketing-ready for organic growth via local community outreach, SEO, and social media. **Zero budget approach** - focusing on free channels.

## Current Status

**✅ Working:**
- Landing page with hero, features, FAQ, CTAs
- Meta tags, OpenGraph, Twitter cards configured
- PWA manifest with app shortcuts
- robots.txt and basic sitemap
- Privacy Policy & Terms of Service pages
- Live at **swimto.app**

## Critical Gaps (Must Fix Before Marketing)

### 1. 🔴 Missing Image Assets (Blocking Social Sharing)
**Priority:** Critical  
**Status:** Referenced in meta tags but files don't exist

The following images are referenced but missing from `apps/web/public/`:

- [x] **`og-image.png`** (1200x630) - Social sharing preview image
  - Referenced in `index.html` OpenGraph and Twitter meta tags
  - Referenced in `manifest.json` screenshots
  - Without this, social shares show broken/generic image
  
- [x] **`icon-192.png`** (192x192) - PWA icon
  - Referenced in `manifest.json` icons and shortcuts
  - Required for proper PWA install experience

**Current assets:** Only `swimto-logo-512.png` and `icon.svg` exist

**Files to Create:**
- `apps/web/public/og-image.png` (1200x630)
- `apps/web/public/icon-192.png` (192x192)

---

### 2. 🔴 Fake Structured Data
**Priority:** Critical  
**Status:** `index.html` contains fabricated ratings

The JSON-LD structured data includes fake reviews:

```json
"aggregateRating": {
  "ratingValue": "4.8",
  "ratingCount": "50"
}
```

This should be **removed** to avoid Google penalties for fabricated review data.

- [x] Remove `aggregateRating` from JSON-LD schema

**Files to Update:**
- `apps/web/index.html` - Remove aggregateRating block

---

### 3. 🔴 Incomplete Sitemap
**Priority:** Critical  
**Status:** Missing several public routes

Current sitemap only includes `/`, `/map`, `/privacy`, `/terms`

- [x] Add `/schedule` route
- [x] Add `/about` route  
- [x] Add `/real-time-updates` route

**Files to Update:**
- `apps/web/public/sitemap.xml`

---

## High Priority (SEO Enhancement)

### 4. 🟡 FAQ Structured Data
**Priority:** High  
**Status:** FAQ content exists but not marked up for rich snippets

The homepage has a comprehensive FAQ section that could appear in Google search as rich snippets.

- [x] Add FAQPage schema to JSON-LD structured data
- [x] Include all 6 FAQ items from Home.tsx

**Files to Update:**
- `apps/web/index.html` - Add FAQPage schema

---

## Marketing Collateral (For Distribution)

### 5. 🟡 QR Code & Flyer Materials
**Priority:** High  
**Status:** Not created

For posting at Toronto community pools and recreation centers:

- [x] Generate QR code linking to `swimto.app`
- [x] Create simple printable flyer design (8.5x11 or A4)
- [x] Include tagline: "Find Your Perfect Swim Time"
- [x] Add brief feature bullets

**Files to Create:**
- `docs/MARKETING.md` - Marketing guide with QR code and templates

---

### 6. 🟡 Social Media Copy Templates
**Priority:** High  
**Status:** Not created

Templates for organic posting:

- [x] Reddit post template (r/toronto, r/askTO) - follow self-promo rules
- [x] Facebook group post template (Toronto fitness/swimming groups)
- [x] Nextdoor post template
- [x] Brief pitch for swim clubs/masters swimming groups

**Files to Create:**
- `docs/MARKETING.md` - Include copy templates

---

## Medium Priority (Nice to Have)

### 7. 🟢 Per-Route Meta Tags
**Priority:** Medium  
**Status:** All routes use same static meta tags

Currently all pages share the same title/description. Consider adding react-helmet-async for dynamic meta tags per route.

- [ ] Evaluate if needed (static may be sufficient for now)
- [ ] If implemented, add unique titles for `/map`, `/schedule`, `/about`

---

### 8. 🟢 Social Media Images
**Priority:** Medium  
**Status:** Not created

Additional image assets for social posts:

- [ ] Square image (1080x1080) for Instagram/Facebook posts
- [ ] Story image (1080x1920) for Instagram stories

---

## Marketing Strategy Summary

### Target Channels (Zero Budget)

| Channel | Approach |
|---------|----------|
| **SEO** | Fix technical issues, target "Toronto pool schedule" keywords |
| **Local** | QR code flyers at community centers, word of mouth |
| **Reddit** | Posts in r/toronto, r/askTO (follow rules, be helpful not spammy) |
| **Facebook** | Toronto swimming/fitness groups |
| **Partnerships** | Reach out to swim clubs, masters swimming groups |

### Target Audience

- Casual swimmers looking for drop-in times
- Parents finding swim times for kids
- Fitness swimmers with regular routines
- Seniors using community pools

---

## Success Criteria

- [ ] Social shares display proper og-image preview
- [ ] PWA installs correctly with proper icons
- [ ] No Google Search Console warnings about structured data
- [ ] All public routes in sitemap
- [ ] Marketing materials ready for community distribution
- [ ] At least one Reddit/social post drafted

---

## Files Summary

| File | Action | Priority |
|------|--------|----------|
| `apps/web/public/og-image.png` | Create (1200x630) | 🔴 Critical |
| `apps/web/public/icon-192.png` | Create (192x192) | 🔴 Critical |
| `apps/web/index.html` | Remove fake ratings, add FAQ schema | 🔴 Critical |
| `apps/web/public/sitemap.xml` | Add missing routes | 🔴 Critical |
| `docs/MARKETING.md` | Create with QR code, flyer, copy templates | 🟡 High |

---

## Related Documentation

- [PROJECT_STRATEGY.md](../../PROJECT_STRATEGY.md) - Business model and go-to-market strategy
- [apps/web/src/pages/Home.tsx](../../apps/web/src/pages/Home.tsx) - Landing page content
- [apps/web/index.html](../../apps/web/index.html) - Meta tags and structured data

---

**Labels:** `marketing`, `seo`, `enhancement`

**Milestone:** Marketing Launch
