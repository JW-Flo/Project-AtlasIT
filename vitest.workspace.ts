import { defineWorkspace } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineWorkspace([
  // Node-based tests (existing test suite)
  {
    resolve: {
      alias: {
        "cloudflare:workers": fileURLToPath(
          new URL(
            "./tests/integration/__mocks__/cloudflare-workers.ts",
            import.meta.url,
          ),
        ),
      },
    },
    test: {
      name: "unit",
      include: [
        "tests/**/*.test.ts",
        "packages/*/src/**/*.test.ts",
        "core-api/src/**/*.test.ts",
      ],
      exclude: ["**/*.integration.test.ts", "**/*.worker.test.ts"],
      environment: "node",
    },
  },
  // Worker-based tests (Cloudflare Workers runtime)
  {
    test: {
      name: "workers",
      include: ["**/*.worker.test.ts"],
      pool: "@cloudflare/vitest-pool-workers",
      poolOptions: {
        workers: {
          wrangler: {
            configPath: "./wrangler.toml",
          },
          miniflare: {
            d1Databases: ["ATLAS_CORE_DB"],
            kvNamespaces: [
              "KV_SESSIONS",
              "KV_CACHE",
              "KV_FEATURE_FLAGS",
              "MCP_STORE",
            ],
            r2Buckets: ["atlas_policies", "atlas_evidence", "atlas_artifacts"],
          },
        },
      },
    },
  },
]);
