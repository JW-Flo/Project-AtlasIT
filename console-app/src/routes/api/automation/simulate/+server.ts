import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { getRule } from "$lib/server/automation";
import { simulateRule } from "@atlasit/shared";
import type { AutomationEvent, TriggerType } from "@atlasit/shared";

const VALID_TRIGGER_TYPES: Set<string> = new Set([
  "user_joined_group",
  "user_left_group",
  "user_created",
  "user_deactivated",
  "app_connected",
  "app_disconnected",
  "app_health_changed",
  "schedule",
  "compliance_score_changed",
]);

/**
 * POST /api/automation/simulate
 * Dry-run a single automation rule against a real or generated event.
 * Never executes any actions.
 */
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  let body: { ruleId?: string; testEvent?: { type: string; payload: Record<string, unknown> } };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.ruleId) {
    return json({ error: "ruleId is required" }, { status: 400 });
  }

  const rule = await getRule(db, tenantId, body.ruleId);
  if (!rule) {
    return json({ error: "Rule not found" }, { status: 404 });
  }

  const timestamp = new Date().toISOString();
  let event: AutomationEvent;

  if (body.testEvent) {
    if (
      !body.testEvent.type ||
      typeof body.testEvent.type !== "string" ||
      !VALID_TRIGGER_TYPES.has(body.testEvent.type)
    ) {
      return json(
        { error: `Invalid trigger type. Must be one of: ${[...VALID_TRIGGER_TYPES].join(", ")}` },
        { status: 400 },
      );
    }
    if (!body.testEvent.payload || typeof body.testEvent.payload !== "object") {
      return json({ error: "testEvent.payload must be an object" }, { status: 400 });
    }
    event = {
      type: body.testEvent.type as TriggerType,
      tenantId,
      payload: body.testEvent.payload,
      timestamp,
      source: "simulate",
    };
  } else {
    const payload = await generateSamplePayload(db, tenantId, rule.triggerType);
    event = {
      type: rule.triggerType,
      tenantId,
      payload,
      timestamp,
      source: "simulate",
    };
  }

  const result = simulateRule(rule, event);

  // Persist simulation for history
  try {
    await db
      .prepare(
        `INSERT INTO automation_simulations
         (id, tenant_id, rule_id, rule_name, trigger_event, matched, actions_preview, condition_results, ran_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        tenantId,
        body.ruleId,
        rule.name,
        JSON.stringify(event),
        result.matched ? 1 : 0,
        JSON.stringify(result.actions ?? []),
        JSON.stringify(result.conditionResults ?? []),
        user.email,
      )
      .run();
  } catch {
    // Non-fatal — simulation result still returned
  }

  return json(result);
};

async function generateSamplePayload(
  db: D1Database,
  tenantId: string,
  triggerType: string,
): Promise<Record<string, unknown>> {
  switch (triggerType) {
    case "user_created":
    case "user_deactivated": {
      const user = await db
        .prepare("SELECT id, email, display_name FROM directory_users WHERE tenant_id = ? LIMIT 1")
        .bind(tenantId)
        .first<{ id: string; email: string; display_name: string }>();

      return user
        ? { userId: user.id, email: user.email, displayName: user.display_name }
        : { userId: "sample-user-id", email: "sample@tenant.com", displayName: "Sample User" };
    }

    case "user_joined_group":
    case "user_left_group": {
      const user = await db
        .prepare("SELECT id, email, display_name FROM directory_users WHERE tenant_id = ? LIMIT 1")
        .bind(tenantId)
        .first<{ id: string; email: string; display_name: string }>();

      const group = await db
        .prepare("SELECT id, name FROM directory_groups WHERE tenant_id = ? LIMIT 1")
        .bind(tenantId)
        .first<{ id: string; name: string }>();

      return {
        userId: user?.id ?? "sample-user-id",
        email: user?.email ?? "sample@tenant.com",
        displayName: user?.display_name ?? "Sample User",
        groupId: group?.id ?? "sample-group-id",
        groupName: group?.name ?? "Sample Group",
      };
    }

    case "app_connected":
    case "app_disconnected":
    case "app_health_changed": {
      const app = await db
        .prepare("SELECT app_id FROM app_health_checks WHERE tenant_id = ? LIMIT 1")
        .bind(tenantId)
        .first<{ app_id: string }>();

      return {
        appId: app?.app_id ?? "sample-app-id",
        healthy: triggerType !== "app_disconnected",
      };
    }

    case "schedule":
      return { timestamp: new Date().toISOString() };

    case "compliance_score_changed":
      return { score: 75, framework: "SOC2" };

    default:
      return {};
  }
}
