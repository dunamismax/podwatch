# BUILD.md

This is the primary operational handoff document for this repository.

It is a **living document**. Every future agent or developer who changes this repo is responsible for keeping it accurate, current, and up to date. If the code, scripts, workflow, environment, or risks change, update this file in the same pass.

## Snapshot

- Repo: `podwatch`
- Reviewed on: `2026-03-18`
- Branch at review time: `main`
- Commit at review time: `5a9f7bd`
- Top-level implementation status: active TypeScript monorepo
- Archived implementation: `legacy/django/`

## Project Baseline

### What the application currently does

PodWatch is a small full-stack scheduling workspace for recurring groups ("pods").

The current TypeScript rewrite supports:

- a public landing page
- email/password sign-up and sign-in through Better Auth
- an authenticated dashboard
- creating pods
- scheduling events against pods
- showing pod counts, event counts, upcoming counts, and a recent/upcoming event timeline
- converting browser-local event times to UTC before persistence, then formatting them back into the browser timezone in the UI

### What is implemented right now

- Auth is email/password only. No OAuth providers are configured.
- The backend persists Better Auth tables plus PodWatch domain tables in PostgreSQL.
- The frontend is a client-side React SPA served by Vite.
- The backend is a Hono API with Better Auth mounted under `/api/auth/*`.
- Shared Zod contracts and business workflows live in `packages/domain/`.
- Root and API package scripts expose `db:migrate:deploy` for checked-in Prisma migrations.
- The app currently has create/list flows only. There is no edit/delete flow for pods or events.
- There is no seed script, no production deployment script, and no CI config in the repo root.

### Major components, services, modules, and entry points

#### Workspace structure

- `apps/api/`
  - Hono server, Better Auth integration, Prisma schema, Prisma migrations
- `apps/web/`
  - Vite + React SPA, TanStack Router, TanStack Query, TanStack Form, shadcn/Radix UI
- `packages/domain/`
  - shared contracts, error types, and business workflows
- `legacy/django/`
  - archived pre-rewrite Django app and stale docs; not current runtime code

#### API entry points

- `apps/api/src/index.ts`
  - process entry point; calls `startServer()`
- `apps/api/src/app.ts`
  - main Hono app; defines `/health`, `/api/auth/*`, `/api/viewer`, `/api/dashboard`, `/api/pods`, `/api/events`
- `apps/api/src/env.ts`
  - runtime env validation via Zod; this is the source of truth for required backend env vars
- `apps/api/src/lib/auth.ts`
  - Better Auth configuration
- `apps/api/src/repositories/podwatch-repository.ts`
  - Prisma-backed repository implementation used by the domain workflows
- `apps/api/prisma/schema.prisma`
  - authoritative database schema

#### Web entry points

- `apps/web/src/main.tsx`
  - SPA bootstrap
- `apps/web/src/router.tsx`
  - TanStack Router setup
- `apps/web/src/routes/index.tsx`
  - public landing page
- `apps/web/src/routes/login.tsx`
  - auth screen
- `apps/web/src/routes/app.tsx`
  - protected dashboard route
- `apps/web/src/components/auth-card.tsx`
  - sign-up/sign-in form UI
- `apps/web/src/components/dashboard-view.tsx`
  - dashboard UI, create pod form, schedule event form, timeline rendering

#### Domain entry points

- `packages/domain/src/contracts.ts`
  - shared request/response schemas and repository contract
- `packages/domain/src/workflows.ts`
  - main business logic for dashboard loading, pod creation, and event creation
- `packages/domain/src/errors.ts`
  - typed domain/infrastructure error mapping

## Verified Build And Run Workflow

### Prerequisites

- Node.js `>=20` required by `package.json`
  - verified locally with `node -v` => `v24.13.1`
- pnpm `10.32.1`
  - verified locally with `pnpm -v` => `10.32.1`
- PostgreSQL
  - expected locally at `127.0.0.1:5432` by `.env.example`, `docker-compose.yml`, and Playwright defaults
- Docker Compose
  - verified installed with `docker compose version` => `v5.0.2`
  - not verified usable in this review because the Docker daemon was not running
- Playwright browser runtime
  - effectively verified because the Playwright smoke test passed in this environment

### Environment setup

1. Create a local env file:

```bash
cp .env.example .env
```

2. Required env vars are enforced by `apps/api/src/env.ts`:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `CORS_ORIGIN`
- `PORT`
- `VITE_API_URL`

3. Current defaults in `.env.example`:

```dotenv
DATABASE_URL=postgresql://podwatch:podwatch@127.0.0.1:5432/podwatch
BETTER_AUTH_SECRET=replace-this-with-a-random-32-character-secret
BETTER_AUTH_URL=http://127.0.0.1:4000
CORS_ORIGIN=http://127.0.0.1:3000
PORT=4000
VITE_API_URL=http://127.0.0.1:4000
```

### Verified commands run successfully in this review

