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
import { classifyEvent, storeEvidence } from "@atlasit/shared";

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
  /** Run this step in parallel with the next step(s) that also have parallel=true */
  parallel?: boolean;
  /** Only run if condition evaluates truthy against workflow context */
  condition?: {
    field: string;
    operator: "eq" | "neq" | "exists" | "not_exists";
    value?: unknown;
  };
  /** Delay before dispatching this step (e.g. leaver grace period). Uses DO alarm. */
  delayMs?: number;
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
    const runId = body.correlationId || crypto.randomUUID();
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
      context: { ...body.context, _correlationId: body.correlationId },
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

    // Update steps_done in D1 workflow_runs table
    await this.updateRunProgress();

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

    // Handle compensation step completion
    if (step.compensation) {
      const allCompensationDone = this.state.steps
        .filter((s) => s.compensation)
        .every((s) => s.status !== "running" && s.status !== "pending");

      if (allCompensationDone) {
        this.transition("failed");
        this.state.completedAt = new Date().toISOString();
        await this.ctx.storage.put("state", this.state);
        await this.ctx.storage.deleteAlarm();
        await this.updateRunProgress("failed");
      }
      return this.jsonResponse({
        status: allCompensationDone ? "failed" : "compensating",
      });
    }

    // Check if any regular (non-compensation) steps are still running
    const stillRunning = this.state.steps.some(
      (s) => s.status === "running" && !s.compensation,
    );

    // If parallel steps are still running, wait for them before advancing
    if (stillRunning) {
      return this.jsonResponse({ status: "waiting_parallel" });
    }

    // Check if all regular steps are done
    const hasPending = this.state.steps.some(
      (s) => s.status === "pending" && !s.compensation,
    );
    if (!hasPending) {
      this.transition("completed");
      this.state.completedAt = new Date().toISOString();
      await this.ctx.storage.put("state", this.state);
      await this.ctx.storage.deleteAlarm();
      await this.updateRunProgress("completed");
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
    const isCompensation = !!step.compensation;

    // Look up step definition: for compensation steps, strip the compensate_ prefix
    const defStepId = isCompensation
      ? stepId.replace(/^compensate_/, "")
      : stepId;
    const defStepList = isCompensation
      ? (this.definition.onFailure ?? [])
      : this.definition.steps;
    const defStep = defStepList.find((s) => s.id === defStepId);
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

    // Emit evidence for the failed step
    await this.emitEvidence(step);

    // Move to dead letter queue (flag compensationFailed for compensation steps)
    await this.sendToDeadLetter(step, body.error, isCompensation);

    if (isCompensation) {
      // Compensation step failed — check if all compensation steps are done
      const allCompensationDone = this.state.steps
        .filter((s) => s.compensation)
        .every((s) => s.status !== "running" && s.status !== "pending");

      if (allCompensationDone) {
        this.transition("failed");
        this.state.completedAt = new Date().toISOString();
        await this.ctx.storage.deleteAlarm();
      }
      await this.ctx.storage.put("state", this.state);

      return this.jsonResponse({
        status: "failed",
        error: `Compensation step ${stepId} failed: ${body.error}`,
        compensationFailed: true,
      });
    }

    // Regular step: run compensations or transition to failed
    if (this.definition.onFailure?.length) {
      await this.ctx.storage.put("state", this.state);
      await this.ctx.storage.deleteAlarm();
      await this.runCompensations();
    } else {
      this.transition("failed");
      this.state.completedAt = new Date().toISOString();
      await this.ctx.storage.put("state", this.state);
      await this.ctx.storage.deleteAlarm();
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

    const now = Date.now();

    // Check for delayed steps ready to dispatch
    const waitingSteps = this.state.steps.filter(
      (s) => (s.status as string) === "waiting",
    );
    for (const step of waitingSteps) {
      const delayTarget = (await this.ctx.storage.get(
        `delay:${step.stepId}`,
      )) as number | undefined;
      if (delayTarget && now >= delayTarget) {
        // Grace period elapsed — dispatch the step
        step.status = "running";
        step.attempts = 1;
        const bus = this.getQueueBus();
        if (bus) {
          await bus.publish("step-tasks", {
            kind: "step-task",
            runId: this.state.id,
            stepId: step.stepId,
            attempt: 1,
          });
        }
        this.state.history.push({
          stepId: step.stepId,
          action: step.action,
          status: "running",
          timestamp: new Date().toISOString(),
          attemptNumber: 1,
        });
        await this.ctx.storage.delete(`delay:${step.stepId}`);
        await this.ctx.storage.put("state", this.state);
      }
    }

    if (
      this.state.status === "running" ||
      this.state.status === "compensating"
    ) {
      // Check ALL running steps against their deadlines
      const timedOutSteps = this.state.steps.filter(
        (s) =>
          s.status === "running" &&
          s.stepDeadline !== undefined &&
          s.stepDeadline <= now,
      );

      for (const step of timedOutSteps) {
        step.status = "failed";
        step.error = "Step timed out";
        step.completedAt = new Date().toISOString();

        this.state.history.push({
          stepId: step.stepId,
          action: step.action,
          status: "failed",
          timestamp: step.completedAt,
          attemptNumber: step.attempts,
          error: "Step timed out",
        });

        if (step.compensation) {
          // Compensation step timed out — escalate to DLQ
          await this.sendToDeadLetter(step, "Step timed out", true);
        }
      }

      if (this.state.status === "running" && timedOutSteps.length > 0) {
        if (this.definition.onFailure?.length) {
          await this.ctx.storage.put("state", this.state);
          await this.runCompensations();
        } else {
          this.transition("failed");
          this.state.completedAt = new Date().toISOString();
          await this.ctx.storage.put("state", this.state);
        }
        return;
      }

      if (this.state.status === "compensating") {
        // Check if all compensation steps are done (completed or failed)
        const allCompensationDone = this.state.steps
          .filter((s) => s.compensation)
          .every((s) => s.status !== "running" && s.status !== "pending");

        if (allCompensationDone) {
          this.transition("failed");
          this.state.completedAt = new Date().toISOString();
        } else {
          // Schedule next alarm for remaining running steps
          this.scheduleNextDeadlineAlarm();
        }
      }

      await this.ctx.storage.put("state", this.state);
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

  /** Write steps_done and status back to D1 workflow_runs table */
  private async updateRunProgress(finalStatus?: string): Promise<void> {
    if (!this.state) return;
    const db = (this.env as any)?.DB;
    if (!db) return;

    // Use correlationId (the workflow_runs.id from jml-engine) if available
    const runDbId =
      (this.state.context?._correlationId as string) || this.state.id;
    const stepsDone = this.state.steps.filter(
      (s) => s.status === "completed" && !s.compensation,
    ).length;

    try {
      if (finalStatus) {
        await db
          .prepare(
            `UPDATE workflow_runs SET steps_done = ?, status = ?, completed_at = ?, duration_ms = ? WHERE id = ?`,
          )
          .bind(
            stepsDone,
            finalStatus,
            new Date().toISOString(),
            this.state.createdAt
              ? Date.now() - new Date(this.state.createdAt).getTime()
              : null,
            runDbId,
          )
          .run();
      } else {
        await db
          .prepare(`UPDATE workflow_runs SET steps_done = ? WHERE id = ?`)
          .bind(stepsDone, runDbId)
          .run();
      }
    } catch {
      // Non-fatal: DO state is the source of truth
    }
  }

  private async advanceToNextStep(): Promise<void> {
    if (!this.state || !this.definition) return;

    // Collect the next batch of steps to dispatch.
    // A "parallel" batch is a contiguous run of steps with parallel=true,
    // or a single non-parallel step.
    const pendingSteps = this.state.steps.filter(
      (s) => s.status === "pending" && !s.compensation,
    );
    if (pendingSteps.length === 0) return;

    const batch: StepState[] = [];
    for (const step of pendingSteps) {
      const defStep = this.definition.steps.find((s) => s.id === step.stepId);
      if (!defStep) continue;

      // Evaluate condition — skip if condition fails
      if (defStep.condition && !this.evaluateCondition(defStep.condition)) {
        step.status = "skipped" as StepStatus;
        step.completedAt = new Date().toISOString();
        this.state.history.push({
          stepId: step.stepId,
          action: step.action,
          status: "skipped" as StepStatus,
          timestamp: step.completedAt,
          attemptNumber: 0,
        });
        continue;
      }

      batch.push(step);

      // If this step is not parallel, stop collecting (it runs alone)
      if (!defStep.parallel) break;
      // If this step IS parallel, keep collecting until a non-parallel step
    }

    if (batch.length === 0) {
      // All remaining steps were skipped — check completion
      const stillPending = this.state.steps.some(
        (s) => s.status === "pending" || s.status === "running",
      );
      if (!stillPending) {
        this.transition("completed");
        this.state.completedAt = new Date().toISOString();
        await this.ctx.storage.put("state", this.state);
        await this.ctx.storage.deleteAlarm();
      }
      return;
    }

    const now = new Date().toISOString();
    const bus = this.getQueueBus();

    for (const step of batch) {
      const defStep = this.definition.steps.find((s) => s.id === step.stepId)!;

      // If this step has a delay, mark it as waiting and set an alarm
      if (defStep.delayMs && defStep.delayMs > 0) {
        step.status = "waiting" as StepStatus;
        step.startedAt = now;
        step.stepDeadline = Date.now() + defStep.delayMs + defStep.timeoutMs;

        this.state.history.push({
          stepId: step.stepId,
          action: step.action,
          status: "waiting" as StepStatus,
          timestamp: now,
          attemptNumber: 0,
        });

        // Store the delay target so alarm() can dispatch when ready
        await this.ctx.storage.put(
          `delay:${step.stepId}`,
          Date.now() + defStep.delayMs,
        );
        await this.ctx.storage.setAlarm(Date.now() + defStep.delayMs);
        await this.ctx.storage.put("state", this.state);
        return; // Wait for alarm to dispatch this step
      }

      step.status = "running";
      step.startedAt = now;
      step.attempts = 1;

      if (defStep.timeoutMs > 0) {
        step.stepDeadline = Date.now() + defStep.timeoutMs;
      }

      this.state.history.push({
        stepId: step.stepId,
        action: step.action,
        status: "running",
        timestamp: now,
        attemptNumber: 1,
      });

      // Dispatch step task via queue
      if (bus) {
        const msg: StepTaskMessage = {
          kind: "step-task",
          runId: this.state.id,
          stepId: step.stepId,
          attempt: step.attempts,
        };
        await bus.publish("step-tasks", msg);
      }
    }

    await this.ctx.storage.put("state", this.state);
    this.scheduleNextDeadlineAlarm();
  }

  private evaluateCondition(condition: {
    field: string;
    operator: string;
    value?: unknown;
  }): boolean {
    if (!this.state) return false;
    const fieldValue = getNestedValue(this.state.context, condition.field);
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

  private async emitEvidence(step: StepState): Promise<void> {
    if (!this.state) return;

    // 1. Write immutable R2 envelope (existing behavior)
    const emitter = this.getEvidenceEmitter();
    if (emitter) {
      try {
        await emitter.emit(this.state, step);
      } catch (err) {
        console.error(
          "R2 evidence emission failed:",
          err instanceof Error ? err.message : err,
        );
      }
    }

    // 2. Bridge to D1 compliance_evidence via evidence classifier
    // This makes workflow step evidence queryable for scoring + feed
    try {
      const eventType =
        step.status === "completed"
          ? `workflow.step.${step.action}.completed`
          : `workflow.step.${step.action}.failed`;

      const classified = classifyEvent(
        this.state.tenantId,
        eventType,
        "workflow-do",
        this.state.actor,
        this.state.userId !== "unknown" ? this.state.userId : null,
        {
          runId: this.state.id,
          stepId: step.stepId,
          action: step.action,
          workflowType: this.state.type,
          status: step.status,
          durationMs: step.durationMs,
          error: step.error,
          context: this.state.context,
        },
      );

      if (classified && this.env?.DB) {
        await storeEvidence(
          {
            db: this.env.DB,
            bucket: (this.env.EVIDENCE as unknown as R2Bucket) ?? undefined,
          },
          classified,
        );
      }
    } catch (err) {
      // D1 evidence bridge failure should not block workflow execution
      console.error(
        "D1 evidence bridge failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  private async sendToDeadLetter(
    step: StepState,
    error: string,
    compensationFailed = false,
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
          compensationFailed,
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

    this.transition("compensating");

    const now = new Date().toISOString();
    const bus = this.getQueueBus();

    for (const step of this.definition.onFailure) {
      const compensationStep: StepState = {
        stepId: `compensate_${step.id}`,
        action: step.handler,
        status: "running",
        attempts: 1,
        startedAt: now,
        compensation: true,
      };

      if (step.timeoutMs > 0) {
        compensationStep.stepDeadline = Date.now() + step.timeoutMs;
      }

      this.state.steps.push(compensationStep);

      this.state.history.push({
        stepId: compensationStep.stepId,
        action: compensationStep.action,
        status: "running",
        timestamp: now,
        attemptNumber: 1,
      });

      if (bus) {
        const msg: StepTaskMessage = {
          kind: "step-task",
          runId: this.state.id,
          stepId: compensationStep.stepId,
          attempt: 1,
          compensation: true,
        };
        await bus.publish("step-tasks", msg);
      }
    }

    // Set alarm to earliest compensation deadline
    this.scheduleNextDeadlineAlarm();
    await this.ctx.storage.put("state", this.state);
  }

  private scheduleNextDeadlineAlarm(): void {
    if (!this.state) return;

    const deadlines = this.state.steps
      .filter((s) => s.status === "running" && s.stepDeadline !== undefined)
      .map((s) => s.stepDeadline!);

    if (deadlines.length > 0) {
      const earliest = Math.min(...deadlines);
      // setAlarm is async but we fire-and-forget here; caller persists state after
      void this.ctx.storage.setAlarm(earliest);
    }
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

// ── Module-level helpers ───────────────────────────────────────────────────

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (
      current &&
      typeof current === "object" &&
      key in (current as Record<string, unknown>)
    ) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}
