#!/usr/bin/env node
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const artifactsDir = path.join(repoRoot, "artifacts", "docs");
mkdirSync(artifactsDir, { recursive: true });

const targets = ["docs", "."];

function listFiles(root, acc = []) {
  const entries = readdirSync(root);
  for (const e of entries) {
    const p = path.join(root, e);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (
        e === "node_modules" ||
        e === "dist" ||
        e === ".git" ||
        e === "artifacts"
      )
        continue;
      listFiles(p, acc);
    } else if (e.endsWith(".md")) {
      acc.push(p);
    }
  }
  return acc;
}

const mdFiles = [
  ...listFiles(path.join(repoRoot, "docs")),
  path.join(repoRoot, "README.md"),
  path.join(repoRoot, "ROADMAP.md"),
  path.join(repoRoot, "CONTEXT.md"),
  path.join(repoRoot, "OPERATIONS.md"),
]
  .filter(Boolean)
  .filter((p) => {
    try {
      statSync(p);
      return true;
    } catch {
      return false;
    }
  });

const linkRegex = /\[[^\]]*\]\(([^)]+)\)/g;
const results = [];

for (const file of mdFiles) {
  let content = "";
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const found = [];
  let m;
  while ((m = linkRegex.exec(content)) !== null) {
    const url = m[1];
    if (!url || url.startsWith("#")) continue;
    found.push(url);
  }
  if (found.length) {
    results.push({ file: path.relative(repoRoot, file), links: found });
  }
}

writeFileSync(
  path.join(artifactsDir, "links-audit.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)
);
console.log("Wrote artifacts/docs/links-audit.json");
