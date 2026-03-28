/**
 * Shadow AI & SaaS Discovery sync logic.
 *
 * Calls adapter /api/oauth-grants endpoints, classifies discovered apps and
 * grants, and upserts into discovered_apps / discovered_oauth_grants.
 */

import {
  detectAiTool,
  hasHighRiskScopes,
  matchMarketplaceApp,
  type RiskTier,
  type DiscoveredGrantItem,
  type OAuthGrantDiscoveryResult,
} from "@atlasit/shared";

// ── Marketplace catalog ──────────────────────────────────────────────────────

const MARKETPLACE_CATALOG_IDS: string[] = [
  "google_workspace",
  "microsoft_365",
  "slack",
  "jira",
  "confluence",
  "bamboohr",
  "workday",
  "adp",
  "quickbooks",
  "xero",
  "stripe",
  "okta",
  "auth0",
  "crowdstrike",
  "1password",
  "pagerduty",
  "zscaler",
  "aws",
  "gcp",
  "azure",
  "github",
  "datadog",
  "zoom",
  "teams",
  "discord",
  "salesforce",
  "hubspot",
  "dropbox",
  "notion",
  "zendesk",
  "asana",
  "monday",
  "docusign",
  "figma",
  "canva",
];

// ── Adapters that expose /api/oauth-grants ───────────────────────────────────

const OAUTH_GRANT_CAPABLE_ADAPTERS = ["google_workspace", "microsoft_365"];

// ── Types ────────────────────────────────────────────────────────────────────

export interface SyncSummary {
  newApps: number;
  updatedApps: number;
  totalGrants: number;
  aiToolsFound: number;
  highRiskGrants: number;
  providers: string[];
  syncedAt: string;
  errors: number;
}

export interface ListAppsOptions {
  riskTier?: string;
  isAiTool?: boolean;
  status?: string;
  limit: number;
  offset: number;
}

export interface ListGrantsOptions {
  appId?: string;
  userEmail?: string;
  limit: number;
  offset: number;
}

// ── Discovery ────────────────────────────────────────────────────────────────

