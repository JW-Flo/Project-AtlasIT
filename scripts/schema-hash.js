#!/usr/bin/env node
/**
 * Computes a stable hash for all SQL migrations (ordered lexicographically) to detect drift.
 * Usage: node scripts/schema-hash.js
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function hashMigrations(dir) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const hash = crypto.createHash("sha256");
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file));
    hash.update(file + "\n");
    hash.update(content);
  }
  return { files, hash: hash.digest("hex") };
}

const onboardingDir = path.join(process.cwd(), "onboarding", "migrations");
if (!fs.existsSync(onboardingDir)) {
  console.error("Migrations directory not found:", onboardingDir);
  process.exit(1);
}

const result = hashMigrations(onboardingDir);
console.log(JSON.stringify(result, null, 2));
