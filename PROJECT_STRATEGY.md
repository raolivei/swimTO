# swimTO — Why this exists

A shared map and schedule for municipal drop-in swimming across Toronto,
Mississauga, Brampton, Vaughan, Richmond Hill and Markham.

## What it does

- Combines official municipal calendars and seasonal timetables.
- Filters by city, swim type, pool type, date and distance.
- Shows upcoming sessions and links to municipal booking information.
- Allows browsing without an account; optional Google sign-in syncs favorites.

## How it stays current

The existing GitHub Actions workflow publishes images to GHCR. Flux image
automation in pi-fleet selects and deploys them. A separate daily CronJob
refreshes municipal data. Source failures retain previous valid schedules;
check the municipality's portal for last-minute changes or closures.

Coverage is verified for these six cities, not every GTA pool. See
[local review and coverage](docs/LOCAL_REVIEW.md). The next data-maintenance
step is the reviewed facility registry tracked in issue #182.

## Principles

- Public MIT-licensed software, useful for other municipalities to adapt.
- Official source dates and locations, without fabricated availability.
- Mobile access shaped around finding a nearby swim quickly.
- Self-hosted infrastructure and aggregate operational metrics, with no
  third-party analytics tracker. See [the metrics definition](docs/REPOSITORY_AUDIT.md).

## Data attribution

The software's MIT License does not relicense municipal source data.
See [COPYRIGHT](COPYRIGHT) for Toronto's Open Government Licence and other
municipal source terms.
