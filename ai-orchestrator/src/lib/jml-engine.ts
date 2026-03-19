/**
 * Zero-config JML (Joiner / Mover / Leaver) engine.
 *
 * Detects user lifecycle changes from directory sync events and
 * automatically executes the appropriate workflow — no manual
 * automation rule configuration required.
 *
 * Flow:
 *   1. Adapter publishes user.* event → events route
 *   2. Event route calls classifyAndExecute()
 *   3. JML engine:
 *      a. Loads tenant JML policy (enabled by default)
 *      b. Classifies the change (joiner / mover / leaver / rehire)
 *      c. Resolves the access bundle from group→app mappings
 *      d. Builds workflow steps (provision/revoke per app)
 *      e. Starts WorkflowDO and records in directory_changelog + workflow_runs
 *      f. Emits activity stream event for real-time UI
 */

import { enrichUserProfile } from "./profile-enricher";
import type { CanonicalUserProfile } from "@atlasit/shared/automation/types";
import { classifyEvent, storeEvidence } from "@atlasit/shared";

// ── Types ───────────────────────────────────────────────────────────────────

export interface JmlPolicy {
  tenantId: string;
  enabled: boolean;
  autoJoiner: boolean;
  autoLeaver: boolean;
  autoMover: boolean;
  leaverGraceMs: number;
  notifyManager: boolean;
  notifyUser: boolean;
  requireJoinerApproval: boolean;
}

export type JmlAction = "joiner" | "leaver" | "mover" | "rehire";

export interface DirectoryChange {
  userId: string;
  email?: string;
  externalId?: string;
  changeType: "created" | "updated" | "deactivated" | "deleted" | "reactivated";
  delta: Record<string, { old?: unknown; new?: unknown }>;
  source: string;
}

export interface JmlClassification {
  action: JmlAction;
  userId: string;
  email?: string;
  reason: string;
  /** Apps to provision (joiner/mover/rehire) */
  appsToProvision: AppAccess[];
  /** Apps to revoke (leaver/mover) */
  appsToRevoke: AppAccess[];
  profile: CanonicalUserProfile | null;
}

interface AppAccess {
  appId: string;
  role: string;
  groupId: string;
}

export interface JmlContext {
  db: D1Database;
  workflow: DurableObjectNamespace;
  adapterUrls: Record<string, string>;
  selfUrl?: string;
  /** Optional R2 bucket for tamper-evident evidence storage */
  evidenceBucket?: R2Bucket;
}

// ── Main entry point ────────────────────────────────────────────────────────

/**
 * Classify a directory change and auto-execute the appropriate JML workflow.
 * Returns null if JML is disabled or no action is needed.
 */
