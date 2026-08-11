import { defineConfig, devices } from "@playwright/test";

const liveE2ePort = process.env.TEND_LIVE_E2E_PORT ?? "3101";
const liveE2eOrigin = `http://127.0.0.1:${liveE2ePort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "live-auth.spec.ts",
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: liveE2eOrigin,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `pnpm --filter @tend/web dev --port ${liveE2ePort}`,
    url: `${liveE2eOrigin}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      TEND_MODE: "live",
      MINDS_MODE: "live",
      TEND_PUBLIC_ORIGIN: liveE2eOrigin,
      TEND_CREATOR_ACCESS_KEY: "e2e-creator-access-key-with-32-characters",
      TEND_SESSION_SECRET: "e2e-session-signing-secret-with-32-characters",
      TEND_DB_PATH: "./data/e2e-live-auth.db",
    },
  },
});
