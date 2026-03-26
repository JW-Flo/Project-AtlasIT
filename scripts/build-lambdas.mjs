#!/usr/bin/env node
/**
 * Build all Lambda functions in lambdas/ using esbuild.
 * Outputs to lambdas/<name>/dist/handler.js (single-file bundle).
 */

import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const LAMBDAS_DIR = new URL("../lambdas", import.meta.url).pathname;
// console-ssr is built by SvelteKit's own pipeline, not esbuild
const SKIP = new Set(["console-ssr"]);
const dirs = readdirSync(LAMBDAS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !SKIP.has(d.name))
  .map((d) => d.name);

console.log(`Building ${dirs.length} lambdas...`);

let failed = 0;
for (const name of dirs) {
  const srcDir = join(LAMBDAS_DIR, name, "src");
  const entry = join(srcDir, "handler.ts");
  const outDir = join(LAMBDAS_DIR, name, "dist");

  if (!existsSync(entry)) {
    console.warn(`  SKIP ${name} (no src/handler.ts)`);
    continue;
  }

  try {
    execFileSync("npx", [
      "esbuild",
      entry,
      "--bundle",
      "--platform=node",
      "--target=node20",
      "--format=esm",
      `--outdir=${outDir}`,
      "--sourcemap",
      "--external:@aws-sdk/*",
      "--external:@atlasit/*",
    ], { stdio: "pipe" });
    console.log(`  OK   ${name}`);
  } catch (err) {
    console.error(`  FAIL ${name}: ${err.stderr?.toString().trim()}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} lambda(s) failed to build.`);
  process.exit(1);
}

console.log("\nAll lambdas built successfully.");
