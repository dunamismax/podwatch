# PodWatch

PodWatch is a Bun-powered scheduling workspace for small recurring groups.

A pod is a named group that meets repeatedly: a study circle, volunteer crew, commander table, or any other recurring unit. The rewritten app keeps the product narrow:

- create pods
- schedule events against pods
- review a recent and upcoming event timeline

## Stack

- Runtime: Bun
- Package manager / monorepo: Bun workspaces
- Frontend / app framework: TanStack Start, Router, and Query
- Language: TypeScript
- Domain / validation: Zod
- Database: PostgreSQL + Drizzle ORM
- Auth: Better Auth
- Observability: OpenTelemetry
- Lint / format: Biome
- Tests: Vitest

## Quick Start

1. Install dependencies.

```bash
bun install
```

2. Copy the environment file and fill in secrets.

```bash
cp .env.example .env
```

3. Start PostgreSQL.

```bash
docker compose up -d postgres
```

4. Push the Drizzle schema.

```bash
bun run db:push
```

5. Start the app.

```bash
bun run dev
```

Open `http://127.0.0.1:3000`.

## Environment

- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: secret used to sign auth cookies
- `BETTER_AUTH_URL`: public origin for Better Auth callbacks and cookies
- `OTEL_SERVICE_NAME`: service name for traces
- `OTEL_EXPORTER_OTLP_ENDPOINT`: optional OTLP HTTP exporter endpoint

## Commands

```bash
bun run dev
bun run build
bun run typecheck
bun run test
bun run db:generate
bun run db:push
bun run db:studio
```

## Workspace Layout

```text
apps/web/              TanStack Start app, routes, and auth UI
packages/db/           Drizzle schema, PostgreSQL client, repository layer
packages/domain/       Zod contracts and async domain workflows
packages/observability/OpenTelemetry bootstrap helpers
legacy/django/         Archived Django implementation from before the rewrite
```

## Notes

- The active application is the TypeScript workspace in `apps/web`.
- The archived Django app remains in `legacy/django` for reference only.
- The dashboard stores event times as UTC and renders them in the browser timezone.

## License

[MIT](LICENSE)
