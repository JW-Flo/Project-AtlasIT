#!/usr/bin/env node
/**
 * OpenAPI Spec Verification Script
 * - Ensures required paths & schemas exist
 * - Validates basic structure (lightweight)
 */
import { readFile } from "fs/promises";
import path from "path";
import process from "process";
import yaml from "js-yaml";

const SPEC_PATH = "docs/api/openapi.yaml";
const REQUIRED_PATHS = ["/health", "/api/compliance/snapshot"];
const REQUIRED_SCHEMAS = [
  "ComplianceSnapshot",
  "FrameworkSummary",
  "Risk",
  "Policy",
  "Error",
];

function fail(msg) {
  console.error(`❌ OpenAPI verify failed: ${msg}`);
  process.exit(1);
}

async function main() {
  try {
    const fullPath = path.resolve(SPEC_PATH);
    const raw = await readFile(fullPath, "utf8");
    const spec = yaml.load(raw);

    if (!spec.openapi || !/^3\.1\./.test(spec.openapi)) {
      fail(
        `OpenAPI version must be 3.1.x (found: ${spec.openapi || "missing"})`
      );
    }
    if (!spec.paths) fail("Missing paths section");
    if (!spec.components || !spec.components.schemas)
      fail("Missing components.schemas section");

    for (const p of REQUIRED_PATHS) {
      if (!spec.paths[p]) fail(`Required path missing: ${p}`);
    }
    for (const s of REQUIRED_SCHEMAS) {
      if (!spec.components.schemas[s]) fail(`Required schema missing: ${s}`);
    }

    console.log("✅ OpenAPI verification passed");
    console.log(`   Paths: ${Object.keys(spec.paths).length}`);
    console.log(`   Schemas: ${Object.keys(spec.components.schemas).length}`);
  } catch (err) {
    fail(err.message || String(err));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
