# Code Review — PodWatch

**Date:** 2026-03-03
**Scope:** Full codebase (~1 840 lines across 30 source files)
**Toolchain results:** Lint clean (46 files), typecheck clean, build successful (SPA mode)

---

## 1. Architecture

**Stack:** React 19 + React Router 7 (SPA) / Bun HTTP server / PostgreSQL + Drizzle ORM / Better Auth / Tailwind CSS 4 / Zod 4

The high-level split is solid: `app/` for the React SPA, `backend/` for the API server, `db/` for schema and migrations, `scripts/` for tooling. Each module is small and focused.

### Strengths

- Clean separation between frontend and backend with no shared runtime dependencies.
- Drizzle schema is well-indexed and properly normalized, with cascade deletes and composite primary keys where appropriate.
- RBAC system (`roles` / `permissions` / `rolePermissions` / `userRoles`) is a real permission model, not just a boolean `isAdmin` flag.
- Zod validation on both env parsing and request bodies.
- Route guards (`AuthLayout`, `GuestLayout`) keep auth redirection logic out of individual pages.
- Build output is lean — client JS totals ~410 KB (~135 KB gzipped) with good code-splitting per route.

### Issues

| Severity | Issue | Location | Status |
|----------|-------|----------|--------|
| ~~Medium~~ | ~~React Query is initialized in `root.tsx` but never used.~~ Dashboard now uses `useQuery`/`useMutation` for data fetching with caching, deduplication, and targeted invalidation. | `app/routes/dashboard.tsx` | **RESOLVED** |
| ~~Medium~~ | ~~No CORS headers on business API routes.~~ Global CORS middleware added to all routes with origin allowlist. | `backend/index.ts` | **RESOLVED** |
| ~~Medium~~ | ~~README API table is stale.~~ Updated to match actual Better Auth routes. | `README.md` | **RESOLVED** |
| ~~Low~~ | ~~No global error handler in `Bun.serve`.~~ Try/catch wraps all request handling with structured 500 responses and logging. | `backend/index.ts` | **RESOLVED** |

---

## 2. TypeScript & Type Safety

### Strengths

- `strict: true` in tsconfig — the strongest baseline.
- Drizzle schema types flow correctly into query results.
- Zod schemas for request validation produce typed outputs.
- `as const` used for auth status strings in `useAuth`.

### Issues

| Severity | Issue | Location | Status |
|----------|-------|----------|--------|
| ~~Medium~~ | ~~`SessionUser` is defined twice with conflicting types.~~ Frontend `SessionUser` centralized in `app/lib/types.ts`. Backend keeps `id: number` for DB queries (intentional coercion). | `app/lib/types.ts`, `backend/session.ts` | **RESOLVED** |
| **Low** | `apiFetch` return type is `Promise<T>` with no runtime check that the response actually matches `T`. The cast is fine for now but fragile if the API shape changes. | `app/lib/api.ts:6` | Open |
| ~~Low~~ | ~~`Pod`, `EventRecord`, and `DashboardData` types are defined locally in `dashboard.tsx`.~~ Extracted to `app/lib/types.ts`. | `app/lib/types.ts` | **RESOLVED** |
| **Low** | `colorClasses` in Button and Badge accepts `string` instead of the union type, losing type narrowing. | `app/components/ui/button.tsx:16`, `app/components/ui/badge.tsx:10` | Open |

---

## 3. React Patterns

### Strengths

- Functional components throughout, no class components.
- `forwardRef` on `Input` and `Textarea` for proper form library integration.
- `displayName` set on forwarded-ref components.
- React Query `useQuery`/`useMutation` for data fetching with targeted cache invalidation.
- Layout/outlet pattern for auth guards is clean and idiomatic RR7.

### Issues

