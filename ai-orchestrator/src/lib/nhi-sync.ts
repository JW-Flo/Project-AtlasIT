/**
 * NHI sync logic — discovers NHIs from adapters and upserts into D1.
 *
 * Creates/updates:
 *   - directory_users rows with identity_type != 'human'
 *   - nhi_credentials rows with credential metadata
 *   - nhi_audit_log entries for new discoveries
 */

import type {
  IdentityType,
  NhiCredentialType,
  NhiStatus,
  RiskFactor,
} from "@atlasit/shared";
import { computeRiskScore, detectRiskFactors } from "@atlasit/shared";

// ── Types ────────────────────────────────────────────────────────────────────

interface DiscoveredNhi {
  externalId: string;
  displayName: string;
  identityType: IdentityType;
  credentialType: NhiCredentialType;
  ownerEmail?: string;
  scopes?: string[];
  permissions?: string;
  expiresAt?: string;
  lastUsedAt?: string;
  lastRotatedAt?: string;
  metadata?: Record<string, unknown>;
}

interface DiscoveryResult {
  provider: string;
  identities: DiscoveredNhi[];
  discoveredAt: string;
  error?: string;
}

interface SyncResult {
  created: number;
  updated: number;
  total: number;
  errors: number;
  providers: string[];
  syncedAt: string;
}

interface ListOptions {
  status?: string;
  credentialType?: string;
  provider?: string;
  limit: number;
  offset: number;
}

// ── NHI-capable adapters ─────────────────────────────────────────────────────

const NHI_CAPABLE_ADAPTERS = [
  "github",
  "aws",
  "google-workspace",
  "microsoft-365",
  "okta",
];

// ── Discovery ────────────────────────────────────────────────────────────────

