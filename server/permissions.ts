import { and, eq } from 'drizzle-orm';
import { permissions, rolePermissions, userRoles } from '../db/schema';
import { db } from './db';

export async function userHasPermission(userId: number, permissionName: string): Promise<boolean> {
  const permission = await db
    .select({ id: permissions.id })
    .from(permissions)
    .where(eq(permissions.name, permissionName))
    .limit(1);

  if (!permission[0]) {
    return false;
  }

  const membership = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .innerJoin(
      rolePermissions,
      and(
        eq(rolePermissions.roleId, userRoles.roleId),
        eq(rolePermissions.permissionId, permission[0].id),
      ),
    )
    .where(and(eq(userRoles.userId, userId), eq(userRoles.active, true)))
    .limit(1);

  return membership.length > 0;
}