async function fetchOAuthGrants(
  adapterUrls: Record<string, string>,
  tenantId: string,
  correlationId: string,
): Promise<OAuthGrantDiscoveryResult[]> {
  const settled = await Promise.allSettled(
    OAUTH_GRANT_CAPABLE_ADAPTERS.filter((slug) => adapterUrls[slug]).map(async (slug) => {
      const url = adapterUrls[slug];
      const res = await fetch(`${url}/api/oauth-grants`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": tenantId,
          "X-Correlation-ID": correlationId,
        },
      });

      if (!res.ok) {
        return {
          provider: slug,
          grants: [] as DiscoveredGrantItem[],
          discoveredAt: new Date().toISOString(),
          error: `HTTP ${res.status}`,
        } as OAuthGrantDiscoveryResult & { error?: string };
      }

      const data = (await res.json()) as OAuthGrantDiscoveryResult;
      return { ...data, provider: slug };
    }),
  );

  const results: OAuthGrantDiscoveryResult[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") {
      results.push(r.value);
    } else {
      results.push({
        provider: "unknown",
        grants: [],
        discoveredAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

// ── Sync (discover + upsert) ─────────────────────────────────────────────────

export async function syncDiscoveredApps(
  db: D1Database,
  adapterUrls: Record<string, string>,
  tenantId: string,
  correlationId: string,
): Promise<SyncSummary> {
  const adapterResults = await fetchOAuthGrants(adapterUrls, tenantId, correlationId);

  let newApps = 0;
  let updatedApps = 0;
  let totalGrants = 0;
  let aiToolsFound = 0;
  let highRiskGrants = 0;
  let errors = 0;
  const providers: string[] = [];

  for (const result of adapterResults) {
    if (!result.grants || result.grants.length === 0) continue;
    providers.push(result.provider);

    for (const grant of result.grants) {
      totalGrants++;

      try {
        const { isAiTool, category } = detectAiTool(grant.appName, grant.appDomain);
        const isHighRisk = hasHighRiskScopes(grant.scopes);
        const marketplaceMatch = matchMarketplaceApp(grant.appName, MARKETPLACE_CATALOG_IDS);

        if (isHighRisk) highRiskGrants++;

        // Upsert discovered_app
        const appOutcome = await upsertDiscoveredApp(db, tenantId, result.provider, {
          appName: grant.appName,
          appDomain: grant.appDomain,
          isAiTool,
          category,
          marketplaceMatch,
          discoverySource: "oauth_grant",
        });

        if (appOutcome.outcome === "created") {
          newApps++;
          if (isAiTool) aiToolsFound++;
        } else {
          updatedApps++;
        }

        // Upsert discovered_oauth_grant
        await upsertDiscoveredGrant(db, tenantId, appOutcome.appId, grant, isHighRisk);
      } catch (err) {
        errors++;
        console.error(
          JSON.stringify({
            level: "error",
            event: "discovery.sync.upsert_failed",
            tenantId,
            provider: result.provider,
            appName: grant.appName,
            error: err instanceof Error ? err.message : String(err),
          }),
        );
      }
    }
  }

  return {
    newApps,
    updatedApps,
    totalGrants,
    aiToolsFound,
    highRiskGrants,
    providers: [...new Set(providers)],
    syncedAt: new Date().toISOString(),
    errors,
  };
}

// ── Upsert helpers ───────────────────────────────────────────────────────────

interface AppUpsertInput {
  appName: string;
  appDomain?: string | null;
  isAiTool: boolean;
  category: string | null;
  marketplaceMatch: string | null;
  discoverySource: string;
}

async function upsertDiscoveredApp(
  db: D1Database,
  tenantId: string,
  provider: string,
  input: AppUpsertInput,
): Promise<{ outcome: "created" | "updated"; appId: string }> {
  const now = new Date().toISOString();

  // Check for existing app by tenant + name + provider (natural dedup key)
  const existing = await db
    .prepare(
      "SELECT id FROM discovered_apps WHERE tenant_id = ? AND app_name = ? AND provider = ?",
    )
    .bind(tenantId, input.appName, provider)
    .first<{ id: string }>();

  if (existing) {
    await db
      .prepare(
        `UPDATE discovered_apps SET
           last_seen_at = ?,
           user_count = (
             SELECT COUNT(DISTINCT user_email) FROM discovered_oauth_grants
             WHERE tenant_id = ? AND discovered_app_id = ?
           ),
           is_ai_tool = ?,
           marketplace_match = ?,
           updated_at = ?
         WHERE id = ?`,
      )
      .bind(now, tenantId, existing.id, input.isAiTool ? 1 : 0, input.marketplaceMatch, now, existing.id)
      .run();

    return { outcome: "updated", appId: existing.id };
  }

  const appId = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO discovered_apps
       (id, tenant_id, app_name, app_domain, provider, discovery_source, risk_tier,
        category, first_seen_at, last_seen_at, user_count, is_ai_tool,
        marketplace_match, status, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'unknown', ?, ?, ?, 0, ?, ?, 'active', '{}', ?, ?)`,
    )
    .bind(
      appId,
      tenantId,
      input.appName,
      input.appDomain ?? null,
      provider,
      input.discoverySource,
      input.category,
      now,
      now,
      input.isAiTool ? 1 : 0,
      input.marketplaceMatch,
      now,
      now,
    )
    .run();

  return { outcome: "created", appId };
}

async function upsertDiscoveredGrant(
  db: D1Database,
  tenantId: string,
  discoveredAppId: string,
  grant: DiscoveredGrantItem,
  isHighRisk: boolean,
): Promise<void> {
  const now = new Date().toISOString();

  const existing = await db
    .prepare(
      "SELECT id FROM discovered_oauth_grants WHERE tenant_id = ? AND discovered_app_id = ? AND user_email = ?",
    )
    .bind(tenantId, discoveredAppId, grant.userEmail)
    .first<{ id: string }>();

  const metadata = JSON.stringify({
    ...(grant.metadata ?? {}),
    highRisk: isHighRisk,
  });

  if (existing) {
    await db
      .prepare(
        `UPDATE discovered_oauth_grants SET
           scopes = ?, last_used_at = ?, metadata = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        JSON.stringify(grant.scopes),
        grant.lastUsedAt ?? null,
        metadata,
        now,
        existing.id,
      )
      .run();
    return;
  }

  await db
    .prepare(
      `INSERT INTO discovered_oauth_grants
       (id, tenant_id, discovered_app_id, user_email, scopes, granted_at,
        last_used_at, client_id, status, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      tenantId,
      discoveredAppId,
      grant.userEmail,
      JSON.stringify(grant.scopes),
      grant.grantedAt ?? null,
      grant.lastUsedAt ?? null,
      grant.clientId ?? null,
      metadata,
      now,
      now,
    )
    .run();
}

// ── List discovered apps ─────────────────────────────────────────────────────

export async function listDiscoveredApps(
  db: D1Database,
  tenantId: string,
  opts: ListAppsOptions,
): Promise<{ apps: Record<string, unknown>[]; total: number }> {
  const conditions = ["tenant_id = ?"];
  const params: (string | number)[] = [tenantId];

  if (opts.riskTier) {
    conditions.push("risk_tier = ?");
    params.push(opts.riskTier);
  }
  if (opts.isAiTool !== undefined) {
    conditions.push("is_ai_tool = ?");
    params.push(opts.isAiTool ? 1 : 0);
  }
  if (opts.status) {
    conditions.push("status = ?");
    params.push(opts.status);
  }

  const where = conditions.join(" AND ");

  const countResult = await db
    .prepare(`SELECT COUNT(*) as cnt FROM discovered_apps WHERE ${where}`)
    .bind(...params)
    .first<{ cnt: number }>();

  const { results } = await db
    .prepare(
      `SELECT * FROM discovered_apps WHERE ${where}
       ORDER BY is_ai_tool DESC, last_seen_at DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(...params, opts.limit, opts.offset)
    .all();

  return {
    apps: (results ?? []).map(mapAppRow),
    total: countResult?.cnt ?? 0,
  };
}

// ── Update app risk tier ─────────────────────────────────────────────────────

export async function updateAppRiskTier(
  db: D1Database,
  tenantId: string,
  appId: string,
  riskTier: RiskTier,
): Promise<{ updated: boolean; app: Record<string, unknown> | null }> {
  const now = new Date().toISOString();

  const existing = await db
    .prepare("SELECT id FROM discovered_apps WHERE id = ? AND tenant_id = ?")
    .bind(appId, tenantId)
    .first<{ id: string }>();

  if (!existing) {
    return { updated: false, app: null };
  }

  await db
    .prepare(
      "UPDATE discovered_apps SET risk_tier = ?, updated_at = ? WHERE id = ? AND tenant_id = ?",
    )
    .bind(riskTier, now, appId, tenantId)
    .run();

  // Emit compliance evidence for classification action
  await db
    .prepare(
      `INSERT INTO compliance_evidence
       (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id,
        actor, subject, metadata, created_at)
       VALUES (?, ?, 'SOC2', 'CC6.6', 'Shadow IT Risk Management', 'classification',
        'shadow_discovery', ?, 'admin', ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      tenantId,
      appId,
      appId,
      JSON.stringify({ riskTier, classifiedAt: now }),
      now,
    )
    .run();

  const updated = await db
    .prepare("SELECT * FROM discovered_apps WHERE id = ? AND tenant_id = ?")
    .bind(appId, tenantId)
    .first<Record<string, unknown>>();

  return { updated: true, app: updated ? mapAppRow(updated) : null };
}

// ── List discovered grants ───────────────────────────────────────────────────

export async function listDiscoveredGrants(
  db: D1Database,
  tenantId: string,
  opts: ListGrantsOptions,
): Promise<{ grants: Record<string, unknown>[]; total: number }> {
  const conditions = ["g.tenant_id = ?"];
  const params: (string | number)[] = [tenantId];

  if (opts.appId) {
    conditions.push("g.discovered_app_id = ?");
    params.push(opts.appId);
  }
  if (opts.userEmail) {
    conditions.push("g.user_email = ?");
    params.push(opts.userEmail);
  }

  const where = conditions.join(" AND ");

  const countResult = await db
    .prepare(`SELECT COUNT(*) as cnt FROM discovered_oauth_grants g WHERE ${where}`)
    .bind(...params)
    .first<{ cnt: number }>();

  const { results } = await db
    .prepare(
      `SELECT g.*, a.app_name, a.risk_tier, a.is_ai_tool
       FROM discovered_oauth_grants g
       LEFT JOIN discovered_apps a ON a.id = g.discovered_app_id
       WHERE ${where}
       ORDER BY g.created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(...params, opts.limit, opts.offset)
    .all();

  return {
    grants: (results ?? []).map(mapGrantRow),
    total: countResult?.cnt ?? 0,
  };
}

// ── Row mappers ──────────────────────────────────────────────────────────────

function mapAppRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    appName: row.app_name,
    appDomain: row.app_domain,
    provider: row.provider,
    discoverySource: row.discovery_source,
    riskTier: row.risk_tier,
    category: row.category,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    userCount: row.user_count,
    isAiTool: row.is_ai_tool === 1 || row.is_ai_tool === true,
    marketplaceMatch: row.marketplace_match,
    status: row.status,
    metadata: safeJsonParse(row.metadata as string, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGrantRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    discoveredAppId: row.discovered_app_id,
    appName: row.app_name,
    riskTier: row.risk_tier,
    isAiTool: row.is_ai_tool === 1 || row.is_ai_tool === true,
    userEmail: row.user_email,
    scopes: safeJsonParse(row.scopes as string, []),
    grantedAt: row.granted_at,
    lastUsedAt: row.last_used_at,
    clientId: row.client_id,
    status: row.status,
    metadata: safeJsonParse(row.metadata as string, {}),
    createdAt: row.created_at,
  };
}

function safeJsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}
