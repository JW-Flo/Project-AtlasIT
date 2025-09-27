#!/usr/bin/env node
/**
 * Miniflare QA harness for AtlasIT Console Worker.
 * Requires prior build (npm run build) to have .svelte-kit/cloudflare/_worker.js
 */
import { Miniflare } from 'miniflare';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerEntry = path.resolve(__dirname, '../.svelte-kit/cloudflare/_worker.js');

import fs from 'node:fs';

if (!fs.existsSync(workerEntry)) {
  console.error('Built worker not found at', workerEntry, '\nRun: npm run build first.');
  process.exit(1);
}

const mf = new Miniflare({
  modules: true,
  scriptPath: workerEntry,
  compatibilityDate: '2025-09-27',
  compatibilityFlags: ['nodejs_compat'],
  envPath: false,
  kvNamespaces: ["SESSION"],
  r2Buckets: ["R2_BUCKET"],
  durableObjects: {},
  bindings: {
    SITE_URL: 'http://localhost'
  }
});

async function req(pathname) {
  const res = await mf.dispatchFetch('http://internal' + pathname);
  return res;
}

async function run() {
  const tests = [
    {
      path: '/api/health',
      validate: async (r) => {
        const j = await r.json();
        const missing = [];
        if (j.status !== 'ok') missing.push('status');
        for (const key of ['version','commit','timestamp']) {
          if (!j[key]) missing.push(key);
        }
        if (missing.length) throw new Error('health fields invalid: '+missing.join(','));
      }
    },
    {
      path: '/api/mock/compliance/snapshot',
      validate: async (r) => {
        const j = await r.json();
        if (!Array.isArray(j.frameworkSummary)) throw new Error('frameworkSummary missing');
      }
    },
    {
      path: '/console',
      validate: async (r) => {
        const t = await r.text();
        if (!t.toLowerCase().includes('atlasit console')) throw new Error('console html missing');
      }
    },
    {
      path: '/',
      validate: async (r) => {
        if (r.status !== 307 && r.status !== 308) {
          const t = await r.text();
          if (!t.toLowerCase().includes('atlasit console')) throw new Error('root redirect/content fail');
        }
      }
    }
  ];
  let failures = 0;
  for (const t of tests) {
    const start = Date.now();
    try {
      const res = await req(t.path);
      if (!res) throw new Error('no response');
      await t.validate(res.clone());
      console.log(`✔ ${t.path} ${res.status} ${Date.now()-start}ms`);
    } catch (e) {
      failures++;
      console.error(`✖ ${t.path} ${e.message}`);
    }
  }
  if (failures) {
    console.error(`FAIL: ${failures} endpoints failed`);
    process.exit(1);
  } else {
    console.log('PASS: all endpoints validated under Miniflare runtime');
  }
}

run().catch(e => { console.error(e); process.exit(1); });