| Severity | Issue | Location | Status |
|----------|-------|----------|--------|
| ~~High~~ | ~~No error boundaries.~~ `ErrorBoundary` component wraps the app in `root.tsx` with dev-mode error details and reload action. | `app/components/error-boundary.tsx`, `app/root.tsx` | **RESOLVED** |
| ~~Medium~~ | ~~Dashboard does full refetch of both pods and events after creating a single pod.~~ Now uses React Query `useMutation` with targeted `invalidateQueries({ queryKey: ['pods'] })`. | `app/routes/dashboard.tsx` | **RESOLVED** |
| ~~Low~~ | ~~Auth guard layouts return `null` during loading.~~ Now show a centered loading spinner with `aria-live="polite"`. | `app/routes/home.tsx`, `app/routes/guest-layout.tsx`, `app/routes/auth-layout.tsx` | **RESOLVED** |
| **Low** | `QueryClient` is created at module scope outside the component tree. This is fine for SPA but would break with SSR if the config ever changes. | `app/root.tsx:5` | Open |

---

## 4. Backend & API Design

### Strengths

- `requirePermission` helper centralizes auth + permission check with proper 401/403 distinction.
- Pod creation uses a transaction to atomically insert the pod and its membership row.
- Zod validation returns the first issue message as a user-facing error string.
- Event query scopes to user's pods via `innerJoin` on `podMembers` — no data leakage.
- `parseJson` handles malformed JSON gracefully with a 400.

### Issues

| Severity | Issue | Location | Status |
|----------|-------|----------|--------|
| ~~High~~ | ~~No rate limiting on any endpoint.~~ In-memory sliding window rate limiter added to auth endpoints (30 req/15min per IP). | `backend/rate-limit.ts`, `backend/index.ts` | **RESOLVED** |
| ~~Medium~~ | ~~`userHasPermission` runs 2 sequential queries.~~ Rewritten as a single 3-table JOIN query. | `backend/permissions.ts` | **RESOLVED** |
| ~~Medium~~ | ~~`ensureAccessControlBootstrap` uses sequential `await` in `for` loops.~~ Batched with `Promise.all`. | `backend/permissions.ts` | **RESOLVED** |
| ~~Medium~~ | ~~No pagination on `GET /api/pods`.~~ Added `?limit=` and `?offset=` query params (default 50, max 100). | `backend/api.ts` | **RESOLVED** |
| **Low** | Event query includes past events (last 24 hours) but the dashboard labels the section "Upcoming events" — semantically misleading. | `backend/api.ts:145`, `app/routes/dashboard.tsx` | Open |
| ~~Low~~ | ~~No request logging.~~ All requests now logged with method, path, status, and duration. | `backend/index.ts` | **RESOLVED** |

---

## 5. Security

### Strengths

- Password hashing via bcryptjs with 12 salt rounds.
- Session cookies managed by Better Auth with cookie caching.
- RBAC checked on every business endpoint.
- SQL injection prevented by Drizzle ORM parameterized queries.
- No secrets in source — env vars validated through Zod.

### Issues

| Severity | Issue | Location | Status |
|----------|-------|----------|--------|
| ~~High~~ | ~~Login page unconditionally displays seeded credentials.~~ Gated behind `import.meta.env.DEV` — hidden in production builds. | `app/routes/login.tsx` | **RESOLVED** |
| ~~Medium~~ | ~~`AUTH_SECRET` defaults to `'dev-secret-change-me'`.~~ Startup now throws if `NODE_ENV=production` and secret is the default. | `backend/env.ts` | **RESOLVED** |
| **Medium** | No CSRF token verification on the custom API routes. Better Auth handles its own routes, but `POST /api/pods` relies solely on cookie-based auth with no additional CSRF protection. | `backend/api.ts:64` | Open |
| ~~Low~~ | ~~Password placeholder on the login form is the literal string `"password"`.~~ Changed to `"••••••••"`. | `app/routes/login.tsx` | **RESOLVED** |

---

## 6. UI / UX

### Strengths

- Cohesive dark theme with custom CSS properties and gradient backgrounds.
- Responsive layout with sensible breakpoints (sm, lg, xl).
- Consistent component design language across Card, Button, Badge, Input, Textarea.
- Good empty states with personality ("the dashboard stops feeling like an abandoned bridge").
- Proper loading and disabled states on buttons.

### Issues

