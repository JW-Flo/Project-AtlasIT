import { json } from '@sveltejs/kit';
import { l as listRules, r as recordExecution } from './automation-pg-BL11rGe-.js';
import { D as DEFAULT_SLA_SECONDS, c as computeSlaBreachAt } from './lifecycle-BLhc1MUq.js';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import './gap-analyzer-CVZTZ0l9.js';
import { m as matchRules, s as sortActions, b as buildExecutionSummary, i as interpolateTemplate } from './engine-CzA3W71_.js';
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

async function emitEvent(db, tenantId, type, source, payload) {
  const id = crypto.randomUUID().replace(/-/g, "");
  await db.prepare(
    `INSERT INTO events (id, tenant_id, type, source, payload, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))`
  ).bind(id, tenantId, type, source, JSON.stringify(payload)).run();
  return id;
}
async function forwardToOrchestrator(orchestratorUrl, tenantId, type, payload, apiKey) {
  try {
    const res = await fetch(`${orchestratorUrl}/api/v1/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
        ...apiKey ? { "X-API-Key": apiKey } : {}
      },
      body: JSON.stringify({ type, tenantId, payload, source: "console-app" }),
      signal: AbortSignal.timeout(1e4)
    });
    if (!res.ok) {
      console.warn(
        `[automation-actions] Orchestrator forwarding failed: ${res.status} for ${type}`
      );
    }
  } catch (err) {
    console.warn(
      `[automation-actions] Orchestrator unreachable for ${type}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
const handleSendNotification = async (config, ctx) => {
  try {
    const { notify } = await import('./notifications-COLEq-wV.js');
    await notify(ctx.db, null, {
      tenantId: ctx.tenantId,
      type: "automation_triggered",
      title: config.title || "Automation notification",
      body: config.message || config.body || "",
      severity: config.severity || "info",
      sourceType: "automation_rule",
      sourceId: config.ruleId || void 0,
      sourceLabel: config.ruleName || "Automation rule",
      actionUrl: "/console/automation",
      metadata: { triggerPayload: ctx.payload }
    });
  } catch {
  }
  const eventId = await emitEvent(ctx.db, ctx.tenantId, "notification", "automation-engine", {
    ...config,
    triggerPayload: ctx.payload
  });
  return {
    actionType: "send_notification",
    status: "success",
    message: `Notification dispatched`,
    details: { eventId, ...config }
  };
};
const handleCreateIncident = async (config, ctx) => {
  const id = crypto.randomUUID().replace(/-/g, "");
  const title = config.title || config.message || `Auto-incident: ${ctx.payload?.eventType || "unknown event"}`;
  const severity = config.severity || "medium";
  const description = config.description || `Created by automation rule. Trigger: ${JSON.stringify(ctx.payload).slice(0, 500)}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let slaConfig = DEFAULT_SLA_SECONDS;
  try {
    const row = await ctx.db.prepare(
      "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'incident_sla_config'"
    ).bind(ctx.tenantId).first();
    if (row?.value) slaConfig = JSON.parse(row.value);
  } catch {
  }
  const slaBreachAt = computeSlaBreachAt(now, severity, slaConfig);
  try {
    await ctx.db.prepare(
      `INSERT INTO incidents (id, tenant_id, title, severity, status, source, source_id, description, created_at, sla_breach_at)
         VALUES (?, ?, ?, ?, 'open', 'automation', ?, ?, ?, ?)`
    ).bind(
      id,
      ctx.tenantId,
      title,
      severity,
      config.ruleId || null,
      description,
      now,
      slaBreachAt
    ).run();
  } catch (e) {
    return {
      actionType: "create_incident",
      status: "failed",
      message: `Failed to create incident: ${e?.message || "DB error"}`
    };
  }
  try {
    const timelineId = crypto.randomUUID().replace(/-/g, "");
    await ctx.db.prepare(
      `INSERT INTO incident_timeline (id, incident_id, tenant_id, entry_type, actor_email, content)
         VALUES (?, ?, ?, 'auto_action', 'system', 'Incident auto-created by automation rule')`
    ).bind(timelineId, id, ctx.tenantId).run();
  } catch {
  }
  try {
    const { notify } = await import('./notifications-COLEq-wV.js');
    await notify(ctx.db, null, {
      tenantId: ctx.tenantId,
      type: "incident_created",
      title: `Auto-incident: ${title}`,
      body: description,
      severity,
      sourceType: "incident",
      sourceId: id,
      sourceLabel: title,
      actionUrl: `/console/incidents`,
      metadata: { automated: true, ruleId: config.ruleId }
    });
  } catch {
  }
  const eventId = await emitEvent(ctx.db, ctx.tenantId, "incident.created", "automation-engine", {
    incidentId: id,
    title,
    severity,
    triggerPayload: ctx.payload
  });
  return {
    actionType: "create_incident",
    status: "success",
    message: `Incident created`,
    details: { incidentId: id, eventId, title, severity }
  };
};
const handleAssignRole = async (config, ctx) => {
  const email = config.email || ctx.payload.email;
  const role = config.role || "viewer";
  if (!email) {
    return {
      actionType: "assign_role",
      status: "failed",
      message: "No email provided for role assignment"
    };
  }
  const existing = await ctx.db.prepare("SELECT id, roles FROM console_user_roles WHERE email = ? AND tenant_id = ?").bind(email, ctx.tenantId).first();
  if (existing) {
    const currentRoles = JSON.parse(existing.roles || '["viewer"]');
    if (currentRoles.includes(role)) {
      return {
        actionType: "assign_role",
        status: "success",
        message: `Role "${role}" already assigned to ${email}`,
        details: { email, role, action: "no-op" }
      };
    }
    const updatedRoles = [...currentRoles, role];
    await ctx.db.prepare("UPDATE console_user_roles SET roles = ?, updated_at = datetime('now') WHERE id = ?").bind(JSON.stringify(updatedRoles), existing.id).run();
  } else {
    const id = crypto.randomUUID().replace(/-/g, "");
    await ctx.db.prepare("INSERT INTO console_user_roles (id, email, tenant_id, roles) VALUES (?, ?, ?, ?)").bind(id, email, ctx.tenantId, JSON.stringify([role])).run();
  }
  return {
    actionType: "assign_role",
    status: "success",
    message: `Role "${role}" assigned to ${email}`,
    details: { email, role }
  };
};
const handleRemoveRole = async (config, ctx) => {
  const email = config.email || ctx.payload.email;
  const role = config.role || "viewer";
  if (!email) {
    return {
      actionType: "remove_role",
      status: "failed",
      message: "No email provided for role removal"
    };
  }
  const existing = await ctx.db.prepare("SELECT id, roles FROM console_user_roles WHERE email = ? AND tenant_id = ?").bind(email, ctx.tenantId).first();
  if (!existing) {
    return {
      actionType: "remove_role",
      status: "success",
      message: `No roles found for ${email}`,
      details: { email, role, action: "no-op" }
    };
  }
  const currentRoles = JSON.parse(existing.roles || "[]");
  const updatedRoles = currentRoles.filter((r) => r !== role);
  if (updatedRoles.length === currentRoles.length) {
    return {
      actionType: "remove_role",
      status: "success",
      message: `Role "${role}" not present for ${email}`,
      details: { email, role, action: "no-op" }
    };
  }
  if (updatedRoles.length === 0) {
    await ctx.db.prepare("DELETE FROM console_user_roles WHERE id = ?").bind(existing.id).run();
  } else {
    await ctx.db.prepare("UPDATE console_user_roles SET roles = ?, updated_at = datetime('now') WHERE id = ?").bind(JSON.stringify(updatedRoles), existing.id).run();
  }
  return {
    actionType: "remove_role",
    status: "success",
    message: `Role "${role}" removed from ${email}`,
    details: { email, role }
  };
};
const handleUpdateComplianceStatus = async (config, ctx) => {
  const eventId = await emitEvent(
    ctx.db,
    ctx.tenantId,
    "compliance.status_changed",
    "automation-engine",
    { ...config, triggerPayload: ctx.payload }
  );
  return {
    actionType: "update_compliance_status",
    status: "success",
    message: `Compliance status change event emitted`,
    details: { eventId, ...config }
  };
};
const handleProvisionAppAccess = async (config, ctx) => {
  const appId = config.appId;
  if (!appId) {
    return {
      actionType: "provision_app_access",
      status: "failed",
      message: "No appId specified for provisioning"
    };
  }
  const credential = await ctx.db.prepare("SELECT id FROM app_credentials WHERE tenant_id = ? AND app_id = ?").bind(ctx.tenantId, appId).first();
  if (!credential) {
    return {
      actionType: "provision_app_access",
      status: "skipped",
      message: `App "${appId}" is not connected — skipping provisioning`,
      details: { appId }
    };
  }
  const provisionPayload = { action: "provision", appId, ...config, triggerPayload: ctx.payload };
  const eventId = await emitEvent(
    ctx.db,
    ctx.tenantId,
    "provisioning.requested",
    "automation-engine",
    provisionPayload
  );
  if (ctx.orchestratorUrl) {
    forwardToOrchestrator(
      ctx.orchestratorUrl,
      ctx.tenantId,
      "provisioning.requested",
      provisionPayload,
      ctx.serviceApiKey
    );
  }
  return {
    actionType: "provision_app_access",
    status: "success",
    message: `Provisioning event emitted for ${appId}`,
    details: { eventId, appId }
  };
};
const handleRevokeAppAccess = async (config, ctx) => {
  const appId = config.appId;
  if (!appId) {
    return {
      actionType: "revoke_app_access",
      status: "failed",
      message: "No appId specified for revocation"
    };
  }
  const credential = await ctx.db.prepare("SELECT id FROM app_credentials WHERE tenant_id = ? AND app_id = ?").bind(ctx.tenantId, appId).first();
  if (!credential) {
    return {
      actionType: "revoke_app_access",
      status: "skipped",
      message: `App "${appId}" is not connected — skipping revocation`,
      details: { appId }
    };
  }
  const revokePayload = { action: "revoke", appId, ...config, triggerPayload: ctx.payload };
  const eventId = await emitEvent(
    ctx.db,
    ctx.tenantId,
    "provisioning.requested",
    "automation-engine",
    revokePayload
  );
  if (ctx.orchestratorUrl) {
    forwardToOrchestrator(
      ctx.orchestratorUrl,
      ctx.tenantId,
      "provisioning.requested",
      revokePayload,
      ctx.serviceApiKey
    );
  }
  return {
    actionType: "revoke_app_access",
    status: "success",
    message: `Revocation event emitted for ${appId}`,
    details: { eventId, appId }
  };
};
const handleRunWorkflow = async (config, ctx) => {
  const eventId = await emitEvent(ctx.db, ctx.tenantId, "workflow.requested", "automation-engine", {
    ...config,
    triggerPayload: ctx.payload
  });
  return {
    actionType: "run_workflow",
    status: "success",
    message: `Workflow request event emitted`,
    details: { eventId, ...config }
  };
};
const handleSyncDirectory = async (config, ctx) => {
  const eventId = await emitEvent(
    ctx.db,
    ctx.tenantId,
    "directory.sync_requested",
    "automation-engine",
    { ...config, triggerPayload: ctx.payload }
  );
  return {
    actionType: "sync_directory",
    status: "success",
    message: `Directory sync request event emitted`,
    details: { eventId, ...config }
  };
};
const handlers = {
  send_notification: handleSendNotification,
  create_incident: handleCreateIncident,
  assign_role: handleAssignRole,
  remove_role: handleRemoveRole,
  update_compliance_status: handleUpdateComplianceStatus,
  provision_app_access: handleProvisionAppAccess,
  revoke_app_access: handleRevokeAppAccess,
  run_workflow: handleRunWorkflow,
  sync_directory: handleSyncDirectory
};
async function executeAction(actionType, config, ctx) {
  const handler = handlers[actionType];
  if (!handler) {
    return {
      actionType,
      status: "failed",
      message: `Unknown action type: ${actionType}`
    };
  }
  let result;
  try {
    result = await handler(config, ctx);
  } catch (err) {
    result = {
      actionType,
      status: "failed",
      message: err?.message || "Action handler threw an unexpected error"
    };
  }
  recordActionEvidence(ctx.db, ctx.tenantId, actionType, result, config);
  return result;
}
const ACTION_CONTROL_REFS = {
  provision_app_access: ["SOC2-CC6.2", "ISO-27001-A.9.2.1", "NIST-CSF-PR.AC-1"],
  revoke_app_access: ["SOC2-CC6.3", "ISO-27001-A.9.2.6", "HIPAA-164.312(a)(1)"],
  assign_role: ["SOC2-CC6.1", "ISO-27001-A.9.2.2"],
  remove_role: ["SOC2-CC6.3", "ISO-27001-A.9.2.6"],
  create_incident: ["SOC2-CC7.3", "ISO-27001-A.16.1.2", "NIST-CSF-RS.RP-1"],
  send_notification: ["SOC2-CC2.2"],
  update_compliance_status: ["SOC2-CC4.1", "ISO-27001-A.18.2.1"],
  run_workflow: ["SOC2-CC8.1", "ISO-27001-A.12.1.2"],
  sync_directory: ["SOC2-CC6.1", "ISO-27001-A.9.2.1"]
};
function recordActionEvidence(db, tenantId, actionType, result, config) {
  const refs = ACTION_CONTROL_REFS[actionType];
  if (!refs || refs.length === 0) return;
  const id = `action-${tenantId}-${actionType}-${Date.now()}`;
  const evidenceStatus = result.status === "success" ? "pass" : "fail";
  const metadata = JSON.stringify({
    status: evidenceStatus,
    actionType,
    outcome: result.status,
    message: result.message,
    config: { appId: config.appId, role: config.role },
    recordedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  const primaryRef = refs[0];
  const framework = primaryRef.startsWith("ISO-") ? "ISO27001" : primaryRef.startsWith("NIST-") ? "NIST_CSF" : primaryRef.startsWith("HIPAA-") ? "HIPAA" : primaryRef.startsWith("GDPR-") ? "GDPR" : "SOC2";
  db.prepare(
    `INSERT INTO compliance_evidence
     (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, 'automation_action', 'automation-engine', ?, 'system', ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET metadata = excluded.metadata, created_at = excluded.created_at`
  ).bind(
    id,
    tenantId,
    framework,
    primaryRef.replace(/^[A-Z0-9]+-/, ""),
    `${actionType}:${result.status}`,
    `automation:${actionType}:${Date.now()}`,
    config.appId ?? actionType,
    metadata
  ).run().catch(() => {
  });
}
const POST = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const orchestratorUrl = platform?.env?.ORCHESTRATOR_URL;
  const serviceApiKey = platform?.env?.ORCHESTRATOR_API_KEY || platform?.env?.INTERNAL_API_KEY || "";
  let event;
  try {
    event = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!event.type || !event.payload) {
    return json({ error: "type and payload are required" }, { status: 400 });
  }
  event.tenantId = tenantId;
  event.timestamp = event.timestamp || (/* @__PURE__ */ new Date()).toISOString();
  const allRules = await listRules(tenantId);
  const matched = matchRules(allRules, event);
  if (matched.length === 0) {
    return json({ matched: 0, results: [] });
  }
  const allResults = [];
  for (const rule of matched) {
    const startTime = Date.now();
    const actions = sortActions(rule.actions);
    const results = [];
    for (const action of actions) {
      try {
        const interpolatedConfig = interpolateConfig(action.config, event.payload);
        const result = await executeAction(action.type, interpolatedConfig, {
          tenantId,
          payload: event.payload,
          orchestratorUrl,
          serviceApiKey
        });
        results.push(result);
      } catch (err) {
        results.push({
          actionType: action.type,
          status: "failed",
          message: err?.message || "Unknown error"
        });
      }
    }
    const durationMs = Date.now() - startTime;
    const summary = buildExecutionSummary(rule, results, durationMs);
    await recordExecution(tenantId, rule.id, {
      triggerEvent: event.payload,
      status: summary.status,
      actionsRun: summary.actionsRun,
      actionsFailed: summary.actionsFailed,
      results,
      durationMs: summary.durationMs,
      startedAt: event.timestamp,
      completedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    await writeAudit({
      tenantId,
      actorUserId: "system",
      actorEmail: "automation@atlasit.io",
      action: "automation.executed",
      targetType: "automation_rule",
      targetId: rule.id,
      detail: JSON.stringify({
        ruleName: rule.name,
        triggerType: event.type,
        status: summary.status,
        actionsRun: summary.actionsRun,
        durationMs
      })
    });
    allResults.push({ ruleId: rule.id, ruleName: rule.name, results });
  }
  return json({ matched: matched.length, results: allResults });
};
function interpolateConfig(config, payload) {
  const out = {};
  for (const [k, v] of Object.entries(config)) {
    out[k] = typeof v === "string" ? interpolateTemplate(v, payload) : v;
  }
  return out;
}

export { POST };
//# sourceMappingURL=_server.ts-BHr_hNC0.js.map
