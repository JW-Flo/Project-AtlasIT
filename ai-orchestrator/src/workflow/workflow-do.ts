import { DurableObject } from "cloudflare:workers";
import type {
  WorkflowDefinition,
  WorkflowState,
  WorkflowStatus,
  StepResult,
} from "./types";
import { VALID_TRANSITIONS } from "./types";

export class WorkflowDO extends DurableObject {
  private state: WorkflowState | null = null;
  private definition: WorkflowDefinition | null = null;

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
    this.state = {
      definitionId: body.definition.id,
      definitionName: body.definition.name,
      status: "CREATED",
      currentStepIndex: 0,
      stepResults: {},
      context: body.context ?? {},
      tenantId: body.tenantId,
      correlationId: body.correlationId,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    for (const step of body.definition.steps) {
      this.state.stepResults[step.id] = {
        stepId: step.id,
        status: "pending",
        attempts: 0,
      };
    }

    await this.ctx.storage.put("state", this.state);
    await this.ctx.storage.put("definition", this.definition);

    this.transition("RUNNING");
    await this.ctx.storage.put("state", this.state);

    await this.ctx.storage.setAlarm(
      Date.now() + body.definition.globalTimeoutMs,
    );

    await this.advanceToNextStep();

    return this.jsonResponse(
      {
        status: "started",
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

    const stepResult = this.state.stepResults[stepId];
    if (!stepResult) return this.jsonResponse({ error: "Unknown step" }, 404);
    if (stepResult.status !== "running")
      return this.jsonResponse(
        { error: `Step is ${stepResult.status}, not running` },
        409,
      );

    stepResult.status = "completed";
    stepResult.output = body.output;
    stepResult.completedAt = new Date().toISOString();
    this.state.updatedAt = new Date().toISOString();

    if (body.output && typeof body.output === "object") {
      Object.assign(this.state.context, body.output);
    }

    this.state.currentStepIndex++;
    await this.ctx.storage.put("state", this.state);

    if (this.state.currentStepIndex >= this.definition.steps.length) {
      this.transition("COMPLETED");
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

    const stepResult = this.state.stepResults[stepId];
    if (!stepResult) return this.jsonResponse({ error: "Unknown step" }, 404);

    const step = this.definition.steps.find((s) => s.id === stepId);
    if (!step)
      return this.jsonResponse({ error: "Step definition not found" }, 404);

    stepResult.attempts++;

    const maxRetries = step.retryConfig?.maxRetries ?? 0;
    if (stepResult.attempts <= maxRetries) {
      stepResult.status = "running";
      stepResult.error = body.error;
      this.state.updatedAt = new Date().toISOString();
      await this.ctx.storage.put("state", this.state);

      const backoff =
        (step.retryConfig?.backoffMs ?? 1000) *
        Math.pow(2, stepResult.attempts - 1);
      await this.ctx.storage.setAlarm(Date.now() + backoff);

      return this.jsonResponse({
        status: "retrying",
        attempt: stepResult.attempts,
        maxRetries,
        nextRetryMs: backoff,
      });
    }

    stepResult.status = "failed";
    stepResult.error = body.error;
    stepResult.completedAt = new Date().toISOString();

    this.state.error = `Step ${stepId} failed: ${body.error}`;
    this.transition("FAILED");
    this.state.completedAt = new Date().toISOString();
    await this.ctx.storage.put("state", this.state);
    await this.ctx.storage.deleteAlarm();

    if (this.definition.onFailure?.length) {
      await this.runCompensations();
    }

    return this.jsonResponse({ status: "failed", error: this.state.error });
  }

  private async handleGetStatus(): Promise<Response> {
    await this.loadState();
    if (!this.state)
      return this.jsonResponse({ error: "Workflow not initialized" }, 404);
    return this.jsonResponse({
      definitionId: this.state.definitionId,
      definitionName: this.state.definitionName,
      status: this.state.status,
      currentStepIndex: this.state.currentStepIndex,
      stepResults: this.state.stepResults,
      context: this.state.context,
      tenantId: this.state.tenantId,
      startedAt: this.state.startedAt,
      updatedAt: this.state.updatedAt,
      completedAt: this.state.completedAt,
      error: this.state.error,
    });
  }

  private async handleCancel(): Promise<Response> {
    await this.loadState();
    if (!this.state)
      return this.jsonResponse({ error: "Workflow not initialized" }, 404);
    if (this.state.status === "COMPLETED" || this.state.status === "FAILED") {
      return this.jsonResponse(
        { error: `Cannot cancel workflow in ${this.state.status} state` },
        409,
      );
    }
    this.transition("FAILED");
    this.state.error = "Cancelled by user";
    this.state.completedAt = new Date().toISOString();
    await this.ctx.storage.put("state", this.state);
    await this.ctx.storage.deleteAlarm();
    return this.jsonResponse({ status: "cancelled" });
  }

  async alarm(): Promise<void> {
    await this.loadState();
    if (!this.state || !this.definition) return;

    if (this.state.status === "RUNNING" || this.state.status === "WAITING") {
      this.transition("TIMED_OUT");
      this.state.error = "Workflow timed out";
      this.state.completedAt = new Date().toISOString();

      const currentStep = this.definition.steps[this.state.currentStepIndex];
      if (currentStep) {
        const stepResult = this.state.stepResults[currentStep.id];
        if (stepResult && stepResult.status === "running") {
          stepResult.status = "failed";
          stepResult.error = "Step timed out";
          stepResult.completedAt = new Date().toISOString();
        }
      }

      await this.ctx.storage.put("state", this.state);

      if (this.definition.onFailure?.length) {
        await this.runCompensations();
      }
    }
  }

  private transition(newStatus: WorkflowStatus): void {
    if (!this.state) throw new Error("State not loaded");
    const allowed = VALID_TRANSITIONS[this.state.status];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid transition: ${this.state.status} -> ${newStatus}`,
      );
    }
    this.state.status = newStatus;
    this.state.updatedAt = new Date().toISOString();
  }

  private async advanceToNextStep(): Promise<void> {
    if (!this.state || !this.definition) return;
    const step = this.definition.steps[this.state.currentStepIndex];
    if (!step) return;

    const stepResult = this.state.stepResults[step.id];
    stepResult.status = "running";
    stepResult.startedAt = new Date().toISOString();
    stepResult.attempts = 1;
    this.state.updatedAt = new Date().toISOString();

    await this.ctx.storage.put("state", this.state);

    if (step.timeoutMs > 0) {
      await this.ctx.storage.setAlarm(Date.now() + step.timeoutMs);
    }
  }

  private async runCompensations(): Promise<void> {
    if (!this.definition?.onFailure) return;
    for (const step of this.definition.onFailure) {
      this.state!.stepResults[`compensate_${step.id}`] = {
        stepId: `compensate_${step.id}`,
        status: "completed",
        attempts: 1,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
    }
    await this.ctx.storage.put("state", this.state!);
  }

  private getCurrentStepId(): string | null {
    if (!this.state || !this.definition) return null;
    return this.definition.steps[this.state.currentStepIndex]?.id ?? null;
  }

  private async loadState(): Promise<void> {
    if (!this.state) {
      this.state =
        ((await this.ctx.storage.get("state")) as WorkflowState | undefined) ??
        null;
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