export async function classifyAndExecute(
  tenantId: string,
  change: DirectoryChange,
  ctx: JmlContext,
): Promise<{ action: JmlAction; workflowRunId: string } | null> {
  // 1. Load policy
  const policy = await loadJmlPolicy(ctx.db, tenantId);
  if (!policy.enabled) return null;

  // 2. Classify
  const classification = await classify(tenantId, change, ctx.db);
  if (!classification) return null;

  // 3. Check policy allows this action
  if (classification.action === "joiner" && !policy.autoJoiner) return null;
  if (classification.action === "leaver" && !policy.autoLeaver) return null;
  if (classification.action === "mover" && !policy.autoMover) return null;
  if (classification.action === "rehire" && !policy.autoJoiner) return null;

  // 4. Build and execute workflow
  const workflowRunId = await executeJmlWorkflow(
    tenantId,
    classification,
    policy,
    ctx,
  );

  // 5. Record in changelog
  const changelogId = crypto.randomUUID().replace(/-/g, "");
  await ctx.db
    .prepare(
      `INSERT INTO directory_changelog (id, tenant_id, user_id, email, change_type, delta, jml_action, workflow_run_id, source, processed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    )
    .bind(
      changelogId,
      tenantId,
      change.userId,
      change.email ?? null,
      change.changeType,
      JSON.stringify(change.delta),
      classification.action,
      workflowRunId,
      change.source,
    )
    .run();

  // 6. Emit compliance evidence for the JML action
  await emitJmlEvidence(tenantId, classification, workflowRunId, change, ctx);

  // 7. Emit activity stream event
  await emitActivity(ctx.db, tenantId, classification, workflowRunId);

  return { action: classification.action, workflowRunId };
}

// ── Classification ──────────────────────────────────────────────────────────

async function classify(
  tenantId: string,
  change: DirectoryChange,
  db: D1Database,
): Promise<JmlClassification | null> {
  const profile = await enrichUserProfile(db, tenantId, {
    email: change.email,
    userId: change.userId,
    externalId: change.externalId,
  }).catch(() => null);

  switch (change.changeType) {
    case "created": {
      const appsToProvision = profile?.appAccess ?? [];
      if (appsToProvision.length === 0 && !profile) return null;
      return {
        action: "joiner",
        userId: change.userId,
        email: change.email,
        reason: "New user detected in directory sync",
        appsToProvision,
        appsToRevoke: [],
        profile,
      };
    }

    case "deactivated":
    case "deleted": {
      const appsToRevoke = profile?.appAccess ?? [];
      return {
        action: "leaver",
        userId: change.userId,
        email: change.email,
        reason: `User ${change.changeType} in directory`,
        appsToProvision: [],
        appsToRevoke,
        profile,
      };
    }

    case "reactivated": {
      const appsToProvision = profile?.appAccess ?? [];
      return {
        action: "rehire",
        userId: change.userId,
        email: change.email,
        reason: "User reactivated in directory",
        appsToProvision,
        appsToRevoke: [],
        profile,
      };
    }

    case "updated": {
      return classifyUpdate(tenantId, change, profile, db);
    }

    default:
      return null;
  }
}

/**
 * Classify a profile update — detect department/group/role changes that
 * require a mover workflow (revoke old access, provision new).
 */
async function classifyUpdate(
  tenantId: string,
  change: DirectoryChange,
  profile: CanonicalUserProfile | null,
  db: D1Database,
): Promise<JmlClassification | null> {
  const delta = change.delta;

  // Detect meaningful mover signals
  const moverFields = ["department", "title", "manager", "orgUnit", "groups"];
  const changedFields = Object.keys(delta).filter((f) =>
    moverFields.includes(f),
  );
  if (changedFields.length === 0) return null;

  // Resolve old and new access bundles
  const currentApps = profile?.appAccess ?? [];

  // Load previous group memberships from delta to compute revocations
  const oldGroups = delta.groups?.old as string[] | undefined;
  let oldApps: AppAccess[] = [];

  if (oldGroups && oldGroups.length > 0) {
    // Resolve what apps the old groups mapped to
    const placeholders = oldGroups.map(() => "?").join(",");
    const { results } = await db
      .prepare(
        `SELECT app_id as appId, role, group_id as groupId
         FROM group_app_mappings
         WHERE tenant_id = ? AND group_id IN (${placeholders})`,
      )
      .bind(tenantId, ...oldGroups)
      .all<AppAccess>();
    oldApps = results ?? [];
  }

  // Apps to revoke: were in old set, not in new set
  const currentAppIds = new Set(currentApps.map((a) => `${a.appId}:${a.role}`));
  const appsToRevoke = oldApps.filter(
    (a) => !currentAppIds.has(`${a.appId}:${a.role}`),
  );

  // Apps to provision: in new set, not in old set
  const oldAppIds = new Set(oldApps.map((a) => `${a.appId}:${a.role}`));
  const appsToProvision = currentApps.filter(
    (a) => !oldAppIds.has(`${a.appId}:${a.role}`),
  );

  if (appsToRevoke.length === 0 && appsToProvision.length === 0) return null;

  return {
    action: "mover",
    userId: change.userId,
    email: change.email,
    reason: `User profile updated: ${changedFields.join(", ")}`,
    appsToProvision,
    appsToRevoke,
    profile,
  };
}

// ── Workflow execution ──────────────────────────────────────────────────────

async function executeJmlWorkflow(
  tenantId: string,
  classification: JmlClassification,
  policy: JmlPolicy,
  ctx: JmlContext,
): Promise<string> {
  const runId = crypto.randomUUID();
  const steps = buildJmlSteps(classification, ctx.adapterUrls, policy);

  // Start WorkflowDO
  const doId = ctx.workflow.idFromName(runId);
  const stub = ctx.workflow.get(doId);

  const profileContext = classification.profile
    ? {
        userId: classification.profile.id,
        email: classification.profile.email,
        displayName: classification.profile.displayName,
        firstName: classification.profile.firstName,
        lastName: classification.profile.lastName,
        department: classification.profile.department,
        title: classification.profile.title,
        manager: classification.profile.manager,
        phone: classification.profile.phone,
        groups: classification.profile.groups,
        appAccess: classification.profile.appAccess,
        rawAttributes: classification.profile.rawAttributes,
      }
    : {};

  await stub.fetch(
    new Request("http://workflow/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        definition: {
          id: `jml-${classification.action}-${runId}`,
          name: `${classification.action} workflow`,
          steps: steps.main,
          onFailure: steps.compensation,
          globalTimeoutMs: 5 * 60_000,
        },
        tenantId,
        correlationId: runId,
        context: {
          workflowType: classification.action,
          trigger: "jml_auto",
          jmlReason: classification.reason,
          ...profileContext,
        },
      }),
    }),
  );

  // Record in workflow_runs
  await ctx.db
    .prepare(
      `INSERT INTO workflow_runs (id, tenant_id, type, user_id, email, status, trigger, steps_total, context)
       VALUES (?, ?, ?, ?, ?, 'running', 'jml_auto', ?, ?)`,
    )
    .bind(
      runId,
      tenantId,
      classification.action,
      classification.userId,
      classification.email ?? null,
      steps.main.length,
      JSON.stringify(profileContext),
    )
    .run();

  // Send notifications if configured
  if (policy.notifyManager && classification.profile?.manager && ctx.selfUrl) {
    notifyAsync(ctx.selfUrl, tenantId, classification, "manager").catch(
      () => {},
    );
  }
  if (policy.notifyUser && classification.email && ctx.selfUrl) {
    notifyAsync(ctx.selfUrl, tenantId, classification, "user").catch(() => {});
  }

  return runId;
}

interface WorkflowStepDef {
  id: string;
  name: string;
  handler: string;
  timeoutMs: number;
  compensate?: string;
  delayMs?: number;
}

function buildJmlSteps(
  classification: JmlClassification,
  adapterUrls: Record<string, string>,
  policy: JmlPolicy,
): { main: WorkflowStepDef[]; compensation: WorkflowStepDef[] } {
  const main: WorkflowStepDef[] = [];
  const compensation: WorkflowStepDef[] = [];

  // Always start with access resolution
  main.push({
    id: "resolve_access",
    name: "Resolve access bundle",
    handler: "atlas.resolve_access_bundle",
    timeoutMs: 10_000,
  });

  if (
    classification.action === "joiner" ||
    classification.action === "rehire"
  ) {
    // Provision each app the user should have access to
    for (const app of classification.appsToProvision) {
      if (!adapterUrls[app.appId]) continue;
      main.push({
        id: `provision_${app.appId}`,
        name: `Provision ${app.appId} (${app.role})`,
        handler: `${app.appId}.provision`,
        timeoutMs: 30_000,
        compensate: `${app.appId}.deprovision`,
      });
      compensation.push({
        id: `provision_${app.appId}`,
        name: `Rollback ${app.appId}`,
        handler: `${app.appId}.deprovision`,
        timeoutMs: 30_000,
      });
    }
  }

  if (classification.action === "leaver") {
    // Apply grace period delay to the first revocation step if configured
    let graceApplied = false;
    for (const app of classification.appsToRevoke) {
      if (!adapterUrls[app.appId]) continue;
      const step: WorkflowStepDef = {
        id: `revoke_${app.appId}`,
        name: `Revoke ${app.appId}`,
        handler: `${app.appId}.deprovision`,
        timeoutMs: 30_000,
      };
      // Apply grace period delay to the first revocation step
      if (!graceApplied && policy.leaverGraceMs > 0) {
        step.delayMs = policy.leaverGraceMs;
        step.name = `Revoke ${app.appId} (after ${Math.round(policy.leaverGraceMs / 60_000)}min grace)`;
        graceApplied = true;
      }
      main.push(step);
    }
  }

  if (classification.action === "mover") {
    // Revoke old apps first
    for (const app of classification.appsToRevoke) {
      if (!adapterUrls[app.appId]) continue;
      main.push({
        id: `revoke_old_${app.appId}`,
        name: `Revoke old ${app.appId} (${app.role})`,
        handler: `${app.appId}.deprovision`,
        timeoutMs: 30_000,
      });
    }
    // Then provision new apps
    for (const app of classification.appsToProvision) {
      if (!adapterUrls[app.appId]) continue;
      main.push({
        id: `provision_new_${app.appId}`,
        name: `Provision ${app.appId} (${app.role})`,
        handler: `${app.appId}.provision`,
        timeoutMs: 30_000,
        compensate: `${app.appId}.deprovision`,
      });
      compensation.push({
        id: `provision_new_${app.appId}`,
        name: `Rollback ${app.appId}`,
        handler: `${app.appId}.deprovision`,
        timeoutMs: 30_000,
      });
    }
  }

  // Always emit evidence at the end
  main.push({
    id: "emit_evidence",
    name: `Emit ${classification.action} evidence`,
    handler: "atlas.emit_evidence",
    timeoutMs: 10_000,
  });

  return { main, compensation };
}

// ── Policy loading ──────────────────────────────────────────────────────────

const DEFAULT_POLICY: Omit<JmlPolicy, "tenantId"> = {
  enabled: true,
  autoJoiner: true,
  autoLeaver: true,
  autoMover: true,
  leaverGraceMs: 0,
  notifyManager: true,
  notifyUser: false,
  requireJoinerApproval: false,
};

export async function loadJmlPolicy(
  db: D1Database,
  tenantId: string,
): Promise<JmlPolicy> {
  const row = await db
    .prepare("SELECT * FROM jml_policies WHERE tenant_id = ?")
    .bind(tenantId)
    .first<Record<string, unknown>>();

  if (!row) return { tenantId, ...DEFAULT_POLICY };

  return {
    tenantId,
    enabled: !!row.enabled,
    autoJoiner: !!row.auto_joiner,
    autoLeaver: !!row.auto_leaver,
    autoMover: !!row.auto_mover,
    leaverGraceMs: (row.leaver_grace_ms as number) ?? 0,
    notifyManager: !!row.notify_manager,
    notifyUser: !!row.notify_user,
    requireJoinerApproval: !!row.require_joiner_approval,
  };
}

export async function upsertJmlPolicy(
  db: D1Database,
  policy: JmlPolicy,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO jml_policies (tenant_id, enabled, auto_joiner, auto_leaver, auto_mover, leaver_grace_ms, notify_manager, notify_user, require_joiner_approval, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT (tenant_id) DO UPDATE SET
         enabled = excluded.enabled,
         auto_joiner = excluded.auto_joiner,
         auto_leaver = excluded.auto_leaver,
         auto_mover = excluded.auto_mover,
         leaver_grace_ms = excluded.leaver_grace_ms,
         notify_manager = excluded.notify_manager,
         notify_user = excluded.notify_user,
         require_joiner_approval = excluded.require_joiner_approval,
         updated_at = datetime('now')`,
    )
    .bind(
      policy.tenantId,
      policy.enabled ? 1 : 0,
      policy.autoJoiner ? 1 : 0,
      policy.autoLeaver ? 1 : 0,
      policy.autoMover ? 1 : 0,
      policy.leaverGraceMs,
      policy.notifyManager ? 1 : 0,
      policy.notifyUser ? 1 : 0,
      policy.requireJoinerApproval ? 1 : 0,
    )
    .run();
}

