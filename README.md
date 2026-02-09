# Magic Pod Dashboard (Web)

Magic Pod Dashboard is a web app for Magic: The Gathering pods and other tabletop groups that need a shared place to coordinate sessions. It combines pod membership, event planning, RSVP tracking, arrival updates, checklists, and notifications in one flow so groups can move from planning to game night with less back-and-forth.

Live URL: https://poddashboard.com

## What the app does

- Sign in with email one-time code (`/auth`)
- Create and manage pods
- Invite members by email and accept invites in-app
- Create events with title, schedule, description, and location
- Track RSVP and live arrival status (including ETA minutes)
- Keep a shared event checklist and cycle item state (`open`, `done`, `blocked`)
- Edit event details or cancel events (host/admin controls)
- Deliver in-app notifications for event changes and arrival updates
- Subscribe to realtime updates for attendance, checklist, event details, and notifications

## Main routes

- `/` dashboard for next event, RSVP actions, arrival board, and checklist
- `/pods` list of your pods plus upcoming events across pods
- `/pod/:id` pod details, members, and invite management (admin/owner)
- `/create-pod` create a new pod
- `/create-event` create an event in one of your pods
- `/event/:id` event detail, RSVP, arrival status, checklist
- `/event/edit/:id` edit/cancel event (event creator or pod owner/admin)
- `/invites` accept pending pod invites
- `/notifications` read and manage event notifications
- `/auth` one-time-code sign in and profile management

## Tech stack

- React 19 + TypeScript
- Vite
- React Router
- TanStack Query
- Zod
- Supabase
  - Postgres
  - Auth (email OTP)
  - Realtime
  - Edge Functions
  - Storage

## Data model overview

Core tables from `scripts/supabase-setup.sql`:

- `pods`
- `pod_memberships`
- `pod_invites`
- `events`
- `event_attendance`
- `event_checklist_items`
- `notifications`
- `profiles`
- `user_push_tokens`

The schema script also includes:

- enums for membership, invite, RSVP, arrival, and checklist states
- indexes and `updated_at` triggers
- helper functions (`can_access_pod`, `is_pod_admin`, `shares_pod_with`)
- RPCs (`create_pod_with_owner`, `accept_pod_invite`)
- RLS policies for all major tables

## Project structure

- `src/App.tsx` route table and app providers
- `src/web/` pages, app layout, styles, and utility formatters
- `src/features/` feature-scoped query/mutation modules
- `src/lib/` env parsing, Supabase client, React Query client
- `src/hooks/use-supabase-session.ts` auth/session bootstrap hook
- `scripts/supabase-setup.sql` schema, policies, indexes, RPCs
- `supabase/functions/notify-event` event notification edge function

## Local setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Create `.env`:

```bash
# Preferred for web
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Optional compatibility keys
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

`src/lib/env.ts` validates env values with Zod at startup.  
After editing `.env`, restart the dev server.

### 3) Configure Supabase Auth for code login (required)

In Supabase Dashboard:

1. Go to `Authentication -> Providers -> Email` and keep email sign-in enabled.
2. Go to `Authentication -> Email Templates`.
3. For templates used in email sign-in (`Magic Link`, and `Confirm signup` if you allow new users), use `{{ .Token }}` in the email body.
4. Remove `{{ .ConfirmationURL }}` from those templates so users receive a one-time code instead of a login link.

Supabase sends OTP vs magic link based on the template variables, not only the client SDK call.

### 4) Apply schema + policies

Run `scripts/supabase-setup.sql` in the Supabase SQL editor.

### 5) Run the app

```bash
npm run dev
```

Open the local URL shown by Vite, then sign in at `/auth`.

## Available scripts

- `npm run dev` start local dev server
- `npm start` alias for `npm run dev`
- `npm run build` type-check + production build
- `npm run preview` preview production build locally
- `npm run lint` run ESLint for `src/**/*.ts(x)`

## Notifications and realtime behavior

- App-side notification reads/writes use `src/features/notifications/notifications-queries.ts`.
- Event mutations call the `notify-event` edge function with event context.
- `notify-event` writes in-app notifications and can fan out Expo push notifications when `user_push_tokens` exist.
- Realtime subscriptions invalidate React Query caches for fresh UI state.

## Notes for contributors

- Keep web UI code under `src/web/`.
- Keep domain data access in `src/features/`.
- Keep env/input validation with Zod.
- Keep schema and policy changes in `scripts/supabase-setup.sql`.
- Do not commit real secrets; use `.env.example`.

## License

MIT. See [LICENSE](LICENSE).
