export type WorkflowStatus =
  | "CREATED"
  | "RUNNING"
  | "WAITING"
  | "COMPLETED"
  | "FAILED"
  | "TIMED_OUT";

export interface WorkflowStep {
  id: string;
  name: string;
  handler: string;
  timeoutMs: number;
  retryConfig?: { maxRetries: number; backoffMs: number };
  compensate?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
  onFailure?: WorkflowStep[];
  globalTimeoutMs: number;
}

export interface WorkflowState {
  definitionId: string;
  definitionName: string;
  status: WorkflowStatus;
  currentStepIndex: number;
  stepResults: Record<string, StepResult>;
  context: Record<string, unknown>;
  tenantId: string;
  correlationId: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
}

export interface StepResult {
  stepId: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  output?: unknown;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  attempts: number;
}

export const VALID_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  CREATED: ["RUNNING"],
  RUNNING: ["WAITING", "COMPLETED", "FAILED", "TIMED_OUT"],
  WAITING: ["RUNNING", "COMPLETED", "FAILED", "TIMED_OUT"],
  COMPLETED: [],
  FAILED: [],
  TIMED_OUT: [],
};
