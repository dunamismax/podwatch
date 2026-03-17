import { defineConfig } from "@playwright/test";

const apiPort = 4310;
const webPort = 3310;
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === "1";
const apiUrl = `http://127.0.0.1:${apiPort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "pnpm -C ../.. --filter @podwatch/api dev",
      port: apiPort,
      reuseExistingServer,
      timeout: 120_000,
      env: {
        BETTER_AUTH_SECRET:
          process.env.BETTER_AUTH_SECRET ||
          "development-secret-value-that-is-long-enough",
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || apiUrl,
        CORS_ORIGIN: process.env.CORS_ORIGIN || `http://127.0.0.1:${webPort}`,
        DATABASE_URL:
          process.env.DATABASE_URL ||
          "postgresql://podwatch:podwatch@127.0.0.1:5432/podwatch",
        PORT: String(apiPort),
      },
    },
    {
      command: `pnpm exec vite dev --port ${webPort}`,
      port: webPort,
      reuseExistingServer,
      timeout: 120_000,
      env: {
        VITE_API_URL: process.env.VITE_API_URL || apiUrl,
      },
    },
  ],
});