export async function discoverFromAdapters(
  adapterUrls: Record<string, string>,
  tenantId: string,
  correlationId: string,
): Promise<DiscoveryResult[]> {
  const results: DiscoveryResult[] = [];

  const settled = await Promise.allSettled(
    NHI_CAPABLE_ADAPTERS.filter((slug) => adapterUrls[slug]).map(async (slug) => {
      const url = adapterUrls[slug];
      const res = await fetch(`${url}/api/nhi/discovery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": tenantId,
          "X-Correlation-ID": correlationId,
        },
        body: JSON.stringify({ tenantId }),
      });

      if (!res.ok) {
        return {
          provider: slug,
          identities: [] as DiscoveredNhi[],
          discoveredAt: new Date().toISOString(),
          error: `HTTP ${res.status}`,
        };
      }

      return (await res.json()) as DiscoveryResult;
    }),
  );

  for (const r of settled) {
    if (r.status === "fulfilled") {
      results.push(r.value);
    }
  }

  return results;
}

// ── Sync (discover + upsert) ─────────────────────────────────────────────────

export async function syncNhiFromAdapters(
  db: D1Database,
  adapterUrls: Record<string, string>,
  tenantId: string,
  correlationId: string,
): Promise<SyncResult> {
  const results = await discoverFromAdapters(adapterUrls, tenantId, correlationId);

  let created = 0;
  let updated = 0;
  let errors = 0;
  const providers: string[] = [];

  for (const result of results) {
    if (result.error && result.identities.length === 0) continue;
    providers.push(result.provider);

    for (const nhi of result.identities) {
      try {
        const outcome = await upsertNhi(db, tenantId, result.provider, nhi);
        if (outcome === "created") created++;
        else updated++;
      } catch (err) {
        errors++;
        console.error(
          JSON.stringify({
            level: "error",
            event: "nhi.sync.upsert_failed",
            tenantId,
            provider: result.provider,
            externalId: nhi.externalId,
            error: err instanceof Error ? err.message : String(err),
          }),
        );
      }
    }
  }

  return {
    created,
    updated,
    total: created + updated,
    errors,
    providers,
    syncedAt: new Date().toISOString(),
  };
}

// ── Upsert single NHI ────────────────────────────────────────────────────────

async function upsertNhi(
  db: D1Database,
  tenantId: string,
  provider: string,
  nhi: DiscoveredNhi,
): Promise<"created" | "updated"> {
  const now = new Date().toISOString();

  // 1. Upsert directory_users entry for NHI
  const dirUserId = `nhi:${tenantId}:${provider}:${nhi.externalId}`;
  const email = nhi.ownerEmail ?? `${nhi.externalId}@nhi.${provider}`;

  await db
    .prepare(
      `INSERT INTO directory_users (id, tenant_id, external_id, email, display_name, department, title, status, identity_type, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'Non-Human Identities', ?, 'active', ?, ?, ?, ?)
       ON CONFLICT(tenant_id, external_id) DO UPDATE SET
         display_name = excluded.display_name,
         identity_type = excluded.identity_type,
         updated_at = excluded.updated_at`,
    )
    .bind(
      dirUserId,
      tenantId,
      nhi.externalId,
      email,
      nhi.displayName,
      nhi.credentialType,
      nhi.identityType,
      provider,
      now,
      now,
    )
    .run();

  // 2. Check if nhi_credentials row exists
  const existing = await db
    .prepare(
      "SELECT id FROM nhi_credentials WHERE tenant_id = ? AND provider = ? AND external_id = ?",
    )
    .bind(tenantId, provider, nhi.externalId)
    .first<{ id: string }>();

  const riskFactors = detectRiskFactors({
    expiresAt: nhi.expiresAt,
    ownerEmail: nhi.ownerEmail,
    lastUsedAt: nhi.lastUsedAt,
    lastRotatedAt: nhi.lastRotatedAt,
    scopes: nhi.scopes,
    createdAt: now,
  });
  const riskScore = computeRiskScore(riskFactors);

  if (existing) {
    // Update existing credential
    await db
      .prepare(
        `UPDATE nhi_credentials SET
           display_name = ?, owner_email = ?, scopes = ?, permissions = ?,
           expires_at = ?, last_used_at = ?, last_rotated_at = ?,
           risk_score = ?, risk_factors = ?, metadata = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        nhi.displayName,
        nhi.ownerEmail ?? null,
        JSON.stringify(nhi.scopes ?? []),
        nhi.permissions ?? null,
        nhi.expiresAt ?? null,
        nhi.lastUsedAt ?? null,
        nhi.lastRotatedAt ?? null,
        riskScore,
        JSON.stringify(riskFactors),
        JSON.stringify(nhi.metadata ?? {}),
        now,
        existing.id,
      )
      .run();

    return "updated";
  }

  // 3. Insert new credential
  const credId = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO nhi_credentials
       (id, tenant_id, directory_user_id, credential_type, provider, external_id,
        display_name, owner_email, scopes, permissions, expires_at, last_used_at,
        last_rotated_at, risk_score, risk_factors, status, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    )
    .bind(
      credId,
      tenantId,
      dirUserId,
      nhi.credentialType,
      provider,
      nhi.externalId,
      nhi.displayName,
      nhi.ownerEmail ?? null,
      JSON.stringify(nhi.scopes ?? []),
      nhi.permissions ?? null,
      nhi.expiresAt ?? null,
      nhi.lastUsedAt ?? null,
      nhi.lastRotatedAt ?? null,
      riskScore,
      JSON.stringify(riskFactors),
      JSON.stringify(nhi.metadata ?? {}),
      now,
      now,
    )
    .run();

  // 4. Audit log entry
  await db
    .prepare(
      `INSERT INTO nhi_audit_log (id, tenant_id, credential_id, action, actor, details, created_at)
       VALUES (?, ?, ?, 'discovered', 'system', ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      tenantId,
      credId,
      JSON.stringify({ provider, credentialType: nhi.credentialType, displayName: nhi.displayName }),
      now,
    )
    .run();

  return "created";
}

// ── List credentials ─────────────────────────────────────────────────────────

export async function listNhiCredentials(
  db: D1Database,
  tenantId: string,
  opts: ListOptions,
): Promise<{ credentials: Record<string, unknown>[]; total: number }> {
  const conditions = ["nc.tenant_id = ?"];
  const params: (string | number)[] = [tenantId];

  if (opts.status) {
    conditions.push("nc.status = ?");
    params.push(opts.status);
  }
  if (opts.credentialType) {
    conditions.push("nc.credential_type = ?");
    params.push(opts.credentialType);
  }
  if (opts.provider) {
    conditions.push("nc.provider = ?");
    params.push(opts.provider);
  }

  const where = conditions.join(" AND ");

  const countResult = await db
    .prepare(`SELECT COUNT(*) as cnt FROM nhi_credentials nc WHERE ${where}`)
    .bind(...params)
    .first<{ cnt: number }>();

  const { results } = await db
    .prepare(
      `SELECT nc.*, du.display_name as dir_display_name, du.email as dir_email
       FROM nhi_credentials nc
       LEFT JOIN directory_users du ON du.id = nc.directory_user_id
       WHERE ${where}
       ORDER BY nc.risk_score DESC, nc.updated_at DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(...params, opts.limit, opts.offset)
    .all();

  return {
    credentials: (results ?? []).map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      directoryUserId: row.directory_user_id,
      credentialType: row.credential_type,
      provider: row.provider,
      externalId: row.external_id,
      displayName: row.display_name,
      ownerEmail: row.owner_email,
      scopes: safeJsonParse(row.scopes as string, []),
      permissions: row.permissions,
      expiresAt: row.expires_at,
      lastUsedAt: row.last_used_at,
      lastRotatedAt: row.last_rotated_at,
      riskScore: row.risk_score,
      riskFactors: safeJsonParse(row.risk_factors as string, []),
      status: row.status,
      metadata: safeJsonParse(row.metadata as string, {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    total: countResult?.cnt ?? 0,
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
