import { defineConfig } from "@playwright/test";

// Prefer explicit env override; fallback to common dev ports (worker:8787, vite:5173)
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173";

export default defineConfig({
  globalSetup: "./tests/global-setup.js",
  globalTeardown: "./tests/global-teardown.js",
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  projects: [
    {
      name: "smoke",
      testDir: "./tests/smoke",
      timeout: 30_000,
      retries: process.env.CI ? 2 : 0,
      use: {
        baseURL,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
      },
    },
    {
      name: "full",
      testDir: "./tests/full",
      timeout: 45_000,
      retries: 0,
      use: {
        baseURL,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
      },
    },
    {
      name: "qa",
      testDir: "./tests/qa",
      timeout: 60_000,
      retries: 0,
      use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://console.atlasit.pro",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
      },
    },
  ],
});
