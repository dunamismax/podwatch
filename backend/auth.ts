import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from '../db/schema';
import { db } from './db';
import { env } from './env';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      ...schema,
      user: schema.users,
    },
  }),
  basePath: '/api/auth',
  baseURL: env.API_URL,
  secret: env.AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  user: {
    modelName: 'users',
    fields: {
      emailVerified: 'email_verified_at',
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    database: {
      generateId: (options) => {
        if (options.model === 'user' || options.model === 'users') {
          return false;
        }
        return crypto.randomUUID();
      },
    },
  },
});
