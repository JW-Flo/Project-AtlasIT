import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // Use plain node environment; integration test manually creates Miniflare instance.
    environment: "node",
    // Exclude CF Workers integration tests — miniflare v4 dist broken, and these
    // test the CF Workers path which is being replaced by AWS Lambda (M6).
    exclude: [
      "dist/**",
      "**/auth-correlation.test.ts",
      "**/integration.test.ts",
      "**/rate-limit.test.ts",
      "**/node_modules/**",
    ],
  },
});
