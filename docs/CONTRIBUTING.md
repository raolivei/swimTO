# Contributing to SwimTO

SwimTO is public and licensed under MIT. Contributions are welcome. Municipal
location and schedule data has separate terms; preserve attribution in [COPYRIGHT](../COPYRIGHT).

## Workflow

1. Start a feature branch from current `main`. Use `feature/`, `fix/`, `docs/`, or `chore/` as appropriate.
2. Keep changes focused on the linked issue and preserve existing facility IDs.
3. Run the checks relevant to the change. Show frontend changes running locally before opening a PR; follow [local review](LOCAL_REVIEW.md).
4. Update `VERSION` and `CHANGELOG.md` for application changes. Documentation and dependency-policy-only changes do not require a new application version.
5. Open a PR targeting `main`, include the issue number and validation results, and wait for CI before merging.

Use conventional commits such as `fix(pipeline): preserve official session dates`.
Never commit credentials or actual `.env` values. Vault and External Secrets
Operator own runtime secrets. Client-side keys must be restricted to intended origins.

## Checks

Use the repository virtualenv with the relevant requirements installed:

```sh
# repository root
python -m pytest data-pipeline/tests

# apps/api
python -m pytest tests

# apps/web
npm test -- --run
npm run lint
npm run type-check
npm run build
```

For map interactions, run the existing Playwright configuration described in
[MOBILE_TESTING.md](MOBILE_TESTING.md). CI pins the browser-test job to Ubuntu
24.04 while Playwright 1.56.1 lacks Ubuntu 26.04 support. Production Python
currently uses 3.11; upgrade its base image together with compatible pinned
native dependencies and ARM64 image validation.

## Data changes

Use official municipal sources, keep dates and closures intact, and verify
sample sessions against the booking portal. Do not fabricate schedules or
coordinates. Add regression tests for parser and ingestion behavior. A source
failure must not delete a facility's valid existing schedules.

See [Toronto discovery](JSON_API_FACILITIES.md) before adding fallback facilities.
Do not infer complete city coverage from the number of catalog entries.

## Releases and infrastructure

Reuse `.github/workflows/build-and-push.yml` and the shared `github-workflows`
Docker workflow. GHCR images are selected by Flux image automation in
`pi-fleet/clusters/eldertree/swimto/`; infrastructure changes belong in pi-fleet.
Do not add another image publisher or apply live-only deployment patches.

## Reporting issues

Include the page, pool, city, date, expected behavior, and municipal source URL.
Redact tokens, email addresses, and other personal information from screenshots
and logs. Keep discussion respectful and focused on the problem.
