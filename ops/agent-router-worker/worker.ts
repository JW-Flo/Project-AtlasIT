/**
 * agent-router-worker/worker.ts
 * Cloudflare Worker for autonomous agent routing decisions
 */

import { createHash } from 'crypto';

interface Env {
  // Environment bindings would go here
}

interface PRMetadata {
  pr_number?: number;
  title: string;
  files_changed: string[];
  labels?: string[];
  author?: string;
  body?: string;
}

interface RoutingRules {
  version: string;
  high_priority_paths: string[];
  medium_priority_paths: string[];
  critical_keywords: string[];
  prohibited_patterns: string[];
  auto_escalate_on?: string[];
  severity_thresholds?: Record<string, unknown>;
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

// Import rules at build time
import RULES from './rules.json';

function computeRulesHash(rules: RoutingRules): string {
  const canonical = JSON.stringify(rules, Object.keys(rules).sort());
  return createHash('sha256').update(canonical).digest('hex');
}

function generateDeterministicUUID(seed: string): string {
  const hash = createHash('sha256').update(seed).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

function evaluateRouting(prMetadata: PRMetadata, rules: RoutingRules): RoutingDecision {
  const triggers: string[] = [];
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let assignee: 'copilot' | 'codex' | 'human' = 'copilot';

  // Evaluate file paths for high priority
  for (const file of prMetadata.files_changed || []) {
    for (const pattern of rules.high_priority_paths) {
      if (file.startsWith(pattern)) {
        triggers.push(`high_priority_path:${pattern}`);
        if (severity === 'low') severity = 'medium';
      }
    }

    // Evaluate medium priority paths
    for (const pattern of rules.medium_priority_paths) {
      if (file.startsWith(pattern)) {
        triggers.push(`medium_priority_path:${pattern}`);
        if (severity === 'low') severity = 'medium';
      }
    }
  }

  // Evaluate title and body for critical keywords
  const searchText = `${prMetadata.title} ${prMetadata.body || ''}`.toLowerCase();

  for (const keyword of rules.critical_keywords) {
    if (searchText.includes(keyword.toLowerCase())) {
      triggers.push(`critical_keyword:${keyword}`);
      severity = 'high';
    }
  }

  // Check for prohibited patterns (escalate to critical)
  for (const pattern of rules.prohibited_patterns) {
    if (searchText.includes(pattern.toLowerCase())) {
      triggers.push(`prohibited_pattern:${pattern}`);
      severity = 'critical';
    }
  }

  // Determine assignee based on severity
  if (severity === 'medium') {
    assignee = 'codex';
  } else if (severity === 'high') {
    assignee = 'codex';
  } else if (severity === 'critical') {
    assignee = 'human';
  }

  // Generate deterministic decision ID from PR metadata
  const seed = JSON.stringify({
    title: prMetadata.title,
    files: prMetadata.files_changed.sort(),
    pr_number: prMetadata.pr_number,
  });
  const decisionId = generateDeterministicUUID(seed);

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
    decision.rule_summary = `Matched ${triggers.length} trigger(s): ${triggers.slice(0, 5).join(', ')}${triggers.length > 5 ? '...' : ''}`;
  }

  return decision;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          service: 'agent-router-worker',
          version: RULES.version,
          rules_hash: computeRulesHash(RULES),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Routing decision endpoint
    if (url.pathname === '/route' && request.method === 'POST') {
      try {
        const prMetadata: PRMetadata = await request.json();

        // Validate required fields
        if (!prMetadata.title || !prMetadata.files_changed) {
          return new Response(
            JSON.stringify({
              error: 'Missing required fields: title, files_changed',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        const decision = evaluateRouting(prMetadata, RULES);

        return new Response(JSON.stringify(decision, null, 2), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'Invalid request body',
            message: error instanceof Error ? error.message : 'Unknown error',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
