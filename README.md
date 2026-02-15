<p align="center">
  <img src="public/favicon.svg" alt="PodDashboard logo" width="84" />
</p>

<p align="center">
  Dark-themed TALL app for authentication, role-aware pod management, and upcoming event visibility.
</p>

# PodDashboard

PodDashboard is a Laravel 12 + Livewire 4 application for organizing tabletop pods and events.
It uses a server-driven UI with Flux components, headless auth via Fortify, and permission-based route protection.

## Tech Stack

- Laravel 12
- Livewire 4
- Alpine.js (bundled via Livewire)
- Flux UI Free
- Tailwind CSS 4 + Vite 7
- Laravel Fortify (including 2FA challenge flow)
- Spatie Laravel Permission (RBAC)
- Laravel Telescope
- Laravel Pulse
- Laravel Pail
- Pest 4 + PHPUnit 12
- Laravel Pint
- Larastan (PHPStan)
- SQLite by default for local/testing (`.env.example`), with PostgreSQL/MySQL-ready config

## Current Features

- Flux + Livewire dashboard UI
- Fortify auth flows:
  - login/logout
  - register
  - forgot/reset password
  - confirm password
  - two-factor challenge (`/two-factor-challenge`)
- RBAC with Spatie roles/permissions
  - default roles: `member`, `admin`
  - new registrations receive `member`
- Permission-protected app routes
  - dashboard requires `dashboard.view`
  - API requires `api.access`
  - pod creation API additionally requires `api.pods.create`
- Session-authenticated JSON API:
  - `GET /api/pods`
  - `POST /api/pods`
  - `GET /api/events`
- Monitoring dashboards:
  - Pulse at `/pulse` (permission-gated)
  - Telescope at `/telescope` (permission-gated)

## Requirements

- PHP 8.2+ (tested in this repo with 8.4.1)
- Composer 2+
- Node.js 22+
- npm 10+

## Setup

### One-command setup

```bash
composer setup
```

`composer setup` installs dependencies, creates `.env`, generates the app key, ensures `database/database.sqlite` exists, runs migrations, and builds frontend assets.

### Manual setup

```bash
cp .env.example .env
composer install
npm install
php artisan key:generate
php -r "file_exists('database/database.sqlite') || touch('database/database.sqlite');"
php artisan migrate
npm run build
```

## Run Locally

```bash
composer dev
```

This starts:

- `php artisan serve`
- `php artisan queue:listen`
- `php artisan pail`
- `npm run dev`

If UI changes are not visible, run `npm run dev` or `npm run build`.

## Authorization Model

Permissions currently seeded:

- `dashboard.view`
- `pods.create`
- `api.access`
- `api.pods.create`
- `monitoring.pulse.view`
- `monitoring.telescope.view`

Seed behavior:

- `php artisan db:seed` creates `test@example.com` / `password`
- seeded user is assigned `admin`

## Example API Request

Create pod:

```http
POST /api/pods
Content-Type: application/json
```

```json
{
  "name": "Friday Pod",
  "description": "Casual commander table"
}
```

Success response (`201`):

```json
{
  "pod": {
    "id": 1,
    "name": "Friday Pod",
    "description": "Casual commander table",
    "role": "owner"
  }
}
```

## Quality Commands

```bash
php artisan test --compact
php artisan test --compact tests/Feature/OtpAuthenticationTest.php
php artisan test --compact tests/Feature/DashboardFeatureTest.php
php artisan test --compact tests/Feature/ApiEndpointsTest.php
composer analyse
composer lint
vendor/bin/pint --dirty --format agent
npm run build
```

## Project Layout

```text
app/
  Actions/Fortify/             Fortify user/password actions
  Http/Controllers/Api/        API endpoints
  Http/Requests/               API request validation
  Livewire/                    Dashboard Livewire component
  Models/                      User, Pod, PodMember, Event
  Providers/                   App, Fortify, Telescope providers
config/
  fortify.php                  Fortify features (incl. 2FA)
  permission.php               Spatie permission config
  pulse.php                    Pulse config
  telescope.php                Telescope config
database/
  migrations/                  Core + Pulse + Telescope + Spatie + 2FA columns
  seeders/                     AccessControlSeeder + DatabaseSeeder
resources/views/
  auth/                        Fortify auth views (Flux)
  livewire/                    Dashboard view
  layouts/pod.blade.php        Global app shell
  vendor/pulse/dashboard.blade.php
routes/web.php                 Web + API route definitions
tests/Feature/                 Auth, dashboard, and API behavior tests
phpstan.neon                   Larastan/PHPStan config
```

## License

MIT (`LICENSE`)
