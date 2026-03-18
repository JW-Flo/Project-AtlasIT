import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "cloudflare:workers": fileURLToPath(
        new URL(
          "../tests/integration/__mocks__/cloudflare-workers.ts",
          import.meta.url,
        ),
      ),
      "@atlasit/shared": fileURLToPath(
        new URL("../packages/shared/src", import.meta.url),
      ),
    },
  },
  test: {
    name: "ai-orchestrator",
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    environment: "node",
  },
});
