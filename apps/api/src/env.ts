import "dotenv/config";

import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required."),
  BETTER_AUTH_URL: z.string().url().default("http://127.0.0.1:4000"),
  CORS_ORIGIN: z.string().url().default("http://127.0.0.1:3000"),
});

export const env = EnvSchema.parse(process.env);
