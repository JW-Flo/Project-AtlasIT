#!/usr/bin/env npx tsx
/**
 * Batch scaffold all marketplace adapters from ConnectorManifest templates.
 * Skips adapters that already have hand-written code (okta, google-workspace).
 *
 * Usage: npx tsx scripts/scaffold-all-adapters.ts
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scaffoldAdapter } from "../packages/adapter-gen/src/scaffold.js";
import { ALL_MANIFESTS } from "../packages/connector-schema/src/templates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ADAPTERS_DIR = path.join(ROOT, "adapters");

// Adapters that already have hand-written implementations
const SKIP_SLUGS = new Set(["okta", "google-workspace"]);

async function main() {
  const toScaffold = ALL_MANIFESTS.filter((m) => !SKIP_SLUGS.has(m.slug));

  console.log(`Scaffolding ${toScaffold.length} adapters...\n`);

  for (const manifest of toScaffold) {
    const outDir = path.join(ADAPTERS_DIR, manifest.slug);
    console.log(`  ${manifest.slug} -> ${outDir}`);
    await scaffoldAdapter(manifest, outDir);
  }

  console.log(`\nDone. ${toScaffold.length} adapters scaffolded.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
