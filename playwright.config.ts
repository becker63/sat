import { defineConfig } from "@playwright/test";

const isReplit = !!process.env.REPL_ID;
const basePort = isReplit ? 5000 : 5173;

export default defineConfig({
  testDir: "./src/components",
  testMatch: ["**/*.e2e.spec.ts", "**/*.e2e.spec.tsx"],
  timeout: 30_000,
  workers: process.env.CI ? 4 : 8,
  use: {
    headless: true,
    baseURL: `http://127.0.0.1:${basePort}`,
    browserName: "chromium",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || (isReplit ? "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium" : undefined),
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  },
  webServer: isReplit
    ? undefined
    : {
        command:
          'npx panda cssgen "./src/**/*.{ts,tsx}" && npx next dev --hostname 127.0.0.1 --port 5173',
        url: "http://127.0.0.1:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
