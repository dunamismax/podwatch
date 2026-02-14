<p align="center">
  <img src="public/favicon.svg" alt="PodDashboard logo" width="84" />
</p>

<p align="center">
  A Laravel + Livewire app for organizing tabletop play pods, memberships, and upcoming events with passwordless email OTP login.
</p>

# PodDashboard

PodDashboard helps playgroups coordinate recurring pods and sessions without heavy tooling. Players sign in with email OTP, create pods, and track upcoming events scoped to memberships.

## Trust Signals

![PHP](https://img.shields.io/badge/PHP-8.4%2B-777BB4?logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel&logoColor=white)
![Livewire](https://img.shields.io/badge/Livewire-4-4E56A6)
![Pest](https://img.shields.io/badge/Tested_with-Pest_4-22C55E)
![License](https://img.shields.io/badge/License-MIT-blue)

## Quick Start

### Prerequisites

- PHP 8.4+
- Composer 2+
- Node.js 22+ (matches CI)
- npm 10+
- PostgreSQL 14+ (default `.env.example`) or another Laravel-supported database

### Run

```bash
git clone <your-repo-url> poddashboard
cd poddashboard
cp .env.example .env
composer install
npm install
php artisan key:generate
php artisan migrate
composer dev
```

Expected result:

- App is available at `http://localhost:8000`
- Login page is available at `http://localhost:8000/login`
- Health check responds at `http://localhost:8000/up`

Optional local seed user:

```bash
php artisan db:seed
```

Use `test@example.com` on the login page to request an OTP code.

## Features

- Passwordless OTP authentication with 6-digit email codes.
- OTP expiry and one-time consumption enforcement.
- OTP send and verify rate limits to reduce abuse and brute-force attempts.
- Pod creation from the dashboard with automatic owner membership assignment.
- Upcoming events feed limited to pods the authenticated user belongs to.
- Session-authenticated JSON API for pod listing/creation and upcoming events.
- API input validation with explicit malformed JSON handling.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend | [Laravel 12](https://laravel.com/docs/12.x) | Framework, routing, Eloquent, middleware |
| Reactive UI | [Livewire 4](https://livewire.laravel.com/) | Server-driven reactive pages |
| UI Components | [Flux UI Free](https://fluxui.dev/) | Shared UI primitives and starter-kit components |
| Authentication | Custom OTP service + Laravel session auth | Passwordless email login flow |
| Styling/Build | [Tailwind CSS 4](https://tailwindcss.com/) + [Vite 7](https://vite.dev/) | Styling and frontend bundling |
| Database | PostgreSQL (default env), SQLite for tests | Persistent app data and deterministic tests |
| Testing | [Pest 4](https://pestphp.com/) + PHPUnit 12 | Feature and unit test coverage |
| Code Style | [Laravel Pint](https://laravel.com/docs/12.x/pint) | Automated PHP formatting |

## Project Structure

```sh
poddashboard/
├── app/
│   ├── Livewire/                        # OTP login/verify pages and dashboard page
│   ├── Services/OtpAuthService.php      # OTP issue/verify logic and login handoff
│   ├── Http/Controllers/Api/            # API endpoints for pods and events
│   ├── Http/Requests/                   # API request validation
│   ├── Models/                          # User, Pod, PodMember, Event, OtpCode
│   └── Mail/OtpCodeMail.php             # OTP email message
├── database/
│   ├── migrations/                      # Users, pods, members, events, otp_codes schema
│   ├── factories/                       # Model factories for tests
│   └── seeders/DatabaseSeeder.php       # Optional local seed data
├── resources/
│   ├── views/livewire/                  # Login, verify, and dashboard views
│   ├── views/emails/                    # OTP email templates
│   └── css + js                         # Vite entrypoints
├── routes/
│   └── web.php                          # Home redirect, auth pages, dashboard, API routes
├── tests/
│   ├── Feature/OtpAuthenticationTest.php # OTP auth flow and throttling coverage
│   └── Feature/ApiEndpointsTest.php     # Pods/events API behavior coverage
├── .github/workflows/                   # CI lint + tests workflows
├── composer.json                        # PHP dependencies + workflow scripts
└── package.json                         # Frontend scripts and dependencies
```

## Development Workflow and Common Commands

### Setup

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
```

### Run

```bash
composer dev
```

### Test

```bash
php artisan test --compact
php artisan test --compact tests/Feature/OtpAuthenticationTest.php
```

### Lint and Format

```bash
composer lint
vendor/bin/pint --dirty --format agent
```

### Build

```bash
npm run build
```

### Deploy (Generic Laravel Flow)

```bash
php artisan down
npm run build
php artisan migrate --force
php artisan optimize
php artisan up
```

Command verification notes for this README rewrite:

- Verified in this environment: `php artisan --version`, `php artisan route:list`, `php artisan test --compact tests/Feature/OtpAuthenticationTest.php`, `npm run build`.
- Not executed in this rewrite: `composer dev`, full production deploy sequence, and `php artisan migrate` against local PostgreSQL.

## Deployment and Operations

This repository does not ship platform-specific infra manifests (no committed Docker/Kubernetes/Terraform files). Deploy as a standard Laravel app on your preferred platform.

- Build assets with `npm run build` before release.
- Run migrations with `php artisan migrate --force` during deployment.
- Use `GET /up` as a basic health endpoint.
- Use `php artisan pail` for live log tailing.
- Roll back the latest migration batch with `php artisan migrate:rollback` if needed.

## Security and Reliability Notes

- Authentication uses email OTP codes with server-side hashing (`sha256`) and expiry/consumption tracking.
- OTP issuance and verification are rate-limited per email and IP.
- Protected dashboard access requires authenticated session middleware.
- API endpoints return `401` for unauthenticated requests.
- Validation is enforced in Livewire actions and `FormRequest` classes.
- CI runs lint and tests via GitHub Actions workflows.

## Documentation

| Path | Purpose |
|---|---|
| [AGENTS.md](AGENTS.md) | Repository-specific engineering guidance |
| [routes/web.php](routes/web.php) | Source of truth for web and API routes |
| [app/Services/OtpAuthService.php](app/Services/OtpAuthService.php) | OTP lifecycle and authentication logic |
| [tests/Feature/OtpAuthenticationTest.php](tests/Feature/OtpAuthenticationTest.php) | OTP auth and throttle behavior tests |
| [tests/Feature/ApiEndpointsTest.php](tests/Feature/ApiEndpointsTest.php) | API authorization and response behavior tests |
| [.github/workflows/tests.yml](.github/workflows/tests.yml) | CI test pipeline definition |
| [.github/workflows/lint.yml](.github/workflows/lint.yml) | CI lint pipeline definition |

## Contributing

Contributions are welcome through pull requests.

1. Create a feature branch.
2. Run lint and tests locally (`composer lint` and `php artisan test --compact`).
3. Open a PR with a clear summary of behavior changes and test impact.

## License

Licensed under the [MIT License](LICENSE).