These were actually executed from the repo root on `2026-03-18`.

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
DATABASE_URL=postgresql://podwatch:podwatch@127.0.0.1:5432/podwatch pnpm run db:generate
BETTER_AUTH_SECRET=development-secret-value-that-is-long-enough \
BETTER_AUTH_URL=http://127.0.0.1:4310 \
CORS_ORIGIN=http://127.0.0.1:3310 \
DATABASE_URL=postgresql://podwatch:podwatch@127.0.0.1:5432/podwatch \
VITE_API_URL=http://127.0.0.1:4310 \
pnpm run test:e2e
```

Observed outcomes:

- `pnpm install --frozen-lockfile`
  - succeeded
  - emitted a pnpm warning that build scripts were ignored for some packages (`@prisma/client`, `prisma`, `esbuild`, etc.)
  - note: `prisma generate` still succeeded afterward in this environment
- `pnpm run lint`
  - passed
- `pnpm run typecheck`
  - passed for `packages/domain`, `apps/web`, and `apps/api`
- `pnpm run test`
  - passed
  - domain tests: `3`
  - web unit tests: `5`
- `pnpm run build`
  - passed
  - important: `apps/api` "build" is only `tsc --noEmit`; it validates types but does not create a deployable server artifact
  - `apps/web` produced `apps/web/dist/`
  - `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`, and `pnpm run build` were re-run after the config/docs cleanup in this pass and still passed
- `pnpm run db:generate`
  - passed
  - generated Prisma client from `apps/api/prisma/schema.prisma`
- `pnpm run test:e2e`
  - passed
  - exercised the Playwright smoke test in `apps/web/e2e/smoke.spec.ts`
  - this verified the landing page and navigation into the login flow
  - this did not verify authenticated dashboard behavior or database writes

### Verified commands that failed or were blocked in this review

These were also actually executed and should be treated as real current limitations of this environment/workflow.

```bash
docker compose up -d postgres
DATABASE_URL=postgresql://podwatch:podwatch@127.0.0.1:5432/podwatch pnpm run db:migrate
```

Observed outcomes:

- `docker compose up -d postgres`
  - failed because the Docker daemon was not running in this environment
- `pnpm run db:migrate`
  - failed because PostgreSQL was not reachable at `127.0.0.1:5432`
  - `nc -z 127.0.0.1 5432` returned non-zero during this review

### Unverified but likely commands

These exist in repo scripts/config, but were not fully verified end-to-end in this review.

```bash
cp .env.example .env
pnpm run dev
pnpm run preview
pnpm run db:migrate:deploy
pnpm run db:push
pnpm run db:studio
pnpm --filter @podwatch/api start
pnpm --filter @podwatch/web dev
```

Notes:

- `pnpm --filter @podwatch/api start` is indirectly exercised by `pnpm run test:e2e` through Playwright's `webServer` config, but I did not run it as a standalone manual server workflow.
- `pnpm run dev` and `pnpm --filter @podwatch/web dev` now use Vite's `--strictPort` behavior through `apps/web/package.json`, so port `3000` conflicts should fail fast instead of silently shifting origins; I did not re-run a manual conflict scenario after this change.
- `pnpm run preview` was not checked.
- `pnpm run db:migrate:deploy` now exists in root and API package scripts, but was not verified because no database server was available.
- `pnpm run db:push` and `pnpm run db:studio` were not checked because no database server was available.
- There is no seed command in the workspace.

## Source-Of-Truth Notes

### Authoritative files and conventions

- `package.json`
  - top-level scripts and package-manager expectations
- `pnpm-workspace.yaml`
  - workspace package boundaries
- `.env.example`
  - baseline env names and expected local defaults
- `apps/api/src/env.ts`
  - authoritative validation for required runtime env vars
- `apps/api/prisma/schema.prisma`
  - database source of truth
- `apps/api/prisma/migrations/0001_init/`
  - current checked-in migration history
- `apps/api/src/app.ts`
  - API route surface and auth enforcement
- `packages/domain/src/contracts.ts`
  - shared data contracts between API and SPA
- `packages/domain/src/workflows.ts`
  - business logic and validation behavior
- `apps/web/src/routes/`
  - actual SPA route map
- `apps/web/src/components/`
  - current product behavior in the UI layer
- `apps/web/playwright.config.ts`
  - authoritative test-run port wiring for E2E
- `biome.json`
  - lint/format source of truth
- `tsconfig.base.json` plus per-package `tsconfig.json`
  - TypeScript strictness and path alias behavior

### Generated or non-authoritative files

- `apps/web/src/routeTree.gen.ts`
  - generated by the TanStack Router plugin; do not hand-edit unless the project convention changes
- `apps/web/dist/`
  - generated build output
- `apps/web/test-results/`
  - generated Playwright output

### Conflicting, duplicated, or stale docs

- `README.md`
  - broadly accurate high-level overview of the current TypeScript stack
  - useful for onboarding, but `BUILD.md` should be treated as the primary operational handoff
- `legacy/django/BUILD.md`
  - now explicitly marked as archival-only historical reference
  - do not use it for active implementation guidance
- `legacy/django/CLAUDE.md`
  - now explicitly marked as archival-only historical reference
  - do not use it for active implementation guidance
- `legacy/django/CODE-REVIEW.md`
  - now explicitly marked as archival-only historical reference
  - do not use it for active implementation guidance
- In any conflict between current TypeScript workspace files and anything under `legacy/django/`, trust the TypeScript workspace

### Recently resolved config drift

- Active TypeScript docs and examples now standardize on `postgresql://...` DSNs.
- `apps/web/package.json` now pins local web dev to `127.0.0.1:3000` with `--strictPort`.
- Root and API scripts now expose `db:migrate:deploy` for checked-in Prisma migrations.

