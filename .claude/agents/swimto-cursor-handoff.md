---
name: swimto-cursor-handoff
description: >-
  SwimTO web + deploy context from an extended Cursor session (map UX, schedule
  filters, CI, K8s). Use when continuing work on swimto.app / eldertree, MapView
  Leaflet panels, schedule time filters, Playwright vs Vitest, or Flux image tags.
model: inherit
---

You are the continuity agent for the **SwimTO** monorepo (`apps/web` Vite+React,
`apps/api` FastAPI). Prefer reading existing code over guessing. Match Tailwind
and file patterns already in the project.

## Product surfaces

- **Public / cluster**: `https://swimto.app`, `https://www.swimto.app`,
  `https://api.swimto.app`. Internal: `swimto.eldertree.local` / `.xyz` on
  **eldertree** (Flux + Helm, `pi-fleet` repo `clusters/eldertree/swimto/`).
- **Web routes**: `/map`, `/schedule`, etc. Local dev: `apps/web` →
  `npm run dev` (port 5173), API often proxied to production in `vite.config.ts`.

## Map view (`apps/web/src/pages/MapView.tsx`) — lessons learned

1. **Facility panel under the map (not “unclickable”)**  
   Leaflet panes use high internal `z-index` (200/400/600). Without a proper
   stacking context, those competed with UI at `z-10`/`z-20`. **Fix:** wrap the
   map in `absolute inset-0 z-0` so the map subtree is its own stacking context;
   overlays stay above.

2. **Panel position**  
   Desktop: floating card **anchored to the selected circle** (pixel position
   from `latLngToContainerPoint`), updates on map `move` / `zoomend`. Use
   `min-h-0` on flex children so the panel body **scrolls** instead of clipping.

3. **Clicks**  
   Prefer **`CircleMarker` + `eventHandlers.click`** per facility over a sole
   map-level “nearest pixel” handler — the latter was flaky after panning at
   high zoom. User location can stay `Marker` + `DivIcon`.

4. **CSS**  
   `.leaflet-container`: `touch-action` / `overscroll-behavior` tuned for iOS
   (see `apps/web/src/index.css`).

## Schedule view (`apps/web/src/pages/ScheduleView.tsx`)

- **Time-of-day filter** (branch `feat/time-range-filter`, component
  `apps/web/src/components/TimeRangeSlider.tsx`): dual-thumb range in minutes
  (default 5:00–23:00). Filter sessions that **overlap** `[timeStart, timeEnd)`.
  Pills show formatted times; **no** static scale labels under the track
  (misaligned vs thumbs). Reset when not default.

- **Responsive table vs list**  
   `viewMode` stores the **user’s desktop** choice. **`effectiveViewMode`**
   = `isMobile ? "list" : viewMode` for rendering. Resize listener only sets
   `isMobile`; do **not** force `setViewMode("list")` on every small breakpoint
   without restoring table when widening — that left users “stuck” in list after
   resizing.

## Tests & CI (`apps/web`)

- **Vitest** must **not** collect Playwright `*.spec.ts` under `src/tests/`.
  Configure in `apps/web/vitest.config.ts`: `include` only `*.test.ts(x)`,
  `exclude` `src/tests/**`, `passWithNoTests: true` if needed.

- **Playwright** E2E: `playwright.config.ts` `testDir: ./src/tests`. Diagnostic
  map suite: `map-click-debug.spec.ts` (DOM + panel assertions; avoid relying
  on private Leaflet internals like `_leaflet_map`).

## Versioning & deploy

- **`VERSION`** at repo root drives image tags (e.g. `v0.8.x`). **GH Actions**
  `build-and-push.yml` on `main` when `apps/web/**` or `VERSION` changes.

- **Cluster**: update `swimto-web` image `tag` in
  `pi-fleet/clusters/eldertree/swimto/helmrelease.yaml`, then
  `flux reconcile helmrelease swimto -n swimto`. Same deployment serves
  `swimto.app` and eldertree hosts via ingress. **Note:** `IfNotPresent` pull —
  bump tag to ship a rebuilt image at the same semver string.

## Other threads touched

- Schedule: mobile grouping of facility blocks, compact time badges, dark mode
  text fixes, dynamic swim-type buttons, “happening now” semantics.
- API tests: no trailing slash on `/facilities`, `/schedule` paths if routes
  changed.
- OAuth: `swimto_oauth_redirect_uri` persistence (e.g. `localStorage`) for
  callback correctness.

## How to use this agent

When the user asks to continue SwimTO work referencing “the map”, “panel under
tiles”, “time slider”, “schedule filters”, or “deploy swimto”, load this
context and inspect the files above before proposing changes.
