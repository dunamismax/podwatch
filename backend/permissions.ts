import { and, eq } from 'drizzle-orm';
import { permissions, rolePermissions, roles, userRoles } from '../db/schema';
import { db } from './db';

export const ROLE_MEMBER = 'member';
export const ROLE_ADMIN = 'admin';

export const MEMBER_PERMISSIONS = [
  'dashboard.view',
  'pods.create',
  'api.access',
  'api.pods.create',
];

export const ADMIN_PERMISSIONS = [
  ...MEMBER_PERMISSIONS,
  'monitoring.pulse.view',
  'monitoring.telescope.view',
];

export async function userHasPermission(userId: number, permissionName: string): Promise<boolean> {
  const result = await db
    .select({ permissionId: rolePermissions.permissionId })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.active, true),
        eq(permissions.name, permissionName),
      ),
    )
    .limit(1);

  return result.length > 0;
}

export async function ensureAccessControlBootstrap(): Promise<void> {
  await Promise.all(
    ADMIN_PERMISSIONS.map((name) =>
      db
        .insert(permissions)
        .values({ name })
        .onConflictDoUpdate({ target: permissions.name, set: { name } }),
    ),
  );

  const [[memberRole], [adminRole]] = await Promise.all([
    db
      .insert(roles)
      .values({ name: ROLE_MEMBER })
      .onConflictDoUpdate({ target: roles.name, set: { name: ROLE_MEMBER } })
      .returning({ id: roles.id }),
    db
      .insert(roles)
      .values({ name: ROLE_ADMIN })
      .onConflictDoUpdate({ target: roles.name, set: { name: ROLE_ADMIN } })
      .returning({ id: roles.id }),
  ]);

  if (!memberRole || !adminRole) {
    throw new Error('Access control bootstrap failed.');
  }

  const allPermissions = await db.select().from(permissions);
  const memberPermissionIds = allPermissions
    .filter((p) => MEMBER_PERMISSIONS.includes(p.name))
    .map((p) => p.id);
  const adminPermissionIds = allPermissions.map((p) => p.id);

  await Promise.all([
    ...memberPermissionIds.map((permissionId) =>
      db
        .insert(rolePermissions)
        .values({ roleId: memberRole.id, permissionId })
        .onConflictDoNothing(),
    ),
    ...adminPermissionIds.map((permissionId) =>
      db
        .insert(rolePermissions)
        .values({ roleId: adminRole.id, permissionId })
        .onConflictDoNothing(),
    ),
  ]);
}
