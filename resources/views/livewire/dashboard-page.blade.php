<div class="grid gap-6 md:grid-cols-2">
    <section class="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-2">
        <h1 class="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p class="mt-2 text-sm text-zinc-600">
            Create pods, view your memberships, and track upcoming events.
        </p>
    </section>

    <section class="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-zinc-900">Create a pod</h2>

        @if (session('status'))
            <p class="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {{ session('status') }}
            </p>
        @endif

        <form wire:submit="createPod" class="mt-4 space-y-4">
            <div class="space-y-1">
                <label for="name" class="block text-sm font-medium text-zinc-800">Pod name</label>
                <input
                    id="name"
                    wire:model="name"
                    type="text"
                    required
                    maxlength="120"
                    class="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-600"
                />
                @error('name')
                    <p class="text-sm text-red-600">{{ $message }}</p>
                @enderror
            </div>

            <div class="space-y-1">
                <label for="description" class="block text-sm font-medium text-zinc-800">Description</label>
                <textarea
                    id="description"
                    wire:model="description"
                    rows="3"
                    maxlength="500"
                    class="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-600"
                ></textarea>
                @error('description')
                    <p class="text-sm text-red-600">{{ $message }}</p>
                @enderror
            </div>

            <button
                type="submit"
                class="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
                Create pod
            </button>
        </form>
    </section>

    <section class="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-zinc-900">Your pods</h2>

        @if ($pods->isEmpty())
            <p class="mt-3 text-sm text-zinc-600">No pods yet. Create your first pod.</p>
        @else
            <ul class="mt-3 space-y-3">
                @foreach ($pods as $pod)
                    <li class="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                        <p class="text-sm font-semibold text-zinc-900">{{ $pod->name }}</p>
                        @if ($pod->description)
                            <p class="text-sm text-zinc-600">{{ $pod->description }}</p>
                        @endif
                    </li>
                @endforeach
            </ul>
        @endif
    </section>

    <section class="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-2">
        <h2 class="text-lg font-semibold text-zinc-900">Upcoming events</h2>

        @if ($events->isEmpty())
            <p class="mt-3 text-sm text-zinc-600">No upcoming events.</p>
        @else
            <ul class="mt-3 space-y-3">
                @foreach ($events as $event)
                    <li class="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                        <p class="text-sm font-semibold text-zinc-900">{{ $event->title }}</p>
                        <p class="text-sm text-zinc-600">
                            {{ $event->pod?->name }} · {{ $event->scheduled_for?->format('M j, Y g:i A') }}
                        </p>
                    </li>
                @endforeach
            </ul>
        @endif
    </section>
</div>
