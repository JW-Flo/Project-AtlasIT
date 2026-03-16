import { DurableObject } from "cloudflare:workers";
import type {
  RunState,
  StepState,
  RunStatus,
  StepStatus,
  StepTaskMessage,
  WorkflowType,
} from "../../../packages/shared/src/workflow/types";
import {
  WORKFLOW_STATE_SCHEMA_VERSION,
  DEFAULT_MAX_RETRIES,
  BACKOFF_BASE_MS,
  BACKOFF_MAX_MS,
} from "../../../packages/shared/src/workflow/types";
import { EvidenceEmitter } from "../../../packages/shared/src/workflow/evidence-emitter";
import type {
  QueueBus,
  EvidenceStore,
} from "../../../packages/shared/src/platform/interfaces";
import { CloudflareEvidenceStore } from "../../../packages/shared/src/platform/cloudflare/evidence-store";
import { CloudflareQueueBus } from "../../../packages/shared/src/platform/cloudflare/queue-bus";
import { moveToDeadLetter } from "../lib/dead-letter";
import type { DeadLetterEntry } from "../lib/dead-letter";

// ---------------------------------------------------------------------------
// Env bindings expected by WorkflowDO
// ---------------------------------------------------------------------------

export interface WorkflowDOEnv {
  STEP_TASKS: {
    send(msg: unknown, opts?: { delaySeconds?: number }): Promise<void>;
  };
  EVIDENCE: {
    head(key: string): Promise<{ key: string } | null>;
    put(
      key: string,
      value: string | ArrayBuffer | ReadableStream,
      options?: unknown,
    ): Promise<unknown>;
    get(key: string): Promise<{ text(): Promise<string> } | null>;
  };
  DB: D1Database;
}

// ---------------------------------------------------------------------------
// Legacy WorkflowDefinition shape (kept for API compatibility)
// ---------------------------------------------------------------------------

export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
  onFailure?: WorkflowStep[];
  globalTimeoutMs: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  handler: string;
  timeoutMs: number;
  retryConfig?: { maxRetries: number; backoffMs: number };
  compensate?: string;
}

// ---------------------------------------------------------------------------
// Valid status transitions (using shared RunStatus)
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<RunStatus, RunStatus[]> = {
  queued: ["running"],
  running: ["completed", "failed", "compensating"],
  completed: [],
  failed: [],
  compensating: ["failed"],
};

// ---------------------------------------------------------------------------
// WorkflowDO
// ---------------------------------------------------------------------------

export class WorkflowDO extends DurableObject<WorkflowDOEnv> {
  private state: RunState | null = null;
  private definition: WorkflowDefinition | null = null;
  private evidenceEmitter: EvidenceEmitter | null = null;
  private queueBus: QueueBus | null = null;

  private getEvidenceEmitter(): EvidenceEmitter | null {
    if (this.evidenceEmitter) return this.evidenceEmitter;
    if (!this.env?.EVIDENCE) return null;
    const store: EvidenceStore = new CloudflareEvidenceStore(this.env.EVIDENCE);
    this.evidenceEmitter = new EvidenceEmitter(store);
    return this.evidenceEmitter;
  }

  private getQueueBus(): QueueBus | null {
    if (this.queueBus) return this.queueBus;
    if (!this.env?.STEP_TASKS) return null;
    this.queueBus = new CloudflareQueueBus({
      "step-tasks": this.env.STEP_TASKS,
    });
    return this.queueBus;
  }

