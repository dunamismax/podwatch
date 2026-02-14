<?php

use App\Models\Event;
use App\Models\Pod;
use App\Models\PodMember;
use App\Models\User;
use Illuminate\Support\Carbon;

it('returns unauthorized for unauthenticated api requests', function (): void {
    $this->getJson('/api/pods')
        ->assertStatus(401)
        ->assertJson(['error' => 'Unauthorized']);

    $this->getJson('/api/events')
        ->assertStatus(401)
        ->assertJson(['error' => 'Unauthorized']);
});

it('creates a pod via api and lists pods for the authenticated user', function (): void {
    $user = User::factory()->create([
        'password' => null,
    ]);

    $this->actingAs($user)
        ->postJson('/api/pods', [
            'name' => 'API Pod',
            'description' => 'Created through the resource endpoint',
        ])
        ->assertStatus(201)
        ->assertJsonPath('pod.name', 'API Pod')
        ->assertJsonPath('pod.role', 'owner');

    $this->actingAs($user)
        ->getJson('/api/pods')
        ->assertOk()
        ->assertJsonCount(1, 'pods')
        ->assertJsonPath('pods.0.name', 'API Pod');
});

it('returns a 400 error for malformed pod creation payloads', function (): void {
    $user = User::factory()->create([
        'password' => null,
    ]);

    $response = $this->actingAs($user)->call(
        'POST',
        '/api/pods',
        [],
        [],
        [],
        ['CONTENT_TYPE' => 'application/json'],
        '{"name":'
    );

    $response
        ->assertStatus(400)
        ->assertJsonStructure(['error']);
});

it('lists upcoming events for the authenticated user', function (): void {
    $user = User::factory()->create([
        'password' => null,
    ]);

    $pod = Pod::query()->create([
        'name' => 'Event Pod',
        'description' => null,
        'owner_id' => $user->id,
    ]);

    PodMember::query()->create([
        'pod_id' => $pod->id,
        'user_id' => $user->id,
        'role' => 'owner',
        'joined_at' => Carbon::now(),
    ]);

    Event::query()->create([
        'pod_id' => $pod->id,
        'title' => 'Draft Night',
        'description' => null,
        'location' => 'Community Hall',
        'scheduled_for' => Carbon::now()->addDay(),
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->getJson('/api/events')
        ->assertOk()
        ->assertJsonCount(1, 'events')
        ->assertJsonPath('events.0.title', 'Draft Night')
        ->assertJsonPath('events.0.podName', 'Event Pod');
});
