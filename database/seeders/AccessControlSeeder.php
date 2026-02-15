<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Spatie\Permission\Contracts\Permission as PermissionContract;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class AccessControlSeeder extends Seeder
{
    public const string ROLE_MEMBER = 'member';

    public const string ROLE_ADMIN = 'admin';

    /**
     * @var list<string>
     */
    public const array MEMBER_PERMISSIONS = [
        'dashboard.view',
        'pods.create',
        'api.access',
        'api.pods.create',
    ];

    /**
     * @var list<string>
     */
    public const array ADMIN_PERMISSIONS = [
        ...self::MEMBER_PERMISSIONS,
        'monitoring.pulse.view',
        'monitoring.telescope.view',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $memberPermissions = $this->createPermissions(self::MEMBER_PERMISSIONS);
        $adminPermissions = $this->createPermissions(self::ADMIN_PERMISSIONS);

        $memberRole = Role::findOrCreate(self::ROLE_MEMBER, 'web');
        $adminRole = Role::findOrCreate(self::ROLE_ADMIN, 'web');

        $memberRole->syncPermissions($memberPermissions);
        $adminRole->syncPermissions($adminPermissions);
    }

    /**
     * @param  list<string>  $permissionNames
     * @return Collection<int, PermissionContract>
     */
    protected function createPermissions(array $permissionNames): Collection
    {
        return collect($permissionNames)
            ->map(fn (string $permission): PermissionContract => Permission::findOrCreate($permission, 'web'));
    }
}
