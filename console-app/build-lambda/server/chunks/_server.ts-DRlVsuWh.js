import { json } from '@sveltejs/kit';
import { e as getRule } from './automation-pg-BL11rGe-.js';
import './gap-analyzer-CVZTZ0l9.js';
import { a as simulateRule } from './engine-CzA3W71_.js';
import { queryPg, queryPgOne } from './pg-BHX2Ay11.js';
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

const VALID_TRIGGER_TYPES = /* @__PURE__ */ new Set([
  "user_joined_group",
  "user_left_group",
  "user_created",
  "user_deactivated",
  "app_connected",
  "app_disconnected",
  "app_health_changed",
  "schedule",
  "compliance_score_changed"
]);
const POST = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.ruleId) {
    return json({ error: "ruleId is required" }, { status: 400 });
  }
  const rule = await getRule(body.ruleId, tenantId);
  if (!rule) {
    return json({ error: "Rule not found" }, { status: 404 });
  }
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  let event;
  if (body.testEvent) {
    if (!body.testEvent.type || typeof body.testEvent.type !== "string" || !VALID_TRIGGER_TYPES.has(body.testEvent.type)) {
      return json(
        { error: `Invalid trigger type. Must be one of: ${[...VALID_TRIGGER_TYPES].join(", ")}` },
        { status: 400 }
      );
    }
    if (!body.testEvent.payload || typeof body.testEvent.payload !== "object") {
      return json({ error: "testEvent.payload must be an object" }, { status: 400 });
    }
    event = {
      type: body.testEvent.type,
      tenantId,
      payload: body.testEvent.payload,
      timestamp,
      source: "simulate"
    };
  } else {
    const payload = await generateSamplePayload(tenantId, rule.triggerType);
    const mergedPayload = { ...payload, ...rule.triggerConfig };
    event = {
      type: rule.triggerType,
      tenantId,
      payload: mergedPayload,
      timestamp,
      source: "simulate"
    };
  }
  const result = simulateRule(rule, event);
  try {
    await queryPg(
      `INSERT INTO automation_simulations
       (id, tenant_id, rule_id, rule_name, trigger_event, matched, actions_preview, condition_results, ran_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        crypto.randomUUID(),
        tenantId,
        body.ruleId,
        rule.name,
        JSON.stringify(event),
        result.matched ? true : false,
        JSON.stringify(result.actions ?? []),
        JSON.stringify(result.conditionResults ?? []),
        user.email
      ]
    );
  } catch {
  }
  return json(result);
};
async function generateSamplePayload(tenantId, triggerType) {
  switch (triggerType) {
    case "user_created":
    case "user_deactivated": {
      const user = await queryPgOne(
        "SELECT id, email, display_name FROM directory_users WHERE tenant_id = $1 LIMIT 1",
        [tenantId]
      );
      return user ? { userId: user.id, email: user.email, displayName: user.display_name } : { userId: "example-user-id", email: "user@example.com", displayName: "Example User" };
    }
    case "user_joined_group":
    case "user_left_group": {
      const user = await queryPgOne(
        "SELECT id, email, display_name FROM directory_users WHERE tenant_id = $1 LIMIT 1",
        [tenantId]
      );
      const group = await queryPgOne(
        "SELECT id, name FROM directory_groups WHERE tenant_id = $1 LIMIT 1",
        [tenantId]
      );
      return {
        userId: user?.id ?? "example-user-id",
        email: user?.email ?? "user@example.com",
        displayName: user?.display_name ?? "Example User",
        groupId: group?.id ?? "example-group-id",
        groupName: group?.name ?? "Example Group"
      };
    }
    case "app_connected":
    case "app_disconnected":
    case "app_health_changed": {
      const app = await queryPgOne(
        "SELECT app_id FROM app_health_checks WHERE tenant_id = $1 LIMIT 1",
        [tenantId]
      );
      return {
        appId: app?.app_id ?? "example-app-id",
        healthy: triggerType !== "app_disconnected"
      };
    }
    case "schedule":
      return { timestamp: (/* @__PURE__ */ new Date()).toISOString() };
    case "compliance_score_changed":
      return { score: 75, framework: "SOC2" };
    default:
      return {};
  }
}

export { POST };
//# sourceMappingURL=_server.ts-DRlVsuWh.js.map
