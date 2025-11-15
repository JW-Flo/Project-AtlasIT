#!/usr/bin/env node
/**
 * emit-evidence.ts
 * Utility to emit evidence artifacts in standardized format
 */

import { randomUUID } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface EvidenceArtifact {
  trace_id: string;
  control_id: string;
  timestamp: string;
  tenant_id?: string;
  subject_id?: string;
  decision_ref?: string;
  result: 'pass' | 'fail' | 'skip' | 'error';
  metadata?: Record<string, unknown>;
}

export function emitEvidence(
  controlId: string,
  result: 'pass' | 'fail' | 'skip' | 'error',
  metadata?: Record<string, unknown>,
  subjectId?: string
): EvidenceArtifact {
  const evidence: EvidenceArtifact = {
    trace_id: randomUUID(),
    control_id: controlId,
    timestamp: new Date().toISOString(),
    result,
  };

  if (subjectId) evidence.subject_id = subjectId;
  if (metadata) evidence.metadata = metadata;

  const artifactsDir = join(process.cwd(), 'artifacts');
  mkdirSync(artifactsDir, { recursive: true });

  const filename = `${controlId}-${Date.now()}.json`;
  const filepath = join(artifactsDir, filename);

  writeFileSync(filepath, JSON.stringify(evidence, null, 2));
  console.log(`[EVIDENCE] Emitted: ${filepath}`);

  return evidence;
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: emit-evidence.ts <control_id> <result> [metadata_json]');
    process.exit(1);
  }

  const [controlId, result, metadataJson] = args;
  const metadata = metadataJson ? JSON.parse(metadataJson) : undefined;

  if (!['pass', 'fail', 'skip', 'error'].includes(result)) {
    console.error('Result must be one of: pass, fail, skip, error');
    process.exit(1);
  }

  emitEvidence(
    controlId,
    result as 'pass' | 'fail' | 'skip' | 'error',
    metadata
  );
}
