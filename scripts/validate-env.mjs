#!/usr/bin/env node
/**
 * Validate required environment variables for AtlasIT local/deploy contexts.
 * Exits non-zero and prints a concise report if anything critical is missing.
 */
import fs from 'fs';
import path from 'path';

// Allow CF_API_TOKEN legacy name; prefer CLOUDFLARE_API_TOKEN moving forward.
const REQUIRED_BASE = [
  'CF_ACCOUNT_ID',
  // token handled separately
  'D1_DATABASE',
  'KV_NAMESPACE',
  'R2_BUCKET'
];

const REQUIRED_SERVICE_KEYS = [
  'ONBOARDING_API_KEY',
  'ORCHESTRATOR_API_KEY'
];

const OPTIONAL_IDP = [
  'OKTA_DOMAIN',
  'OKTA_API_TOKEN',
  'OKTA_CLIENT_ID',
  'OKTA_CLIENT_SECRET'
];

function has(v){ return process.env[v] && process.env[v].trim() !== ''; }

// Load .env if present (simple parser, non-destructive)
const envFile = path.join(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
  for (const l of lines) {
    if (!l || l.trim().startsWith('#')) continue;
    const idx = l.indexOf('=');
    if (idx === -1) continue;
    const k = l.slice(0, idx).trim();
    if (!(k in process.env)) {
      process.env[k] = l.slice(idx+1).trim();
    }
  }
}

const missing = [];

const CF_API_TOKEN =
  process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || '';
if (CF_API_TOKEN && !process.env.CF_API_TOKEN) {
  process.env.CF_API_TOKEN = CF_API_TOKEN;
}

for (const key of REQUIRED_BASE) {
  if (!has(key)) missing.push(key);
}

// Cloudflare token check (either new or legacy)
if (!CF_API_TOKEN) {
  missing.push('CLOUDFLARE_API_TOKEN (or legacy CF_API_TOKEN)');
}

for (const key of REQUIRED_SERVICE_KEYS) {
  if (!has(key)) missing.push(key);
}

// Conditional Okta
if (process.env.FEATURE_IDP_OKTA === 'true') {
  for (const k of OPTIONAL_IDP) if (!has(k)) missing.push(k + ' (required because FEATURE_IDP_OKTA=true)');
}

if (missing.length) {
  console.error('\n[ENV VALIDATION] Missing required variables:');
  for (const m of missing) console.error(' -', m);
  console.error('\nAdd them to .env or inject via secrets before deploying.');
  process.exit(1);
} else {
  console.log('[ENV VALIDATION] All required environment variables are present.');
}
