# GitHub issue (create manually if `gh` is blocked)

**Title:** Outdoor Pools: indoor/outdoor filter, map panel fix, UI tests in CI

**Labels:** enhancement, summer

## Summary

Summer feature: first-class **Indoor / Outdoor / All** pool filtering, with schema support for facilities that offer **both** pool types. Also fixes the map detail-panel bug (northern markers) and adds fast Playwright e2e to PR CI.

## Background

- Ourland Park (toronto.ca id=857) and other outdoor pools are ingested via JSON API + `get_all_swim_pools()`.
- Current `is_indoor` boolean cannot represent "both indoor and outdoor at same site".
- Map desktop panel can be hidden/clipped when selecting northern community centres.
- Playwright specs exist locally but are not run on PRs.

## Checklist

- [x] Migration `003_add_pool_type_flags.sql`: `has_indoor`, `has_outdoor` columns + backfill
- [x] API: `pool_type=all|indoor|outdoor` on `GET /facilities` (deprecate `include_outdoor`)
- [x] Data pipeline: derive/set `has_indoor`/`has_outdoor` in curated ingest
- [x] Web: 3-way segmented control on Map (All / Indoor / Outdoor), outdoor marker hint
- [x] Map fix: panel clamp + z-order + auto-pan on marker select
- [x] CI: Playwright job on PR (chromium + one mobile) + `map-panel.spec.ts` regression
- [x] CHANGELOG

## Acceptance

- User can filter map to indoor-only, outdoor-only, or all pools
- Facility with both flags appears in both indoor and outdoor filters
- Selecting a northern pool shows a fully visible schedule panel on desktop
- PR workflow fails if core Playwright tests fail

```bash
gh issue create --repo raolivei/swimTO \
  --title "Outdoor Pools: indoor/outdoor filter, map panel fix, UI tests in CI" \
  --body-file docs/ISSUE_OUTDOOR_POOLS.md
```
