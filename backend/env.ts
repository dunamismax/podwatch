import { z } from 'zod';

export const env = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().min(1).default('postgres://postgres:postgres@localhost:5432/podwatch'),
    AUTH_SECRET: z.string().min(1).default('dev-secret-change-me'),
    APP_URL: z.string().url().default('http://localhost:3000'),
    API_URL: z.string().url().default('http://localhost:3001'),
    PORT: z.coerce.number().int().positive().default(3001),
  })
  .parse(process.env);

if (env.NODE_ENV === 'production' && env.AUTH_SECRET === 'dev-secret-change-me') {
  throw new Error('AUTH_SECRET must be changed from the default value in production.');
}