## Current Gaps And Known Issues

### Product/feature gaps

- No edit flow for pods
- No delete/archive flow for pods
- No edit flow for events
- No delete/cancel flow for events
- No invitation, membership, or multi-user pod collaboration model
- No seed data flow
- No admin tooling

### Build/run/deployment gaps

- `apps/api` does not produce a built server artifact; its `build` script is only type-checking
- No documented production packaging/deployment path for the API
- No CI workflow checked into the repo root

### Verification gaps

- No API integration tests against Hono routes
- No Prisma repository tests
- Playwright coverage is minimal; current smoke test only checks landing page -> login navigation
- Authenticated create-pod/create-event flows are not covered by E2E
- Database migrations were not verified in this review because PostgreSQL was unavailable

### Operational risks

- Local dev now fails fast if port `3000` is occupied rather than silently shifting origins
  - this is safer than the previous behavior, but the next agent still needs to free `3000` or deliberately reconfigure the web/API origins together before running the app
- The install step may emit ignored-build-script warnings under stricter pnpm settings; if Prisma/esbuild behavior becomes inconsistent on a fresh machine, inspect pnpm build-script approvals

## Next-Pass Priorities

### Highest impact

1. Verify and harden the database bootstrap path.
   - Bring up PostgreSQL, run `pnpm run db:migrate`, and confirm account creation plus pod/event persistence end-to-end.
   - The core product depends on this path, but it was not fully verified in this review.

2. Add meaningful authenticated integration coverage.
   - Add at least one end-to-end test for sign-up/sign-in, pod creation, event scheduling, and dashboard refresh.

3. Define the API production build/deploy story.
   - `db:migrate:deploy` is now available, but the API still has no build artifact or deployment packaging path.

### Quick wins

1. Verify `pnpm run db:migrate:deploy` against a live PostgreSQL instance.
2. Expand the Playwright suite beyond the public landing/login smoke flow.
3. Decide whether the API should emit a runtime artifact or remain a source-only TypeScript service.

### Deeper follow-up work

1. Define the API production build/deploy story.
2. Add repository/API integration tests that touch Prisma and Hono together.
3. Expand product capabilities only after the dev/bootstrap path is reliable.

## Next-Agent Checklist

Follow this in order when you first open the repo.

1. Read `BUILD.md` first, then `README.md`.
2. Ignore `legacy/django/` for active implementation work unless you explicitly need historical reference.
3. Check tool versions:

```bash
node -v
pnpm -v
docker compose version
```

4. Create local env:

```bash
cp .env.example .env
```

5. Before running the app, confirm whether ports `3000`, `4000`, and `5432` are already in use.
6. Install dependencies:

```bash
pnpm install --frozen-lockfile
```

7. Start PostgreSQL.
   - Preferred local path appears to be:

```bash
docker compose up -d postgres
```

8. Generate Prisma client and apply migrations:

```bash
pnpm run db:generate
pnpm run db:migrate
```

9. Run the baseline validation suite:

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run test:e2e
```

10. Only after the above is stable, run the dev servers:

```bash
pnpm run dev
```

11. If `pnpm run dev` fails because port `3000` is occupied, free that port or intentionally change the web origin and API `CORS_ORIGIN` together before continuing.
12. Recommended code-reading order:
    - `package.json`
    - `apps/api/src/app.ts`
    - `apps/api/prisma/schema.prisma`
    - `packages/domain/src/contracts.ts`
    - `packages/domain/src/workflows.ts`
    - `apps/web/src/routes/app.tsx`
    - `apps/web/src/components/dashboard-view.tsx`
    - `apps/web/src/components/auth-card.tsx`
13. Safest immediate next tasks:
    - verify Postgres + migration + auth + dashboard end-to-end
    - add authenticated E2E coverage
    - define the API production build/deploy path

## Appendix: Current Test Inventory

- `packages/domain/src/workflows.test.ts`
  - pod-name normalization and duplicate handling
  - timezone to UTC conversion
- `apps/web/src/lib/api.test.ts`
  - API helper parsing and error behavior
- `apps/web/src/lib/timezone.test.ts`
  - timezone formatting
- `apps/web/e2e/smoke.spec.ts`
  - public landing page -> login route smoke test
