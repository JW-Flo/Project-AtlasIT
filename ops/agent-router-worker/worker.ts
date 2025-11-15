// Type definitions for routing logic
export interface PRMetadata {
  number: number;
  title: string;
  labels: string[];
  files_changed: string[];
  author: string;
}

export interface RoutingRules {
  severity_by_path: Record<string, string>;
  severity_by_keyword: Record<string, string>;
  codex_assignment_triggers: string[];
  evidence_required: string[];
  prohibited_patterns: string[];
}

export interface RoutingDecision {
  decision_id: string;
  severity: "low" | "medium" | "high" | "critical";
  agents: {
    primary: string;
    secondary?: string;
  };
  evidence_required: string[];
  prohibited_hits: string[];
  timestamp: string;
  rule_summary?: RuleSummary;
}

export interface RuleSummary {
  matched_paths: string[];
  matched_keywords: string[];
  triggered_assignments: string[];
}

export interface Env {
  RULES_KV?: KVNamespace;
}

// Load routing rules from KV or bundled JSON
async function loadRules(env: Env): Promise<RoutingRules> {
  // TODO: Implement KV loading when deployed
  // For now, use bundled rules
  const rulesModule = await import("./rules.json");
  return rulesModule.default as RoutingRules;
}

// Compute severity based on files changed and keywords
function computeSeverity(
  pr: PRMetadata,
  rules: RoutingRules
): { severity: string; matches: { paths: string[]; keywords: string[] } } {
  const matchedPaths: string[] = [];
  const matchedKeywords: string[] = [];
  let maxSeverity = "low";

  const severityRank: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  // Check file paths
  for (const file of pr.files_changed) {
    for (const [pathPattern, severity] of Object.entries(rules.severity_by_path)) {
      if (file.startsWith(pathPattern) || file.includes(pathPattern)) {
        matchedPaths.push(`${file} -> ${severity}`);
        if (severityRank[severity] > severityRank[maxSeverity]) {
          maxSeverity = severity;
        }
      }
    }
  }

  // Check keywords in title
  const titleLower = pr.title.toLowerCase();
  for (const [keyword, severity] of Object.entries(rules.severity_by_keyword)) {
    if (titleLower.includes(keyword.toLowerCase())) {
      matchedKeywords.push(`${keyword} -> ${severity}`);
      if (severityRank[severity] > severityRank[maxSeverity]) {
        maxSeverity = severity;
      }
    }
  }

  return { severity: maxSeverity, matches: { paths: matchedPaths, keywords: matchedKeywords } };
}

// Assign agents based on triggers and severity
function assignAgents(
  pr: PRMetadata,
  rules: RoutingRules,
  severity: string
): { primary: string; secondary?: string; triggers: string[] } {
  const triggers: string[] = [];
  let primary = "github-review";
  let secondary: string | undefined;

  // Check if Codex should be assigned
  for (const trigger of rules.codex_assignment_triggers) {
    if (pr.files_changed.some((file) => file.includes(trigger))) {
      triggers.push(trigger);
      primary = "codex";
    }
  }

  // Assign secondary agent for high severity
  if (severity === "high" || severity === "critical") {
    secondary = "security-review";
  }

  return { primary, secondary, triggers };
}

// Check for prohibited patterns
function checkProhibitedPatterns(pr: PRMetadata, rules: RoutingRules): string[] {
  const hits: string[] = [];

  // Check title and file names for prohibited patterns
  const searchText = `${pr.title} ${pr.files_changed.join(" ")}`;

  for (const pattern of rules.prohibited_patterns) {
    if (searchText.includes(pattern)) {
      hits.push(pattern);
    }
  }

  return hits;
}

// Determine required evidence files
function determineEvidenceRequired(pr: PRMetadata, rules: RoutingRules): string[] {
  const required: string[] = [];

  for (const evidenceFile of rules.evidence_required) {
    if (pr.files_changed.some((file) => file.includes(evidenceFile))) {
      required.push(evidenceFile);
    }
  }

  return required;
}

// Main routing logic
export async function routePR(
  pr: PRMetadata,
  env: Env,
  simulate: boolean = false
): Promise<RoutingDecision> {
  const rules = await loadRules(env);

  const { severity, matches } = computeSeverity(pr, rules);
  const { primary, secondary, triggers } = assignAgents(pr, rules, severity);
  const prohibitedHits = checkProhibitedPatterns(pr, rules);
  const evidenceRequired = determineEvidenceRequired(pr, rules);

  // Escalate to critical if prohibited patterns found
  const finalSeverity = prohibitedHits.length > 0 ? "critical" : severity;

  const decision: RoutingDecision = {
    decision_id: crypto.randomUUID(),
    severity: finalSeverity as "low" | "medium" | "high" | "critical",
    agents: {
      primary,
      secondary,
    },
    evidence_required: evidenceRequired,
    prohibited_hits: prohibitedHits,
    timestamp: new Date().toISOString(),
  };

  if (simulate) {
    decision.rule_summary = {
      matched_paths: matches.paths,
      matched_keywords: matches.keywords,
      triggered_assignments: triggers,
    };
  }

  return decision;
}

// Cloudflare Worker fetch handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Simulate",
        },
      });
    }

    // Only accept POST requests
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      // Parse PR metadata from request body
      const pr = (await request.json()) as PRMetadata;

      // Check for simulation mode
      const simulate = request.headers.get("X-Simulate") === "true";

      // Route the PR
      const decision = await routePR(pr, env, simulate);

      // TODO: Future GitHub API evidence validation
      // When implemented, verify evidence artifacts via GitHub API
      // and update decision with validation results

      return new Response(JSON.stringify(decision, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  },
};
