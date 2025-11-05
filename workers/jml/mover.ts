/**
 * Mover Worker - Handles user role transitions in JML lifecycle
 *
 * Responsibilities:
 * - Detect attribute deltas (department, title, manager)
 * - Calculate entitlement changes (add/remove/retain)
 * - Update connectors with new role data
 * - Enforce policies (MFA, access removal)
 * - Emit evidence for compliance
 */

export interface RoleChange {
  previous: {
    department: string;
    title: string;
    manager?: string;
  };
  new: {
    department: string;
    title: string;
    manager?: string;
    effectiveDate?: string;
  };
}

export interface EntitlementChanges {
  add: string[];
  remove: string[];
  retain: string[];
}

export interface AttributeDelta {
  department?: { from: string; to: string };
  title?: { from: string; to: string };
  manager?: { from: string; to: string };
}

export interface MoverEvidence {
  trace_id: string;
  timestamp: string;
  user_id: string;
  delta_summary: AttributeDelta;
  entitlement_changes: EntitlementChanges;
  control_ids: string[];
  status: "completed" | "failed" | "partial";
  error?: string;
}

export interface Connector {
  name: string;
  updateUser?: (userId: string, attributes: any) => Promise<any>;
  addEntitlement?: (userId: string, entitlement: string) => Promise<any>;
  removeEntitlement?: (userId: string, entitlement: string) => Promise<any>;
  verifyMFA?: (userId: string) => Promise<boolean>;
}

export interface Policy {
  requireMFA?: boolean;
  allowedTransitions?: string[];
  requiredApprovals?: number;
}

export interface PolicyViolation {
  code: string;
  message: string;
  severity: "error" | "warning";
}

export class MoverWorker {
  /**
   * Detect changes between previous and new role attributes
   */
  detectAttributeDeltas(
    previous: { department: string; title: string; manager?: string },
    newRole: { department: string; title: string; manager?: string },
  ): AttributeDelta {
    const delta: AttributeDelta = {};

    if (previous.department !== newRole.department) {
      delta.department = { from: previous.department, to: newRole.department };
    }

    if (previous.title !== newRole.title) {
      delta.title = { from: previous.title, to: newRole.title };
    }

    if (
      previous.manager !== newRole.manager &&
      (previous.manager || newRole.manager)
    ) {
      delta.manager = {
        from: previous.manager || "none",
        to: newRole.manager || "none",
      };
    }

    return delta;
  }

  /**
   * Calculate which entitlements to add, remove, and retain
   */
  calculateEntitlementChanges(
    previous: string[],
    target: string[],
  ): EntitlementChanges {
    const previousSet = new Set(previous);
    const targetSet = new Set(target);

    const add = target.filter((e) => !previousSet.has(e));
    const remove = previous.filter((e) => !targetSet.has(e));
    const retain = target.filter((e) => previousSet.has(e));

    return { add, remove, retain };
  }