// ── JML Evidence emission ────────────────────────────────────────────────────

/**
 * Maps a JML action to the canonical directory event type used for evidence
 * classification. These event types have dedicated classifier rules with
 * full control tag sets (CC6.1, CC6.3, A.9.2.6, etc.).
 */
const JML_ACTION_EVENT_TYPE: Record<JmlAction, string> = {
  joiner: "directory.user.joined",
  leaver: "directory.user.left",
  mover: "directory.user.moved",
  rehire: "directory.user.joined", // rehire is a joiner from a compliance perspective
};

async function emitJmlEvidence(
  tenantId: string,
  classification: JmlClassification,
  workflowRunId: string,
  change: DirectoryChange,
  ctx: JmlContext,
): Promise<void> {
  const eventType = JML_ACTION_EVENT_TYPE[classification.action];
  const actor = classification.email ?? classification.userId;
  const subject = classification.email ?? null;

  const payload: Record<string, unknown> = {
    jmlAction: classification.action,
    reason: classification.reason,
    workflowRunId,
    userId: classification.userId,
    email: classification.email,
    source: change.source,
    appsToProvision: classification.appsToProvision.map((a) => a.appId),
    appsToRevoke: classification.appsToRevoke.map((a) => a.appId),
    profile: classification.profile
      ? {
          department: classification.profile.department,
          title: classification.profile.title,
        }
      : undefined,
  };

  const classified = classifyEvent(
    tenantId,
    eventType,
    change.source,
    actor,
    subject,
    payload,
  );

  if (!classified) return;

  await storeEvidence(
    { db: ctx.db, bucket: ctx.evidenceBucket },
    classified,
  ).catch((err) => {
    // Non-fatal: log but never block the JML workflow
    console.error(
      JSON.stringify({
        level: "error",
        message: "JML evidence locker write failed",
        tenantId,
        jmlAction: classification.action,
        workflowRunId,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  });
}

// ── Activity stream ─────────────────────────────────────────────────────────

export async function emitActivity(
  db: D1Database,
  tenantId: string,
  classification: JmlClassification,
  workflowRunId: string,
): Promise<void> {
  const titles: Record<JmlAction, string> = {
    joiner: `Joiner workflow started for ${classification.email ?? classification.userId}`,
    leaver: `Leaver workflow started for ${classification.email ?? classification.userId}`,
    mover: `Mover workflow started for ${classification.email ?? classification.userId}`,
    rehire: `Rehire workflow started for ${classification.email ?? classification.userId}`,
  };

  await db
    .prepare(
      `INSERT INTO activity_stream (tenant_id, event_type, title, detail, severity, entity_type, entity_id, actor, metadata)
       VALUES (?, ?, ?, ?, 'info', 'workflow_run', ?, 'system', ?)`,
    )
    .bind(
      tenantId,
      `jml.${classification.action}_started`,
      titles[classification.action],
      classification.reason,
      workflowRunId,
      JSON.stringify({
        appsToProvision: classification.appsToProvision.map((a) => a.appId),
        appsToRevoke: classification.appsToRevoke.map((a) => a.appId),
      }),
    )
    .run();
}

// ── Notification helper ─────────────────────────────────────────────────────

async function notifyAsync(
  selfUrl: string,
  tenantId: string,
  classification: JmlClassification,
  target: "manager" | "user",
): Promise<void> {
  await fetch(`${selfUrl}/api/v1/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenantId,
      type: `notification.jml_${classification.action}`,
      source: "jml-engine",
      payload: {
        channel: "slack",
        target,
        notifyUser: target === "user" ? classification.email : undefined,
        notifyAdmin:
          target === "manager" ? classification.profile?.manager : undefined,
        user: {
          email: classification.email,
          displayName: classification.profile?.displayName,
          department: classification.profile?.department,
          title: classification.profile?.title,
        },
        action: classification.action,
        reason: classification.reason,
      },
    }),
  });
}
