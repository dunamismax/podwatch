# PodWatch

PodWatch is a full-stack scheduling workspace for small recurring groups.

A pod is a named group that meets repeatedly: a study circle, volunteer crew,
commander table, or any other recurring unit. The product stays intentionally
narrow:

- create pods
- schedule events against pods
- review a recent and upcoming event timeline

## Stack

- Runtime: Node.js
- Package manager: pnpm
- Language: TypeScript
- Frontend: Vite + React
- Routing: TanStack Router
- Server state: TanStack Query
- Forms: TanStack Form
- Validation: Zod
- UI: shadcn/ui + Radix UI
- Backend API: Hono
- Database: PostgreSQL + Prisma ORM
- Migrations: Prisma Migrate
- Auth: Better Auth
- Lint / format: Biome
- Unit tests: Vitest
- End-to-end tests: Playwright

## Quick Start

1. Install dependencies.

```bash
pnpm install
```

2. Copy the environment file and fill in secrets.

```bash
cp .env.example .env
```

3. Start PostgreSQL.

```bash
docker compose up -d postgres
```

4. Generate the Prisma client and apply the initial migration.

```bash
pnpm run db:generate
pnpm run db:migrate
```

For production-style deploys, apply checked-in migrations with:

```bash
pnpm run db:migrate:deploy
```

5. Start the frontend and backend together.

```bash
pnpm run dev
```

Open `http://127.0.0.1:3000`. The Hono API runs on `http://127.0.0.1:4000`.
The web dev server now uses `--strictPort`, so `pnpm run dev` will fail fast instead of silently shifting away from port `3000`.

## Environment

- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: secret used to sign auth cookies
- `BETTER_AUTH_URL`: public origin for Better Auth callbacks and cookies
- `CORS_ORIGIN`: allowed frontend origin for the Hono API
- `PORT`: API server port
- `VITE_API_URL`: frontend API base URL

## Commands

```bash
pnpm run dev
pnpm run build
pnpm run typecheck
pnpm run test
pnpm run test:e2e
pnpm run db:generate
pnpm run db:migrate
pnpm run db:migrate:deploy
pnpm run db:push
pnpm run db:studio
```

## Workspace Layout

```text
apps/api/             Hono API, Better Auth, Prisma schema, and migrations
apps/web/             Vite SPA, TanStack Router, Query, Form, and shadcn UI
packages/domain/      Shared Zod contracts and domain workflows
legacy/django/        Archived Django implementation from before the rewrite
```

## Notes

- The frontend is a client-side React SPA that talks to the Hono API over HTTP.
- The backend keeps Better Auth sessions and Postgres persistence separate from
  the SPA bundle.
- Event times are stored as UTC and rendered back in the browser timezone.

## License

[MIT](LICENSE)
