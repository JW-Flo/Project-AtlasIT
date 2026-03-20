/**
 * Public Trust Center API — no auth required.
 * Returns framework scores, evidence count, and connected app logos for a
 * tenant identified by its public slug.
 *
 * Shape matches TrustCenterPublic (defined in COWORK.md).
 */
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

const STATUS_WEIGHTS: Record<string, number> = {
  not_started: 0,
  in_progress: 0.25,
  implemented: 0.75,
  verified: 1.0,
};

export const GET: RequestHandler = async ({ params, platform }) => {
  const slug = params.slug;
  if (!slug) return json({ error: "slug is required" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Service unavailable" }, { status: 503 });

  // Resolve tenant by slug
  const tenant = await db
    .prepare(`SELECT id, name, slug FROM tenants WHERE slug = ? LIMIT 1`)
    .bind(slug)
    .first<{ id: string; name: string; slug: string }>();

  if (!tenant) return json({ error: "Not found" }, { status: 404 });

  const tenantId = tenant.id;

  // Check if trust center is public
  const pubPref = await db
    .prepare(
      `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'trust_center_public'`,
    )
    .bind(tenantId)
    .first<{ value: string }>();

  const isPublic = pubPref?.value === "true";
  if (!isPublic) return json({ error: "Not found" }, { status: 404 });

  // Read visibility settings (which frameworks/sections are shown)
  let visibleFrameworks: string[] | null = null;
  try {
    const row = await db
      .prepare(
        `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'trust_center_visible_frameworks'`,
      )
      .bind(tenantId)
      .first<{ value: string }>();
    if (row?.value) visibleFrameworks = JSON.parse(row.value);
  } catch {
    // fall through — show all frameworks
  }

  // Read tenant logo
  let logoUrl: string | undefined;
  try {
    const row = await db
      .prepare(
        `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'logo_url'`,
      )
      .bind(tenantId)
      .first<{ value: string }>();
    logoUrl = row?.value ?? undefined;
  } catch {
    // no logo
  }

  // Framework scores from compliance_scores table (pre-calculated)
  const { results: scoreRows } = await db
    .prepare(
      `SELECT framework, score, controls_total, controls_implemented
       FROM compliance_scores WHERE tenant_id = ?`,
    )
    .bind(tenantId)
    .all<{
      framework: string;
      score: number;
      controls_total: number;
      controls_implemented: number;
    }>();

  let frameworks = (scoreRows ?? []).map((r) => ({
    name: r.framework,
    score: r.score,
    controlsImplemented: r.controls_implemented ?? 0,
    controlsTotal: r.controls_total ?? 0,
  }));

  // If no pre-calculated scores, derive from tenant_preferences controls
  if (frameworks.length === 0) {
    try {
      const fwRow = await db
        .prepare(
          `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'`,
        )
        .bind(tenantId)
        .first<{ value: string }>();
      const ctrlRow = await db
        .prepare(
          `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'`,
        )
        .bind(tenantId)
        .first<{ value: string }>();

      const fwList: string[] = fwRow?.value ? JSON.parse(fwRow.value) : [];
      const controls: Array<{ framework: string; status: string }> =
        ctrlRow?.value ? JSON.parse(ctrlRow.value) : [];

      frameworks = fwList.map((fw) => {
        const fwControls = controls.filter((c) => c.framework === fw);
        const total = fwControls.length;
        if (total === 0) return { name: fw, score: 0, controlsImplemented: 0, controlsTotal: 0 };
        const weightSum = fwControls.reduce(
          (s, c) => s + (STATUS_WEIGHTS[c.status] ?? 0),
          0,
        );
        const score = Math.round((weightSum / total) * 100 * 100) / 100;
        const implemented = fwControls.filter(
          (c) => c.status === "implemented" || c.status === "verified",
        ).length;
        return { name: fw, score, controlsImplemented: implemented, controlsTotal: total };
      });
    } catch {
      // no controls data
    }
  }

  // Filter to visible frameworks if configured
  if (visibleFrameworks && visibleFrameworks.length > 0) {
    frameworks = frameworks.filter((f) => visibleFrameworks!.includes(f.name));
  }

  // Evidence count
  const evidenceRow = await db
    .prepare(`SELECT COUNT(*) AS cnt FROM compliance_evidence WHERE tenant_id = ?`)
    .bind(tenantId)
    .first<{ cnt: number }>();
  const evidenceCount = evidenceRow?.cnt ?? 0;

  // Last audit date (latest evidence entry)
  const lastEvRow = await db
    .prepare(
      `SELECT MAX(created_at) AS last_at FROM compliance_evidence WHERE tenant_id = ?`,
    )
    .bind(tenantId)
    .first<{ last_at: string | null }>();
  const lastAuditDate = lastEvRow?.last_at ?? new Date().toISOString();

  // Connected apps (active integrations with logo)
  const { results: appRows } = await db
    .prepare(
      `SELECT i.name, m.logo_url
       FROM integrations i
       LEFT JOIN marketplace_apps m ON m.slug = i.provider
       WHERE i.tenant_id = ? AND i.status = 'active'
       LIMIT 20`,
    )
    .bind(tenantId)
    .all<{ name: string; logo_url: string | null }>();

  const connectedApps = (appRows ?? []).map((r) => ({
    name: r.name,
    logoUrl: r.logo_url ?? "",
  }));

  return json({
    tenant: { name: tenant.name, slug: tenant.slug, logoUrl },
    lastAuditDate,
    frameworks,
    connectedApps,
    evidenceCount,
    isPublic: true,
  });
};
