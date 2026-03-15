import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import {
  FRAMEWORK_CONTROLS,
  type Control,
} from "$lib/compliance/framework-controls";

/**
 * Evaluates the tenant's actual configuration against their selected
 * framework controls. Reads from onboarding config + live tenant state
 * to determine which controls can be auto-assessed.
 *
 * Evaluation keys:
 * - directory_connected: checks directory_connections table
 * - apps_connected: checks app_credentials count
 * - incidents_configured: checks if incidents endpoint is reachable / has data
 * - policies_generated: checks tenant_preferences for generated policies
 * - workflows_configured: checks if any workflows exist
 */

interface EvaluationResult {
  controlId: string;
  suggestedStatus: Control["status"];
  reason: string;
  autoApplied: boolean;
}

async function evaluateTenantState(db: any, tenantId: string) {
  const state: Record<string, boolean> = {
    directory_connected: false,
    apps_connected: false,
    incidents_configured: false,
    policies_generated: false,
    workflows_configured: false,
  };

  // Check directory connection
  try {
    const dir = await db
      .prepare(
        "SELECT status FROM directory_connections WHERE tenant_id = ? AND status = 'active' LIMIT 1",
      )
      .bind(tenantId)
      .first();
    state.directory_connected = !!dir;
  } catch {
    /* table may not exist */
  }

  // Check connected apps
  try {
    const apps = await db
      .prepare(
        "SELECT COUNT(*) as count FROM app_credentials WHERE tenant_id = ?",
      )
      .bind(tenantId)
      .first();
    state.apps_connected = (apps?.count || 0) > 0;
  } catch {
    /* table may not exist */
  }

  // Check incidents (proxy for incident response config)
  try {
    const incidents = await db
      .prepare("SELECT COUNT(*) as count FROM incidents WHERE tenant_id = ?")
      .bind(tenantId)
      .first();
    // Even having the table means it's configured; having data means active use
    state.incidents_configured = true;
  } catch {
    state.incidents_configured = false;
  }

  // Check policies generated
  try {
    const row = await db
      .prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'generated_policies'",
      )
      .bind(tenantId)
      .first();
    if (row?.value) {
      const policies = JSON.parse(row.value as string);
      state.policies_generated = Array.isArray(policies) && policies.length > 0;
    }
  } catch {
    /* no policies */
  }

  // Check workflows
  try {
    const wf = await db
      .prepare("SELECT COUNT(*) as count FROM workflows WHERE tenant_id = ?")
      .bind(tenantId)
      .first();
    state.workflows_configured = (wf?.count || 0) > 0;
  } catch {
    state.workflows_configured = false;
  }

  return state;
}

export const POST: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "No tenant" }, { status: 400 });

  // Read tenant frameworks
  let frameworks: string[] = [];
  try {
    const row = await db
      .prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'",
      )
      .bind(tenantId)
      .first();
    if (row?.value) frameworks = JSON.parse(row.value as string);
  } catch {
    /* defaults */
  }
  if (frameworks.length === 0) frameworks = ["SOC2", "ISO27001", "NIST CSF"];

  // Read current controls
  let controls: Control[] = [];
  try {
    const row = await db
      .prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'",
      )
      .bind(tenantId)
      .first();
    if (row?.value) controls = JSON.parse(row.value as string);
  } catch {
    /* no controls */
  }

  // Evaluate actual tenant configuration
  const tenantState = await evaluateTenantState(db, tenantId);
  const results: EvaluationResult[] = [];
  let updated = false;

  for (const control of controls) {
    // Find the framework definition to check evaluationKey
    const defs = FRAMEWORK_CONTROLS[control.framework];
    if (!defs) continue;
    const def = defs.find(
      (d) =>
        `${control.framework.toLowerCase().replace(/\s+/g, "_")}_${d.name.toLowerCase().replace(/\s+/g, "_")}` ===
        control.id,
    );
    if (!def?.evaluationKey) continue;

    const met = tenantState[def.evaluationKey] ?? false;

    if (met && control.status === "not_started") {
      // Auto-promote to in_progress if tenant has the prerequisite configured
      control.status = "in_progress";
      updated = true;
      results.push({
        controlId: control.id,
        suggestedStatus: "in_progress",
        reason: `Tenant has ${def.evaluationKey.replace(/_/g, " ")}`,
        autoApplied: true,
      });
    } else if (!met && control.status !== "not_started") {
      // Don't downgrade — just note the gap
      results.push({
        controlId: control.id,
        suggestedStatus: control.status,
        reason: `${def.evaluationKey.replace(/_/g, " ")} not yet configured`,
        autoApplied: false,
      });
    }
  }

  // Save updated controls if any auto-applied
  if (updated) {
    await db
      .prepare(
        `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
         VALUES (?, 'compliance_controls', ?)`,
      )
      .bind(tenantId, JSON.stringify(controls))
      .run();
  }

  return json({
    success: true,
    tenantState,
    evaluations: results,
    controlsUpdated: updated,
    frameworks,
  });
};
