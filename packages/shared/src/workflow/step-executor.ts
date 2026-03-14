/**
 * Step executor — runs individual workflow steps.
 *
 * Each step action maps to an executor function that receives the run context
 * and returns a result. The executor is intentionally decoupled from
 * Cloudflare-specific APIs; it operates on plain objects and can be tested
 * in any JS runtime.
 *
 * In production, steps that require external calls will delegate to a
 * ConnectorInvoker via the queue bus. For local / test execution, these
 * functions produce synthetic results.
 */

export interface StepExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
}

type StepExecutor = (
  context: Record<string, unknown>,
) => Promise<StepExecutionResult>;

// ---------------------------------------------------------------------------
// Joiner step executors
// ---------------------------------------------------------------------------

async function validateProfile(
  context: Record<string, unknown>,
): Promise<StepExecutionResult> {
  const user = context.user as Record<string, unknown> | undefined;
  if (!user?.id && !context.subjectRef) {
    return { success: false, error: "missing_user_identity" };
  }
  return {
    success: true,
    output: { validated: true, userId: user?.id ?? context.subjectRef },
  };
}

async function provisionPrimaryAccount(
  context: Record<string, unknown>,
): Promise<StepExecutionResult> {
  const user = context.user as Record<string, unknown> | undefined;
  return {
    success: true,
    output: {
      provisioned: true,
      accountId: `acct-${user?.id ?? "unknown"}`,
      entitlements: context.entitlements,
    },
  };
}

async function synchronizeAccess(
  context: Record<string, unknown>,
): Promise<StepExecutionResult> {
  const entitlements = context.entitlements;
  return {
    success: true,
    output: {
      synchronized: true,
      systems: Array.isArray(entitlements) ? entitlements : [],
    },
  };
}

async function notifyStakeholders(
  context: Record<string, unknown>,
): Promise<StepExecutionResult> {
  const notifications = context.notifications as
    | Record<string, unknown>
    | undefined;
  return {
    success: true,
    output: {
      notified: true,
      channels: notifications?.channels ?? [],
      recipients: notifications?.recipients ?? [],
    },
  };
}

// ---------------------------------------------------------------------------
// Mover step executors
// ---------------------------------------------------------------------------

async function applyRoleChange(
  context: Record<string, unknown>,
): Promise<StepExecutionResult> {
  const newRole = context.newRole as Record<string, unknown> | undefined;
  if (!newRole) {
    return { success: false, error: "missing_new_role" };
  }
  return {
    success: true,
    output: {
      applied: true,
      newRole,
    },
  };
}

async function reconcileEntitlements(
  context: Record<string, unknown>,
): Promise<StepExecutionResult> {
  const entitlements = context.entitlements as
    | Record<string, unknown>
    | undefined;
  const target = entitlements?.target;
  return {
    success: true,
    output: {
      reconciled: true,
      applied: target ?? [],
    },
  };
}

// ---------------------------------------------------------------------------
// Leaver step executors
// ---------------------------------------------------------------------------

async function collectArtifacts(
  context: Record<string, unknown>,
): Promise<StepExecutionResult> {
  const exit = context.exit as Record<string, unknown> | undefined;
  return {
    success: true,
    output: {
      collected: true,
      equipment: exit?.equipment ?? [],
    },
  };
}

async function revokeAccess(
  context: Record<string, unknown>,
): Promise<StepExecutionResult> {
  const entitlements = context.entitlements;
  return {
    success: true,
    output: {
      revoked: true,
      systems: Array.isArray(entitlements) ? entitlements : [],
    },
  };
}

// ---------------------------------------------------------------------------
// Executor registry
// ---------------------------------------------------------------------------

const EXECUTORS: Record<string, StepExecutor> = {
  validate_profile: validateProfile,
  provision_primary_account: provisionPrimaryAccount,
  synchronize_access: synchronizeAccess,
  notify_stakeholders: notifyStakeholders,
  apply_role_change: applyRoleChange,
  reconcile_entitlements: reconcileEntitlements,
  collect_artifacts: collectArtifacts,
  revoke_access: revokeAccess,
};

/**
 * Execute a step action. If the context contains `control.failStep` matching
 * the stepId, force a failure (used for testing DLQ behavior).
 */
export async function executeStep(
  stepId: string,
  action: string,
  context: Record<string, unknown>,
): Promise<StepExecutionResult> {
  // Test control: inject failure for a specific step
  const control = context.control as Record<string, unknown> | undefined;
  if (control?.failStep === stepId) {
    return { success: false, error: `injected_failure:${stepId}` };
  }

  const executor = EXECUTORS[action];
  if (!executor) {
    return { success: false, error: `unknown_action:${action}` };
  }

  return executor(context);
}
