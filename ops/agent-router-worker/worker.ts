/**
 * agent-router-worker/worker.ts
 * Cloudflare Worker for autonomous agent routing decisions
 */

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

// Recursively sort object keys for deterministic serialization
function deepSortObject<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(deepSortObject) as T;
  } else if (obj !== null && typeof obj === 'object') {
    const sortedKeys = Object.keys(obj).sort();
    const result: any = {};
    for (const key of sortedKeys) {
      result[key] = deepSortObject((obj as any)[key]);
    }
    return result;
  }
  return obj;
}

async function computeRulesHash(rules: RoutingRules): Promise<string> {
  const canonical = JSON.stringify(deepSortObject(rules));
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateDeterministicUUID(seed: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(seed);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

async function evaluateRouting(prMetadata: PRMetadata, rules: RoutingRules): Promise<RoutingDecision> {
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
  const decisionId = await generateDeterministicUUID(seed);
  const rulesHash = await computeRulesHash(rules);

  const decision: RoutingDecision = {
    decision_id: decisionId,
    timestamp: new Date().toISOString(),
    severity,
    assignee,
    rule_version: rules.version,
    rules_hash: rulesHash,
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
      const rulesHash = await computeRulesHash(RULES);
      return new Response(
        JSON.stringify({
          status: 'healthy',
          service: 'agent-router-worker',
          version: RULES.version,
          rules_hash: rulesHash,
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

        const decision = await evaluateRouting(prMetadata, RULES);

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
