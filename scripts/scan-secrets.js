#!/usr/bin/env node
/* Simple secret scan: looks for common API key patterns or obvious secrets. */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
// Patterns that strongly indicate an exposed credential VALUE, not just a variable name.
const BLOCKLIST_REGEXES = [
  /sk_live_[0-9a-zA-Z]{10,}/, // Stripe live key value
  /AIza[0-9A-Za-z\-_]{35}/, // Google API key value
  /ghp_[0-9A-Za-z]{36,}/, // GitHub personal access token value
  /-----BEGIN (?:RSA|EC|OPENSSH) PRIVATE KEY-----/, // Any private key block
  /(xox[baprs]-|xapp-)[0-9A-Za-z-]{10,}/, // Slack tokens
  /"?(OPENAI|TOGETHER|ANTHROPIC|MISTRAL)_API_KEY"?\s*[:=]\s*["']?(?:sk-|ghs_)?[A-Za-z0-9-_]{20,}["']?/, // Generic provider API key assignments
  /JWT_SECRET\s*=\s*['"][A-Za-z0-9+\/=]{16,}['"]/i,
];

// Allowlist: file paths (globs substrings) we intentionally ignore even if a regex matches
const ALLOWLIST_PATH_SUBSTRINGS = [
  "README.md",
  "docs/",
  "documentation-worker",
  "CHANGELOG",
  "LICENSE",
  ".md", // general markdown references
];

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".wrangler",
  ".venv",
]);

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".webp",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".zip",
  ".tar",
  ".gz",
  ".bz2",
  ".pdf",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".mp3",
  ".mp4",
  ".wav",
  ".ogg",
  ".wasm",
  ".pack",
]);
let findings = [];

function isAllowlisted(file) {
  const lower = file.toLowerCase();
  return ALLOWLIST_PATH_SUBSTRINGS.some((sub) =>
    lower.includes(sub.toLowerCase()),
  );
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // skip files larger than 50 MB

function scanFile(file) {
  if (isAllowlisted(file)) return; // skip docs and known safe reference files
  if (BINARY_EXTENSIONS.has(path.extname(file).toLowerCase())) return;
  const stat = fs.statSync(file);
  if (stat.size > MAX_FILE_SIZE) return; // skip very large files
  const content = fs.readFileSync(file, "utf8");
  for (const rx of BLOCKLIST_REGEXES) {
    if (rx.test(content)) {
      // Capture a short excerpt for context
      const match = content.match(rx);
      let excerpt = "";
      if (match && match.index !== undefined) {
        excerpt = content
          .substring(
            Math.max(0, match.index - 20),
            match.index + match[0].length + 20,
          )
          .replace(/\n/g, " ");
      }
      findings.push({ file, pattern: rx.toString(), excerpt });
      break; // one hit is enough per file
    }
  }
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
  findings.forEach((f) =>
    console.error(
      ` - ${f.file} matched ${f.pattern}${f.excerpt ? " :: " + f.excerpt : ""}`,
    ),
  );
  process.exit(1);
} else {
  console.log("Secret scan passed. No obvious secrets detected.");
}
