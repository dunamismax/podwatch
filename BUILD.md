# podwatch — Build Tracker

**Status:** Phase 1 — Feature Expansion
**Last Updated:** 2026-03-04
**Branch:** `main`

---

## What This Repo Is

Self-hostable podcast dashboard. Track subscriptions, manage listening queues, get episode summaries. Full-stack web app with auth, podcast feed ingestion, and a clean listening-focused UI.

## Architecture Snapshot

```
podwatch/
├── app/                        # React Router v7 (framework mode)
│   ├── routes/
│   │   ├── home.tsx            # Landing page
│   │   ├── dashboard.tsx       # Main authenticated view
│   │   ├── login.tsx           # Login form
│   │   ├── register.tsx        # Registration form
│   │   ├── auth-layout.tsx     # Authenticated route wrapper
│   │   └── guest-layout.tsx    # Public route wrapper
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives (card, badge, button, input, textarea)
│   │   ├── confirm-dialog.tsx
│   │   ├── error-boundary.tsx
│   │   ├── loading-screen.tsx
│   │   └── toast.tsx
│   ├── hooks/use-auth.tsx      # Auth context hook
│   └── lib/
│       ├── api.ts              # API client
│       ├── auth-client.ts      # Better Auth client
│       ├── types.ts            # Shared types
│       └── utils.ts            # Utilities (cn, etc.)
├── backend/
│   ├── index.ts                # Hono server entry
│   ├── api.ts                  # API routes
│   ├── auth.ts                 # Better Auth config
│   ├── db.ts                   # Drizzle database connection
│   ├── env.ts                  # Zod-validated env vars
│   ├── session.ts              # Session management
│   ├── permissions.ts          # Authorization logic
│   ├── rate-limit.ts           # Rate limiting
│   ├── csrf.ts                 # CSRF protection
│   └── http.ts                 # HTTP utilities
├── db/
│   ├── migrate.ts              # Migration runner
│   ├── seed.ts                 # Seed data
│   └── schema/                 # Drizzle schema definitions
├── scripts/
│   ├── cli.ts                  # Dev CLI (doctor, etc.)
│   └── smoke.ts                # Smoke test runner
├── drizzle.config.ts           # Drizzle Kit config
└── storage/                    # Local file storage
```

**Stack:** React Router v7 + Vite, TypeScript, Tailwind v4, shadcn/ui, Hono backend, Better Auth, Drizzle ORM + Postgres, TanStack Query, Zod, Biome.

---

## Phase Plan

### Phase 0 — Foundation (Complete)

- [x] Project scaffold (Bun, React Router v7, Tailwind v4, Biome)
- [x] Auth system (Better Auth, login/register/sessions)
- [x] Database schema + Drizzle migrations
- [x] Backend API (Hono, rate limiting, CSRF, session management)
- [x] Dashboard route with authenticated layout
- [x] Dev tooling (smoke tests, doctor CLI, concurrent dev servers)

### Phase 1 — Feature Expansion (Current)

**Goal:** Turn the authenticated shell into a useful podcast dashboard with real feed data.

**Success criteria:** Add a podcast by RSS URL → episodes appear → mark as listened → queue management works.

- [ ] Podcast subscription: add/remove podcasts by RSS feed URL
- [ ] RSS feed parser: fetch and parse podcast RSS/Atom feeds, extract episodes
- [ ] Episode list: display episodes with title, date, duration, description
- [ ] Playback state: mark episodes as listened/unlistened, track progress
- [ ] Listening queue: add episodes to queue, reorder, auto-advance
- [ ] Search/filter: search subscriptions and episodes by title/description
- [ ] Feed refresh: manual + scheduled background refresh of subscribed feeds
- [ ] Podcast detail page: show info, episode list, subscription controls
- [ ] DB schema additions: podcasts, episodes, subscriptions, playback_state tables

### Phase 2 — Listening Experience

- [ ] Embedded audio player (persistent across navigation)
- [ ] Playback speed controls (0.5x – 3x)
- [ ] Skip forward/back (configurable intervals)
- [ ] Resume from last position
- [ ] Episode notes / bookmarks at timestamps
- [ ] OPML import/export for podcast subscriptions

### Phase 3 — Intelligence

- [ ] Episode summaries (LLM-generated from transcripts or show notes)
- [ ] Topic tagging / categorization
- [ ] Recommendation engine (based on listening history)
- [ ] "What did I miss" digest for podcasts with many unlistened episodes

### Phase 4 — Production

- [ ] Docker Compose for self-hosting
- [ ] Background job system for feed refreshes
- [ ] Notification on new episodes from subscribed podcasts
- [ ] Mobile-responsive polish
- [ ] Performance: pagination, lazy loading, optimistic updates

---

## Verification Snapshot

```
bun run lint      ✅  (49 files, no issues)
bun run typecheck ✅
bun run smoke     — (smoke test runner exists)
```

Last verified: 2026-03-04

---

## Agent Instructions

- **Dual server architecture:** `dev:api` (Hono backend) + `dev:web` (React Router dev server) run concurrently.
- Auth is Better Auth — not Auth.js. Check `backend/auth.ts` for config.
- Drizzle schema lives in `db/schema/`. Run `bun run db:generate` after schema changes, then `bun run db:migrate`.
- Use TanStack Query for all server-state fetching in the frontend.
- shadcn/ui components in `app/components/ui/` — add new ones via the shadcn CLI pattern.
- RSS parsing: use a well-maintained library (e.g., `rss-parser` or `fast-xml-parser`) — don't hand-roll XML parsing.
- Update this BUILD.md in the same commit as meaningful changes.
