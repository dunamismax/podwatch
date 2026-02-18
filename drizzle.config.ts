import { defineConfig } from 'drizzle-kit';
import { z } from 'zod';

const env = z
  .object({
    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL is required')
      .default('postgres://postgres:postgres@localhost:5432/poddashboard'),
  })
  .parse(process.env);

export default defineConfig({
  out: './db/migrations',
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
