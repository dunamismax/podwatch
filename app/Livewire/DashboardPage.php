<?php

namespace App\Livewire;

use App\Models\Event;
use App\Models\Pod;
use App\Models\PodMember;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;
use Livewire\Component;

class DashboardPage extends Component
{
    public string $name = '';

    public string $description = '';

    public function createPod(): void
    {
        $validated = $this->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
        ], [
            'name.required' => 'Pod name must be at least 2 characters.',
            'name.min' => 'Pod name must be at least 2 characters.',
            'name.max' => 'Pod name must be 120 characters or fewer.',
            'description.max' => 'Description must be 500 characters or fewer.',
        ]);

        $description = trim((string) ($validated['description'] ?? ''));
        $normalizedDescription = $description === '' ? null : $description;
        $userId = Auth::id();

        if (! is_int($userId)) {
            return;
        }

        DB::transaction(function () use ($validated, $normalizedDescription, $userId): void {
            $pod = Pod::query()->create([
                'name' => trim($validated['name']),
                'description' => $normalizedDescription,
                'owner_id' => $userId,
            ]);

            PodMember::query()->create([
                'pod_id' => $pod->id,
                'user_id' => $userId,
                'role' => 'owner',
            ]);
        });

        $this->name = '';
        $this->description = '';
        session()->flash('status', 'Pod created.');
    }

    public function render(): View
    {
        $user = Auth::user();

        $pods = $user?->pods()
            ->select('pods.id', 'pods.name', 'pods.description')
            ->orderByDesc('pods.created_at')
            ->get() ?? new Collection;

        $events = $user === null
            ? new Collection
            : Event::query()
                ->with('pod:id,name')
                ->whereHas('pod.members', function ($query) use ($user): void {
                    $query->where('users.id', $user->id);
                })
                ->where('scheduled_for', '>=', now()->subDay())
                ->orderBy('scheduled_for')
                ->limit(20)
                ->get(['id', 'pod_id', 'title', 'location', 'scheduled_for']);

        return view('livewire.dashboard-page', [
            'pods' => $pods,
            'events' => $events,
        ])->layout('layouts.pod');
    }
}
