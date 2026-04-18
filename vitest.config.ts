import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@atlasit/idp": fileURLToPath(new URL("./packages/idp/src", import.meta.url)),
      "@atlasit/idp-okta": fileURLToPath(
        new URL("./packages/idp-adapters/okta/src", import.meta.url),
      ),
      "@atlasit/shared-types": fileURLToPath(
        new URL("./packages/shared-types/src", import.meta.url),
      ),
      "@atlasit/shared": fileURLToPath(new URL("./packages/shared/src", import.meta.url)),
    },
  },
  test: {
    include: ["**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      // Transitively imports cloudflare:workers via the legacy CF Worker
      // entrypoint; orchestrator is now lambdas/orchestrator/ and the CF
      // source is retained only as a reference port.
      "ai-orchestrator/stream.evidence.test.ts",
    ],
    environment: "node",
    coverage: {
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
