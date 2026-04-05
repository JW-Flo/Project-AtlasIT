/**
 * Step executor for WorkflowDO step-task queue messages.
 *
 * Receives a step-task message, loads run state from the WorkflowDO to
 * resolve the handler and context, dispatches via the handler registry,
 * then reports success/failure back to the DO.
 *
 * The handler registry (handler-registry.ts) replaces the old hard-coded
 * dispatch logic. Built-in handlers are registered at worker startup.
 */

import { resolveHandler, type StepHandlerContext } from "./handler-registry";

interface WorkflowStatusResponse {
  id: string;
  type: string;
  status: string;
  tenantId: string;
  steps: Array<{ stepId: string; action: string; status: string; attempts: number }>;
  history: Array<{ stepId: string; status: string; attemptNumber: number; output?: unknown }>;
  context: Record<string, unknown>;
  createdAt: string;
}

export interface StepTaskEnv {
  WORKFLOW: DurableObjectNamespace;
  ADAPTER_URLS?: string;
  EVIDENCE?: R2Bucket;
  DB?: D1Database;
}

/**
 * Execute a step-task message end-to-end:
 * 1. Load run state from WorkflowDO
 * 2. Dispatch handler via registry
 * 3. Post step-complete or step-fail back to WorkflowDO
 *
 * Throws if the WorkflowDO is unreachable — caller should retry().
 * Does NOT throw on adapter errors — those are reported as step-fail.
 */
