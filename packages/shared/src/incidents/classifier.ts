/**
 * Severity classification engine for incidents.
 * Auto-classifies event data into critical/high/medium/low using
 * pattern-matching rules with confidence scoring.
 */

import type { IncidentSeverity } from "./lifecycle";

export interface EventData {
  type: string;
  source: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}

export interface ClassificationRule {
  name: string;
  severity: IncidentSeverity;
  patterns: RegExp[];
  sourceMatch?: string[];
  typeMatch?: string[];
  weight: number;
}

export interface ClassificationResult {
  severity: IncidentSeverity;
  confidence: number;
  matchedRules: string[];
  autoClassified: true;
}

const SEVERITY_RANK: Record<IncidentSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const CLASSIFICATION_RULES: ClassificationRule[] = [
  // Critical patterns
  {
    name: "data_breach",
    severity: "critical",
    patterns: [
      /data\s*breach/i,
      /unauthorized\s*(access|export)\s*(of|to)\s*(pii|user|customer|personal)/i,
      /exfiltration/i,
    ],
    weight: 1.0,
  },
  {
    name: "ransomware",
    severity: "critical",
    patterns: [/ransomware/i, /encryption\s*attack/i, /files?\s*encrypted\s*by/i],
    weight: 1.0,
  },
  {
    name: "account_compromise",
    severity: "critical",
    patterns: [
      /account\s*compromised/i,
      /credential\s*(theft|leak|stuffing)/i,
      /unauthorized\s*admin/i,
    ],
    weight: 0.95,
  },
  {
    name: "privilege_escalation",
    severity: "critical",
    patterns: [/privilege\s*escalation/i, /root\s*access\s*(gained|obtained)/i],
    weight: 0.95,
  },

  // High patterns
  {
    name: "service_outage",
    severity: "high",
    patterns: [/service\s*(down|outage|unreachable)/i, /503\s*error/i, /complete\s*failure/i],
    weight: 0.85,
  },
  {
    name: "brute_force",
    severity: "high",
    patterns: [
      /brute\s*force/i,
      /multiple\s*failed\s*(login|auth)/i,
      /login\s*attempts?\s*exceed/i,
    ],
    weight: 0.8,
  },
  {
    name: "malware_detection",
    severity: "high",
    patterns: [
      /malware\s*detect/i,
      /virus\s*(found|detect)/i,
      /trojan/i,
      /suspicious\s*executable/i,
    ],
    weight: 0.85,
  },
  {
    name: "security_group_change",
    severity: "high",
    patterns: [/security\s*group\s*(modif|chang)/i, /firewall\s*rule\s*(modif|chang|delet)/i],
    typeMatch: ["system.alert"],
    weight: 0.75,
  },
  {
    name: "failed_login_burst",
    severity: "high",
    patterns: [/failed\s*login/i, /authentication\s*failure/i],
    sourceMatch: ["okta", "azure-ad", "auth0"],
    weight: 0.7,
  },

  // Medium patterns
  {
    name: "permission_change",
    severity: "medium",
    patterns: [
      /role\s*(elevat|chang|grant)/i,
      /permission\s*(chang|grant|modif)/i,
      /access\s*(grant|elevat)/i,
    ],
    weight: 0.6,
  },
  {
    name: "config_change",
    severity: "medium",
    patterns: [/configuration\s*(change|modif|updat)/i, /settings?\s*(change|modif)/i],
    weight: 0.5,
  },
  {
    name: "password_reset",
    severity: "medium",
    patterns: [/password\s*(reset|chang)/i, /credential\s*rotation/i],
    weight: 0.5,
  },
  {
    name: "policy_violation",
    severity: "medium",
    patterns: [/policy\s*violation/i, /compliance\s*(violation|breach)/i, /non-?complian/i],
    weight: 0.65,
  },

  // Low patterns
  {
    name: "user_onboarding",
    severity: "low",
    patterns: [/user\s*(onboard|provision|creat)/i, /new\s*(user|employee|member)/i],
    weight: 0.4,
  },
  {
    name: "informational",
    severity: "low",
    patterns: [/completed\s*checklist/i, /scheduled\s*maintenance/i, /backup\s*complet/i],
    weight: 0.3,
  },
  {
    name: "audit_info",
    severity: "low",
    typeMatch: ["audit.info"],
    patterns: [/.*/],
    weight: 0.3,
  },
];

function matchesRule(event: EventData, rule: ClassificationRule): boolean {
  // Check type match if specified
  if (rule.typeMatch && rule.typeMatch.length > 0) {
    if (!rule.typeMatch.includes(event.type)) return false;
  }

  // Check source match if specified
  if (rule.sourceMatch && rule.sourceMatch.length > 0) {
    if (!rule.sourceMatch.includes(event.source)) return false;
  }

  // Check pattern match against title + description
  const text = `${event.title} ${event.description}`;
  return rule.patterns.some((pattern) => pattern.test(text));
}

function applyContextBoosts(
  severity: IncidentSeverity,
  confidence: number,
  event: EventData,
): { severity: IncidentSeverity; confidence: number } {
  let boostedSeverity = severity;
  let boostedConfidence = confidence;

  // Boost for admin user involvement
  const role = event.metadata?.userRole;
  if (role === "admin" || role === "superAdmin" || role === "owner") {
    const rank = SEVERITY_RANK[boostedSeverity];
    if (rank < 4) {
      boostedSeverity = Object.entries(SEVERITY_RANK).find(
        ([, r]) => r === Math.min(rank + 1, 4),
      )![0] as IncidentSeverity;
      boostedConfidence = Math.min(boostedConfidence + 0.1, 1.0);
    }
  }

  // Boost for production environment
  const env = event.metadata?.environment;
  if (env === "production" || env === "prod") {
    const rank = SEVERITY_RANK[boostedSeverity];
    if (rank < 4) {
      boostedSeverity = Object.entries(SEVERITY_RANK).find(
        ([, r]) => r === Math.min(rank + 1, 4),
      )![0] as IncidentSeverity;
      boostedConfidence = Math.min(boostedConfidence + 0.1, 1.0);
    }
  }

  return { severity: boostedSeverity, confidence: boostedConfidence };
}

/**
 * Classify the severity of an incident based on event data.
 * Uses rule-based pattern matching with context-aware boosts.
 */
export function classifySeverity(event: EventData): ClassificationResult {
  const matches: { rule: ClassificationRule; weight: number }[] = [];

  for (const rule of CLASSIFICATION_RULES) {
    if (matchesRule(event, rule)) {
      matches.push({ rule, weight: rule.weight });
    }
  }

  if (matches.length === 0) {
    return {
      severity: "medium",
      confidence: 0.3,
      matchedRules: [],
      autoClassified: true,
    };
  }

  // Pick highest-severity match, breaking ties by weight
  matches.sort((a, b) => {
    const sevDiff = SEVERITY_RANK[b.rule.severity] - SEVERITY_RANK[a.rule.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.weight - a.weight;
  });

  const best = matches[0];
  const matchedRules = matches.map((m) => m.rule.name);

  // Confidence based on weight of best match + number of corroborating matches
  let confidence = best.weight;
  if (matches.length > 1) {
    confidence = Math.min(confidence + 0.05 * (matches.length - 1), 1.0);
  }

  // Apply context boosts (admin, production, etc.)
  const boosted = applyContextBoosts(best.rule.severity, confidence, event);

  return {
    severity: boosted.severity,
    confidence: boosted.confidence,
    matchedRules,
    autoClassified: true,
  };
}
