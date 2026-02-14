<section class="max-w-xl mx-auto mt-12 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
    <h1 class="text-2xl font-semibold text-zinc-900">Verify your sign-in code</h1>
    <p class="mt-2 text-sm text-zinc-600">Enter the 6-digit code we emailed to you.</p>

    <form wire:submit="verify" class="mt-6 space-y-4">
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

        <div class="space-y-1">
            <label for="code" class="block text-sm font-medium text-zinc-800">Code</label>
            <input
                id="code"
                wire:model="code"
                type="text"
                inputmode="numeric"
                pattern="\d{6}"
                maxlength="6"
                required
                class="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-600"
            />
            @error('code')
                <p class="text-sm text-red-600">{{ $message }}</p>
            @enderror
        </div>

        <button
            type="submit"
            class="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
            Sign in
        </button>
    </form>

    <p class="mt-4 text-sm text-zinc-600">
        Need another code?
        <a href="{{ route('login') }}" class="text-zinc-900 underline">Request a new one</a>.
    </p>
</section>