export async function executeStepTask(
  msg: {
    runId: string;
    stepId: string;
    attempt: number;
    compensation?: boolean;
    idempotencyKey?: string;
  },
  env: StepTaskEnv,
): Promise<void> {
  const adapterUrls = parseAdapterUrls(env.ADAPTER_URLS);
  const doId = env.WORKFLOW.idFromName(msg.runId);
  const stub = env.WORKFLOW.get(doId);

  // Load run state from WorkflowDO
  const statusRes = await stub.fetch(new Request("http://workflow/status"));
  if (!statusRes.ok) {
    throw new Error(`WorkflowDO status unavailable: HTTP ${statusRes.status}`);
  }
  const runState = (await statusRes.json()) as WorkflowStatusResponse;

  const step = runState.steps.find((s) => s.stepId === msg.stepId);
  if (!step) {
    // Step not found — silently ack, likely a duplicate delivery
    return;
  }

  // Idempotency check: if this exact attempt already has a completion in
  // history, skip re-execution and return the cached result to the DO.
  if (msg.idempotencyKey && runState.history) {
    const existingCompletion = runState.history.find(
      (h) => h.stepId === msg.stepId && h.attemptNumber === msg.attempt && h.status === "completed",
    );
    if (existingCompletion) {
      // Step handler already succeeded for this attempt — report cached result
      await stub.fetch(
        new Request(`http://workflow/step/${msg.stepId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            output: existingCompletion.output,
            idempotencyKey: msg.idempotencyKey,
          }),
        }),
      );
      return;
    }
  }

  if (step.status !== "running") {
    // Step already completed or pending — skip
    return;
  }

  try {
    const handlerCtx: StepHandlerContext = {
      tenantId: runState.tenantId,
      workflowRunId: runState.id,
      stepId: msg.stepId,
      context: runState.context,
      adapterUrls,
      evidence: env.EVIDENCE,
      db: env.DB,
    };

    // Try registry first
    const registeredHandler = resolveHandler(step.action);
    let output: unknown;

    if (registeredHandler) {
      output = await registeredHandler(handlerCtx);
    } else {
      // Fallback: legacy direct dispatch for unregistered handlers
      output = await legacyDispatch(
        step.action,
        runState.context,
        runState.tenantId,
        adapterUrls,
        env.EVIDENCE,
      );
    }

    await stub.fetch(
      new Request(`http://workflow/step/${msg.stepId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output }),
      }),
    );

    // Record step success as compliance evidence
    if (env.DB && step.action !== "atlas.resolve_access_bundle") {
      recordStepEvidence(env.DB, runState.tenantId, runState.id, step, "pass", output);
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await stub.fetch(
      new Request(`http://workflow/step/${msg.stepId}/fail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error }),
      }),
    );

    // Record step failure as compliance evidence
    if (env.DB) {
      recordStepEvidence(env.DB, runState.tenantId, runState.id, step, "fail", { error });
    }
    // WorkflowDO manages retry backoff via alarms — we ack the queue message
  }
}

// ── Legacy dispatch (kept for backwards compatibility) ──────────────────────

export async function legacyDispatch(
  handler: string,
  context: Record<string, unknown>,
  tenantId: string,
  adapterUrls: Record<string, string>,
  evidence?: R2Bucket,
): Promise<unknown> {
  const dotIdx = handler.indexOf(".");
  const appId = dotIdx >= 0 ? handler.slice(0, dotIdx) : handler;
  const operation = dotIdx >= 0 ? handler.slice(dotIdx + 1) : "";

  if (appId === "atlas") {
    switch (operation) {
      case "resolve_access_bundle":
        return {
          resolvedApps: context.appAccess ?? [],
          resolvedGroups: context.groups ?? [],
          email: context.email,
          userId: context.userId,
        };
      case "emit_evidence":
        if (evidence) {
          const evidenceId = crypto.randomUUID().replace(/-/g, "");
          const key = `workflow-evidence/${tenantId}/${evidenceId}.json`;
          await evidence.put(
            key,
            JSON.stringify({
              evidenceId,
              tenantId,
              capturedAt: new Date().toISOString(),
              context,
            }),
          );
          return { evidenceId, key };
        }
        return { evidenceId: null, skipped: true };
      default:
        throw new Error(`Unknown atlas operation: "${operation}"`);
    }
  }

  const adapterUrl = adapterUrls[appId];
  if (!adapterUrl) {
    throw new Error(`No adapter URL configured for "${appId}"`);
  }

  // Check adapter health before dispatching — skip unhealthy adapters with warning
  try {
    const healthRes = await fetch(`${adapterUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!healthRes.ok) {
      throw new Error(
        `Adapter "${appId}" is unhealthy (HTTP ${healthRes.status}) — skipping ${operation}`,
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("unhealthy")) throw err;
    throw new Error(
      `Adapter "${appId}" is unreachable — skipping ${operation}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const userProfile = extractUserProfile(context);

  if (operation === "provision") {
    const res = await fetch(`${adapterUrl}/api/provision`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Tenant-ID": tenantId },
      body: JSON.stringify({ tenantId, userProfile, config: {} }),
    });
    if (!res.ok) throw new Error(`${appId} provision failed: HTTP ${res.status}`);
    return res.json().catch(() => ({}));
  }

  if (operation === "deprovision") {
    const res = await fetch(`${adapterUrl}/api/deprovision`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Tenant-ID": tenantId },
      body: JSON.stringify({ tenantId, userProfile, config: {} }),
    });
    if (!res.ok) throw new Error(`${appId} deprovision failed: HTTP ${res.status}`);
    return res.json().catch(() => ({}));
  }

  throw new Error(`Unknown operation "${operation}" for handler "${handler}"`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractUserProfile(context: Record<string, unknown>) {
  return {
    id: context.userId as string | undefined,
    externalId: context.externalId as string | undefined,
    email: context.email as string | undefined,
    displayName: context.displayName as string | undefined,
    firstName: context.firstName as string | undefined,
    lastName: context.lastName as string | undefined,
    department: context.department as string | undefined,
    title: context.title as string | undefined,
    manager: context.manager as string | undefined,
    phone: context.phone as string | undefined,
    groups: (context.groups as string[]) ?? [],
    appAccess:
      (context.appAccess as Array<{
        appId: string;
        role: string;
        groupId: string;
      }>) ?? [],
    rawAttributes: (context.rawAttributes as Record<string, unknown>) ?? {},
  };
}

export function parseAdapterUrls(val?: string): Record<string, string> {
  if (!val) return {};
  try {
    return JSON.parse(val) as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Record a workflow step outcome as compliance evidence in D1.
 * Maps provision/deprovision actions to relevant compliance controls.
 */
function recordStepEvidence(
  db: D1Database,
  tenantId: string,
  workflowRunId: string,
  step: { stepId: string; action: string },
  status: "pass" | "fail",
  output: unknown,
): void {
  const dotIdx = step.action.indexOf(".");
  const appId = dotIdx >= 0 ? step.action.slice(0, dotIdx) : step.action;
  const operation = dotIdx >= 0 ? step.action.slice(dotIdx + 1) : "";

  // Only record adapter provision/deprovision steps
  if (appId === "atlas" || !["provision", "deprovision"].includes(operation)) return;

  // Map to relevant compliance controls
  const controlRefs =
    operation === "provision"
      ? ["SOC2-CC6.2", "ISO-27001-A.9.2.1", "NIST-CSF-PR.AC-1"]
      : ["SOC2-CC6.3", "ISO-27001-A.9.2.6", "HIPAA-164.312(a)(1)"];

  const id = `step-${workflowRunId}-${step.stepId}`;
  const metadata = JSON.stringify({
    status,
    operation,
    appId,
    workflowRunId,
    output: typeof output === "object" ? output : { value: output },
    recordedAt: new Date().toISOString(),
  });

  // Best-effort — never block the workflow
  db.prepare(
    `INSERT INTO compliance_evidence
     (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
     VALUES (?, ?, 'SOC2', ?, ?, 'workflow_step', ?, ?, 'system', ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET metadata = excluded.metadata, created_at = excluded.created_at`,
  )
    .bind(
      id,
      tenantId,
      controlRefs[0].split("-").slice(1).join("-"),
      `${appId}.${operation}`,
      "workflow_step",
      `${workflowRunId}:${step.stepId}`,
      appId,
      metadata,
    )
    .run()
    .catch((err) => {
      console.warn(
        `[step-executor] Evidence write failed for ${step.action}: ${err instanceof Error ? err.message : String(err)}`,
      );
    });

  // Write additional control refs as separate evidence rows
  for (let i = 1; i < controlRefs.length; i++) {
    const ref = controlRefs[i];
    const parts = ref.split("-");
    const framework = parts[0] === "ISO" ? "ISO27001" : parts[0] === "NIST" ? "NIST_CSF" : parts[0];
    const controlId =
      ref.slice(ref.indexOf("-", ref.indexOf("-") + 1) + 1) || ref.split("-").slice(1).join("-");

    db.prepare(
      `INSERT INTO compliance_evidence
       (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, 'workflow_step', ?, ?, 'system', ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET metadata = excluded.metadata, created_at = excluded.created_at`,
    )
      .bind(
        `${id}-${framework}`,
        tenantId,
        framework,
        controlId,
        `${appId}.${operation}`,
        "workflow_step",
        `${workflowRunId}:${step.stepId}`,
        appId,
        metadata,
      )
      .run()
      .catch(() => {
        /* best-effort */
      });
  }
}