  /**
   * Inject test doubles for evidence and queue. Used in tests only.
   */
  _injectDeps(deps: {
    evidenceEmitter?: EvidenceEmitter;
    queueBus?: QueueBus;
  }): void {
    if (deps.evidenceEmitter) this.evidenceEmitter = deps.evidenceEmitter;
    if (deps.queueBus) this.queueBus = deps.queueBus;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (request.method === "POST" && path === "/start")
        return this.handleStart(request);
      if (
        request.method === "POST" &&
        path.startsWith("/step/") &&
        path.endsWith("/complete")
      )
        return this.handleStepComplete(request, path);
      if (
        request.method === "POST" &&
        path.startsWith("/step/") &&
        path.endsWith("/fail")
      )
        return this.handleStepFail(request, path);
      if (request.method === "GET" && path === "/status")
        return this.handleGetStatus();
      if (request.method === "POST" && path === "/cancel")
        return this.handleCancel();
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  private async handleStart(request: Request): Promise<Response> {
    const body = (await request.json()) as {
      definition: WorkflowDefinition;
      tenantId: string;
      correlationId: string;
      context?: Record<string, unknown>;
    };

    this.definition = body.definition;

    const now = new Date().toISOString();
    const runId = crypto.randomUUID();
    const steps: StepState[] = body.definition.steps.map((step) => ({
      stepId: step.id,
      action: step.handler,
      status: "pending" as StepStatus,
      attempts: 0,
    }));

    this.state = {
      schemaVersion: WORKFLOW_STATE_SCHEMA_VERSION,
      id: runId,
      type: (body.context?.workflowType as WorkflowType) ?? "joiner",
      status: "queued",
      tenantId: body.tenantId,
      userId: (body.context?.userId as string) ?? "unknown",
      actor: (body.context?.actor as string) ?? "atlas.workflow-do",
      createdAt: now,
      steps,
      history: [],
      context: body.context ?? {},
      alarmCount: 0,
    };

    await this.ctx.storage.put("state", this.state);
    await this.ctx.storage.put("definition", this.definition);

    this.transition("running");
    await this.ctx.storage.put("state", this.state);

    await this.ctx.storage.setAlarm(
      Date.now() + body.definition.globalTimeoutMs,
    );

    await this.advanceToNextStep();

    return this.jsonResponse(
      {
        status: "started",
        runId,
        workflowStatus: this.state.status,
        currentStep: this.getCurrentStepId(),
      },
      201,
    );
  }

  private async handleStepComplete(
    request: Request,
    path: string,
  ): Promise<Response> {
    await this.loadState();
    if (!this.state || !this.definition)
      return this.jsonResponse({ error: "Workflow not initialized" }, 400);

    const stepId = path.split("/step/")[1].split("/complete")[0];
    const body = (await request.json()) as { output?: unknown };

    const stepIndex = this.state.steps.findIndex((s) => s.stepId === stepId);
    if (stepIndex === -1)
      return this.jsonResponse({ error: "Unknown step" }, 404);

    const step = this.state.steps[stepIndex];
    if (step.status !== "running")
      return this.jsonResponse(
        { error: `Step is ${step.status}, not running` },
        409,
      );

    step.status = "completed";
    step.output = body.output;
    step.completedAt = new Date().toISOString();
    step.durationMs = step.startedAt
      ? Date.now() - new Date(step.startedAt).getTime()
      : undefined;

    // Record in history
    this.state.history.push({
      stepId: step.stepId,
      action: step.action,
      status: "completed",
      timestamp: step.completedAt,
      attemptNumber: step.attempts,
      output: body.output,
    });

    if (body.output && typeof body.output === "object") {
      Object.assign(this.state.context, body.output);
    }

    await this.ctx.storage.put("state", this.state);

    // Emit evidence for step completion
    await this.emitEvidence(step);

    // Check if all steps are done
    const nextPendingIndex = this.state.steps.findIndex(
      (s) => s.status === "pending",
    );
    if (nextPendingIndex === -1) {
      this.transition("completed");
      this.state.completedAt = new Date().toISOString();
      await this.ctx.storage.put("state", this.state);
      await this.ctx.storage.deleteAlarm();
      return this.jsonResponse({
        status: "completed",
        context: this.state.context,
      });
    }

    await this.advanceToNextStep();
    return this.jsonResponse({
      status: "advancing",
      nextStep: this.getCurrentStepId(),
    });
  }

  private async handleStepFail(
    request: Request,
    path: string,
  ): Promise<Response> {
    await this.loadState();
    if (!this.state || !this.definition)
      return this.jsonResponse({ error: "Workflow not initialized" }, 400);

    const stepId = path.split("/step/")[1].split("/fail")[0];
    const body = (await request.json()) as { error: string };

    const stepIndex = this.state.steps.findIndex((s) => s.stepId === stepId);
    if (stepIndex === -1)
      return this.jsonResponse({ error: "Unknown step" }, 404);

    const step = this.state.steps[stepIndex];
    const defStep = this.definition.steps.find((s) => s.id === stepId);
    if (!defStep)
      return this.jsonResponse({ error: "Step definition not found" }, 404);

    step.attempts++;
    step.error = body.error;

    // Record failure attempt in history
    this.state.history.push({
      stepId: step.stepId,
      action: step.action,
      status: "failed",
      timestamp: new Date().toISOString(),
      attemptNumber: step.attempts,
      error: body.error,
    });

    const maxRetries = defStep.retryConfig?.maxRetries ?? DEFAULT_MAX_RETRIES;
    if (step.attempts <= maxRetries) {
      step.status = "running";
      await this.ctx.storage.put("state", this.state);

      const backoff = Math.min(
        (defStep.retryConfig?.backoffMs ?? BACKOFF_BASE_MS) *
          Math.pow(2, step.attempts - 1),
        BACKOFF_MAX_MS,
      );
      await this.ctx.storage.setAlarm(Date.now() + backoff);

      return this.jsonResponse({
        status: "retrying",
        attempt: step.attempts,
        maxRetries,
        nextRetryMs: backoff,
      });
    }

    // Retries exhausted
    step.status = "dlq";
    step.completedAt = new Date().toISOString();
    step.durationMs = step.startedAt
      ? Date.now() - new Date(step.startedAt).getTime()
      : undefined;

    this.state.history.push({
      stepId: step.stepId,
      action: step.action,
      status: "dlq",
      timestamp: new Date().toISOString(),
      attemptNumber: step.attempts,
      error: body.error,
    });

    this.transition("failed");
    this.state.completedAt = new Date().toISOString();
    await this.ctx.storage.put("state", this.state);
    await this.ctx.storage.deleteAlarm();

    // Emit evidence for the failed step
    await this.emitEvidence(step);

    // Move to dead letter queue
    await this.sendToDeadLetter(step, body.error);

    if (this.definition.onFailure?.length) {
      await this.runCompensations();
    }

    return this.jsonResponse({
      status: "failed",
      error: `Step ${stepId} failed: ${body.error}`,
    });
  }

  private async handleGetStatus(): Promise<Response> {
    await this.loadState();
    if (!this.state)
      return this.jsonResponse({ error: "Workflow not initialized" }, 404);
    return this.jsonResponse({
      id: this.state.id,
      type: this.state.type,
      status: this.state.status,
      tenantId: this.state.tenantId,
      steps: this.state.steps,
      history: this.state.history,
      context: this.state.context,
      createdAt: this.state.createdAt,
      completedAt: this.state.completedAt,
      alarmCount: this.state.alarmCount,
    });
  }

  private async handleCancel(): Promise<Response> {
    await this.loadState();
    if (!this.state)
      return this.jsonResponse({ error: "Workflow not initialized" }, 404);
    if (this.state.status === "completed" || this.state.status === "failed") {
      return this.jsonResponse(
        { error: `Cannot cancel workflow in ${this.state.status} state` },
        409,
      );
    }
    this.transition("failed");
    this.state.completedAt = new Date().toISOString();
    await this.ctx.storage.put("state", this.state);
    await this.ctx.storage.deleteAlarm();
    return this.jsonResponse({ status: "cancelled" });
  }

  async alarm(): Promise<void> {
    await this.loadState();
    if (!this.state || !this.definition) return;

    this.state.alarmCount = (this.state.alarmCount ?? 0) + 1;

    if (this.state.status === "running") {
      // Find the current running step and check if it timed out
      const currentStep = this.state.steps.find((s) => s.status === "running");
      if (currentStep) {
        currentStep.status = "failed";
        currentStep.error = "Step timed out";
        currentStep.completedAt = new Date().toISOString();

        this.state.history.push({
          stepId: currentStep.stepId,
          action: currentStep.action,
          status: "failed",
          timestamp: currentStep.completedAt,
          attemptNumber: currentStep.attempts,
          error: "Step timed out",
        });
      }

      this.transition("failed");
      this.state.completedAt = new Date().toISOString();
      await this.ctx.storage.put("state", this.state);

      if (this.definition.onFailure?.length) {
        await this.runCompensations();
      }
    }
  }

  private transition(newStatus: RunStatus): void {
    if (!this.state) throw new Error("State not loaded");
    const allowed = VALID_TRANSITIONS[this.state.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(
        `Invalid transition: ${this.state.status} -> ${newStatus}`,
      );
    }
    this.state.status = newStatus;
  }

  private async advanceToNextStep(): Promise<void> {
    if (!this.state || !this.definition) return;

    const nextStep = this.state.steps.find((s) => s.status === "pending");
    if (!nextStep) return;

    const defStep = this.definition.steps.find((s) => s.id === nextStep.stepId);
    if (!defStep) return;

    nextStep.status = "running";
    nextStep.startedAt = new Date().toISOString();
    nextStep.attempts = 1;

    this.state.history.push({
      stepId: nextStep.stepId,
      action: nextStep.action,
      status: "running",
      timestamp: nextStep.startedAt,
      attemptNumber: 1,
    });

    await this.ctx.storage.put("state", this.state);

    if (defStep.timeoutMs > 0) {
      await this.ctx.storage.setAlarm(Date.now() + defStep.timeoutMs);
    }

    // Dispatch step task via queue
    const bus = this.getQueueBus();
    if (bus) {
      const msg: StepTaskMessage = {
        kind: "step-task",
        runId: this.state.id,
        stepId: nextStep.stepId,
        attempt: nextStep.attempts,
      };
      await bus.publish("step-tasks", msg);
    }
  }

  private async emitEvidence(step: StepState): Promise<void> {
    if (!this.state) return;
    const emitter = this.getEvidenceEmitter();
    if (!emitter) return;
    try {
      await emitter.emit(this.state, step);
    } catch (err) {
      // Evidence emission failure should not block workflow execution
      console.error(
        "Evidence emission failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  private async sendToDeadLetter(
    step: StepState,
    error: string,
  ): Promise<void> {
    if (!this.state) return;
    try {
      const db = this.env?.DB;
      if (!db) return;

      const entry: DeadLetterEntry = {
        eventId: this.state.id,
        agentId: step.action,
        deliveryId: `${this.state.id}:${step.stepId}`,
        tenantId: this.state.tenantId,
        eventType: `workflow.step.${step.action}`,
        eventSource: "workflow-do",
        eventPayload: JSON.stringify({
          runId: this.state.id,
          stepId: step.stepId,
          context: this.state.context,
        }),
        errorMessage: error,
        totalAttempts: step.attempts,
        firstAttemptAt: step.startedAt ?? this.state.createdAt,
        lastAttemptAt: new Date().toISOString(),
      };
      await moveToDeadLetter(db, entry);
    } catch (err) {
      // DLQ failure should not block workflow execution
      console.error(
        "DLQ write failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  private async runCompensations(): Promise<void> {
    if (!this.definition?.onFailure || !this.state) return;
    for (const step of this.definition.onFailure) {
      const compensationStep: StepState = {
        stepId: `compensate_${step.id}`,
        action: step.handler,
        status: "completed",
        attempts: 1,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
      this.state.steps.push(compensationStep);
    }
    await this.ctx.storage.put("state", this.state);
  }

  private getCurrentStepId(): string | null {
    if (!this.state) return null;
    const current = this.state.steps.find(
      (s) => s.status === "running" || s.status === "pending",
    );
    return current?.stepId ?? null;
  }

  private async loadState(): Promise<void> {
    if (!this.state) {
      this.state =
        ((await this.ctx.storage.get("state")) as RunState | undefined) ?? null;
      this.definition =
        ((await this.ctx.storage.get("definition")) as
          | WorkflowDefinition
          | undefined) ?? null;
    }
  }

  private jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
