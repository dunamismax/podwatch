<section class="max-w-xl mx-auto mt-12 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
    <h1 class="text-2xl font-semibold text-zinc-900">Sign in with email OTP</h1>
    <p class="mt-2 text-sm text-zinc-600">Enter your email and we will send a one-time code.</p>

    @if (session('status'))
        <p class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {{ session('status') }}
        </p>
    @endif

    <form wire:submit="sendCode" class="mt-6 space-y-4">
        <div class="space-y-1">
            <label for="email" class="block text-sm font-medium text-zinc-800">Email</label>
            <input
                id="email"
                wire:model="email"
                type="email"
                autocomplete="email"
                required
                class="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-600"
            />
            @error('email')
                <p class="text-sm text-red-600">{{ $message }}</p>
            @enderror
        </div>

        <button
            type="submit"
            class="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
            Send code
        </button>
    </form>

    <p class="mt-4 text-sm text-zinc-600">
        Already got a code?
        <a href="{{ route('verify') }}" class="text-zinc-900 underline">Verify it here</a>.
    </p>
</section>
