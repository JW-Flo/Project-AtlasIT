#!/usr/bin/env node
/**
 * simulate-routing.ts
 * Simulates agent routing decisions with deterministic output
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createHash, randomUUID } from 'crypto';

interface PRMetadata {
  pr_number?: number;
  title: string;
  files_changed: string[];
  labels?: string[];
  author?: string;
}

interface RoutingDecision {
  decision_id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  assignee: 'copilot' | 'codex' | 'human';
  rule_version: string;
  rules_hash: string;
  triggers: string[];
  rule_summary?: string;
  pr_metadata: PRMetadata;
}

interface RoutingRules {
  version: string;
  high_priority_paths: string[];
  medium_priority_paths: string[];
  critical_keywords: string[];
  prohibited_patterns: string[];
  auto_escalate_on?: string[];
}

const DEFAULT_SEED = 'PR-INIT-001-simulation';

function computeRulesHash(rules: RoutingRules): string {
  const canonical = JSON.stringify(rules, Object.keys(rules).sort());
  return createHash('sha256').update(canonical).digest('hex');
}

function simulateRouting(
  prMetadata: PRMetadata,
  seed: string = DEFAULT_SEED
): RoutingDecision {
  console.log('[SIMULATE] Starting routing simulation...');

  // Load routing rules
  const rulesPath = join(
    process.cwd(),
    'ops/agent-router-worker/rules.json'
  );
  let rules: RoutingRules;

  try {
    rules = JSON.parse(readFileSync(rulesPath, 'utf-8'));
  } catch (error) {
    console.error('[SIMULATE] Failed to load rules.json, using defaults');
    rules = {
      version: '1.0.0',
      high_priority_paths: ['.github/workflows', 'ops/', 'policies/'],
      medium_priority_paths: ['scripts/', 'src/'],
      critical_keywords: ['security', 'auth', 'secret'],
      prohibited_patterns: ['password', 'apikey'],
      auto_escalate_on: ['security'],
    };
  }

  const triggers: string[] = [];
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let assignee: 'copilot' | 'codex' | 'human' = 'copilot';

  // Evaluate file paths
  for (const file of prMetadata.files_changed) {
    for (const pattern of rules.high_priority_paths) {
      if (file.startsWith(pattern)) {
        triggers.push(`high_priority_path:${pattern}`);
        if (severity === 'low') severity = 'medium';
      }
    }

    for (const pattern of rules.medium_priority_paths) {
      if (file.startsWith(pattern)) {
        triggers.push(`medium_priority_path:${pattern}`);
      }
    }
  }

  // Evaluate title for keywords
  const titleLower = prMetadata.title.toLowerCase();
  for (const keyword of rules.critical_keywords) {
    if (titleLower.includes(keyword)) {
      triggers.push(`critical_keyword:${keyword}`);
      severity = 'high';
    }
  }

  for (const pattern of rules.prohibited_patterns) {
    if (titleLower.includes(pattern)) {
      triggers.push(`prohibited_pattern:${pattern}`);
      severity = 'critical';
    }
  }

  // Determine assignee based on severity
  if (severity === 'medium' || severity === 'high') {
    assignee = 'codex';
  } else if (severity === 'critical') {
    assignee = 'human';
  }

  // Generate deterministic UUID from seed
  const seedHash = createHash('sha256').update(seed).digest('hex');
  const decisionId = `${seedHash.substring(0, 8)}-${seedHash.substring(8, 12)}-${seedHash.substring(12, 16)}-${seedHash.substring(16, 20)}-${seedHash.substring(20, 32)}`;

  const decision: RoutingDecision = {
    decision_id: decisionId,
    timestamp: new Date().toISOString(),
    severity,
    assignee,
    rule_version: rules.version,
    rules_hash: computeRulesHash(rules),
    triggers,
    pr_metadata: prMetadata,
  };

  if (triggers.length > 0) {
    decision.rule_summary = `Matched ${triggers.length} trigger(s): ${triggers.join(', ')}`;
  }

  console.log(`[SIMULATE] Severity: ${severity}`);
  console.log(`[SIMULATE] Assignee: ${assignee}`);
  console.log(`[SIMULATE] Triggers: ${triggers.length}`);

  return decision;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: simulate-routing.ts <pr_metadata.json> [seed]');
    process.exit(1);
  }

  const [metadataPath, seed] = args;
  const prMetadata: PRMetadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));

  const decision = simulateRouting(prMetadata, seed);

  console.log('\n[SIMULATE] Decision JSON:');
  console.log(JSON.stringify(decision, null, 2));
}

export { simulateRouting };
