/**
 * Step definitions for each workflow type.
 *
 * Each workflow type has an ordered list of steps that define the execution
 * plan. Steps are executed sequentially; each step can produce output that
 * feeds into subsequent steps via the run context.
 */
import type { StepDefinition, WorkflowType } from "./types.js";
/**
 * Return the ordered step definitions for a workflow type.
 * Throws if the type is unknown.
 */
export declare function getStepDefinitions(
  type: WorkflowType,
): StepDefinition[];
//# sourceMappingURL=step-registry.d.ts.map
