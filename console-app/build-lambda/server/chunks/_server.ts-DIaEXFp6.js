import { json } from '@sveltejs/kit';

const STATUS_WEIGHTS = {
  not_started: 0,
  in_progress: 0.25,
  implemented: 0.75,
  verified: 1
};
const GET = async ({ params, platform }) => {
  const slug = params.slug;
  if (!slug) return json({ error: "slug is required" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Service unavailable" }, { status: 503 });
  const tenant = await db.prepare(`SELECT id, name, slug FROM tenants WHERE slug = ? LIMIT 1`).bind(slug).first();
  if (!tenant) return json({ error: "Not found" }, { status: 404 });
  const tenantId = tenant.id;
  const pubPref = await db.prepare(
    `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'trust_center_public'`
  ).bind(tenantId).first();
  const isPublic = pubPref?.value === "true";
  if (!isPublic) return json({ error: "Not found" }, { status: 404 });
  let visibleFrameworks = null;
  try {
    const row = await db.prepare(
      `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'trust_center_visible_frameworks'`
    ).bind(tenantId).first();
    if (row?.value) visibleFrameworks = JSON.parse(row.value);
  } catch {
  }
  let logoUrl;
  try {
    const row = await db.prepare(`SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'logo_url'`).bind(tenantId).first();
    logoUrl = row?.value ?? void 0;
  } catch {
  }
  const { results: scoreRows } = await db.prepare(
    `SELECT framework, score, controls_total, controls_implemented
       FROM compliance_scores WHERE tenant_id = ?`
  ).bind(tenantId).all();
  let frameworks = (scoreRows ?? []).map((r) => ({
    name: r.framework,
    score: r.score,
    controlsImplemented: r.controls_implemented ?? 0,
    controlsTotal: r.controls_total ?? 0
  }));
  if (frameworks.length === 0) {
    try {
      const fwRow = await db.prepare(`SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'`).bind(tenantId).first();
      const ctrlRow = await db.prepare(
        `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'`
      ).bind(tenantId).first();
      const fwList = fwRow?.value ? JSON.parse(fwRow.value) : [];
      const controls = ctrlRow?.value ? JSON.parse(ctrlRow.value) : [];
      frameworks = fwList.map((fw) => {
        const fwControls = controls.filter((c) => c.framework === fw);
        const total = fwControls.length;
        if (total === 0) return { name: fw, score: 0, controlsImplemented: 0, controlsTotal: 0 };
        const weightSum = fwControls.reduce((s, c) => s + (STATUS_WEIGHTS[c.status] ?? 0), 0);
        const score = Math.round(weightSum / total * 100 * 100) / 100;
        const implemented = fwControls.filter(
          (c) => c.status === "implemented" || c.status === "verified"
        ).length;
        return { name: fw, score, controlsImplemented: implemented, controlsTotal: total };
      });
    } catch {
    }
  }
  if (visibleFrameworks && visibleFrameworks.length > 0) {
    frameworks = frameworks.filter((f) => visibleFrameworks.includes(f.name));
  }
  let controlVisibility = {};
  try {
    const visRow = await db.prepare(
      `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'trust_center_control_visibility'`
    ).bind(tenantId).first();
    if (visRow?.value) controlVisibility = JSON.parse(visRow.value);
  } catch {
  }
  const { results: controlRows } = await db.prepare(
    `SELECT framework, control_id, control_name,
              COUNT(*) AS cnt, MAX(created_at) AS last_at
       FROM compliance_evidence
       WHERE tenant_id = ?
       GROUP BY framework, control_id
       ORDER BY framework, control_id`
  ).bind(tenantId).all();
  const now = Date.now();
  const thresholdMs = 30 * 864e5;
  const controlsByFramework = /* @__PURE__ */ new Map();
  for (const row of controlRows ?? []) {
    if (controlVisibility[row.control_id] === "private") continue;
    const fw = row.framework;
    if (!controlsByFramework.has(fw)) controlsByFramework.set(fw, []);
    let status = "not_started";
    if (row.cnt > 0 && row.last_at) {
      const ageMs = now - new Date(row.last_at).getTime();
      status = ageMs <= thresholdMs ? "implemented" : "in_progress";
    }
    controlsByFramework.get(fw).push({
      controlId: row.control_id,
      controlName: row.control_name ?? row.control_id,
      status,
      evidenceCount: row.cnt,
      lastEvidenceAt: row.last_at
    });
  }
  for (const fw of frameworks) {
    fw.controls = controlsByFramework.get(fw.name) ?? [];
  }
  const evidenceRow = await db.prepare(`SELECT COUNT(*) AS cnt FROM compliance_evidence WHERE tenant_id = ?`).bind(tenantId).first();
  const evidenceCount = evidenceRow?.cnt ?? 0;
  const lastEvRow = await db.prepare(`SELECT MAX(created_at) AS last_at FROM compliance_evidence WHERE tenant_id = ?`).bind(tenantId).first();
  const lastAuditDate = lastEvRow?.last_at ?? (/* @__PURE__ */ new Date()).toISOString();
  const { results: appRows } = await db.prepare(
    `SELECT i.name, m.logo_url
       FROM integrations i
       LEFT JOIN marketplace_apps m ON m.slug = i.provider
       WHERE i.tenant_id = ? AND i.status = 'active'
       LIMIT 20`
  ).bind(tenantId).all();
  const connectedApps = (appRows ?? []).map((r) => ({
    name: r.name,
    logoUrl: r.logo_url ?? ""
  }));
  return json({
    tenant: { name: tenant.name, slug: tenant.slug, logoUrl },
    lastAuditDate,
    frameworks,
    connectedApps,
    evidenceCount,
    isPublic: true
  });
};

export { GET };
//# sourceMappingURL=_server.ts-DIaEXFp6.js.map
