import { json } from '@sveltejs/kit';

const FRESHNESS_THRESHOLD_MS = 30 * 864e5;
function describeAge(createdAt) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(ageMs / 864e5);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}
const GET = async ({ params, url, platform }) => {
  const slug = params.slug;
  if (!slug) return json({ error: "slug is required" }, { status: 400 });
  const controlId = url.searchParams.get("control");
  const framework = url.searchParams.get("framework");
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Service unavailable" }, { status: 503 });
  const tenant = await db.prepare(`SELECT id FROM tenants WHERE slug = ? LIMIT 1`).bind(slug).first();
  if (!tenant) return json({ error: "Not found" }, { status: 404 });
  const tenantId = tenant.id;
  const pubPref = await db.prepare(
    `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'trust_center_public'`
  ).bind(tenantId).first();
  if (pubPref?.value !== "true") {
    return json({ error: "Not found" }, { status: 404 });
  }
  let controlVisibility = {};
  try {
    const visRow = await db.prepare(
      `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'trust_center_control_visibility'`
    ).bind(tenantId).first();
    if (visRow?.value) controlVisibility = JSON.parse(visRow.value);
  } catch {
  }
  if (controlId && controlVisibility[controlId] === "private") {
    return json({ error: "Not found" }, { status: 404 });
  }
  let query = `SELECT id, control_id, evidence_type, source, actor, subject, metadata, created_at
     FROM compliance_evidence
     WHERE tenant_id = ?`;
  const bindings = [tenantId];
  if (controlId) {
    query += ` AND control_id = ?`;
    bindings.push(controlId);
  }
  if (framework) {
    query += ` AND framework = ?`;
    bindings.push(framework);
  }
  query += ` ORDER BY created_at DESC LIMIT 100`;
  const { results: rows } = await db.prepare(query).bind(...bindings).all();
  const now = Date.now();
  const evidence = (rows ?? []).filter((row) => {
    const vis = controlVisibility[row.control_id];
    return vis !== "private";
  }).map((row) => {
    let status = null;
    try {
      if (row.metadata) {
        const meta = JSON.parse(row.metadata);
        if (meta.status) status = meta.status;
      }
    } catch {
    }
    const ageMs = now - new Date(row.created_at).getTime();
    return {
      id: row.id,
      controlId: row.control_id,
      evidenceType: row.evidence_type,
      source: row.source,
      actor: row.actor,
      subject: row.subject,
      status,
      createdAt: row.created_at,
      isFresh: ageMs <= FRESHNESS_THRESHOLD_MS,
      ageDescription: describeAge(row.created_at)
    };
  });
  return json({ evidence, total: evidence.length });
};

export { GET };
//# sourceMappingURL=_server.ts-DIStAHhH.js.map
