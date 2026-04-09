#!/usr/bin/env node
/**
 * Build all Lambda functions in lambdas/ using esbuild.
 * Outputs to lambdas/<name>/dist/handler.js (single-file CJS bundle).
 */

import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import esbuild from "esbuild";

// Plugin: resolve .js imports to .ts source files (TypeScript convention)
const tsResolvePlugin = {
  name: "ts-resolve",
  setup(build) {
    build.onResolve({ filter: /\.js$/ }, (args) => {
      if (args.kind !== "import-statement" && args.kind !== "dynamic-import") return;
      if (!args.resolveDir) return;
      const tsPath = join(args.resolveDir, args.path.replace(/\.js$/, ".ts"));
      if (existsSync(tsPath)) {
        return { path: tsPath };
      }
    });
  },
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const LAMBDAS_DIR = join(ROOT_DIR, "lambdas");
const SHARED_SRC = join(ROOT_DIR, "packages", "shared", "src");

// console-ssr is built by SvelteKit's own pipeline, not esbuild
const SKIP = new Set(["console-ssr"]);
const dirs = readdirSync(LAMBDAS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !SKIP.has(d.name))
  .map((d) => d.name);

// Allow building a single function via --function flag
const fnArg = process.argv.find((a) => a.startsWith("--function"));
const targetFn = fnArg ? process.argv[process.argv.indexOf(fnArg) + 1] : null;

const toBuild = targetFn ? dirs.filter((d) => d === targetFn) : dirs;

console.log(`Building ${toBuild.length} lambdas...`);

let failed = 0;
for (const name of toBuild) {
  const srcDir = join(LAMBDAS_DIR, name, "src");
  const entry = join(srcDir, "handler.ts");
  const outDir = join(LAMBDAS_DIR, name, "dist");

  if (!existsSync(entry)) {
    console.warn(`  SKIP ${name} (no src/handler.ts)`);
    continue;
  }

  try {
    await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      platform: "node",
      target: "node20",
      format: "cjs",
      outdir: outDir,
      sourcemap: true,
      external: ["@aws-sdk/*", "crypto", "pg", "pg-native"],
      alias: {
        "@atlasit/shared": SHARED_SRC,
      },
      resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
      plugins: [tsResolvePlugin],
    });
    console.log(`  OK   ${name}`);
  } catch (err) {
    console.error(`  FAIL ${name}: ${(err.message || "").slice(0, 500)}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} lambda(s) failed to build.`);
  process.exit(1);
}

console.log("\nAll lambdas built successfully.");
