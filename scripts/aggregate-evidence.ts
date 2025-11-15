#!/usr/bin/env node
/**
 * aggregate-evidence.ts
 * Aggregates evidence artifacts into INDEX.json
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface EvidenceArtifact {
  trace_id: string;
  control_id: string;
  timestamp: string;
  result: 'pass' | 'fail' | 'skip' | 'error';
  metadata?: Record<string, unknown>;
}

interface EvidenceIndex {
  generated_at: string;
  total_artifacts: number;
  by_control: Record<string, number>;
  by_result: Record<string, number>;
  artifacts: Array<{
    filename: string;
    trace_id: string;
    control_id: string;
    timestamp: string;
    result: string;
  }>;
}

function aggregateEvidence(): EvidenceIndex {
  console.log('[AGGREGATE] Aggregating evidence artifacts...');

  const artifactsDir = join(process.cwd(), 'artifacts');
  mkdirSync(artifactsDir, { recursive: true });

  let files: string[] = [];
  try {
    files = readdirSync(artifactsDir).filter(
      (f) => f.endsWith('.json') && f !== 'INDEX.json'
    );
  } catch (error) {
    console.warn('[AGGREGATE] No artifacts directory found');
  }

  const index: EvidenceIndex = {
    generated_at: new Date().toISOString(),
    total_artifacts: 0,
    by_control: {},
    by_result: {},
    artifacts: [],
  };

  for (const file of files) {
    try {
      const content = readFileSync(join(artifactsDir, file), 'utf-8');
      const evidence: EvidenceArtifact = JSON.parse(content);

      if (!evidence.trace_id || !evidence.control_id) {
        console.warn(`[AGGREGATE] Skipping invalid artifact: ${file}`);
        continue;
      }

      index.total_artifacts++;

      // Count by control
      index.by_control[evidence.control_id] =
        (index.by_control[evidence.control_id] || 0) + 1;

      // Count by result
      index.by_result[evidence.result] =
        (index.by_result[evidence.result] || 0) + 1;

      // Add to artifacts list
      index.artifacts.push({
        filename: file,
        trace_id: evidence.trace_id,
        control_id: evidence.control_id,
        timestamp: evidence.timestamp,
        result: evidence.result,
      });
    } catch (error) {
      console.warn(`[AGGREGATE] Failed to parse ${file}:`, error);
    }
  }

  // Write index
  const indexPath = join(artifactsDir, 'INDEX.json');
  writeFileSync(indexPath, JSON.stringify(index, null, 2));

  console.log(`[AGGREGATE] Generated index with ${index.total_artifacts} artifacts`);
  console.log(`[AGGREGATE] Written to: ${indexPath}`);

  return index;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const index = aggregateEvidence();
  console.log('\n[AGGREGATE] Summary:');
  console.log(JSON.stringify(index, null, 2));
}

export { aggregateEvidence };
