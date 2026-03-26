/**
 * Step definitions for each workflow type.
 *
 * Each workflow type has an ordered list of steps that define the execution
 * plan. Steps are executed sequentially; each step can produce output that
 * feeds into subsequent steps via the run context.
 */

import type { StepDefinition, WorkflowType } from "./types.js";

const JOINER_STEPS: StepDefinition[] = [
  { id: "validate-profile", action: "validate_profile" },
  { id: "provision-primary-account", action: "provision_primary_account" },
  { id: "synchronize-access", action: "synchronize_access" },
  { id: "notify-stakeholders", action: "notify_stakeholders" },
];

const MOVER_STEPS: StepDefinition[] = [
  { id: "validate-profile", action: "validate_profile" },
  { id: "apply-role-change", action: "apply_role_change" },
  { id: "reconcile-entitlements", action: "reconcile_entitlements" },
  { id: "notify-stakeholders", action: "notify_stakeholders" },
];

const LEAVER_STEPS: StepDefinition[] = [
  { id: "validate-profile", action: "validate_profile" },
  { id: "collect-artifacts", action: "collect_artifacts" },
  { id: "revoke-access", action: "revoke_access" },
  { id: "notify-stakeholders", action: "notify_stakeholders" },
];

const REGISTRY: Record<WorkflowType, StepDefinition[]> = {
  joiner: JOINER_STEPS,
  mover: MOVER_STEPS,
  leaver: LEAVER_STEPS,
};

/**
 * Return the ordered step definitions for a workflow type.
 * Throws if the type is unknown.
 */
export function getStepDefinitions(type: WorkflowType): StepDefinition[] {
  const steps = REGISTRY[type];
  if (!steps) {
    throw new Error(`Unknown workflow type: ${type}`);
  }
  return steps;
}
