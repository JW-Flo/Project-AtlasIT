import { json } from '@sveltejs/kit';
import { w as writeAudit } from './audit-DeKPFK-8.js';
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

const SUPPORTED_PROVIDERS = ["pagerduty", "opsgenie", "servicenow"];
function stubId(prefix) {
  return `${prefix}${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}
class PagerDutyStub {
  name = "pagerduty";
  async createIncident(incident) {
    return {
      success: true,
      externalId: stubId("stub-pd-"),
      provider: this.name,
      message: `[stub] PagerDuty incident created for: ${incident.title}`
    };
  }
  async updateIncident(externalId, _updates) {
    return { success: true, externalId, provider: this.name, message: "[stub] Updated" };
  }
  async resolveIncident(externalId) {
    return { success: true, externalId, provider: this.name, message: "[stub] Resolved" };
  }
  async acknowledge(externalId) {
    return { success: true, externalId, provider: this.name, message: "[stub] Acknowledged" };
  }
}
class OpsgenieStub {
  name = "opsgenie";
  async createIncident(incident) {
    return {
      success: true,
      externalId: stubId("stub-og-"),
      provider: this.name,
      message: `[stub] Opsgenie alert created for: ${incident.title}`
    };
  }
  async updateIncident(externalId, _updates) {
    return { success: true, externalId, provider: this.name, message: "[stub] Updated" };
  }
  async resolveIncident(externalId) {
    return { success: true, externalId, provider: this.name, message: "[stub] Resolved" };
  }
  async acknowledge(externalId) {
    return { success: true, externalId, provider: this.name, message: "[stub] Acknowledged" };
  }
}
class ServiceNowStub {
  name = "servicenow";
  async createIncident(incident) {
    return {
      success: true,
      externalId: stubId("stub-sn-"),
      provider: this.name,
      message: `[stub] ServiceNow incident created for: ${incident.title}`
    };
  }
  async updateIncident(externalId, _updates) {
    return { success: true, externalId, provider: this.name, message: "[stub] Updated" };
  }
  async resolveIncident(externalId) {
    return { success: true, externalId, provider: this.name, message: "[stub] Resolved" };
  }
  async acknowledge(externalId) {
    return { success: true, externalId, provider: this.name, message: "[stub] Acknowledged" };
  }
}
function createSoarProvider(config) {
  switch (config.provider) {
    case "pagerduty":
      return new PagerDutyStub();
    case "opsgenie":
      return new OpsgenieStub();
    case "servicenow":
      return new ServiceNowStub();
    default:
      throw new Error(`Unsupported SOAR provider: ${config.provider}`);
  }
}
function getDb(platform) {
  const env = platform?.env || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}
const POST = async ({ params, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const incidentId = params.id;
  const incident = await db.prepare("SELECT * FROM incidents WHERE id = ? AND tenant_id = ?").bind(incidentId, tenantId).first();
  if (!incident) return json({ error: "Incident not found" }, { status: 404 });
  let soarConfig = null;
  try {
    const row = await db.prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'soar_config'").bind(tenantId).first();
    if (row?.value) {
      const parsed = JSON.parse(row.value);
      if (parsed.enabled && SUPPORTED_PROVIDERS.includes(parsed.provider)) {
        soarConfig = parsed;
      }
    }
  } catch {
  }
  if (!soarConfig) {
    return json(
      { error: "No SOAR provider configured. Configure one in Settings > Integrations." },
      { status: 422 }
    );
  }
  const provider = createSoarProvider(soarConfig);
  const soarIncident = {
    id: incident.id,
    title: incident.title,
    severity: incident.severity,
    status: incident.status,
    description: incident.description ?? "",
    ownerEmail: incident.owner_email,
    createdAt: incident.created_at,
    tenantId
  };
  const result = await provider.createIncident(soarIncident);
  try {
    const timelineId = crypto.randomUUID().replace(/-/g, "");
    await db.prepare(
      `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content, metadata)
         VALUES (?, ?, ?, 'auto_action', ?, ?, ?)`
    ).bind(
      timelineId,
      incidentId,
      tenantId,
      user.email ?? "system",
      `Escalated to ${soarConfig.provider}`,
      JSON.stringify({ externalId: result.externalId, provider: result.provider })
    ).run();
  } catch {
  }
  try {
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId ?? "unknown",
      actorEmail: user.email ?? "unknown",
      action: "incident.escalated",
      targetType: "incident",
      targetId: incidentId,
      detail: JSON.stringify({ provider: soarConfig.provider, externalId: result.externalId })
    });
  } catch {
  }
  try {
    const { notify } = await import('./notifications-COLEq-wV.js');
    await notify(db, platform, {
      tenantId,
      type: "incident_escalated",
      title: `Incident escalated to ${soarConfig.provider}`,
      body: `${incident.title} was escalated by ${user.email}`,
      severity: "critical",
      sourceType: "incident",
      sourceId: incidentId,
      sourceLabel: incident.title,
      actionUrl: `/console/incidents`,
      metadata: { provider: soarConfig.provider, externalId: result.externalId }
    });
  } catch {
  }
  return json({
    success: result.success,
    provider: result.provider,
    externalId: result.externalId,
    message: result.message
  });
};

export { POST };
//# sourceMappingURL=_server.ts-CXBXEhmp.js.map
