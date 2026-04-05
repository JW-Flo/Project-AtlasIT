/**
 * Shadow AI & SaaS Discovery Types
 *
 * Tracks OAuth grants and unapproved apps discovered across connected
 * adapters. Each discovered app is classified by risk tier and checked
 * against known AI/LLM tool patterns.
 */

// ── Risk Tiers ───────────────────────────────────────────────────────────────

export type RiskTier = "approved" | "under_review" | "blocked" | "unknown";

export type DiscoverySource = "oauth_grant" | "mcp_connection" | "api_log" | "manual";

// ── Discovered App ───────────────────────────────────────────────────────────

export interface DiscoveredApp {
  id: string;
  tenantId: string;
  appName: string;
  appDomain: string | null;
  provider: string;
  discoverySource: DiscoverySource;
  riskTier: RiskTier;
  category: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  userCount: number;
  isAiTool: boolean;
  marketplaceMatch: string | null;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ── OAuth Grant ──────────────────────────────────────────────────────────────

export interface DiscoveredOAuthGrant {
  id: string;
  tenantId: string;
  discoveredAppId: string;
  userEmail: string;
  scopes: string[];
  grantedAt: string | null;
  lastUsedAt: string | null;
  clientId: string | null;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ── Discovery Result from Adapter ────────────────────────────────────────────

export interface OAuthGrantDiscoveryResult {
  provider: string;
  grants: DiscoveredGrantItem[];
  discoveredAt: string;
}

export interface DiscoveredGrantItem {
  appName: string;
  appDomain?: string;
  clientId?: string;
  userEmail: string;
  scopes: string[];
  grantedAt?: string;
  lastUsedAt?: string;
  metadata?: Record<string, unknown>;
}

// ── Governance Playbook ──────────────────────────────────────────────────────

export type PlaybookTrigger =
  | "new_ai_tool_detected"
  | "high_risk_scopes"
  | "unapproved_app_used"
  | "expired_grant"
  | "data_flow_to_llm";

export type PlaybookAction =
  | "notify_user"
  | "notify_admin"
  | "create_incident"
  | "create_access_review"
  | "block_grant"
  | "auto_approve";

export interface DiscoveryPlaybook {
  id: string;
  tenantId: string;
  name: string;
  enabled: boolean;
  triggerCondition: PlaybookTrigger;
  actions: PlaybookAction[];
  createdAt: string;
  updatedAt: string;
}

// ── AI Tool Detection ────────────────────────────────────────────────────────

/**
 * Known AI/LLM tool patterns for shadow AI detection.
 * Matches against app name, domain, or client ID.
 */
const AI_TOOL_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  // LLM providers
  { pattern: /\bchatgpt\b|openai/i, category: "llm" },
  { pattern: /\bclaude\b|anthropic/i, category: "llm" },
  { pattern: /\bgemini\b|google ai|bard/i, category: "llm" },
  { pattern: /\bcopilot\b|github copilot/i, category: "ai_coding" },
  { pattern: /\bperplexity/i, category: "llm" },
  { pattern: /\bmistral/i, category: "llm" },
  { pattern: /\bcohere/i, category: "llm" },
  { pattern: /\bhugging\s?face/i, category: "ml_platform" },
  { pattern: /\breplicate/i, category: "ml_platform" },

  // AI coding tools
  { pattern: /\bcursor\b/i, category: "ai_coding" },
  { pattern: /\btabnine/i, category: "ai_coding" },
  { pattern: /\bcodeium/i, category: "ai_coding" },
  { pattern: /\breplit/i, category: "ai_coding" },
  { pattern: /\bsupermaven/i, category: "ai_coding" },
  { pattern: /\bwindsurf/i, category: "ai_coding" },

  // AI writing/content
  { pattern: /\bjasper\b.*ai|jasper\.ai/i, category: "ai_writing" },
  { pattern: /\bcopy\.ai/i, category: "ai_writing" },
  { pattern: /\bgrammarly/i, category: "ai_writing" },
  { pattern: /\bnotion\s*ai/i, category: "ai_writing" },
  { pattern: /\bwritesonic/i, category: "ai_writing" },

  // AI image/video
  { pattern: /\bmidjourney/i, category: "ai_image" },
  { pattern: /\bdall-?e\b|dall·e/i, category: "ai_image" },
  { pattern: /\bstable\s*diffusion/i, category: "ai_image" },
  { pattern: /\brunway\b.*ml|runwayml/i, category: "ai_video" },

  // AI meeting/productivity
  { pattern: /\botter\.ai/i, category: "ai_productivity" },
  { pattern: /\bfireflies\.ai/i, category: "ai_productivity" },
  { pattern: /\bgong\b/i, category: "ai_productivity" },
  { pattern: /\bglean\b/i, category: "ai_productivity" },

  // AI data/analytics
  { pattern: /\bdatabricks/i, category: "ml_platform" },
  { pattern: /\bsnowflake\s*cortex/i, category: "ml_platform" },

  // Additional AI coding tools
  { pattern: /\bdevin\b|cognition\.ai/i, category: "ai_coding" },
  { pattern: /\bcline\b|continue\.dev/i, category: "ai_coding" },
  { pattern: /\bcodewhisperer|amazon\s*q\b/i, category: "ai_coding" },
  { pattern: /\bv0\.dev|vercel\s*v0/i, category: "ai_coding" },

  // Additional LLMs
  { pattern: /\bgrok\b|x\.ai/i, category: "llm" },
  { pattern: /\bharvey\.ai|harvey\s*ai/i, category: "llm" },

  // AI writing/content (additional)
  { pattern: /\bwriter\.com|writer\s*ai/i, category: "ai_writing" },

  // AI video/voice
  { pattern: /\bsynthesia/i, category: "ai_video" },
  { pattern: /\belevenlabs/i, category: "ai_productivity" },
  { pattern: /\bsora\b/i, category: "ai_video" },
];

/**
 * High-risk OAuth scopes that indicate broad data access.
 */
const HIGH_RISK_SCOPE_PATTERNS = [
  /mail\.read|gmail\.readonly|mail\.readwrite/i,
  /drive\.(readonly|file)|files\.readwrite/i,
  /contacts\.read|people\.read/i,
  /calendars\.readwrite|calendar/i,
  /admin\./i,
  /user\.read\.all|directory\.read/i,
  /\*|full_access|all/i,
];

/**
 * Detect if an app name or domain matches known AI/LLM tools.
 */
export function detectAiTool(
  appName: string,
  appDomain?: string,
): { isAiTool: boolean; category: string | null } {
  const searchStr = `${appName} ${appDomain ?? ""}`;
  for (const { pattern, category } of AI_TOOL_PATTERNS) {
    if (pattern.test(searchStr)) {
      return { isAiTool: true, category };
    }
  }
  return { isAiTool: false, category: null };
}

/**
 * Check if scopes indicate high-risk data access.
 */
export function hasHighRiskScopes(scopes: string[]): boolean {
  const scopeStr = scopes.join(" ");
  return HIGH_RISK_SCOPE_PATTERNS.some((p) => p.test(scopeStr));
}

/**
 * Match a discovered app name against the 35-app marketplace catalog.
 * Returns the marketplace app ID if found, null otherwise.
 */
export function matchMarketplaceApp(
  appName: string,
  catalogIds: string[],
): string | null {
  const normalized = appName.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const id of catalogIds) {
    const normalizedId = id.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalized.includes(normalizedId) || normalizedId.includes(normalized)) {
      return id;
    }
  }
  return null;
}
