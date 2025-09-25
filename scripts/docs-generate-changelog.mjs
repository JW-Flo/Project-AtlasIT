#!/usr/bin/env node
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function safeRun(cmd) {
  try {
    return run(cmd);
  } catch {
    return "";
  }
}

const repoRoot = process.cwd();
const artifactsDir = path.join(repoRoot, "artifacts", "docs");
mkdirSync(artifactsDir, { recursive: true });

const base = process.env.DOCS_BASE_REF || "main";
const head = safeRun("git rev-parse --abbrev-ref HEAD") || "HEAD";
const targets = [
  "docs/**",
  "README.md",
  "ROADMAP.md",
  "CONTEXT.md",
  "OPERATIONS.md",
  "ops/hand-off.md",
  "ops/pr-bodies/PR6_docs-alignment.md",
].join(" ");

const diff = safeRun(
  `git diff --name-status --no-renames ${base}...${head} -- ${targets}`
);
const shortstat = safeRun(
  `git diff --shortstat ${base}...${head} -- ${targets}`
);
const branch = head;
const now = new Date().toISOString();

const lines = [];
lines.push(`# Docs changelog`);
lines.push("");
lines.push(`Generated: ${now}`);
lines.push(`Base: ${base}`);
lines.push(`Head: ${branch}`);
lines.push("");
if (shortstat) lines.push(`Summary: ${shortstat}`);
lines.push("");
lines.push("## Changed files");
lines.push("");
if (diff) {
  for (const line of diff.split("\n")) {
    if (!line) continue;
    const [status, ...rest] = line.split(/\s+/);
    const file = rest.join(" ");
    lines.push(`- [${status}] ${file}`);
  }
} else {
  lines.push("- (no changes detected for targeted docs paths)");
}
lines.push("");

writeFileSync(
  path.join(artifactsDir, "changelog.md"),
  lines.join("\n"),
  "utf8"
);
console.log("Wrote artifacts/docs/changelog.md");
