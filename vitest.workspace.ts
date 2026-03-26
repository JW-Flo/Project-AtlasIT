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
        "@atlasit/shared": fileURLToPath(
          new URL("./packages/shared/src", import.meta.url),
        ),
        "@atlasit/idp": fileURLToPath(
          new URL("./packages/idp/src", import.meta.url),
        ),
        "@atlasit/idp-okta": fileURLToPath(
          new URL("./packages/idp-adapters/okta/src", import.meta.url),
        ),
        "@atlasit/shared-types": fileURLToPath(
          new URL("./packages/shared-types/src", import.meta.url),
        ),
      },
    },
    test: {
      name: "unit",
      include: [
        "tests/**/*.test.ts",
        "packages/*/src/**/*.test.ts",
        "core-api/src/**/*.test.ts",
        "adapters/*/src/**/*.test.ts",
        "compliance-worker/src/**/*.test.ts",
      ],
      exclude: [
        "**/*.integration.test.ts",
        "**/*.worker.test.ts",
        "tests/adapter-gen*.test.ts",
        "tests/bindings*.test.ts",
        "tests/health*.test.ts",
        "tests/idp-*.test.ts",
        "tests/onboarding.test.ts",
        "tests/api/**",
        "tests/runtime/**",
      ],
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
        // @ts-expect-error -- @cloudflare/vitest-pool-workers extends pool options
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
