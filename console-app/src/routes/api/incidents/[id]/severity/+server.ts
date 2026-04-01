import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";
import {
  computeSlaBreachAt,
  DEFAULT_SLA_SECONDS,
  type SlaConfig,
} from "@atlasit/shared/incidents/lifecycle";

function getDb(platform: any): D1Database | null {
  const env = (platform?.env as any) || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}

async function loadSlaConfig(db: D1Database, tenantId: string): Promise<SlaConfig> {
  try {
    const row = await db
      .prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'incident_sla_config'",
      )
      .bind(tenantId)
      .first<{ value: string }>();
    if (row?.value) return JSON.parse(row.value);
  } catch {
    /* use defaults */
  }
  return DEFAULT_SLA_SECONDS;
}

const VALID_SEVERITIES = ["low", "medium", "high", "critical"] as const;
type Severity = (typeof VALID_SEVERITIES)[number];

export const PUT: RequestHandler = async ({ params, request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner", "admin", "member"]);
  if (guard) return guard;

  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const { id } = params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const newSeverity = body?.severity;
  if (!newSeverity || !VALID_SEVERITIES.includes(newSeverity as Severity)) {
    return json(
      { error: `Invalid severity; must be one of: ${VALID_SEVERITIES.join(", ")}` },
      { status: 400 },
    );
  }

  // Load current incident and verify tenant ownership
  const incident = await db
    .prepare("SELECT id, severity, created_at FROM incidents WHERE id = ? AND tenant_id = ?")
    .bind(id, tenantId)
    .first<{ id: string; severity: string; created_at: string }>();

  if (!incident) {
    return json({ error: "Incident not found" }, { status: 404 });
  }

  if (incident.severity === newSeverity) {
    return json({ error: "Severity is already set to that value" }, { status: 422 });
  }

  const oldSeverity = incident.severity;

  // Recompute SLA breach deadline based on new severity
  const slaConfig = await loadSlaConfig(db, tenantId);
  const slaBreachAt = computeSlaBreachAt(incident.created_at, newSeverity as Severity, slaConfig);

  // Update incident
  await db
    .prepare(
      "UPDATE incidents SET severity = ?, sla_breach_at = ?, sla_breach_notified = 0 WHERE id = ? AND tenant_id = ?",
    )
    .bind(newSeverity, slaBreachAt, id, tenantId)
    .run();

  // Write timeline entry
  const timelineId = crypto.randomUUID().replace(/-/g, "");
  try {
    await db
      .prepare(
        `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content, metadata)
         VALUES (?, ?, ?, 'status_change', ?, ?, ?)`,
      )
      .bind(
        timelineId,
        id,
        tenantId,
        user.email ?? "unknown",
        `Severity changed from ${oldSeverity} to ${newSeverity}`,
        JSON.stringify({ type: "severity_change", oldSeverity, newSeverity }),
      )
      .run();
  } catch {
    // Non-blocking
  }

  // Audit log
  try {
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId ?? "unknown",
      actorEmail: user.email ?? "unknown",
      action: "incident.severity_changed",
      targetType: "incident",
      targetId: id,
      detail: JSON.stringify({ oldSeverity, newSeverity }),
    });
  } catch {
    // Non-blocking
  }

  return json({ id, severity: newSeverity, slaBreachAt });
};
