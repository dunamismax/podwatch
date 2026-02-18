import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, pool } from '../server/db';
import { permissions, rolePermissions, roles, userRoles, users } from './schema';

const ROLE_MEMBER = 'member';
const ROLE_ADMIN = 'admin';

const MEMBER_PERMISSIONS = ['dashboard.view', 'pods.create', 'api.access', 'api.pods.create'];

const ADMIN_PERMISSIONS = [
  ...MEMBER_PERMISSIONS,
  'monitoring.pulse.view',
  'monitoring.telescope.view',
];

async function seed() {
  const [memberRole] = await db
    .insert(roles)
    .values({ name: ROLE_MEMBER })
    .onConflictDoUpdate({ target: roles.name, set: { name: ROLE_MEMBER } })
    .returning({ id: roles.id });

  const [adminRole] = await db
    .insert(roles)
    .values({ name: ROLE_ADMIN })
    .onConflictDoUpdate({ target: roles.name, set: { name: ROLE_ADMIN } })
    .returning({ id: roles.id });

  for (const permissionName of ADMIN_PERMISSIONS) {
    await db
      .insert(permissions)
      .values({ name: permissionName })
      .onConflictDoUpdate({ target: permissions.name, set: { name: permissionName } });
  }

  const allPermissions = await db.select().from(permissions);
  const memberPermissionIds = allPermissions
    .filter((permission) => MEMBER_PERMISSIONS.includes(permission.name))
    .map((permission) => permission.id);
  const adminPermissionIds = allPermissions.map((permission) => permission.id);

  for (const permissionId of memberPermissionIds) {
    await db
      .insert(rolePermissions)
      .values({ roleId: memberRole.id, permissionId })
      .onConflictDoNothing();
  }

  for (const permissionId of adminPermissionIds) {
    await db
      .insert(rolePermissions)
      .values({ roleId: adminRole.id, permissionId })
      .onConflictDoNothing();
  }

  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'test@example.com'))
    .limit(1);

  const passwordHash = await hash('password', 12);

  const userId =
    existingUser[0]?.id ??
    (
      await db
        .insert(users)
        .values({
          email: 'test@example.com',
          name: 'Test User',
          passwordHash,
        })
        .returning({ id: users.id })
    )[0].id;

  if (existingUser[0]) {
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  }

  await db.insert(userRoles).values({ userId, roleId: adminRole.id }).onConflictDoNothing();

  console.log('Seed complete: test@example.com / password (admin)');
}

seed()
  .catch((error) => {
    console.error('Seed failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
