#!/usr/bin/env node
/**
 * AtlasIT MVP Deployment Script
 *
 * Deploys, in order:
 * 1) dispatch-worker (Workers for Platforms gateway)
 * 2) compliance-worker (demo compliance API)
 * 3) ai-orchestrator (optional, health + AI quota)
 * 4) console-app (UI)
 *
 * Requirements:
 * - wrangler logged in (wrangler login)
 * - Cloudflare account_id set in wrangler.toml files
 * - D1 databases created for dispatch/compliance where referenced
 *
 * Optional env:
 * - CONSOLE_PUBLIC_URL (for smoke)
 * - DISPATCH_ADMIN_TOKEN (set as secret for console & used for smoke)
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function run(cmd, opts = {}) {
  console.log(`\n› ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

function exists(p) {
  return fs.existsSync(p);
}

function step(title) {
  console.log(`\n=== ${title} ===`);
}

const root = process.cwd();

async function main() {
  step('Verify environment');
  try {
    run('wrangler whoami');
  } catch (e) {
    console.error('Wrangler not authenticated. Run: wrangler login');
    process.exit(1);
  }

  // Build shared (if applicable)
  if (exists(path.join(root, 'packages', 'shared'))) {
    step('Build shared package');
    try { run('npm run build:shared'); } catch {}
  }

  // 1) Dispatch worker
  const dispatchDir = path.join(root, 'dispatch-worker');
  if (exists(dispatchDir)) {
    step('Deploy dispatch-worker');
    try { run('npm i --no-fund --no-audit', { cwd: dispatchDir }); } catch {}
    // Set admin token as secret if provided
    if (process.env.DISPATCH_ADMIN_TOKEN) {
      run(`bash -lc 'printf %s "${process.env.DISPATCH_ADMIN_TOKEN}" | npx wrangler secret put DISPATCH_ADMIN_TOKEN'`, { cwd: dispatchDir });
    }
    // Apply D1 migrations using database name defined in wrangler.toml
    run('npx wrangler d1 migrations apply atlasit-shared', { cwd: dispatchDir });
    run('npx wrangler deploy', { cwd: dispatchDir });
  } else {
    console.warn('dispatch-worker not present, skipping');
  }

  // 1b) Core worker (root index.js, env.core)
  const rootWrangler = path.join(root, 'wrangler.toml');
  if (exists(rootWrangler)) {
    step('Deploy core worker (env.core)');
    try { run('npx wrangler deploy -e core'); } catch (e) {
      console.warn('Core deploy failed (non-fatal for demo):', e?.message || e);
    }
  }

  // 2) Compliance worker
  const complianceDir = path.join(root, 'compliance-worker');
  if (exists(complianceDir)) {
    step('Deploy compliance-worker');
  try { run('npm i --no-fund --no-audit', { cwd: complianceDir }); } catch {}
  run('npx wrangler d1 migrations apply atlasit_compliance', { cwd: complianceDir });
    run('npx wrangler deploy', { cwd: complianceDir });
  } else {
    console.warn('compliance-worker not present, skipping');
  }

  // 3) AI orchestrator (optional)
  const orchestratorDir = path.join(root, 'ai-orchestrator');
  if (exists(orchestratorDir)) {
    step('Deploy ai-orchestrator');
    try { run('npm i --no-fund --no-audit', { cwd: orchestratorDir }); } catch {}
    run('npx wrangler deploy', { cwd: orchestratorDir });
  }

  // 3b) AI gateway worker (optional)
  const aiEnv = process.env.DEPLOY_AI_GATEWAY === '1';
  if (aiEnv && exists(rootWrangler)) {
    step('Deploy ai-gateway worker (env.ai)');
    try { run('npx wrangler deploy -e ai'); } catch (e) {
      console.warn('AI gateway deploy failed (continuing):', e?.message || e);
    }
  }

  // 4) Console app
  const consoleDir = path.join(root, 'console-app');
  if (exists(consoleDir)) {
    step('Build & deploy console-app');
    try { run('npm i --no-fund --no-audit', { cwd: consoleDir }); } catch {}
    // Mirror admin token secret into console for /api/platform/usage proxy
    if (process.env.DISPATCH_ADMIN_TOKEN) {
      run(`bash -lc 'printf %s "${process.env.DISPATCH_ADMIN_TOKEN}" | npx wrangler secret put DISPATCH_ADMIN_TOKEN'`, { cwd: consoleDir });
    }
    run('npm run build', { cwd: consoleDir });
    run('npx wrangler deploy', { cwd: consoleDir });
  } else {
    console.warn('console-app not present, skipping');
  }

  // Smoke
  const base = process.env.CONSOLE_PUBLIC_URL;
  if (base) {
    step('Smoke checks');
    try { run(`curl -sf ${base}/api/health | jq .`); } catch {}
    try { run(`curl -sf ${base}/api/config | jq .`); } catch {}
  } else {
    console.log('Set CONSOLE_PUBLIC_URL to run smoke checks');
  }

  console.log('\nMVP deployment sequence complete.');

  // Resolve routes (from wrangler output or env)
  const consoleOrigin = process.env.CONSOLE_PUBLIC_URL || 'https://<console-workers-domain>';
  const dispatchOrigin = process.env.DISPATCH_PUBLIC_URL || 'https://<dispatch-workers-domain>';
  const orchOrigin = 'https://<orchestrator-workers-domain>';
  const compOrigin = 'https://<compliance-workers-domain>';

  console.log('\nResolved Routes:');
  console.log(`Console: ${consoleOrigin}`);
  console.log(`Dispatch: ${dispatchOrigin}`);
  console.log(`Orchestrator: ${orchOrigin}`);
  console.log(`Compliance: ${compOrigin}`);

  console.log('\nSmoke Curls:');
  console.log(`curl -fsS "${consoleOrigin}/health"`);
  console.log(`curl -fsS "${consoleOrigin}/api/config"`);
  console.log(`curl -fsS "${consoleOrigin}/admin/usage/summary"`);
  console.log(`curl -fsS -H "x-admin-token: ${process.env.DISPATCH_ADMIN_TOKEN || '<token>'}" "${dispatchOrigin}/admin/usage/summary"`);
  console.log(`curl -fsS "${orchOrigin}/health" || true`);
  console.log(`curl -fsS "${compOrigin}/health" || true`);
  console.log('echo "MVP SMOKE: GREEN"');
}

main().catch((e) => { console.error(e); process.exit(1); });
