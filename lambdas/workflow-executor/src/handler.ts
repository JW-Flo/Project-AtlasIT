import type { Context } from "aws-lambda";

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
  console.log("Executing workflow step", {
    stepId: event.stepId,
    action: event.action,
  });

  // TODO: Wire up step execution registry from jml-engine
  // Each action maps to a step executor function

  return {
    stepId: event.stepId,
    status: "completed",
    output: { action: event.action, timestamp: new Date().toISOString() },
  };
}
