/**
 * JMLEngine — Durable Object workflow orchestrator.
 *
 * Persists run state in DO storage, executes steps sequentially with bounded
 * retries, and routes exhausted failures to a DLQ. Uses DO alarms for
 * scheduled wake-ups (not external crons).
 *
 * Design invariants:
 *  - State is versioned (schemaVersion field) for forward-compatible migration.
 *  - All state mutations are persisted before returning.
 *  - Step execution is deterministic given the same context and step registry.
 *  - Cloudflare-specific types do not leak into this module — the constructor
 *    accepts a portable storage interface.
 */
import { WORKFLOW_STATE_SCHEMA_VERSION, DEFAULT_MAX_RETRIES } from "./types.js";
import { getStepDefinitions } from "./step-registry.js";
import { executeStep } from "./step-executor.js";
// ---------------------------------------------------------------------------
// JMLEngine class
// ---------------------------------------------------------------------------
export class JMLEngine {
    storage;
    maxRetries;
    constructor(state, _env = {}) {
        this.storage = state.storage;
        this.maxRetries = DEFAULT_MAX_RETRIES;
    }
    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------
    /**
     * Enqueue a new workflow run.
     *
     * Accepts the full context payload (type, tenantId, user, etc.), creates
     * the run state, persists it, executes all steps synchronously (alarm-driven
     * in production), and returns the final result.
     */
    async handleEnqueue(context) {
        const type = context.type;
        if (!type || !["joiner", "mover", "leaver"].includes(type)) {
            return this.jsonResponse({ error: "invalid_workflow_type", provided: type }, 400);
        }
        const tenantId = context.tenantId ?? "unknown";
        const user = context.user;
        const userId = user?.id ?? context.subjectRef ?? "user-unknown";
        const runId = crypto.randomUUID();
        const now = new Date().toISOString();
        const stepDefs = getStepDefinitions(type);
        const steps = stepDefs.map((def) => ({
            stepId: def.id,
            action: def.action,
            status: "pending",
            attempts: 0,
        }));
        const runState = {
            schemaVersion: WORKFLOW_STATE_SCHEMA_VERSION,
            id: runId,
            type,
            status: "queued",
            tenantId,
            userId,
            actor: context.actor ?? "atlas.workflow-engine",
            createdAt: now,
            steps,
            history: [],
            context,
            alarmCount: 0,
        };
        await this.storage.put(`run:${runId}`, runState);
        // Execute the workflow (in production this would be alarm-driven)
        await this.executeRun(runId);
        const finalState = await this.storage.get(`run:${runId}`);
        return this.jsonResponse({ runId, runState: finalState });
    }
    /**
     * Alarm handler — called by DO runtime on scheduled wake-up.
     * Resumes execution of the current run.
     */
    async alarm() {
        // Find any run in "running" or "queued" state and resume it
        const runs = await this.storage.list({ prefix: "run:" });
        for (const [key, value] of runs) {
            const run = value;
            if (run.status === "running" || run.status === "queued") {
                run.alarmCount = (run.alarmCount ?? 0) + 1;
                await this.storage.put(key, run);
                await this.executeRun(run.id);
                return;
            }
        }
    }
    // -----------------------------------------------------------------------
    // Internal execution loop
    // -----------------------------------------------------------------------
    async executeRun(runId) {
        const run = await this.storage.get(`run:${runId}`);
        if (!run)
            return;
        run.status = "running";
        await this.storage.put(`run:${runId}`, run);
        for (const step of run.steps) {
            if (step.status === "completed" || step.status === "dlq") {
                continue;
            }
            const result = await this.executeStepWithRetries(run, step);
            if (!result.success) {
                // Step exhausted retries — route to DLQ
                step.status = "dlq";
                run.status = "failed";
                const dlqEntry = {
                    runId,
                    stepId: step.stepId,
                    action: step.action,
                    attempts: step.attempts,
                    lastError: step.error ?? "unknown_error",
                    payload: run.context,
                    createdAt: new Date().toISOString(),
                };
                await this.storage.put(`dlq:${runId}:${step.stepId}`, dlqEntry);
                run.history.push({
                    stepId: step.stepId,
                    action: step.action,
                    status: "dlq",
                    timestamp: new Date().toISOString(),
                    attemptNumber: step.attempts,
                    error: step.error,
                });
                await this.storage.put(`run:${runId}`, run);
                return; // Stop execution on failure
            }
        }
        // All steps completed successfully
        run.status = "completed";
        run.completedAt = new Date().toISOString();
        await this.storage.put(`run:${runId}`, run);
    }
    async executeStepWithRetries(run, step) {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            step.attempts = attempt;
            step.status = "running";
            step.startedAt = step.startedAt ?? new Date().toISOString();
            await this.storage.put(`run:${run.id}`, run);
            const result = await executeStep(step.stepId, step.action, run.context);
            if (result.success) {
                step.status = "completed";
                step.completedAt = new Date().toISOString();
                step.output = result.output;
                step.error = undefined;
                const historyEntry = {
                    stepId: step.stepId,
                    action: step.action,
                    status: "completed",
                    timestamp: step.completedAt,
                    attemptNumber: attempt,
                    output: result.output,
                };
                run.history.push(historyEntry);
                await this.storage.put(`run:${run.id}`, run);
                return { success: true };
            }
            // Step failed — record the error
            step.error = result.error;
            step.status = "failed";
            run.history.push({
                stepId: step.stepId,
                action: step.action,
                status: "failed",
                timestamp: new Date().toISOString(),
                attemptNumber: attempt,
                error: result.error,
            });
            await this.storage.put(`run:${run.id}`, run);
            // If not the last attempt, we would schedule an alarm for retry
            // In synchronous mode we just loop
        }
        return { success: false };
    }
    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------
    jsonResponse(body, status = 200) {
        return new Response(JSON.stringify(body), {
            status,
            headers: { "Content-Type": "application/json" },
        });
    }
}
//# sourceMappingURL=jml-engine.js.map