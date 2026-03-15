import type { Context } from "aws-lambda";
import { bootstrap } from "@atlasit/shared/platform/aws/bootstrap.js";
import { executeStep } from "@atlasit/shared/workflow/step-executor.js";
import type { StepState } from "@atlasit/shared/workflow/types.js";

interface StepInput {
  stepId: string;
  action: string;
  executionId: string;
  tenantId: string;
  context: Record<string, unknown>;
}

interface StepOutput {
  stepId: string;
  status: "completed" | "failed";
  output?: unknown;
  error?: string;
}

export async function handler(
  event: StepInput,
  _context: Context,
): Promise<StepOutput> {
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  console.log("Executing workflow step", {
    stepId: event.stepId,
    action: event.action,
    executionId: event.executionId,
  });

  const svc = bootstrap();
  const result = await executeStep(event.stepId, event.action, event.context);
  const durationMs = Date.now() - startMs;
  const completedAt = new Date().toISOString();

  // Emit evidence for every step (success or failure) — P0 requirement
  const stepState: StepState = {
    stepId: event.stepId,
    action: event.action,
    status: result.success ? "completed" : "failed",
    attempts: 1,
    startedAt,
    completedAt,
    output: result.output,
    error: result.error,
    durationMs,
  };

  try {
    await svc.evidenceEmitter.emit(
      {
        schemaVersion: 1,
        id: event.executionId,
        type: "joiner",
        status: "running",
        tenantId: event.tenantId,
        userId: "",
        actor: event.tenantId,
        createdAt: startedAt,
        steps: [stepState],
        history: [],
        context: event.context,
        alarmCount: 0,
      },
      stepState,
    );
  } catch (err) {
    console.error("Evidence emission failed", {
      stepId: event.stepId,
      error: err,
    });
  }

  return {
    stepId: event.stepId,
    status: result.success ? "completed" : "failed",
    output: result.output,
    error: result.error,
  };
}
