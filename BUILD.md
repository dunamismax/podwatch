# podwatch — Build Tracker

**Status:** Baseline Reset
**Last Updated:** 2026-03-07
**Branch:** `main`

## Literal Product Definition

PodWatch is a small scheduling app for pods and their events.

A pod is a named group that meets repeatedly. Examples: a game table, a study group, a volunteer team, a neighborhood crew. The app is intentionally limited to:

- creating pods
- listing pods
- scheduling events for those pods
- viewing recent and upcoming events

Anything beyond that is out of scope unless it is directly required by those workflows.

## Architecture Snapshot

```text
podwatch/
├── manage.py
├── podwatch/
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── pods/
│   ├── forms.py
│   ├── models.py
│   ├── tests.py
│   ├── urls.py
│   ├── views.py
│   ├── migrations/
│   ├── static/pods/site.css
│   └── templates/
└── requirements.txt
```

**Stack:** Python, Django, SQLite, server-rendered HTML, plain CSS.

## What Was Removed On Purpose

- React Router app shell
- Bun API server
- Better Auth integration
- role and permission scaffolding
- Drizzle/Postgres migration layer
- TypeScript build, lint, and smoke tooling

Those pieces were not carried forward because they were broader than the product that was actually present in the repo.

## Current Foundation

### Complete

- [x] Django project bootstrap
- [x] Pod and event models
- [x] Standard Django forms for creating pods and events
- [x] Single dashboard page rendered on the server
- [x] Plain CSS styling
- [x] Django tests for the main flows

### Intentionally Deferred

- [ ] authentication
- [ ] pod membership
- [ ] permissions
- [ ] API endpoints
- [ ] background jobs
- [ ] import/export

## Verification Target

When dependencies are installed, the expected baseline checks are:

```bash
python manage.py check
python manage.py test
python -m compileall manage.py podwatch pods
```

## Working Rules For Future Changes

- Keep the product literal: pods and events first.
- Prefer server-rendered views over front-end framework reintroduction.
- Add new concepts only when they are required by real pod scheduling workflows.
- Update this file when the product boundary changes, not when tooling fashion changes.
