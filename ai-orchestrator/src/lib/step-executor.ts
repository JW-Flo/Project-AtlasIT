/**
 * Step executor for WorkflowDO step-task queue messages.
 *
 * Receives a step-task message, loads run state from the WorkflowDO to
 * resolve the handler and context, dispatches to the appropriate adapter
 * or atlas internal operation, then reports success/failure back to the DO.
 */

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
}

/**
 * Execute a step-task message end-to-end:
 * 1. Load run state from WorkflowDO
 * 2. Dispatch handler → adapter call or atlas internal op
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
    const output = await dispatchHandler(
      step.action,
      runState.context,
      runState.tenantId,
      adapterUrls,
      env.EVIDENCE,
    );

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

// ── Handler dispatch ──────────────────────────────────────────────────────────

async function dispatchHandler(
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
    return handleAtlasOp(operation, context, tenantId, evidence);
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

// ── Atlas internal operations ─────────────────────────────────────────────────

async function handleAtlasOp(
  operation: string,
  context: Record<string, unknown>,
  tenantId: string,
  evidence?: R2Bucket,
): Promise<unknown> {
  switch (operation) {
    case "resolve_access_bundle": {
      // Return user's resolved access from context (seeded by run_workflow action)
      return {
        resolvedApps: context.appAccess ?? [],
        resolvedGroups: context.groups ?? [],
        email: context.email,
        userId: context.userId,
      };
    }
    case "emit_evidence": {
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
    }
    default:
      throw new Error(`Unknown atlas operation: "${operation}"`);
  }
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
