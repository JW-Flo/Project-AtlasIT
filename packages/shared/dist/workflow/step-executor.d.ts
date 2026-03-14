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
/**
 * Execute a step action. If the context contains `control.failStep` matching
 * the stepId, force a failure (used for testing DLQ behavior).
 */
export declare function executeStep(
  stepId: string,
  action: string,
  context: Record<string, unknown>,
): Promise<StepExecutionResult>;
//# sourceMappingURL=step-executor.d.ts.map