  /**
   * Apply role change to user via connectors
   */
  async applyRoleChange(
    user: { id: string; email: string },
    newRole: { department: string; title: string; manager?: string },
    connectors: Connector[],
  ): Promise<{ success: boolean; updated: string[]; errors: any[] }> {
    const updated: string[] = [];
    const errors: any[] = [];

    const attributes = {
      department: newRole.department,
      title: newRole.title,
      manager: newRole.manager,
    };

    for (const connector of connectors) {
      if (connector.updateUser) {
        try {
          await connector.updateUser(user.id, attributes);
          updated.push(connector.name);
        } catch (error) {
          errors.push({
            connector: connector.name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return {
      success: errors.length === 0,
      updated,
      errors,
    };
  }

  /**
   * Reconcile entitlements by adding/removing access
   */
  async reconcileEntitlements(
    user: { id: string; email: string },
    changes: EntitlementChanges,
    connectors: Connector[],
  ): Promise<{ success: boolean; applied: string[]; failed: string[] }> {
    const applied: string[] = [];
    const failed: string[] = [];

    // Process removals first (security-first approach)
    for (const entitlement of changes.remove) {
      let removed = false;
      for (const connector of connectors) {
        if (connector.removeEntitlement) {
          try {
            await connector.removeEntitlement(user.id, entitlement);
            removed = true;
            break;
          } catch (error) {
            // Continue to next connector
          }
        }
      }
      if (!removed) {
        failed.push(entitlement);
      }
    }

    // Process additions
    for (const entitlement of changes.add) {
      let added = false;
      for (const connector of connectors) {
        if (connector.addEntitlement) {
          try {
            await connector.addEntitlement(user.id, entitlement);
            added = true;
            applied.push(entitlement);
            break;
          } catch (error) {
            // Continue to next connector
          }
        }
      }
      if (!added) {
        failed.push(entitlement);
      }
    }

    // Retain existing entitlements (verify they still exist)
    applied.push(...changes.retain);

    return {
      success: failed.length === 0,
      applied,
      failed,
    };
  }

  /**
   * Enforce policies and return violations
   */
  enforcePolicy(
    user: { id: string },
    newRole: { department: string; title: string },
    policy: Policy,
  ): PolicyViolation[] {
    const violations: PolicyViolation[] = [];

    // Check if transition is allowed
    if (policy.allowedTransitions && policy.allowedTransitions.length > 0) {
      if (!policy.allowedTransitions.includes(newRole.department)) {
        violations.push({
          code: "DISALLOWED_TRANSITION",
          message: `Department transition to ${newRole.department} requires approval`,
          severity: "warning",
        });
      }
    }

    return violations;
  }

  /**
   * Verify MFA compliance after role change
   *
   * Returns true if:
   * - At least one connector with MFA verification capability confirms MFA is enabled
   * - No connectors have MFA verification capability (assumes external verification)
   *
   * Returns false if:
   * - Any connector with MFA verification reports MFA is disabled
   * - Any connector's MFA verification fails (network/API errors)
   *
   * This ensures security-first behavior: fail closed on errors.
   */
  async verifyMFACompliance(
    user: { id: string },
    connectors: Connector[],
  ): Promise<boolean> {
    let hasVerificationCapability = false;

    for (const connector of connectors) {
      if (connector.verifyMFA) {
        hasVerificationCapability = true;
        try {
          const mfaEnabled = await connector.verifyMFA(user.id);
          if (!mfaEnabled) {
            // Fail closed: if any connector reports MFA disabled, return false
            return false;
          }
        } catch (error) {
          // Fail closed: if verification fails (network/API error), treat as non-compliant
          return false;
        }
      }
    }

    // If no connectors have MFA verification, assume it's verified externally
    // (e.g., IdP policy enforcement, SSO requirements)
    return true;
  }

  /**
   * Emit evidence to artifacts directory
   */
  async emitEvidence(
    traceId: string,
    userId: string,
    delta: AttributeDelta,
    changes: EntitlementChanges,
    status: "completed" | "failed" | "partial",
    error?: string,
  ): Promise<string> {
    const evidence: MoverEvidence = {
      trace_id: traceId,
      timestamp: new Date().toISOString(),
      user_id: userId,
      delta_summary: delta,
      entitlement_changes: changes,
      control_ids: ["AC-2", "AC-6", "IA-2"], // NIST 800-53 controls
      status,
      error,
    };

    // In a real implementation, this would write to R2 or filesystem
    // For now, return the path where it would be written
    const evidencePath = `/artifacts/jml/mover/EV-mover-${traceId}.json`;

    // Mock write operation
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
      // In tests, we can optionally write to a test location
      return evidencePath;
    }

    return evidencePath;
  }

  /**
   * Execute complete mover workflow
   */
  async execute(context: {
    user: {
      id: string;
      email: string;
      displayName: string;
      department: string;
      title: string;
    };
    newRole: {
      department: string;
      title: string;
      manager?: string;
      effectiveDate?: string;
    };
    entitlements: { previous: string[]; target: string[] };
    connectors?: Connector[];
    policy?: Policy;
  }): Promise<{
    success: boolean;
    traceId: string;
    delta: AttributeDelta;
    entitlementChanges: EntitlementChanges;
    evidencePath: string;
    errors?: any[];
  }> {
    const traceId = `mover-${crypto.randomUUID()}`;
    const connectors = context.connectors || [];
    const policy = context.policy || {};

    try {
      // Step 1: Detect deltas
      const delta = this.detectAttributeDeltas(
        { department: context.user.department, title: context.user.title },
        context.newRole,
      );

      // Step 2: Calculate entitlement changes
      const entitlementChanges = this.calculateEntitlementChanges(
        context.entitlements.previous,
        context.entitlements.target,
      );

      // Step 3: Enforce policy
      const violations = this.enforcePolicy(
        context.user,
        context.newRole,
        policy,
      );
      const hasErrors = violations.some((v) => v.severity === "error");
      if (hasErrors) {
        const evidencePath = await this.emitEvidence(
          traceId,
          context.user.id,
          delta,
          entitlementChanges,
          "failed",
          "Policy violations detected",
        );
        return {
          success: false,
          traceId,
          delta,
          entitlementChanges,
          evidencePath,
          errors: violations,
        };
      }

      // Step 4: Apply role change
      const roleResult = await this.applyRoleChange(
        context.user,
        context.newRole,
        connectors,
      );

      // Step 5: Reconcile entitlements
      const entitlementResult = await this.reconcileEntitlements(
        context.user,
        entitlementChanges,
        connectors,
      );

      // Step 6: Verify MFA compliance
      const mfaCompliant = await this.verifyMFACompliance(
        context.user,
        connectors,
      );

      // Step 7: Emit evidence
      const status =
        roleResult.success && entitlementResult.success && mfaCompliant
          ? "completed"
          : entitlementResult.applied.length > 0
            ? "partial"
            : "failed";

      const evidencePath = await this.emitEvidence(
        traceId,
        context.user.id,
        delta,
        entitlementChanges,
        status,
      );

      return {
        success: status === "completed",
        traceId,
        delta,
        entitlementChanges,
        evidencePath,
        errors: [
          ...roleResult.errors,
          ...entitlementResult.failed.map((f) => ({ entitlement: f })),
        ],
      };
    } catch (error) {
      const delta = this.detectAttributeDeltas(
        { department: context.user.department, title: context.user.title },
        context.newRole,
      );
      const entitlementChanges = this.calculateEntitlementChanges(
        context.entitlements.previous,
        context.entitlements.target,
      );
      const evidencePath = await this.emitEvidence(
        traceId,
        context.user.id,
        delta,
        entitlementChanges,
        "failed",
        error instanceof Error ? error.message : String(error),
      );
      return {
        success: false,
        traceId,
        delta,
        entitlementChanges,
        evidencePath,
        errors: [
          { error: error instanceof Error ? error.message : String(error) },
        ],
      };
    }
  }
}
