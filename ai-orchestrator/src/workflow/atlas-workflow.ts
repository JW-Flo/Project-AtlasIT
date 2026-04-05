/**
 * Cloudflare Workflows-based workflow engine.
 *
 * Replaces the custom WorkflowDO Durable Object with the native Cloudflare
 * Workflows primitive. Benefits:
 *   - Built-in durable execution (automatic replay on crash)
 *   - Native retry with exponential backoff per step
 *   - step.sleep() for delays (leaver grace period) without alarm bookkeeping
 *   - No queue-based dispatch — steps execute inline
 *   - Compensation via try/catch around the main step loop
 *
 * The existing handler registry (handler-registry.ts) is reused for step
 * dispatch. WorkflowDO is kept alive for in-flight runs during transition.
 */

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers";
import type { Bindings } from "../types";
import type { WorkflowDefinition, WorkflowStep as WfStepDef } from "./workflow-do";
import { resolveHandler, type StepHandlerContext } from "../lib/handler-registry";
import { legacyDispatch, parseAdapterUrls } from "../lib/step-executor";
import { DEFAULT_MAX_RETRIES, BACKOFF_BASE_MS } from "../../../packages/shared/src/workflow/types";

// ---------------------------------------------------------------------------
// Params passed when creating a workflow instance
// ---------------------------------------------------------------------------

export interface AtlasWorkflowParams {
  definition: WorkflowDefinition;
  tenantId: string;
  correlationId: string;
  context: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert milliseconds to a Cloudflare Workflows duration.
 * Returns milliseconds as a number, which CF Workflows accepts natively.
 */
function msToDuration(ms: number): number {
  return Math.max(1000, ms);
}

function evaluateCondition(
  condition: { field: string; operator: string; value?: unknown },
  context: Record<string, unknown>,
): boolean {
  const fieldValue = getNestedValue(context, condition.field);
  switch (condition.operator) {
    case "eq":
      return fieldValue === condition.value;
    case "neq":
      return fieldValue !== condition.value;
    case "exists":
      return fieldValue !== undefined && fieldValue !== null;
    case "not_exists":
      return fieldValue === undefined || fieldValue === null;
    default:
      return true;
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// ---------------------------------------------------------------------------
// AtlasWorkflow — Cloudflare WorkflowEntrypoint
// ---------------------------------------------------------------------------

export class AtlasWorkflow extends WorkflowEntrypoint<Bindings, AtlasWorkflowParams> {
  async run(event: WorkflowEvent<AtlasWorkflowParams>, step: WorkflowStep) {
    const { definition, tenantId, correlationId, context } = event.payload;
    const workflowContext = { ...context };
    const db = (this.env as any).ATLAS_SHARED_DB ?? (this.env as any).DB;
    const adapterUrls = parseAdapterUrls(this.env.ADAPTER_URLS);

    // Mark run as started
    await step.do("record-start", async () => {
      await db
        .prepare("UPDATE workflow_runs SET status = 'running' WHERE id = ?")
        .bind(correlationId)
        .run();
    });

    let stepsCompleted = 0;

    try {
      for (const stepDef of definition.steps) {
        // Handle delays (e.g., leaver grace period)
        if (stepDef.delayMs && stepDef.delayMs > 0) {
          await step.sleep(`delay-${stepDef.id}`, msToDuration(stepDef.delayMs));
        }

        // Evaluate conditions — skip if condition fails
        if (stepDef.condition && !evaluateCondition(stepDef.condition, workflowContext)) {
          continue;
        }

        const retryLimit = stepDef.retryConfig?.maxRetries ?? DEFAULT_MAX_RETRIES;
        const retryDelay = stepDef.retryConfig?.backoffMs ?? BACKOFF_BASE_MS;

        // step.do() requires Rpc.Serializable callback — handler outputs are
        // plain JSON objects so the cast is safe at runtime.
        const output = await (step.do as any)(
          stepDef.id,
          {
            retries: {
              limit: retryLimit,
              delay: retryDelay,
              backoff: "exponential",
            },
            timeout: msToDuration(stepDef.timeoutMs),
          },
          async () => this.dispatchStep(stepDef, tenantId, correlationId, workflowContext, adapterUrls),
        );

        stepsCompleted++;

        // Merge output into context for downstream steps
        if (output && typeof output === "object") {
          Object.assign(workflowContext, output as Record<string, unknown>);
        }
      }

      // Mark completed in D1
      await step.do("record-complete", async () => {
        await db
          .prepare(
            `UPDATE workflow_runs
             SET status = 'completed', steps_done = ?, completed_at = datetime('now')
             WHERE id = ?`,
          )
          .bind(stepsCompleted, correlationId)
          .run();
      });
    } catch (err) {
      // Run compensation steps if defined
      if (definition.onFailure?.length) {
        for (const compStep of definition.onFailure) {
          try {
            await (step.do as any)(
              `compensate-${compStep.id}`,
              {
                retries: { limit: 2, delay: BACKOFF_BASE_MS, backoff: "exponential" },
                timeout: msToDuration(compStep.timeoutMs),
              },
              async () => this.dispatchStep(compStep, tenantId, correlationId, workflowContext, adapterUrls),
            );
          } catch {
            // Compensation failure — continue other compensations
          }
        }
      }

      // Mark failed in D1
      await step.do("record-failed", async () => {
        await db
          .prepare(
            `UPDATE workflow_runs
             SET status = 'failed', steps_done = ?, completed_at = datetime('now')
             WHERE id = ?`,
          )
          .bind(stepsCompleted, correlationId)
          .run();
      });

      throw err;
    }
  }

  private async dispatchStep(
    stepDef: { id: string; handler: string },
    tenantId: string,
    correlationId: string,
    context: Record<string, unknown>,
    adapterUrls: Record<string, string>,
  ): Promise<unknown> {
    const handlerCtx: StepHandlerContext = {
      tenantId,
      workflowRunId: correlationId,
      stepId: stepDef.id,
      context,
      adapterUrls,
      evidence: this.env.EVIDENCE,
      db: (this.env as any).ATLAS_SHARED_DB ?? (this.env as any).DB,
    };

    const handler = resolveHandler(stepDef.handler);
    if (handler) {
      return handler(handlerCtx);
    }

    return legacyDispatch(
      stepDef.handler,
      context,
      tenantId,
      adapterUrls,
      this.env.EVIDENCE,
    );
  }
}
