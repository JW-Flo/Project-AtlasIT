import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const pkg = JSON.parse(await (await import("node:fs/promises")).readFile("package.json", "utf-8"));
let commit = "unknown";
try {
  commit = execSync("git rev-parse --short HEAD").toString().trim();
} catch {}

// Support SVELTE_CONFIG env var for alternate adapter configs (e.g. adapter-static for AWS S3).
// Usage: SVELTE_CONFIG=console-app/svelte.config.aws.js pnpm --filter console-app run build
// In CI the working tree is ephemeral; the original svelte.config.js is never committed back.
const svelteConfigEnv = process.env.SVELTE_CONFIG;
if (svelteConfigEnv) {
  const configName = basename(svelteConfigEnv); // e.g. "svelte.config.aws.js"
  if (configName !== "svelte.config.js" && configName !== "svelte.config.ts") {
    const src = resolve(__dirname, configName);
    const dst = resolve(__dirname, "svelte.config.js");
    if (existsSync(src)) {
      copyFileSync(src, dst);
    }
  }
}

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version || "0.0.0"),
    __GIT_COMMIT__: JSON.stringify(commit),
  },
});
