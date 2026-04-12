import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/qa",
  testMatch: /08-aws-live-smoke\.spec\.ts/,
  reporter: [["list"]],
  timeout: 90_000,
  use: {
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  workers: 1,
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
