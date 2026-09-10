# swimTO — Why this exists

A community-built schedule for every drop-in swim at every City of Toronto public pool. One screen, always current, no logins, no ads, no tracking.

## What it does

- Aggregates **every** Toronto Parks & Rec drop-in swim — indoor and outdoor — into a single map and schedule.
- Refreshes daily from the [City of Toronto Open Data Portal](https://open.toronto.ca/), the same source toronto.ca itself uses, and from the City's live Parks JSON API for outdoor and special-case pools.
- Filters by swim type (lane, recreational, aquatic fitness, adult, senior), time of day, distance from you, and pool type (indoor / outdoor).
- Highlights what's **happening now** so you can see at a glance which pools to head to.

## How it stays current

Every push to `main` rebuilds the API and web images and rolls them onto the cluster automatically. A separate daily Kubernetes CronJob re-ingests the official Open Data dataset and probes the Parks JSON API for any new locations. There is no manual schedule entry.

## How to run / deploy it

- App: <https://swimto.app>
- Stack: FastAPI + React + PostgreSQL on a self-hosted Raspberry Pi K3s cluster
- See [`README.md`](README.md) for local development and deployment details.

## Principles

- **Privacy-first.** No accounts, no tracking, no analytics calls to third parties.
- **Toronto data, intact.** The schedule shown is the schedule the City publishes — no editorialising. When the City's data is wrong, swimTO is wrong; the upstream is the place to fix it.
- **Mobile-first.** The poolside use case (one hand, wet phone, 30 seconds) shapes every layout decision.
- **Self-hosted.** Cheap to run, no cloud lock-in, all data and infrastructure under one operator.

## Data attribution

Pool location and schedule data: **City of Toronto, Open Government Licence – Toronto.** swimTO redistributes this data; the City retains all rights to the underlying source.
