#!/usr/bin/env node

/**
 * CI check: ensures no wrangler.toml has DEV_AUTH_BYPASS in [env.production].
 *
 * Exits with code 1 if any production section contains DEV_AUTH_BYPASS.
 * Run: node scripts/validate-no-dev-bypass.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, relative } from "node:path";
import { execSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");

// Find all wrangler.toml files
function findWranglerFiles() {
  try {
    const output = execSync("find . -name wrangler.toml -not -path '*/node_modules/*'", {
      cwd: ROOT,
      encoding: "utf-8",
    });
    return output
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((rel) => resolve(ROOT, rel));
  } catch {
    return [];
  }
}

/**
 * Checks whether a wrangler.toml file has DEV_AUTH_BYPASS inside an [env.production] section.
 * Returns true if a violation is found.
 */
function checkFile(filePath) {
  if (!existsSync(filePath)) return false;

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  let inProductionSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headers
    if (/^\[/.test(trimmed)) {
      // Check if this is a production section (env.production or env.production.*)
      inProductionSection = /^\[env\.production\b/.test(trimmed);
      continue;
    }

    // Check for DEV_AUTH_BYPASS in production sections
    if (inProductionSection && /DEV_AUTH_BYPASS/i.test(trimmed)) {
      return true;
    }
  }

  return false;
}

const files = findWranglerFiles();

if (files.length === 0) {
  console.log("No wrangler.toml files found.");
  process.exit(0);
}

let violations = 0;

for (const f of files) {
  if (checkFile(f)) {
    const rel = relative(ROOT, f);
    console.error(`FAIL: ${rel} has DEV_AUTH_BYPASS in [env.production] section`);
    violations++;
  }
}

if (violations > 0) {
  console.error(
    `\n${violations} file(s) have DEV_AUTH_BYPASS in production config. Remove it.`,
  );
  process.exit(1);
} else {
  console.log(`OK: ${files.length} wrangler.toml file(s) checked, no DEV_AUTH_BYPASS in production.`);
  process.exit(0);
}
