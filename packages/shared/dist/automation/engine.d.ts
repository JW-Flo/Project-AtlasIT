import type {
  AutomationRule,
  AutomationEvent,
  RuleCondition,
  ActionResult,
  RuleAction,
  AutomationExecution,
} from "./types";
/**
 * Evaluate whether a rule's conditions match a given event payload.
 * All conditions must pass (AND logic).
 */
export declare function evaluateConditions(
  conditions: RuleCondition[],
  payload: Record<string, unknown>,
): boolean;
/**
 * Match an event against a list of rules to find which ones should fire.
 */
export declare function matchRules(
  rules: AutomationRule[],
  event: AutomationEvent,
): AutomationRule[];
/**
 * Sort actions by their execution order.
 */
export declare function sortActions(actions: RuleAction[]): RuleAction[];
/**
 * Interpolate template strings like {{user.email}} with event payload values.
 */
export declare function interpolateTemplate(
  template: string,
  payload: Record<string, unknown>,
): string;
/**
 * Build a summary of automation execution for audit logging.
 */
export declare function buildExecutionSummary(
  rule: AutomationRule,
  results: ActionResult[],
  durationMs: number,
): Pick<
  AutomationExecution,
  "status" | "actionsRun" | "actionsFailed" | "durationMs"
>;
//# sourceMappingURL=engine.d.ts.map
