import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@atlasit/idp": fileURLToPath(
        new URL("./packages/idp/src", import.meta.url),
      ),
      "@atlasit/idp-okta": fileURLToPath(
        new URL("./packages/idp-adapters/okta/src", import.meta.url),
      ),
    },
  },
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    coverage: {
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 30,
        statements: 40,
      },
    },
  },
});
