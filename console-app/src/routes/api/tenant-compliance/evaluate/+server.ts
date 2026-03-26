import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { FRAMEWORK_CONTROLS, type Control } from "$lib/compliance/framework-controls";

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

interface TenantState {
  /** Boolean evaluation keys used by framework control evaluationKey */
  flags: Record<string, boolean>;
  /** Count of connected apps */
  connectedAppCount: number;
  /** Connected app IDs */
  connectedApps: string[];
  /** Count of directory users synced */
  directoryUserCount: number;
  /** Active automation rules count */
  automationRuleCount: number;
  /** Evidence collected per control_id */
  evidenceByControl: Record<string, number>;
  /** Total evidence count */
  totalEvidenceCount: number;
}

async function evaluateTenantState(db: any, tenantId: string): Promise<TenantState> {
  const flags: Record<string, boolean> = {
    directory_connected: false,
    apps_connected: false,
    incidents_configured: false,
    policies_generated: false,
    workflows_configured: false,
  };

  let connectedAppCount = 0;
  let connectedApps: string[] = [];
  let directoryUserCount = 0;
  let automationRuleCount = 0;
  const evidenceByControl: Record<string, number> = {};
  let totalEvidenceCount = 0;

  // Run all checks in parallel for speed
  const results = await Promise.allSettled([
    // Check directory connection
    db
      .prepare(
        "SELECT status FROM directory_connections WHERE tenant_id = ? AND status = 'active' LIMIT 1",
      )
      .bind(tenantId)
      .first(),

    // Check connected apps (with IDs)
    db.prepare("SELECT app_id FROM app_credentials WHERE tenant_id = ?").bind(tenantId).all(),

    // Check incidents
    db
      .prepare("SELECT COUNT(*) as count FROM incidents WHERE tenant_id = ?")
      .bind(tenantId)
      .first(),

    // Check policies
    db
      .prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'generated_policies'",
      )
      .bind(tenantId)
      .first(),

    // Check workflows
    db
      .prepare("SELECT COUNT(*) as count FROM workflows WHERE tenant_id = ?")
      .bind(tenantId)
      .first(),

    // Check directory user count
    db
      .prepare("SELECT COUNT(*) as count FROM directory_users WHERE tenant_id = ?")
      .bind(tenantId)
      .first(),

    // Check automation rules
    db
      .prepare("SELECT COUNT(*) as count FROM automation_rules WHERE tenant_id = ? AND enabled = 1")
      .bind(tenantId)
      .first(),

    // Check evidence per control
    db
      .prepare(
        "SELECT control_id, COUNT(*) as count FROM compliance_evidence WHERE tenant_id = ? GROUP BY control_id",
      )
      .bind(tenantId)
      .all(),
  ]);

  // Process results safely
  if (results[0].status === "fulfilled") flags.directory_connected = !!results[0].value;

  if (results[1].status === "fulfilled") {
    const rows = results[1].value?.results || [];
    connectedApps = rows.map((r: any) => r.app_id as string);
    connectedAppCount = connectedApps.length;
    flags.apps_connected = connectedAppCount > 0;
  }

  if (results[2].status === "fulfilled") {
    flags.incidents_configured = (results[2].value?.count || 0) > 0;
  }

  if (results[3].status === "fulfilled" && results[3].value?.value) {
    try {
      const policies = JSON.parse(results[3].value.value as string);
      flags.policies_generated = Array.isArray(policies) && policies.length > 0;
    } catch {
      /* ignore */
    }
  }

  if (results[4].status === "fulfilled") {
    flags.workflows_configured = (results[4].value?.count || 0) > 0;
  }

  if (results[5].status === "fulfilled") {
    directoryUserCount = results[5].value?.count || 0;
  }

  if (results[6].status === "fulfilled") {
    automationRuleCount = results[6].value?.count || 0;
  }

  if (results[7].status === "fulfilled") {
    const rows = results[7].value?.results || [];
    for (const row of rows as any[]) {
      evidenceByControl[row.control_id] = row.count;
      totalEvidenceCount += row.count;
    }
  }

  return {
    flags,
    connectedAppCount,
    connectedApps,
    directoryUserCount,
    automationRuleCount,
    evidenceByControl,
    totalEvidenceCount,
  };
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
      .prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'")
      .bind(tenantId)
      .first();
    if (row?.value) frameworks = JSON.parse(row.value as string);
  } catch {
    /* defaults */
  }
  if (frameworks.length === 0) frameworks = ["SOC2", "ISO27001", "NIST CSF"];

  const frameworkSet = new Set(frameworks);

  // Read current controls, scoped to selected frameworks
  let controls: Control[] = [];
  try {
    const row = await db
      .prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'",
      )
      .bind(tenantId)
      .first();
    if (row?.value) {
      const allControls: Control[] = JSON.parse(row.value as string);
      controls = allControls.filter((c) => frameworkSet.has(c.framework));
    }
  } catch {
    /* no controls */
  }

  // Evaluate actual tenant configuration
  const tenantState = await evaluateTenantState(db, tenantId);
  const results: EvaluationResult[] = [];
  const statusUpdates: Map<string, Control["status"]> = new Map();

  // Map control IDs to their compliance_evidence control_id patterns for evidence matching
  const controlIdNormalizers: Record<string, string[]> = {};

  for (const control of controls) {
    // Find the framework definition to check evaluationKey
    const defs = FRAMEWORK_CONTROLS[control.framework];
    if (!defs) continue;
    const def = defs.find(
      (d) =>
        `${control.framework.toLowerCase().replace(/\s+/g, "_")}_${d.name.toLowerCase().replace(/\s+/g, "_")}` ===
        control.id,
    );

    // Build list of evidence control_id patterns that map to this control
    // Evidence may use formats like "CC6.1", "A.9.2.6", or the full control.id
    const evidenceKeys: string[] = [control.id];
    if (def) {
      evidenceKeys.push(def.name);
    }
    controlIdNormalizers[control.id] = evidenceKeys;

    // Check evidence count for this control (match any known key pattern)
    let evidenceCount = 0;
    for (const key of evidenceKeys) {
      evidenceCount += tenantState.evidenceByControl[key] || 0;
    }
    // Also check MANUAL evidence that may not be linked to a specific control
    evidenceCount += tenantState.evidenceByControl["MANUAL"] || 0;

    // Determine promotion based on both configuration state and evidence
    const flagMet = def?.evaluationKey ? (tenantState.flags[def.evaluationKey] ?? false) : false;
    const hasEvidence = evidenceCount > 0;

    if (
      flagMet &&
      hasEvidence &&
      (control.status === "not_started" || control.status === "in_progress")
    ) {
      // Strong signal: both config and evidence exist → promote to implemented
      statusUpdates.set(control.id, "implemented");
      results.push({
        controlId: control.id,
        suggestedStatus: "implemented",
        reason: `Configuration verified (${def?.evaluationKey?.replace(/_/g, " ")}) with ${evidenceCount} evidence item(s)`,
        autoApplied: true,
      });
    } else if (flagMet && control.status === "not_started") {
      // Config present but no evidence yet → in_progress
      statusUpdates.set(control.id, "in_progress");
      results.push({
        controlId: control.id,
        suggestedStatus: "in_progress",
        reason: `Tenant has ${def?.evaluationKey?.replace(/_/g, " ")}`,
        autoApplied: true,
      });
    } else if (hasEvidence && control.status === "not_started") {
      // Evidence exists but config not detected → in_progress
      statusUpdates.set(control.id, "in_progress");
      results.push({
        controlId: control.id,
        suggestedStatus: "in_progress",
        reason: `${evidenceCount} evidence item(s) collected for this control`,
        autoApplied: true,
      });
    } else if (!flagMet && !hasEvidence && control.status === "not_started") {
      results.push({
        controlId: control.id,
        suggestedStatus: "not_started",
        reason: def?.evaluationKey
          ? `${def.evaluationKey.replace(/_/g, " ")} not yet configured; no evidence collected`
          : "No evidence collected",
        autoApplied: false,
      });
    }
  }

  // Apply all status updates atomically after the loop completes
  const updated = statusUpdates.size > 0;
  if (updated) {
    const updatedControls = controls.map((c) => {
      const newStatus = statusUpdates.get(c.id);
      return newStatus ? { ...c, status: newStatus } : c;
    });
    await db
      .prepare(
        `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
         VALUES (?, 'compliance_controls', ?)`,
      )
      .bind(tenantId, JSON.stringify(updatedControls))
      .run();
  }

  return json({
    success: true,
    tenantState: {
      ...tenantState.flags,
      connectedAppCount: tenantState.connectedAppCount,
      connectedApps: tenantState.connectedApps,
      directoryUserCount: tenantState.directoryUserCount,
      automationRuleCount: tenantState.automationRuleCount,
      totalEvidenceCount: tenantState.totalEvidenceCount,
    },
    evaluations: results,
    controlsUpdated: updated,
    frameworks,
  });
};
