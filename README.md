# Magic Pod Dashboard

Magic Pod Dashboard is a Laravel 12 + Livewire 4 web app for tabletop pod management.

## Stack

- Framework: Laravel 12 (PHP 8.2+)
- UI: Livewire 4
- Database: PostgreSQL
- Auth: Email OTP + Laravel session auth
- Mail: SMTP

## Quick start

```bash
cp .env.example .env
composer install
npm install
php artisan key:generate
php artisan migrate
php artisan serve
```

## Routes

- `GET /login` request an email OTP
- `GET /verify` verify OTP and sign in
- `GET /dashboard` authenticated dashboard
- `GET /api/pods` list current user pods
- `POST /api/pods` create pod
- `GET /api/events` list upcoming events

## Tests

```bash
php artisan test
```
