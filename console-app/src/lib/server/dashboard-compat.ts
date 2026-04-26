import { queryPg, queryPgOne } from "$lib/server/pg";
import { listRules } from "$lib/server/automation-pg";

type ConsoleUser = {
  id?: string;
  email?: string;
  role?: string;
  tenantId?: string;
};

type CountRow = { cnt: string | number | null };

function timestamp() {
  return new Date().toISOString();
}

export function ok(data: unknown) {
  return { status: "success", data, timestamp: timestamp() };
}

function n(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseJson(value: unknown): unknown {
  if (!value || typeof value !== "string") return value ?? null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function count(sql: string, params: unknown[]): Promise<number> {
  try {
    const row = await queryPgOne<CountRow>(sql, params);
    return n(row?.cnt);
  } catch {
    return 0;
  }
}

export async function dashboardData(user: ConsoleUser) {
  const tenantId = user.tenantId!;
  const [
    tenant,
    evidenceCount,
    automationRulesTotal,
    automationRulesEnabled,
    openIncidents,
    recentEvents,
  ] = await Promise.all([
    queryPgOne<{
      id: string;
      name: string;
      slug: string;
      tier: string | null;
      status: string | null;
    }>(
      `SELECT id, name, slug, COALESCE(tier, 'free') AS tier, COALESCE(status, 'active') AS status
         FROM tenants WHERE id = $1`,
      [tenantId],
    ).catch(() => null),
    count(`SELECT COUNT(*) AS cnt FROM compliance_evidence WHERE tenant_id = $1`, [tenantId]),
    count(`SELECT COUNT(*) AS cnt FROM automation_rules WHERE tenant_id = $1`, [tenantId]),
    count(`SELECT COUNT(*) AS cnt FROM automation_rules WHERE tenant_id = $1 AND enabled = true`, [
      tenantId,
    ]),
    count(
      `SELECT COUNT(*) AS cnt FROM incidents WHERE tenant_id = $1 AND status NOT IN ('resolved', 'closed')`,
      [tenantId],
    ),
    queryPg<{ id: string; type: string; source: string; status: string; created_at: string }>(
      `SELECT id, type, source, status, created_at
         FROM events WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [tenantId],
    ).catch(() => []),
  ]);

  return ok({
    tenant: tenant ?? {
      id: tenantId,
      name: "AtlasIT",
      slug: tenantId,
      tier: "free",
      status: "active",
    },
    user: {
      id: user.id ?? user.email ?? "",
      email: user.email ?? "",
      role: user.role ?? "member",
    },
    stats: {
      evidenceCount,
      automationRulesTotal,
      automationRulesEnabled,
      openIncidents,
    },
    recentEvents,
  });
}

export async function tenantSettingsData(tenantId: string) {
  const tenant = await queryPgOne<any>(
    `SELECT id, name, slug, COALESCE(tier, 'free') AS tier, COALESCE(status, 'active') AS status,
            industry, size, config, created_at AS "createdAt"
     FROM tenants WHERE id = $1`,
    [tenantId],
  );
  if (!tenant) return null;

  const prefs = await queryPg<{ key: string; value: string }>(
    `SELECT key, value FROM tenant_preferences WHERE tenant_id = $1`,
    [tenantId],
  ).catch(() => []);

  let logoUrl = "";
  let accentColor = "";
  let frameworks: string[] = [];
  for (const row of prefs) {
    if (row.key === "logo_url") logoUrl = row.value;
    if (row.key === "accent_color") accentColor = row.value;
    if (row.key === "frameworks") {
      const parsed = parseJson(row.value);
      frameworks = Array.isArray(parsed) ? parsed.map(String) : [];
    }
  }

  const config = parseJson(tenant.config) as Record<string, unknown> | null;
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    ownerEmail: String(config?.owner_email ?? ""),
    industry: tenant.industry ?? null,
    size: tenant.size ?? null,
    status: tenant.status,
    tier: tenant.tier,
    createdAt: tenant.createdAt,
    logoUrl,
    accentColor,
    frameworks,
  };
}

export async function complianceSummaryData(tenantId: string) {
  const prefs = await queryPgOne<{ value: string }>(
    `SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = 'frameworks'`,
    [tenantId],
  ).catch(() => null);
  const parsed = parseJson(prefs?.value);
  const selectedFrameworks = Array.isArray(parsed) ? parsed.map(String) : [];

  let rows: any[] = [];
  let totalEvidence = 0;
  if (selectedFrameworks.length > 0) {
    rows = await queryPg<any>(
      `SELECT framework,
              COUNT(DISTINCT control_id)::int AS "controlsTotal",
              COUNT(DISTINCT control_id) FILTER (WHERE cnt >= 3)::int AS "controlsPassing",
              COALESCE(SUM(cnt), 0)::int AS "evidenceCount"
       FROM (
         SELECT framework, control_id, COUNT(*) AS cnt
         FROM compliance_evidence
         WHERE tenant_id = $1 AND framework IS NOT NULL AND framework = ANY($2::text[])
         GROUP BY framework, control_id
       ) t
       GROUP BY framework ORDER BY framework`,
      [tenantId, selectedFrameworks],
    ).catch(() => []);
    totalEvidence = await count(
      `SELECT COUNT(*) AS cnt FROM compliance_evidence
       WHERE tenant_id = $1 AND framework = ANY($2::text[])`,
      [tenantId, selectedFrameworks],
    );
  } else {
    rows = await queryPg<any>(
      `SELECT framework,
              COUNT(DISTINCT control_id)::int AS "controlsTotal",
              COUNT(DISTINCT control_id) FILTER (WHERE cnt >= 3)::int AS "controlsPassing",
              COALESCE(SUM(cnt), 0)::int AS "evidenceCount"
       FROM (
         SELECT framework, control_id, COUNT(*) AS cnt
         FROM compliance_evidence
         WHERE tenant_id = $1 AND framework IS NOT NULL
         GROUP BY framework, control_id
       ) t
       GROUP BY framework ORDER BY framework`,
      [tenantId],
    ).catch(() => []);
    totalEvidence = await count(
      `SELECT COUNT(*) AS cnt FROM compliance_evidence WHERE tenant_id = $1`,
      [tenantId],
    );
  }

  const frameworks = rows.map((row) => {
    const controlsTotal = n(row.controlsTotal);
    const controlsPassing = n(row.controlsPassing);
    return {
      framework: row.framework,
      controlsTotal,
      controlsPassing,
      evidenceCount: n(row.evidenceCount),
      score: controlsTotal > 0 ? Math.round((controlsPassing * 100) / controlsTotal) : 0,
    };
  });
  const hasSyntheticEvidence =
    (await count(
      `SELECT COUNT(*) AS cnt FROM compliance_evidence WHERE tenant_id = $1 AND source = 'synthetic'`,
      [tenantId],
    )) > 0;

  return ok({
    frameworks,
    totalEvidence,
    lastUpdated: timestamp(),
    hasSyntheticEvidence,
  });
}

export async function integrationsData(tenantId: string) {
  const items = await queryPg<{
    id: string;
    provider: string;
    type: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, provider, type, status, installed_at AS created_at, updated_at
     FROM integrations WHERE tenant_id = $1 ORDER BY installed_at DESC`,
    [tenantId],
  ).catch(async () => {
    const creds = await queryPg<{
      app_id: string;
      connected_at: string;
      updated_at: string;
      healthy: boolean | number | null;
    }>(
      `SELECT app_id, connected_at, updated_at, healthy
       FROM app_credentials WHERE tenant_id = $1 ORDER BY updated_at DESC`,
      [tenantId],
    ).catch(() => []);
    return creds.map((c) => ({
      id: c.app_id,
      provider: c.app_id,
      type: "saas",
      status: c.healthy === false || c.healthy === 0 ? "error" : "active",
      created_at: c.connected_at,
      updated_at: c.updated_at,
    }));
  });

  return ok({ items, total: items.length });
}

export async function compliancePacksData(tenantId: string, installedOnly = false) {
  let items = await queryPg<any>(
    `SELECT p.id, p.name AS label, p.framework_id AS framework, p.controls_count::int AS "controlCount",
            p.description, p.version, p.status, tcp.installed_at AS "installedAt",
            tcp.last_evaluated_at AS "lastEvaluatedAt",
            tcp.pass_count::int AS "passCount", tcp.fail_count::int AS "failCount",
            tcp.unknown_count::int AS "unknownCount"
     FROM compliance_packs p
     LEFT JOIN tenant_compliance_packs tcp ON tcp.pack_id = p.id AND tcp.tenant_id = $1
     WHERE ($2::boolean = false OR tcp.pack_id IS NOT NULL)
     ORDER BY p.name`,
    [tenantId, installedOnly],
  ).catch(async () => {
    const rows = await queryPg<any>(
      `SELECT p.id, p.name AS label, p.framework_id AS framework, p.controls_count::int AS "controlCount",
              p.description, p.version, p.status,
              CASE WHEN tcp.pack_id IS NULL THEN NULL ELSE tcp.installed_at END AS "installedAt"
       FROM compliance_packs p
       LEFT JOIN tenant_compliance_packs tcp ON tcp.pack_id = p.id AND tcp.tenant_id = $1
       WHERE ($2::boolean = false OR tcp.pack_id IS NOT NULL)
       ORDER BY p.name`,
      [tenantId, installedOnly],
    ).catch(() => []);
    return rows.map((row) => ({
      ...row,
      lastEvaluatedAt: null,
      passCount: null,
      failCount: null,
      unknownCount: null,
    }));
  });

  items = items.map((row) => ({
    ...row,
    controlCount: n(row.controlCount ?? row.control_count),
    passCount: row.passCount == null ? null : n(row.passCount),
    failCount: row.failCount == null ? null : n(row.failCount),
    unknownCount: row.unknownCount == null ? null : n(row.unknownCount),
  }));

  return ok({ items, total: items.length });
}

export async function evidenceData(tenantId: string, url: URL) {
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? "25", 10) || 25, 1),
    100,
  );
  const rows = await queryPg<any>(
    `SELECT id, framework, control_id AS "controlId", source, actor, subject, metadata, data, created_at AS "createdAt"
     FROM compliance_evidence WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [tenantId, limit],
  ).catch(() => []);

  const items = rows.map((row) => ({
    id: row.id,
    framework: row.framework,
    controlId: row.controlId,
    source: row.source,
    actor: row.actor,
    subject: row.subject,
    metadata: parseJson(row.metadata) ?? parseJson(row.data),
    createdAt: row.createdAt,
  }));

  return ok({ items, total: items.length, nextCursor: null });
}

export async function packTrendData(tenantId: string, url: URL) {
  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") ?? "30", 10) || 30, 1), 180);
  let series = await queryPg<any>(
    `SELECT date_trunc('day', snapshot_at)::date AS day,
            ROUND(AVG(score_pct)::numeric, 2) AS "avgScore",
            COUNT(*)::int AS "snapshotCount"
     FROM compliance_score_snapshots
     WHERE tenant_id = $1 AND snapshot_at >= NOW() - ($2::int * INTERVAL '1 day')
     GROUP BY day ORDER BY day ASC`,
    [tenantId, days],
  ).catch(() => []);

  if (series.length === 0) {
    series = await queryPg<any>(
      `SELECT date(recorded_at) AS day,
              ROUND(AVG(score)::numeric, 2) AS "avgScore",
              COUNT(*)::int AS "snapshotCount"
       FROM compliance_history
       WHERE tenant_id = $1 AND recorded_at >= NOW() - ($2::int * INTERVAL '1 day')
       GROUP BY day ORDER BY day ASC`,
      [tenantId, days],
    ).catch(() => []);
  }

  return ok({ days, series });
}

export async function notificationsData(user: ConsoleUser, unreadOnly: boolean) {
  const tenantId = user.tenantId!;
  const userId = user.id ?? user.email ?? "";
  const rows = await queryPg<any>(
    `SELECT id, type, title, body, severity, source_type AS "sourceType", source_id AS "sourceId",
            source_label AS "sourceLabel", read_at AS "readAt", action_url AS "actionUrl",
            metadata, created_at AS "createdAt"
     FROM notifications
     WHERE tenant_id = $1
       AND ($2 = '' OR user_id = $2 OR user_id IS NULL)
       AND ($3::boolean = false OR read_at IS NULL)
     ORDER BY created_at DESC LIMIT 50`,
    [tenantId, userId, unreadOnly],
  ).catch(() => []);
  const unreadCount = await count(
    `SELECT COUNT(*) AS cnt FROM notifications
     WHERE tenant_id = $1 AND ($2 = '' OR user_id = $2 OR user_id IS NULL) AND read_at IS NULL`,
    [tenantId, userId],
  );

  const items = rows.map((row) => ({ ...row, metadata: parseJson(row.metadata) }));
  return { items, total: items.length, unreadCount };
}

export async function automationRulesData(tenantId: string) {
  const rules = await listRules(tenantId).catch(() => []);
  const data = rules.map((rule: any) => ({
    ...rule,
    tenant_id: rule.tenantId,
    trigger_type: rule.triggerType,
    trigger_config: rule.triggerConfig,
    last_run_at: rule.lastRunAt,
    last_status: rule.lastStatus,
    run_count: rule.runCount ?? 0,
    error_count: rule.errorCount ?? 0,
    created_at: rule.createdAt,
    updated_at: rule.updatedAt,
  }));
  return ok(data);
}

export async function automationStatsData(tenantId: string) {
  const [rulesTotal, runsTotal, errorsTotal] = await Promise.all([
    count(`SELECT COUNT(*) AS cnt FROM automation_rules WHERE tenant_id = $1`, [tenantId]),
    count(`SELECT COUNT(*) AS cnt FROM automation_executions WHERE tenant_id = $1`, [tenantId]),
    count(
      `SELECT COUNT(*) AS cnt FROM automation_executions WHERE tenant_id = $1 AND status = 'failed'`,
      [tenantId],
    ),
  ]);
  return ok({
    summary: {
      total_rules: rulesTotal,
      total_runs: runsTotal,
      total_errors: errorsTotal,
    },
  });
}
