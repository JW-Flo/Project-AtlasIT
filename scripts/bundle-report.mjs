#!/usr/bin/env node
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// Simple Vite bundle reporter.
// Usage: node scripts/bundle-report.mjs <dir=dist>
// Fails (exit 1) if any asset > MAX_ASSET_BYTES or total > MAX_TOTAL_BYTES.

const targetDir = process.argv[2] || 'dist';
const MAX_BYTES = parseInt(process.env.MAX_ASSET_BYTES || '', 10) || 400 * 1024; // 400KB
const MAX_TOTAL_BYTES = parseInt(process.env.MAX_TOTAL_BYTES || '', 10) || 2 * 1024 * 1024; // 2MB

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) files = files.concat(walk(full));
    else if (/\.(js|css)$/.test(e.name)) files.push(full);
  }
  return files;
}

try {
  const files = walk(targetDir);
  const assets = files.map(f => ({ file: f, bytes: statSync(f).size }));
  const total = assets.reduce((a,b) => a + b.bytes, 0);
  const largest = assets.slice().sort((a,b)=>b.bytes-a.bytes)[0];
  const result = { total, largest, count: assets.length, maxAssetBudget: MAX_BYTES, maxTotalBudget: MAX_TOTAL_BYTES, assets };
  console.log(JSON.stringify(result, null, 2));
  let fail = false;
  if (largest && largest.bytes > MAX_BYTES) { console.error(`Asset ${largest.file} exceeds budget ${largest.bytes} > ${MAX_BYTES}`); fail = true; }
  if (total > MAX_TOTAL_BYTES) { console.error(`Total bundle size exceeds budget ${total} > ${MAX_TOTAL_BYTES}`); fail = true; }
  process.exit(fail ? 1 : 0);
} catch (err) {
  console.error('bundle-report error', err);
  process.exit(2);
}