| Severity | Issue | Location | Status |
|----------|-------|----------|--------|
| ~~Medium~~ | ~~No feedback during loading state for auth guard routes.~~ Loading spinner component added to all guard layouts. | `app/components/loading-screen.tsx` | **RESOLVED** |
| **Low** | No real-time validation on forms. Password mismatch on register is only caught on submit. Email format, password length requirements, and name presence give no inline feedback. | `app/routes/register.tsx:21-24`, `app/routes/login.tsx` | Open |
| **Low** | No toast/notification system. Success of pod creation is only visible by the pod appearing in the list. An explicit success confirmation would improve UX. | `app/routes/dashboard.tsx` | Open |
| **Low** | No confirmation dialog for sign-out. One click and the user is logged out. | `app/routes/dashboard.tsx` | Open |
| ~~Low~~ | ~~`session?.email` rendered in the header has no fallback if null.~~ Now falls back to `'Unknown'`. | `app/routes/dashboard.tsx` | **RESOLVED** |

---

## 7. Accessibility

### Strengths

- `lang="en"` on `<html>`.
- Proper `<label htmlFor>` on all form inputs.
- Semantic HTML: `<main>`, `<header>`, `<form>`, `<ul>`/`<li>`.
- `aria-hidden="true"` on the spinner SVG in Button.
- Focus-visible styling on inputs via ring/border transitions.

### Issues

| Severity | Issue | Location | Status |
|----------|-------|----------|--------|
| ~~Medium~~ | ~~No skip-to-content link.~~ Added to root layout with `sr-only` + focus styling. | `app/root.tsx` | **RESOLVED** |
| ~~Medium~~ | ~~Error messages not announced to screen readers.~~ `role="alert"` added to all error containers. `aria-live="polite"` added to loading states. | `app/routes/dashboard.tsx`, `app/routes/login.tsx`, `app/routes/register.tsx` | **RESOLVED** |
| ~~Low~~ | ~~Loading text not announced.~~ `aria-live="polite"` added to loading containers. | `app/routes/dashboard.tsx` | **RESOLVED** |
| **Low** | The "Signed in as" box and sign-out button lack landmark designation. Consider `<nav>` or `aria-label` for the user controls region. | `app/routes/dashboard.tsx` | Open |
| **Low** | Color contrast not verified. The dark theme uses `text-slate-300` on dark backgrounds and `text-amber-200/80` labels — worth running through WCAG AA checker. | Various | Open |

---

## 8. Performance

### Strengths

- Vite `optimizeDeps.include` pre-bundles heavy dependencies.
- React Router automatic code-splitting per route.
- Database indexes on all foreign keys and query-path columns.
- Event query limited to 20 rows.
- React Query provides caching, deduplication, and background refetch.

### Issues

| Severity | Issue | Location | Status |
|----------|-------|----------|--------|
| ~~Medium~~ | ~~Permission check is 2 sequential DB queries.~~ Rewritten as single JOIN. | `backend/permissions.ts` | **RESOLVED** |
| ~~Medium~~ | ~~After pod creation, `fetchData()` re-fetches both pods and events.~~ React Query `useMutation` only invalidates `['pods']` query key. | `app/routes/dashboard.tsx` | **RESOLVED** |
| ~~Low~~ | ~~No pagination on pods.~~ Added `limit`/`offset` params. | `backend/api.ts` | **RESOLVED** |
| ~~Low~~ | ~~Bootstrap runs sequential inserts in a loop.~~ Batched with `Promise.all`. | `backend/permissions.ts` | **RESOLVED** |

---

## 9. Dead Code & Tech Debt

| Severity | Item | Location | Status |
|----------|------|----------|--------|
| ~~Medium~~ | ~~`parseCookies()` and `serializeCookie()` dead code.~~ Removed along with `CookieOptions` type. | `backend/http.ts` | **RESOLVED** |
| ~~Medium~~ | ~~`@tanstack/react-query` configured but unused.~~ Dashboard now uses `useQuery`/`useMutation`. | `app/routes/dashboard.tsx` | **RESOLVED** |
| ~~Low~~ | ~~`CookieOptions` type only used by dead code.~~ Removed. | `backend/http.ts` | **RESOLVED** |
| **Low** | `backend/db.ts` exports `pool` — only consumed by `db/seed.ts` for cleanup. Consider exporting a `close()` function instead of the raw pool. | `backend/db.ts` | Open |
| **Low** | Button `colorClasses` has an implicit fallback — `warning + soft` is unhandled and silently returns the same as `warning + default`. Badge has the same pattern for unhandled combos like `info + outline`. | `app/components/ui/button.tsx:16-27`, `app/components/ui/badge.tsx:10-24` | Open |
| **Low** | Smoke tests (`scripts/smoke.ts`) duplicate cookie utilities. Since the backend utilities are now removed, this is a non-issue. | `scripts/smoke.ts` | N/A |
| ~~Info~~ | ~~README lists "Dark/light UI" as a feature.~~ Corrected to "Dark UI". | `README.md` | **RESOLVED** |

