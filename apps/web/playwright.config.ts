import { defineConfig } from "@playwright/test";

const apiPort = 4000;
const webPort = 3000;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    port: webPort,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ||
        "development-secret-value-that-is-long-enough",
      BETTER_AUTH_URL:
        process.env.BETTER_AUTH_URL || `http://127.0.0.1:${apiPort}`,
      CORS_ORIGIN: process.env.CORS_ORIGIN || `http://127.0.0.1:${webPort}`,
      DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgresql://podwatch:podwatch@127.0.0.1:5432/podwatch",
      PORT: String(apiPort),
      VITE_API_URL: process.env.VITE_API_URL || `http://127.0.0.1:${apiPort}`,
    },
  },
});
