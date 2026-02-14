<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $events = Event::query()
            ->with('pod:id,name')
            ->whereHas('pod.members', function ($query) use ($user): void {
                $query->where('users.id', $user->id);
            })
            ->where('scheduled_for', '>=', now()->subDay())
            ->orderBy('scheduled_for')
            ->limit(20)
            ->get(['id', 'pod_id', 'title', 'location', 'scheduled_for'])
            ->map(function (Event $event): array {
                return [
                    'id' => $event->id,
                    'podName' => $event->pod?->name,
                    'title' => $event->title,
                    'location' => $event->location,
                    'scheduledFor' => $event->scheduled_for?->toJSON(),
                ];
            });

        return response()->json(['events' => $events]);
    }
}
