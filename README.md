# PodDashboard

PodDashboard is a Bun-first TypeScript app for pod management and upcoming event visibility.

## Stack

- Bun runtime/package manager
- Vite + React Router (framework mode, SPA-first)
- React 19.2 + TypeScript
- Tailwind CSS + shadcn/ui-style components
- Postgres + Drizzle ORM + drizzle-kit
- Auth.js (credentials) + Zod validation
- Biome for lint/format

## Setup

```bash
cp .env.example .env
bun install
bun run db:migrate
bun run db:seed
```

## Run

```bash
bun run dev
```

- Frontend: `http://localhost:5173`
- API/Auth: `http://localhost:3001`

## Quality Gates

```bash
bun run lint
bun run typecheck
bun run scry:doctor
```

## API

Authenticated routes require a valid Auth.js session and permission grants.

- `GET /api/pods`
- `POST /api/pods`
- `GET /api/events`
- `POST /api/register`
- `ALL /api/auth/*` (Auth.js)

## Seeded User

`bun run db:seed` creates:

- email: `test@example.com`
- password: `password`
- role: `admin`
