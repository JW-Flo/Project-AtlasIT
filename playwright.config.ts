import { defineConfig } from "@playwright/test";

// Prefer explicit env override; fallback to common dev ports (worker:8787, vite:5173)
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ||
  (process.env.USE_VITE_DEV
    ? "http://localhost:5173"
    : "http://localhost:8787");

export default defineConfig({
  timeout: 30_000,
  testDir: "./tests/smoke",
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
});
