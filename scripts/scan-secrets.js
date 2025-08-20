#!/usr/bin/env node
/* Simple secret scan: looks for common API key patterns or obvious secrets. */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const BLOCKLIST_REGEXES = [
  /sk_live_[0-9a-zA-Z]{10,}/, // Stripe live key
  /AIza[0-9A-Za-z\-_]{35}/, // Google API key
  /ghp_[0-9A-Za-z]{36,}/, // GitHub personal access token
  /-----BEGIN (?:RSA|EC|OPENSSH) PRIVATE KEY-----/, // Private key
  /OPENAI_API_KEY/i, // Literal inclusion
  /TOGETHER_API_KEY/i,
  /JWT_SECRET\s*=\s*['"][^'"]+['"]/i,
];

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".wrangler",
]);
let findings = [];

function scanFile(file) {
  const content = fs.readFileSync(file, "utf8");
  BLOCKLIST_REGEXES.forEach((rx) => {
    if (rx.test(content)) {
      findings.push({ file, pattern: rx.toString() });
    }
  });
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile()) scanFile(full);
  }
}

walk(ROOT);

if (findings.length) {
  console.error("Secret scan failed. Potential secrets found:");
  findings.forEach((f) => console.error(` - ${f.file} matched ${f.pattern}`));
  process.exit(1);
} else {
  console.log("Secret scan passed. No obvious secrets detected.");
}
