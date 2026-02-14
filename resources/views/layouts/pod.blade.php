<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Magic Pod Dashboard</title>
        @vite(['resources/css/app.css', 'resources/js/app.js'])
        @livewireStyles
    </head>
    <body class="min-h-screen bg-zinc-100 text-zinc-900">
        <header class="border-b border-zinc-200 bg-white">
            <div class="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                <a href="{{ auth()->check() ? route('dashboard') : route('login') }}" class="font-semibold">
                    Magic Pod Dashboard
                </a>
                <div class="flex items-center gap-3">
                    @auth
                        <span class="text-sm text-zinc-600">{{ auth()->user()->email }}</span>
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button
                                type="submit"
                                class="inline-flex items-center rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                            >
                                Sign out
                            </button>
                        </form>
                    @else
                        <a
                            href="{{ route('login') }}"
                            class="inline-flex items-center rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                        >
                            Sign in
                        </a>
                    @endauth
                </div>
            </div>
        </header>

        <main class="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            {{ $slot }}
        </main>

        @livewireScripts
    </body>
</html>