---

## 10. Testing

- **Smoke tests** (`scripts/smoke.ts`): Good coverage of the happy path — anonymous session, login, session persistence, dashboard render, pod CRUD, registration flow. Uses a proper cookie jar.
- **No unit tests.** No component tests. No integration tests beyond smoke.
- **No CI pipeline.** Lint/typecheck/build are manual.

### Recommended additions (by priority)

1. Unit tests for `userHasPermission` and `requirePermission` — these are the security boundary.
2. API endpoint tests covering error paths (bad JSON, missing fields, unauthorized, forbidden).
3. Component tests for form validation behavior (login, register, pod creation).
4. CI workflow running `bun run lint && bun run typecheck && bun run build`.

---

## 11. Prioritized Improvements

### P0 — Fix before production

1. ~~**Gate seeded credentials display** on dev mode or remove entirely (`login.tsx:88-92`).~~ **RESOLVED**
2. ~~**Add rate limiting** to auth endpoints at minimum.~~ **RESOLVED**
3. ~~**Add CORS headers** to business API routes or use a global CORS middleware.~~ **RESOLVED**
4. ~~**Fail-safe on AUTH_SECRET** — throw on startup if production and secret is the default.~~ **RESOLVED**
5. ~~**Add error boundaries** to the React Router tree.~~ **RESOLVED**

### P1 — High value

6. ~~**Migrate dashboard to React Query** — replace manual fetch/setState with `useQuery`/`useMutation`.~~ **RESOLVED**
7. ~~**Single-query permission check** — rewrite `userHasPermission` as one JOIN.~~ **RESOLVED**
8. ~~**Add `role="alert"`** to error message containers for screen reader announcement.~~ **RESOLVED**
9. ~~**Add pagination** to `GET /api/pods` (and eventually events).~~ **RESOLVED**
10. ~~**Fix README** API table to match actual Better Auth routes.~~ **RESOLVED**

### P2 — Quality of life

11. ~~Remove dead code (`parseCookies`, `serializeCookie`, `CookieOptions`).~~ **RESOLVED**
12. ~~Add a loading skeleton or spinner to auth guard layouts instead of returning `null`.~~ **RESOLVED**
13. ~~Extract shared API types to `app/lib/types.ts`.~~ **RESOLVED**
14. ~~Add skip-to-content link in root layout.~~ **RESOLVED**
15. ~~Add request logging to the backend.~~ **RESOLVED**
16. Add inline form validation (password match, email format, field length).
17. ~~Unify `SessionUser` type — single source of truth shared between frontend and backend.~~ **RESOLVED**
18. ~~Batch permission bootstrap inserts.~~ **RESOLVED**

### P3 — Nice to have

19. Add toast/notification for successful actions.
20. ~~Global error handler in `Bun.serve` with structured error responses.~~ **RESOLVED**
21. Tighten `colorClasses` type signatures in Button and Badge to handle all variant/color combos explicitly.
22. CI pipeline (GitHub Actions) for lint + typecheck + build.
23. Add unit and component tests.
24. ~~Consider removing React Query dependency if migration isn't planned soon.~~ N/A — migrated.

---

## Summary

PodWatch is a clean, well-organized early-stage dashboard. The TypeScript is strict, the schema is solid, the component library is consistent, and the RBAC model is thoughtfully designed.

**Resolved in hardening pass (2026-03-03):** All P0 items (security hardening: rate limiting, CORS, credential leak gating, AUTH_SECRET fail-safe, error boundaries), all P1 items (React Query migration, single-query permission check, accessibility alerts, pagination, README fixes), and most P2 items (dead code removal, loading spinners, shared types, skip-to-content, request logging, type unification, batched bootstrap).

**Remaining open items:** CSRF protection on custom routes, inline form validation, toast notifications, color contrast audit, unit/component tests, CI pipeline.
