<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Database\Seeders\AccessControlSeeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Spatie\Permission\Contracts\Permission as PermissionContract;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'password' => $this->passwordRules(),
        ])->validate();

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => Hash::make($input['password']),
        ]);

        $memberRole = Role::findOrCreate(AccessControlSeeder::ROLE_MEMBER, 'web');
        $memberPermissions = collect(AccessControlSeeder::MEMBER_PERMISSIONS)
            ->map(fn (string $permission): PermissionContract => Permission::findOrCreate($permission, 'web'));

        $memberRole->syncPermissions($memberPermissions);
        $user->assignRole($memberRole);

        return $user;
    }
}
