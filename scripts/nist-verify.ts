#!/usr/bin/env node
/**
 * nist-verify.ts
 * Verifies NIST control mappings and evidence coverage
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { emitEvidence } from './emit-evidence.js';

// NIST 800-53 controls relevant to autonomous development
const NIST_CONTROLS = {
  'NIST-AC-2': 'Account Management',
  'NIST-AU-2': 'Audit Events',
  'NIST-AU-6': 'Audit Review, Analysis, and Reporting',
  'NIST-CM-3': 'Configuration Change Control',
  'NIST-SA-11': 'Developer Security Testing and Evaluation',
  'NIST-SI-7': 'Software and Information Integrity',
};

interface EvidenceArtifact {
  trace_id: string;
  control_id: string;
  timestamp: string;
  result: 'pass' | 'fail' | 'skip' | 'error';
  metadata?: Record<string, unknown>;
}

function verifyNistControls(): number {
  console.log('[NIST-VERIFY] Starting NIST control verification...');

  const artifactsDir = join(process.cwd(), 'artifacts');
  let files: string[] = [];

  try {
    files = readdirSync(artifactsDir).filter((f) => f.endsWith('.json'));
  } catch (error) {
    console.error('[NIST-VERIFY] No artifacts directory found');
    emitEvidence('NIST-VERIFY', 'error', { error: 'No artifacts directory' });
    return 1;
  }

  const evidenceMap = new Map<string, EvidenceArtifact[]>();

  for (const file of files) {
    try {
      const content = readFileSync(join(artifactsDir, file), 'utf-8');
      const evidence: EvidenceArtifact = JSON.parse(content);

      if (evidence.control_id?.startsWith('NIST-')) {
        const existing = evidenceMap.get(evidence.control_id) || [];
        existing.push(evidence);
        evidenceMap.set(evidence.control_id, existing);
      }
    } catch (error) {
      console.warn(`[NIST-VERIFY] Failed to parse ${file}`);
    }
  }

  let verified = 0;
  let missing = 0;

  for (const [controlId, description] of Object.entries(NIST_CONTROLS)) {
    const evidence = evidenceMap.get(controlId);
    if (evidence && evidence.length > 0) {
      console.log(`✅ ${controlId}: ${description} (${evidence.length} artifacts)`);
      verified++;
    } else {
      console.log(`⚠️  ${controlId}: ${description} (no evidence)`);
      missing++;
    }
  }

  const result = missing === 0 ? 'pass' : 'fail';
  emitEvidence('NIST-VERIFY', result, {
    verified,
    missing,
    total: Object.keys(NIST_CONTROLS).length,
  });

  console.log(`\n[NIST-VERIFY] Summary: ${verified} verified, ${missing} missing`);

  return missing > 0 ? 1 : 0;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = verifyNistControls();
  process.exit(exitCode);
}

export { verifyNistControls };
