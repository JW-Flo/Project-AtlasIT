#!/usr/bin/env node
/**
 * Console QA Script
 * Usage: CONSOLE_URL=http://localhost:5173 node scripts/qa-console.mjs
 */

const fetch = global.fetch;

const BASE = process.env.CONSOLE_URL || 'http://localhost:5173';
const TIMEOUT_MS = 5000;

function timeout(p, ms = TIMEOUT_MS) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
  ]);
}

async function check(path, validate) {
  const url = BASE.replace(/\/$/, '') + path;
  const start = Date.now();
  let ok = false, detail = '';
  try {
    const res = await timeout(fetch(url));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let body = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) body = await res.json();
    else body = await res.text();
    if (validate) validate(body, res);
    ok = true;
    detail = `${Date.now()-start}ms`;
  } catch (e) {
    detail = e.message;
  }
  return { path, ok, detail };
}

(async () => {
  const results = [];
  results.push(await check('/api/health', (b) => {
    if (!b || b.status !== 'ok') throw new Error('bad health payload');
    if (!b.version) throw new Error('missing version');
    if (!b.commit) throw new Error('missing commit');
    if (!b.journeyId) throw new Error('missing journeyId');
    if (!b.resources) throw new Error('missing resources map');
    const groups = ['d1','kv','r2','analytics','queues'];
    for (const g of groups) if (!b.resources[g]) throw new Error(`missing resource group ${g}`);
  }));
  results.push(await check('/api/mock/compliance/snapshot', (b) => {
    if (!b.frameworkSummary || !Array.isArray(b.frameworkSummary)) throw new Error('missing frameworkSummary');
  }));
  results.push(await check('/console', (t) => {
    if (typeof t !== 'string' || !t.toLowerCase().includes('atlasit console')) throw new Error('console page content mismatch');
  }));
  results.push(await check('/', (t) => {
    // redirect should eventually land at /console
    if (typeof t !== 'string' || !t.toLowerCase().includes('atlasit console')) throw new Error('root redirect failed');
  }));

  const failed = results.filter(r => !r.ok);
  console.log('\nQA RESULTS');
  for (const r of results) {
    console.log(`${r.ok ? '✔' : '✖'} ${r.path} - ${r.detail}`);
  }
  if (failed.length) {
    console.error(`\nFAIL: ${failed.length} endpoint(s) failed.`);
    process.exit(1);
  } else {
    console.log('\nPASS: all endpoints healthy.');
  }
})();
