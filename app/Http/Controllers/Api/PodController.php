<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePodApiRequest;
use App\Models\Pod;
use App\Models\PodMember;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PodController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $pods = $user->pods()
            ->select('pods.id', 'pods.name', 'pods.description')
            ->orderByDesc('pods.created_at')
            ->get()
            ->map(function (Pod $pod): array {
                return [
                    'id' => $pod->id,
                    'name' => $pod->name,
                    'description' => $pod->description,
                    'role' => $pod->pivot?->role,
                ];
            });

        return response()->json(['pods' => $pods]);
    }

    public function store(StorePodApiRequest $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if ($request->decodedJsonPayload() === null) {
            return response()->json(['error' => 'Request body must be valid JSON.'], 400);
        }

        $validated = $request->validated();
        $description = trim((string) ($validated['description'] ?? ''));
        $normalizedDescription = $description === '' ? null : $description;

        $pod = DB::transaction(function () use ($validated, $normalizedDescription, $user): Pod {
            $createdPod = Pod::query()->create([
                'name' => trim($validated['name']),
                'description' => $normalizedDescription,
                'owner_id' => $user->id,
            ]);

            PodMember::query()->create([
                'pod_id' => $createdPod->id,
                'user_id' => $user->id,
                'role' => 'owner',
            ]);

            return $createdPod;
        });

        return response()->json([
            'pod' => [
                'id' => $pod->id,
                'name' => $pod->name,
                'description' => $pod->description,
                'role' => 'owner',
            ],
        ], 201);
    }
}
