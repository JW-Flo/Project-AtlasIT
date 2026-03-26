#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const artifactsDir = path.join(repoRoot, "artifacts", "docs");
mkdirSync(artifactsDir, { recursive: true });

const payload = {
  generatedAt: new Date().toISOString(),
  branch: process.env.GITHUB_HEAD_REF || process.env.BRANCH || null,
  base: process.env.DOCS_BASE_REF || "main",
  actor: process.env.GITHUB_ACTOR || null,
};

writeFileSync(
  path.join(artifactsDir, "RUN.json"),
  JSON.stringify(payload, null, 2)
);
console.log("Wrote artifacts/docs/RUN.json");
