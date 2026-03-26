#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf-8')); }
const repoRoot = process.cwd();
const configPath = path.join(repoRoot,'artifacts/codex-work.json');
if(!fs.existsSync(configPath)){
  console.error('[codex-guard] artifacts/codex-work.json missing; skipping');
  process.exit(0);
}
const cfg = readJson(configPath);
const protectedGlobs = Object.values(cfg.protected || {}).flat();
if(!protectedGlobs.length){ process.exit(0); }

// Collect staged files
const staged = execSync('git diff --cached --name-only', { encoding:'utf-8' })
  .split(/\n+/).map(s=>s.trim()).filter(Boolean);
if(!staged.length){ process.exit(0); }

// Very small glob matcher (supports ** and *)
function toRegex(glob){
  const escaped = glob.split(/\*\*/g).map(part => part.replace(/[.+?^${}()|[\]\\]/g,'\\$&')).join('§DOUBLESTAR§');
  let pattern = escaped.replace(/\*/g,'[^/]*').replace(/§DOUBLESTAR§/g,'.*');
  pattern = '^' + pattern + '$';
  return new RegExp(pattern);
}
const matchers = protectedGlobs.map(g=>({ glob:g, re: toRegex(g) }));

const violations = [];
for(const f of staged){
  for(const m of matchers){
    if(m.re.test(f)){
      violations.push({ file:f, glob:m.glob });
      break;
    }
  }
}

if(violations.length){
  console.error('\n[codex-guard] Preventing commit: attempted changes in Codex protected areas');
  for(const v of violations){
    console.error(`  - ${v.file} (matched ${v.glob})`);
  }
  console.error('\nTo proceed, coordinate with Codex maintainer or update allowlist.');
  process.exit(1);
}
process.exit(0);
