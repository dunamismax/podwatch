# PodWatch

PodWatch is now a small Django app for keeping track of pods and their scheduled events.

In this repo, a pod means a named group that meets repeatedly: a game night table, a study group, a volunteer crew, or any other small recurring unit. The app does two things only:

- record pods
- record upcoming events for those pods

The rewrite intentionally drops the previous React/Bun/auth stack. This pass establishes a literal, server-rendered baseline instead of carrying forward framework choices that were shaping the product more than the product itself.

## Product Shape

- single Django project
- server-rendered HTML templates
- standard Django forms with CSRF protection
- plain CSS
- SQLite by default for local development

No authentication, RBAC, API surface, or client-side app shell is part of the current foundation.

## Quick Start

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

Open `http://127.0.0.1:8000/`.

## Commands

```bash
python manage.py migrate
python manage.py runserver
python manage.py check
python manage.py test
python -m compileall manage.py podwatch pods
```

## Project Structure

```text
podwatch/               Django project settings and URL config
pods/                   Core app: models, forms, views, tests
pods/templates/         Server-rendered templates
pods/static/            Plain CSS
manage.py               Django entrypoint
requirements.txt        Python dependencies
```

## Scope Notes

- Pods and events are the only grounded concepts retained from the earlier codebase.
- The old TypeScript frontend, Bun backend, auth system, and Drizzle/Postgres scaffolding were removed rather than translated.
- If richer workflows return later, they should be added from this narrower base instead of resurrecting the discarded stack.

## License

[MIT](LICENSE)
