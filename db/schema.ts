import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const memberRoleEnum = pgEnum('member_role', ['owner', 'member']);

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull(),
    emailVerified: timestamp('email_verified_at', { withTimezone: true }),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('users_email_unique').on(table.email)],
);

export const accounts = pgTable(
  'accounts',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    idToken: text('id_token'),
    sessionState: varchar('session_state', { length: 255 }),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })],
);

export const sessions = pgTable(
  'sessions',
  {
    sessionToken: varchar('session_token', { length: 255 }).primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
);

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

export const pods = pgTable(
  'pods',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    description: text('description'),
    ownerId: integer('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('pods_owner_id_idx').on(table.ownerId)],
);

export const podMembers = pgTable(
  'pod_members',
  {
    podId: integer('pod_id')
      .notNull()
      .references(() => pods.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.podId, table.userId] }),
    index('pod_members_user_id_idx').on(table.userId),
  ],
);

export const events = pgTable(
  'events',
  {
    id: serial('id').primaryKey(),
    podId: integer('pod_id')
      .notNull()
      .references(() => pods.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    location: varchar('location', { length: 255 }),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('events_pod_id_idx').on(table.podId),
    index('events_scheduled_for_idx').on(table.scheduledFor),
  ],
);

export const roles = pgTable(
  'roles',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('roles_name_unique').on(table.name)],
);

export const permissions = pgTable(
  'permissions',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('permissions_name_unique').on(table.name)],
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

export const userRoles = pgTable(
  'user_roles',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    active: boolean('active').notNull().default(true),
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleId] })],
);
