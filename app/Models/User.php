<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'email',
        'password',
        'name',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function podMemberships(): HasMany
    {
        return $this->hasMany(PodMember::class);
    }

    public function pods(): BelongsToMany
    {
        return $this->belongsToMany(Pod::class, 'pod_members')
            ->withPivot('role', 'joined_at');
    }

    public function ownedPods(): HasMany
    {
        return $this->hasMany(Pod::class, 'owner_id');
    }

    public function eventsCreated(): HasMany
    {
        return $this->hasMany(Event::class, 'created_by');
    }
}
