import { JMLEngine } from "../../../../index.js";
import type { WorkflowType } from "./templates";
import { getTemplate } from "./templates";
import type { WorkflowStepRecord } from "./store";

interface ExecutionPayload {
  type: WorkflowType;
  tenantId: string;
  subjectRef: string;
  overrides?: Record<string, unknown>;
}

interface StepHistoryEntry {
  stepId: string;
  action: string;
  status: string;
  timestamp: string;
  attemptNumber?: number;
  output?: unknown;
  error?: string;
}

interface RunInternalState {
  id: string;
  type: WorkflowType;
  status: string;
  tenantId: string;
  userId: string;
  createdAt: string;
  completedAt?: string;
  steps: Array<{
    id: string;
    action: string;
    status: string;
    attempts: number;
    startedAt?: string;
    completedAt?: string;
    output?: unknown;
    error?: string;
  }>;
  history: StepHistoryEntry[];
  context: Record<string, unknown>;
}

export interface ExecutionRuntimeResult {
  runId: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  steps: WorkflowStepRecord[];
  context: Record<string, unknown>;
}

class MemoryStorage {
  readonly #store = new Map<string, unknown>();

  async put(key: string, value: unknown) {
    this.#store.set(key, clone(value));
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    const value = this.#store.get(key);
    return value ? (clone(value) as T) : undefined;
  }

  async list({ prefix = "" }: { prefix?: string } = {}) {
    const results = new Map<string, unknown>();
    for (const [key, value] of this.#store.entries()) {
      if (!prefix || key.startsWith(prefix)) {
        results.set(key, clone(value));
      }
    }
    return results;
  }
}

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function computeDuration(started?: string, completed?: string): number {
  if (!started || !completed) return 0;
  const startMs = Date.parse(started);
  const endMs = Date.parse(completed);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 0;
  return Math.max(0, endMs - startMs);
}

export async function runWorkflowExecution(
  payload: ExecutionPayload,
): Promise<ExecutionRuntimeResult> {
  const template = getTemplate(payload.type);
  const baseContext = clone(template);
  baseContext.type = payload.type;
  baseContext.tenantId = payload.tenantId;

  if (!baseContext.user) baseContext.user = {};
  if (typeof baseContext.user === "object") {
    (baseContext.user as Record<string, unknown>).id = payload.subjectRef;
  }

  const mergedContext = {
    ...baseContext,
    subjectRef: payload.subjectRef,
    triggeredAt: new Date().toISOString(),
    ...(payload.overrides ?? {}),
  } as Record<string, unknown>;

  interface JMLEngineState {
    storage: MemoryStorage;
  }
  const state: JMLEngineState = { storage: new MemoryStorage() };
  const engine = new JMLEngine(state, {});
  const response = await engine.handleEnqueue(mergedContext);
  if (response.status >= 400) {
    throw new Error(`automation.enqueue_failed:${response.status}`);
  }
  const body: any =
    response.body && typeof response.body === "object" ? response.body : {};
  const runId = typeof body.runId === "string" ? body.runId : undefined;
  if (!runId) {
    throw new Error("automation.missing_runId");
  }

  // Explicitly store run state if not already present
  let runState = await state.storage.get<RunInternalState>(`run:${runId}`);
  if (!runState && body.runState) {
    await state.storage.put(`run:${runId}`, body.runState);
    runState = body.runState;
  }
  if (!runState) {
    throw new Error(`automation.run_not_found:${runId}`);
  }
  const steps: WorkflowStepRecord[] = runState.steps.map((step) => ({
    stepId: step.id,
    action: step.action,
    status: step.status,
    attempts: step.attempts,
    output: step.output,
    error: step.error,
    startedAt: step.startedAt ?? runState.createdAt,
    completedAt: step.completedAt ?? undefined,
    durationMs: computeDuration(step.startedAt, step.completedAt),
  }));

  const completedAt = runState.completedAt ?? steps.at(-1)?.completedAt;

  return {
    runId,
    status: runState.status,
    createdAt: runState.createdAt,
    completedAt,
    steps,
    context: mergedContext,
  };
}
