import { json } from '@sveltejs/kit';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import { c as computeSlaBreachAt, D as DEFAULT_SLA_SECONDS } from './lifecycle-BLhc1MUq.js';
import { c as classifySeverity } from './classifier-DdU2lVeG.js';
import './gap-analyzer-CVZTZ0l9.js';
import './pg-BHX2Ay11.js';
import 'events';
import 'util';
import 'crypto';
import 'dns';
import 'fs';
import 'net';
import 'tls';
import 'path';
import 'stream';
import 'string_decoder';

async function loadSlaConfig(db, tenantId) {
  try {
    const row = await db.prepare(
      "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'incident_sla_config'"
    ).bind(tenantId).first();
    if (row?.value) return JSON.parse(row.value);
  } catch {
  }
  return DEFAULT_SLA_SECONDS;
}
function getDb(platform) {
  const env = platform?.env || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}
const GET = async ({ url, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const status = url.searchParams.get("status");
  const severity = url.searchParams.get("severity");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);
  let query = "SELECT * FROM incidents WHERE tenant_id = ?";
  const params = [tenantId];
  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (severity) {
    query += " AND severity = ?";
    params.push(severity);
  }
  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);
  try {
    const { results } = await db.prepare(query).bind(...params).all();
    const items = (results ?? []).map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      title: row.title,
      severity: row.severity,
      status: row.status,
      source: row.source ?? null,
      sourceId: row.source_id ?? null,
      description: row.description ?? null,
      ownerEmail: row.owner_email ?? null,
      ownerId: row.owner_id ?? null,
      investigatingAt: row.investigating_at ?? null,
      slaBreachAt: row.sla_breach_at ?? null,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at ?? null
    }));
    return json({ items });
  } catch (e) {
    if (e?.message?.includes("no such table")) {
      return json({ items: [] });
    }
    return json({ error: "Failed to load incidents" }, { status: 500 });
  }
};
const POST = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  let body;
  try {
    body = await request.json();
    if (!body || typeof body.title !== "string" || !body.title.trim()) {
      return json({ error: "Missing required field: title" }, { status: 400 });
    }
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = crypto.randomUUID().replace(/-/g, "");
  const validSeverities = ["low", "medium", "high", "critical"];
  const description = body.description || "";
  let severity;
  let autoClassified = false;
  if (body.autoClassify || !body.severity) {
    const event = {
      type: body.eventType ?? "manual",
      source: body.source ?? "manual",
      title: body.title,
      description,
      metadata: body.metadata ?? {}
    };
    const classification = classifySeverity(event);
    severity = body.severity && validSeverities.includes(body.severity) ? body.severity : classification.severity;
    autoClassified = !body.severity;
  } else {
    severity = validSeverities.includes(body.severity) ? body.severity : "medium";
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const slaConfig = await loadSlaConfig(db, tenantId);
  const slaBreachAt = computeSlaBreachAt(now, severity, slaConfig);
  try {
    await db.prepare(
      `INSERT INTO incidents (id, tenant_id, title, severity, status, source, description, created_at, sla_breach_at)
         VALUES (?, ?, ?, ?, 'open', 'manual', ?, ?, ?)`
    ).bind(id, tenantId, body.title, severity, description, now, slaBreachAt).run();
  } catch (e) {
    console.error("Failed to create incident:", e);
    return json({ error: "Failed to create incident" }, { status: 500 });
  }
  try {
    const timelineId = crypto.randomUUID().replace(/-/g, "");
    await db.prepare(
      `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content)
         VALUES (?, ?, ?, 'auto_action', ?, 'Incident created')`
    ).bind(timelineId, id, tenantId, user.email ?? "unknown").run();
  } catch {
  }
  try {
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId ?? "unknown",
      actorEmail: user.email ?? "unknown",
      action: "incident.created",
      targetType: "incident",
      targetId: id,
      detail: JSON.stringify({ title: body.title })
    });
  } catch {
  }
  try {
    const { notify } = await import('./notifications-COLEq-wV.js');
    await notify(db, platform, {
      tenantId,
      type: "incident_created",
      title: `New incident: ${body.title}`,
      body: description || void 0,
      severity,
      sourceType: "incident",
      sourceId: id,
      sourceLabel: body.title,
      actionUrl: `/console/incidents`
    });
  } catch {
  }
  return json({ id, title: body.title, severity, status: "open", autoClassified }, { status: 201 });
};

export { GET, POST };
//# sourceMappingURL=_server.ts-DkeQnlVn.js.map
