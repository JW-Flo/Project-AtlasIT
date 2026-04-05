/**
 * POST /api/incidents/[id]/escalate — Escalate incident to configured SOAR provider
 */
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";
import {
  createSoarProvider,
  type SoarConfig,
  type SoarIncident,
  SUPPORTED_PROVIDERS,
} from "@atlasit/shared/incidents/soar";

function getDb(platform: any): D1Database | null {
  const env = (platform?.env as any) || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}

export const POST: RequestHandler = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const incidentId = params.id;

  // Load incident
  const incident = await db
    .prepare("SELECT * FROM incidents WHERE id = ? AND tenant_id = ?")
    .bind(incidentId, tenantId)
    .first<any>();

  if (!incident) return json({ error: "Incident not found" }, { status: 404 });

  // Load SOAR config from tenant preferences
  let soarConfig: SoarConfig | null = null;
  try {
    const row = await db
      .prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'soar_config'")
      .bind(tenantId)
      .first<{ value: string }>();
    if (row?.value) {
      const parsed = JSON.parse(row.value);
      if (parsed.enabled && SUPPORTED_PROVIDERS.includes(parsed.provider)) {
        soarConfig = parsed;
      }
    }
  } catch {
    // no config
  }

  if (!soarConfig) {
    return json(
      { error: "No SOAR provider configured. Configure one in Settings > Integrations." },
      { status: 422 },
    );
  }

  const provider = createSoarProvider(soarConfig);

  const soarIncident: SoarIncident = {
    id: incident.id,
    title: incident.title,
    severity: incident.severity,
    status: incident.status,
    description: incident.description ?? "",
    ownerEmail: incident.owner_email,
    createdAt: incident.created_at,
    tenantId,
  };

  const result = await provider.createIncident(soarIncident);

  // Record timeline entry
  try {
    const timelineId = crypto.randomUUID().replace(/-/g, "");
    await db
      .prepare(
        `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content, metadata)
         VALUES (?, ?, ?, 'auto_action', ?, ?, ?)`,
      )
      .bind(
        timelineId,
        incidentId,
        tenantId,
        user.email ?? "system",
        `Escalated to ${soarConfig.provider}`,
        JSON.stringify({ externalId: result.externalId, provider: result.provider }),
      )
      .run();
  } catch {
    // non-blocking
  }

  try {
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId ?? "unknown",
      actorEmail: user.email ?? "unknown",
      action: "incident.escalated",
      targetType: "incident",
      targetId: incidentId!,
      detail: JSON.stringify({ provider: soarConfig.provider, externalId: result.externalId }),
    });
  } catch {
    // non-blocking
  }

  return json({
    success: result.success,
    provider: result.provider,
    externalId: result.externalId,
    message: result.message,
  });
};
