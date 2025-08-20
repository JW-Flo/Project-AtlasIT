import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // Use plain node environment; integration test manually creates Miniflare instance.
    environment: "node",
  },
});
