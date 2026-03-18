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
  steps: Array<{ stepId: string; action: string; status: string }>;
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
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await stub.fetch(
      new Request(`http://workflow/step/${msg.stepId}/fail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error }),
      }),
    );
    // WorkflowDO manages retry backoff via alarms — we ack the queue message
  }
}

// ── Legacy dispatch (kept for backwards compatibility) ──────────────────────

async function legacyDispatch(
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

  const userProfile = extractUserProfile(context);

  if (operation === "provision") {
    const res = await fetch(`${adapterUrl}/api/provision`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Tenant-ID": tenantId },
      body: JSON.stringify({ tenantId, userProfile, config: {} }),
    });
    if (!res.ok)
      throw new Error(`${appId} provision failed: HTTP ${res.status}`);
    return res.json().catch(() => ({}));
  }

  if (operation === "deprovision") {
    const res = await fetch(`${adapterUrl}/api/deprovision`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Tenant-ID": tenantId },
      body: JSON.stringify({ tenantId, userProfile, config: {} }),
    });
    if (!res.ok)
      throw new Error(`${appId} deprovision failed: HTTP ${res.status}`);
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

function parseAdapterUrls(val?: string): Record<string, string> {
  if (!val) return {};
  try {
    return JSON.parse(val) as Record<string, string>;
  } catch {
    return {};
  }
}
