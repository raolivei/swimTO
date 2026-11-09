# Local review before a pull request

Run the changed frontend locally and review Home, Map, and Schedule before
opening a PR. The dev cluster is the subsequent deployment and integration check.

## Existing image and deployment workflow

Local preview does not publish container images. After local review and tests,
use the existing feature-branch/PR workflow and include `VERSION` and
`CHANGELOG.md` updates for application changes.

Image publishing is owned by `.github/workflows/build-and-push.yml`, which calls
`raolivei/github-workflows/.github/workflows/docker-build.yml@main` for
`swimto-api` and `swimto-web`. The shared workflow builds and publishes to GHCR
and manages the configured version tags. Extend these existing workflows when
build-time configuration is needed; do not add a parallel publishing script.

Deployment is owned by Flux in `pi-fleet/clusters/eldertree/swimto/` and
`pi-fleet/clusters/eldertree/swimto-dev/`. Image policies and
`ImageUpdateAutomation` select image tags and commit manifest updates for Flux
to reconcile. Secrets come from Vault through External Secrets Operator.
Routine releases do not use manual image imports or deployment restarts.

The existing caller builds `main` and `dev` pushes, including changes under
`data-pipeline/`. Dev image automation selects `dev-<timestamp>-<sha>` tags;
production selects semver tags in `>=0.5.0 <1.0.0`.

## Frontend and map

From `apps/web`, create a gitignored `.env.local` using `.env.example` as a template.
Set `VITE_API_URL` to the local API URL, normally `http://localhost:8000`, and set
`VITE_CARTO_API_KEY` to the project's CARTO Basemaps browser key retrieved
from Vault. Then run `npm run dev -- --host 127.0.0.1` and open
`http://127.0.0.1:5173`. Restart Vite after changing environment variables.

The map adds the key to requests for both dark and light basemaps. CARTO keys are
visible to the browser in tile requests and should be restricted to the intended
swimTO origins. Never put a Vault token or server credential in a `VITE_` variable.
Never commit actual keys or `.env.local` files.

Vault and ESO supply database, Redis, and application credentials. The existing
production web build passes the public browser basemap key using
`VITE_CARTO_API_KEY=${{ vars.CARTO_API_KEY }}` through the shared build workflow.
Keep this existing build argument and repository-variable wiring. Setting a pod
environment variable alone does not change an already built Vite bundle.

## Data and verification

Use the real local API and an isolated development database for integration
review. If a visual preview uses sample schedules, disclose that explicitly;
sample times cannot establish ingestion accuracy or city readiness.

The registry now includes Toronto, Mississauga, Brampton, Vaughan, Richmond Hill,
and Markham. PerfectMind uses the public form token and real date-range filter
(`ValueKind=6`); `dateString` alone is ignored by the portal. Follow returned
occurrence dates rather than inventing weekly recurrences. Mississauga uses
the actual `rest/onlinecalendar` endpoints and swimming/water-exercise categories.
Richmond Hill reads its seasonal timetable, limits output to its stated validity,
and excludes published full-day, partial-day, and maintenance closures.

Live review on 2026-10-30 verified 45 pools outside Toronto: 10 in Mississauga,
11 in Brampton, 10 in Vaughan, 6 in Richmond Hill, and 8 in Markham. Coordinates
come from booking records, official municipal map links, or OSM geocoding of
official addresses (`sources/municipal_coordinates.json` records attribution).
Toronto now resolves all 51 swimming locations in the current Open Data feed,
bringing the local preview to 96 pools with upcoming schedules. Existing public
pool IDs are preserved; new Toronto pools use `toronto-{official_location_id}`.
New entries require a pool amenity and live `locations/{id}/info.json` metadata
with matching identity and valid regional coordinates. Municipal links and
explicit parent/child venue relationships handle known catalog name differences;
matching never falls back to shared first words or an estimated location.
This is verified coverage, not a guarantee that every GTA pool is included.

Upcoming availability uses America/Toronto wall-clock time. Ended swims no
longer appear as the next session; swims still in progress remain visible.

The October isolated preview used Vite on 127.0.0.1:5173 and the real FastAPI
application on 127.0.0.1:8012 with an isolated SQLite database in /private/tmp.
It contained municipal schedules, not generated example times. Temporary preview
files may be removed between sessions. Docker/PostgreSQL
remains the documented normal local setup; this preview does not change deployment.

Useful checks:

```sh
# Repository root, with the pipeline virtualenv active
PYTHONDONTWRITEBYTECODE=1 python -m pytest data-pipeline/tests -p no:cacheprovider

# apps/api, with Python 3.11+ and requirements-dev.txt installed
python -m pytest tests

# apps/web
npm test -- --run
npm run lint
npm run build
```

Review the map with location denied or unavailable as well as with location
enabled. The first view should fit all available pools; changing city fits that
city, while other filters preserve the user's viewport. Check city and pool-type filters, pool detail
panels, schedule navigation, and narrow layouts.
