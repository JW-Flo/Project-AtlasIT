#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inline minimal engine to avoid importing TS
function sha256Hex(json) {
  const data = new TextEncoder().encode(JSON.stringify(json));
  // Since we’re in Node 18+, use crypto.subtle
  return crypto.subtle.digest('SHA-256', data).then(buf =>
    Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  );
}

async function main() {
  const subjects = [
    { id: 'user-1', mfaEnabled: true, passwordLength: 16, devicePosture: 'healthy' },
    { id: 'user-2', mfaEnabled: false, passwordLength: 8, devicePosture: 'risky' }
  ];
  const timestamp = new Date().toISOString();

  const records = [];
  for (const s of subjects) {
    const mfa = { control: 'MFA_REQUIRED', subject: s.id, result: { status: s.mfaEnabled ? 'pass' : 'fail', reason: s.mfaEnabled ? undefined : 'Multi-factor authentication is not enabled' }, timestamp };
    const pass = { control: 'PASSWORD_MIN_LENGTH', subject: s.id, result: { status: (s.passwordLength ?? 0) >= 12 ? 'pass' : 'fail', reason: (s.passwordLength ?? 0) >= 12 ? undefined : `Password length ${s.passwordLength ?? 0} is below minimum of 12` }, timestamp };
    const dev = { control: 'DEVICE_POSTURE_HEALTHY', subject: s.id, result: { status: (s.devicePosture ?? '').toLowerCase() === 'healthy' ? 'pass' : 'fail', reason: (s.devicePosture ?? '').toLowerCase() === 'healthy' ? undefined : `Reported posture '${s.devicePosture ?? 'unknown'}' is not healthy` }, timestamp };
    for (const r of [mfa, pass, dev]) {
      const hash = await sha256Hex(r);
      records.push({ ...r, hash });
    }
  }

  const out = path.resolve(process.cwd(), 'artifacts/policy/evidence.json');
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(records, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ status: 'ok', output: path.relative(process.cwd(), out), count: records.length }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
