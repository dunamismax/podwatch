<?php

namespace Database\Factories;

use App\Models\User;
use Database\Seeders\AccessControlSeeder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Contracts\Permission as PermissionContract;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (User $user): void {
            $memberRole = Role::findOrCreate(AccessControlSeeder::ROLE_MEMBER, 'web');
            $memberPermissions = collect(AccessControlSeeder::MEMBER_PERMISSIONS)
                ->map(fn (string $permission): PermissionContract => Permission::findOrCreate($permission, 'web'));

            $memberRole->syncPermissions($memberPermissions);
            $user->assignRole($memberRole);
        });
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => []);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('otpauth-secret'),
            'two_factor_recovery_codes' => encrypt(json_encode([
                'recovery-code-one',
                'recovery-code-two',
            ], JSON_THROW_ON_ERROR)),
            'two_factor_confirmed_at' => now(),
        ]);
    }
}
