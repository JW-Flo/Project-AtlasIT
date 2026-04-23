import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { execSync } from "node:child_process";

const pkg = JSON.parse(await (await import("node:fs/promises")).readFile("package.json", "utf-8"));
let commit = "unknown";
try {
  commit = execSync("git rev-parse --short HEAD").toString().trim();
} catch {}

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version || "0.0.0"),
    __GIT_COMMIT__: JSON.stringify(commit),
  },
  ssr: {
    noExternal: [],
    external: [
      "pg",
      "pg-pool",
      "pg-protocol",
      "pg-types",
      "pg-connection-string",
      "pgpass",
      "@aws-sdk/client-secrets-manager",
      "@aws-sdk/nested-clients",
    ],
  },
});
