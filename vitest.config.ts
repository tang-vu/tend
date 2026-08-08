import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "apps/discord-worker/tests/**/*.test.ts",
      "apps/web/tests/**/*.test.ts",
      "packages/core/tests/**/*.test.ts",
      "packages/db/tests/**/*.test.ts",
      "packages/minds/tests/**/*.test.ts",
    ],
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
    fileParallelism: false,
    maxWorkers: 1,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["packages/*/src/**/*.ts", "apps/discord-worker/src/**/*.ts"],
    },
  },
});
