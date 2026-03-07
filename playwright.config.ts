import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/components",
  testMatch: ["**/*.e2e.spec.ts", "**/*.e2e.spec.tsx"],
  timeout: 30_000,
  use: {
    headless: true,
    baseURL: "http://127.0.0.1:5173",
    browserName: "chromium",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
    },
  },
  webServer: {
    command: "npx next dev --hostname 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
