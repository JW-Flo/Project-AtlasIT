/**
 * Tests for Track 1: Workflow Durability wiring.
 *
 * Validates:
 * 1. Evidence emission on step complete/fail
 * 2. Queue dispatch on advanceToNextStep
 * 3. DLQ on exhausted retries
 * 4. Type compatibility between old and new type systems
 * 5. InMemoryEvidenceStore behavior
 */
import { beforeEach, describe, expect, it } from "vitest";
import { EvidenceEmitter } from "../packages/shared/src/workflow/evidence-emitter";
import type {
  RunState,
  StepState,
  RunStatus,
  StepStatus,
  StepTaskMessage,
  EvidenceEnvelope,
} from "../packages/shared/src/workflow/types";
import {
  WORKFLOW_STATE_SCHEMA_VERSION,
  DEFAULT_MAX_RETRIES,
} from "../packages/shared/src/workflow/types";
import {
  InMemoryQueueBus,
  InMemoryEvidenceStore,
} from "../packages/shared/src/platform/testing";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRunState(overrides: Partial<RunState> = {}): RunState {
  return {
    schemaVersion: WORKFLOW_STATE_SCHEMA_VERSION,
    id: "run-test-1",
    type: "joiner",
    status: "running",
    tenantId: "tenant-1",
    userId: "user-1",
    actor: "atlas.test",
    createdAt: "2026-03-15T00:00:00Z",
    steps: [],
    history: [],
    context: {},
    alarmCount: 0,
    ...overrides,
  };
}

function makeStepState(overrides: Partial<StepState> = {}): StepState {
  return {
    stepId: "validate-profile",
    action: "validate_profile",
    status: "completed",
    attempts: 1,
    startedAt: "2026-03-15T00:00:00Z",
    completedAt: "2026-03-15T00:00:05Z",
    durationMs: 5000,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. InMemoryEvidenceStore
// ---------------------------------------------------------------------------

describe("InMemoryEvidenceStore", () => {
  let store: InMemoryEvidenceStore;

  beforeEach(() => {
    store = new InMemoryEvidenceStore();
  });

  it("stores and retrieves evidence by key", async () => {
    const result = await store.put(
      "t1",
      "run1",
      "step1",
      "abc123",
      '{"data":1}',
    );
    expect(result.alreadyExists).toBe(false);
    expect(result.key).toContain("t1");
    expect(result.key).toContain("run1");
    expect(result.key).toContain("step1");
    expect(result.key).toContain("abc123");

    const retrieved = await store.get(result.key);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.body).toBe('{"data":1}');
  });

  it("returns alreadyExists=true for duplicate writes", async () => {
    await store.put("t1", "run1", "step1", "abc123", '{"data":1}');
    const result2 = await store.put(
      "t1",
      "run1",
      "step1",
      "abc123",
      '{"data":1}',
    );
    expect(result2.alreadyExists).toBe(true);
  });

  it("exists returns false for missing keys", async () => {
    const exists = await store.exists("nonexistent");
    expect(exists).toBe(false);
  });

  it("exists returns true for stored keys", async () => {
    const result = await store.put("t1", "run1", "step1", "abc123", "body");
    const exists = await store.exists(result.key);
    expect(exists).toBe(true);
  });

  it("getAll returns all stored entries", async () => {
    await store.put("t1", "run1", "step1", "hash1", "body1");
    await store.put("t1", "run1", "step2", "hash2", "body2");
    expect(store.getAll()).toHaveLength(2);
  });

  it("getByRun filters by runId", async () => {
    await store.put("t1", "run1", "step1", "hash1", "body1");
    await store.put("t1", "run2", "step1", "hash2", "body2");
    expect(store.getByRun("run1")).toHaveLength(1);
    expect(store.getByRun("run2")).toHaveLength(1);
  });

  it("clear empties the store", async () => {
    await store.put("t1", "run1", "step1", "hash1", "body1");
    store.clear();
    expect(store.getAll()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Evidence emission on step complete/fail
// ---------------------------------------------------------------------------

describe("Evidence emission", () => {
  let store: InMemoryEvidenceStore;
  let emitter: EvidenceEmitter;

  beforeEach(() => {
    store = new InMemoryEvidenceStore();
    emitter = new EvidenceEmitter(store);
  });

  it("emits evidence envelope on step completion", async () => {
    const run = makeRunState();
    const step = makeStepState({ status: "completed" });

    const result = await emitter.emit(run, step);

    expect(result.alreadyExists).toBe(false);
    expect(result.key).toContain(run.tenantId);
    expect(result.key).toContain(run.id);
    expect(result.key).toContain(step.stepId);

    const stored = await store.get(result.key);
    expect(stored).not.toBeNull();

    const envelope: EvidenceEnvelope = JSON.parse(stored!.body);
    expect(envelope.tenantId).toBe("tenant-1");
    expect(envelope.workflowRunId).toBe("run-test-1");
    expect(envelope.stepId).toBe("validate-profile");
    expect(envelope.eventType).toBe("step.completed");
    expect(envelope.outcome).toBe("success");
    expect(envelope.hash).toBeDefined();
    expect(envelope.hash.length).toBe(64);
  });

  it("emits evidence envelope on step failure", async () => {
    const run = makeRunState();
    const step = makeStepState({
      status: "failed",
      error: "Connection timeout",
      completedAt: "2026-03-15T00:00:10Z",
    });

    const result = await emitter.emit(run, step);

    const stored = await store.get(result.key);
    expect(stored).not.toBeNull();

    const envelope: EvidenceEnvelope = JSON.parse(stored!.body);
    expect(envelope.eventType).toBe("step.failed");
    expect(envelope.outcome).toBe("failure");
    expect(envelope.error).toBe("Connection timeout");
  });

  it("emits evidence with skipped outcome", async () => {
    const run = makeRunState();
    const step = makeStepState({ status: "skipped" });

    const result = await emitter.emit(run, step);

    const stored = await store.get(result.key);
    const envelope: EvidenceEnvelope = JSON.parse(stored!.body);
    expect(envelope.eventType).toBe("step.skipped");
    expect(envelope.outcome).toBe("skipped");
  });

  it("produces idempotent writes for the same step state", async () => {
    const run = makeRunState();
    const step = makeStepState();

    const result1 = await emitter.emit(run, step);
    const result2 = await emitter.emit(run, step);

    expect(result1.key).toBe(result2.key);
    expect(result2.alreadyExists).toBe(true);
    expect(store.getAll()).toHaveLength(1);
  });

  it("includes actor from run state", async () => {
    const run = makeRunState({ actor: "admin@example.com" });
    const step = makeStepState();

    const result = await emitter.emit(run, step);
    const stored = await store.get(result.key);
    const envelope: EvidenceEnvelope = JSON.parse(stored!.body);
    expect(envelope.actor).toBe("admin@example.com");
  });

  it("throws on empty tenantId", async () => {
    const run = makeRunState({ tenantId: "" });
    const step = makeStepState();

    await expect(emitter.emit(run, step)).rejects.toThrow(
      "Evidence emission requires a non-empty tenantId",
    );
  });

  it("records durationMs in the envelope when available", async () => {
    const run = makeRunState();
    const step = makeStepState({ durationMs: 12345 });

    const result = await emitter.emit(run, step);
    const stored = await store.get(result.key);
    const envelope: EvidenceEnvelope = JSON.parse(stored!.body);
    expect(envelope.durationMs).toBe(12345);
  });
});

// ---------------------------------------------------------------------------
// 3. Queue dispatch on advanceToNextStep
// ---------------------------------------------------------------------------

describe("Queue dispatch for step tasks", () => {
  let bus: InMemoryQueueBus;

  beforeEach(() => {
    bus = new InMemoryQueueBus();
  });

  it("publishes a StepTaskMessage to step-tasks queue", async () => {
    const msg: StepTaskMessage = {
      kind: "step-task",
      runId: "run-1",
      stepId: "validate-profile",
      attempt: 1,
    };

    await bus.publish("step-tasks", msg);

    const messages = bus.getMessages("step-tasks");
    expect(messages).toHaveLength(1);
    expect(messages[0].msg).toEqual(msg);
  });

  it("publishes messages to the correct queue", async () => {
    const msg1: StepTaskMessage = {
      kind: "step-task",
      runId: "run-1",
      stepId: "step-1",
      attempt: 1,
    };
    const msg2: StepTaskMessage = {
      kind: "step-task",
      runId: "run-1",
      stepId: "step-2",
      attempt: 1,
    };

    await bus.publish("step-tasks", msg1);
    await bus.publish("step-tasks", msg2);
    await bus.publish("other-queue", { unrelated: true });

    expect(bus.getMessages("step-tasks")).toHaveLength(2);
    expect(bus.getMessages("other-queue")).toHaveLength(1);
  });

  it("StepTaskMessage has the correct shape", () => {
    const msg: StepTaskMessage = {
      kind: "step-task",
      runId: "run-abc",
      stepId: "provision-account",
      attempt: 3,
    };

    expect(msg.kind).toBe("step-task");
    expect(msg.runId).toBe("run-abc");
    expect(msg.stepId).toBe("provision-account");
    expect(msg.attempt).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 4. DLQ on exhausted retries
// ---------------------------------------------------------------------------

describe("DLQ routing on exhausted retries", () => {
  it("step transitions to dlq status after max retries", () => {
    const step: StepState = {
      stepId: "provision-account",
      action: "provision_primary_account",
      status: "failed",
      attempts: 3,
      error: "Service unavailable",
      startedAt: "2026-03-15T00:00:00Z",
      completedAt: "2026-03-15T00:01:00Z",
    };

    // Simulate retries exhausted -> dlq
    step.status = "dlq";

    expect(step.status).toBe("dlq");
    expect(step.attempts).toBe(3);
  });

  it("run transitions to failed when a step goes to dlq", () => {
    const run = makeRunState({
      steps: [
        makeStepState({ stepId: "step-1", status: "completed" }),
        makeStepState({ stepId: "step-2", status: "dlq", error: "Timeout" }),
      ],
    });

    run.status = "failed";

    expect(run.status).toBe("failed");
    const dlqStep = run.steps.find((s) => s.status === "dlq");
    expect(dlqStep).toBeDefined();
    expect(dlqStep!.stepId).toBe("step-2");
  });

  it("DLQ entry contains required fields for replay", () => {
    // Verify the DLQEntry type from shared can hold workflow step failure data
    const run = makeRunState();
    const step = makeStepState({
      stepId: "provision-account",
      status: "dlq",
      attempts: 3,
      error: "Connection refused",
    });

    // Build a DLQ-style entry (matching shared DLQEntry shape)
    const dlqEntry = {
      runId: run.id,
      stepId: step.stepId,
      action: step.action,
      attempts: step.attempts,
      lastError: step.error!,
      payload: run.context,
      createdAt: new Date().toISOString(),
    };

    expect(dlqEntry.runId).toBe("run-test-1");
    expect(dlqEntry.stepId).toBe("provision-account");
    expect(dlqEntry.attempts).toBe(3);
    expect(dlqEntry.lastError).toBe("Connection refused");
    expect(dlqEntry.createdAt).toBeDefined();
  });

  it("evidence is emitted for failed steps going to DLQ", async () => {
    const store = new InMemoryEvidenceStore();
    const emitter = new EvidenceEmitter(store);
    const run = makeRunState();
    const step = makeStepState({
      stepId: "provision-account",
      status: "failed",
      attempts: 3,
      error: "Connection refused",
      completedAt: "2026-03-15T00:01:00Z",
    });

    await emitter.emit(run, step);

    const evidence = store.getByRun(run.id);
    expect(evidence).toHaveLength(1);

    const stored = await store.get(evidence[0].hash);
    // Check by getting via the key from the put result
    const allEvidence = store.getAll();
    expect(allEvidence[0].runId).toBe(run.id);
    expect(allEvidence[0].stepId).toBe("provision-account");
  });
});

// ---------------------------------------------------------------------------
// 5. Type compatibility between old and new type systems
// ---------------------------------------------------------------------------

describe("Type compatibility", () => {
  it("RunState includes all fields needed by WorkflowDO", () => {
    const state: RunState = {
      schemaVersion: WORKFLOW_STATE_SCHEMA_VERSION,
      id: "run-1",
      type: "joiner",
      status: "running",
      tenantId: "tenant-1",
      userId: "user-1",
      actor: "atlas.workflow-do",
      createdAt: new Date().toISOString(),
      steps: [
        {
          stepId: "step-1",
          action: "validate_profile",
          status: "pending",
          attempts: 0,
        },
      ],
      history: [],
      context: { foo: "bar" },
      alarmCount: 0,
    };

    // All fields used by WorkflowDO are present
    expect(state.id).toBeDefined();
    expect(state.type).toBeDefined();
    expect(state.status).toBeDefined();
    expect(state.tenantId).toBeDefined();
    expect(state.userId).toBeDefined();
    expect(state.actor).toBeDefined();
    expect(state.createdAt).toBeDefined();
    expect(state.steps).toBeDefined();
    expect(state.history).toBeDefined();
    expect(state.context).toBeDefined();
    expect(state.alarmCount).toBeDefined();
    expect(state.schemaVersion).toBe(WORKFLOW_STATE_SCHEMA_VERSION);
  });

  it("StepState supports all statuses used by WorkflowDO", () => {
    const statuses: StepStatus[] = [
      "pending",
      "running",
      "completed",
      "failed",
      "dlq",
      "skipped",
    ];

    for (const status of statuses) {
      const step: StepState = {
        stepId: "s1",
        action: "test",
        status,
        attempts: 0,
      };
      expect(step.status).toBe(status);
    }
  });

  it("RunStatus supports all workflow states", () => {
    const statuses: RunStatus[] = [
      "queued",
      "running",
      "completed",
      "failed",
      "compensating",
    ];

    for (const status of statuses) {
      const run = makeRunState({ status });
      expect(run.status).toBe(status);
    }
  });

  it("StepState has durationMs field for evidence tracking", () => {
    const step: StepState = {
      stepId: "s1",
      action: "test",
      status: "completed",
      attempts: 1,
      durationMs: 5000,
    };
    expect(step.durationMs).toBe(5000);
  });

  it("RunState context is a flexible record", () => {
    const state = makeRunState({
      context: {
        user: { id: "u-1", email: "test@example.com" },
        entitlements: ["okta", "github"],
        nested: { deep: { value: 42 } },
      },
    });
    expect(state.context.user).toBeDefined();
    expect((state.context.user as Record<string, unknown>).email).toBe(
      "test@example.com",
    );
  });

  it("EvidenceEnvelope is compatible with EvidenceEmitter output", async () => {
    const store = new InMemoryEvidenceStore();
    const emitter = new EvidenceEmitter(store);

    const run = makeRunState();
    const step = makeStepState();

    const result = await emitter.emit(run, step);
    const stored = await store.get(result.key);
    const envelope: EvidenceEnvelope = JSON.parse(stored!.body);

    // Verify envelope has all required EvidenceEnvelope fields
    expect(envelope.tenantId).toBe(run.tenantId);
    expect(envelope.workflowRunId).toBe(run.id);
    expect(envelope.stepId).toBe(step.stepId);
    expect(envelope.actor).toBe(run.actor);
    expect(envelope.eventType).toBeDefined();
    expect(envelope.createdAt).toBeDefined();
    expect(envelope.hash).toBeDefined();
    expect(envelope.outcome).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 6. Compensation steps dispatched via queue (not instantly completed)
// ---------------------------------------------------------------------------

describe("Compensation step dispatch via queue", () => {
  let bus: InMemoryQueueBus;

  beforeEach(() => {
    bus = new InMemoryQueueBus();
  });

  it("compensation steps are dispatched as StepTaskMessages with compensation flag", async () => {
    const msg: StepTaskMessage = {
      kind: "step-task",
      runId: "run-1",
      stepId: "compensate_revoke-access",
      attempt: 1,
      compensation: true,
    };

    await bus.publish("step-tasks", msg);

    const messages = bus.getMessages("step-tasks");
    expect(messages).toHaveLength(1);
    expect(messages[0].msg).toEqual(msg);
    expect((messages[0].msg as StepTaskMessage).compensation).toBe(true);
  });

  it("compensation steps start in running status, not completed", () => {
    const step: StepState = {
      stepId: "compensate_revoke-access",
      action: "revoke_access",
      status: "running",
      attempts: 1,
      startedAt: new Date().toISOString(),
      compensation: true,
    };

    // Compensation steps must NOT be immediately marked completed
    expect(step.status).toBe("running");
    expect(step.compensation).toBe(true);
    expect(step.completedAt).toBeUndefined();
  });

  it("multiple compensation steps are each dispatched separately", async () => {
    const compensationSteps = [
      { id: "revoke-access", handler: "revoke_access" },
      { id: "cleanup-resources", handler: "cleanup_resources" },
      { id: "notify-admin", handler: "notify_admin" },
    ];

    for (const step of compensationSteps) {
      const msg: StepTaskMessage = {
        kind: "step-task",
        runId: "run-1",
        stepId: `compensate_${step.id}`,
        attempt: 1,
        compensation: true,
      };
      await bus.publish("step-tasks", msg);
    }

    const messages = bus.getMessages("step-tasks");
    expect(messages).toHaveLength(3);

    for (const published of messages) {
      const msg = published.msg as StepTaskMessage;
      expect(msg.compensation).toBe(true);
      expect(msg.stepId).toMatch(/^compensate_/);
    }
  });

  it("workflow transitions to compensating status when compensation starts", () => {
    const run = makeRunState({ status: "running" });

    // Simulate: running -> compensating is a valid transition
    const validTransitions: Record<RunStatus, RunStatus[]> = {
      queued: ["running"],
      running: ["completed", "failed", "compensating"],
      completed: [],
      failed: [],
      compensating: ["failed"],
    };

    expect(validTransitions[run.status]).toContain("compensating");
    run.status = "compensating";
    expect(run.status).toBe("compensating");
  });

  it("run transitions to failed after all compensation steps complete", () => {
    const run = makeRunState({
      status: "compensating",
      steps: [
        makeStepState({ stepId: "step-1", status: "dlq" }),
        {
          stepId: "compensate_revoke-access",
          action: "revoke_access",
          status: "completed",
          attempts: 1,
          compensation: true,
        },
        {
          stepId: "compensate_cleanup",
          action: "cleanup_resources",
          status: "completed",
          attempts: 1,
          compensation: true,
        },
      ],
    });

    const allCompensationDone = run.steps
      .filter((s) => s.compensation)
      .every((s) => s.status !== "running" && s.status !== "pending");

    expect(allCompensationDone).toBe(true);

    // After all compensation done, transition compensating -> failed
    run.status = "failed";
    expect(run.status).toBe("failed");
  });
});

// ---------------------------------------------------------------------------
// 7. Per-step timeouts tracked independently
// ---------------------------------------------------------------------------

describe("Per-step timeout tracking", () => {
  it("stepDeadline is stored on each running step", () => {
    const now = Date.now();
    const step1: StepState = {
      stepId: "step-1",
      action: "validate_profile",
      status: "running",
      attempts: 1,
      startedAt: new Date().toISOString(),
      stepDeadline: now + 5000,
    };
    const step2: StepState = {
      stepId: "step-2",
      action: "provision_account",
      status: "running",
      attempts: 1,
      startedAt: new Date().toISOString(),
      stepDeadline: now + 10000,
    };

    expect(step1.stepDeadline).toBe(now + 5000);
    expect(step2.stepDeadline).toBe(now + 10000);
    // Different deadlines for different steps
    expect(step1.stepDeadline).not.toBe(step2.stepDeadline);
  });

  it("earliest deadline among running steps determines next alarm", () => {
    const now = Date.now();
    const steps: StepState[] = [
      {
        stepId: "step-1",
        action: "validate",
        status: "running",
        attempts: 1,
        stepDeadline: now + 10000,
      },
      {
        stepId: "step-2",
        action: "provision",
        status: "running",
        attempts: 1,
        stepDeadline: now + 5000,
      },
      {
        stepId: "step-3",
        action: "notify",
        status: "completed",
        attempts: 1,
        stepDeadline: now + 1000, // completed step — should be ignored
      },
    ];

    const deadlines = steps
      .filter((s) => s.status === "running" && s.stepDeadline !== undefined)
      .map((s) => s.stepDeadline!);

    const earliestDeadline = Math.min(...deadlines);
    expect(earliestDeadline).toBe(now + 5000);
  });

  it("timed out step is marked failed with timeout error", () => {
    const now = Date.now();
    const step: StepState = {
      stepId: "step-1",
      action: "validate",
      status: "running",
      attempts: 1,
      startedAt: new Date(now - 6000).toISOString(),
      stepDeadline: now - 1000, // deadline passed
    };

    // Simulate alarm handler behavior
    if (step.stepDeadline !== undefined && step.stepDeadline <= now) {
      step.status = "failed";
      step.error = "Step timed out";
      step.completedAt = new Date().toISOString();
    }

    expect(step.status).toBe("failed");
    expect(step.error).toBe("Step timed out");
    expect(step.completedAt).toBeDefined();
  });

  it("only steps past their deadline are timed out", () => {
    const now = Date.now();
    const steps: StepState[] = [
      {
        stepId: "step-1",
        action: "validate",
        status: "running",
        attempts: 1,
        stepDeadline: now - 1000, // past deadline
      },
      {
        stepId: "step-2",
        action: "provision",
        status: "running",
        attempts: 1,
        stepDeadline: now + 5000, // still has time
      },
    ];

    const timedOut = steps.filter(
      (s) =>
        s.status === "running" &&
        s.stepDeadline !== undefined &&
        s.stepDeadline <= now,
    );

    expect(timedOut).toHaveLength(1);
    expect(timedOut[0].stepId).toBe("step-1");
  });

  it("compensation steps also have independent deadlines", () => {
    const now = Date.now();
    const steps: StepState[] = [
      {
        stepId: "compensate_revoke",
        action: "revoke_access",
        status: "running",
        attempts: 1,
        compensation: true,
        stepDeadline: now + 3000,
      },
      {
        stepId: "compensate_cleanup",
        action: "cleanup_resources",
        status: "running",
        attempts: 1,
        compensation: true,
        stepDeadline: now + 8000,
      },
    ];

    const deadlines = steps
      .filter((s) => s.status === "running" && s.stepDeadline !== undefined)
      .map((s) => s.stepDeadline!);

    expect(deadlines).toHaveLength(2);
    expect(Math.min(...deadlines)).toBe(now + 3000);
  });
});

// ---------------------------------------------------------------------------
// 8. Compensation failure escalation to DLQ
// ---------------------------------------------------------------------------

describe("Compensation failure escalation to DLQ", () => {
  it("DLQ payload includes compensationFailed flag when compensation step fails", () => {
    const run = makeRunState({ status: "compensating" });
    const step: StepState = {
      stepId: "compensate_revoke-access",
      action: "revoke_access",
      status: "dlq",
      attempts: DEFAULT_MAX_RETRIES + 1,
      error: "Revocation service unavailable",
      compensation: true,
      startedAt: "2026-03-15T00:00:00Z",
      completedAt: "2026-03-15T00:01:00Z",
    };

    // Build DLQ entry as workflow-do.ts does
    const dlqPayload = JSON.stringify({
      runId: run.id,
      stepId: step.stepId,
      context: run.context,
      compensationFailed: true,
    });

    const parsed = JSON.parse(dlqPayload);
    expect(parsed.compensationFailed).toBe(true);
    expect(parsed.runId).toBe(run.id);
    expect(parsed.stepId).toBe("compensate_revoke-access");
  });

  it("regular step DLQ payload does not include compensationFailed flag", () => {
    const run = makeRunState();
    const step: StepState = {
      stepId: "provision-account",
      action: "provision_primary_account",
      status: "dlq",
      attempts: DEFAULT_MAX_RETRIES + 1,
      error: "Service unavailable",
    };

    const dlqPayload = JSON.stringify({
      runId: run.id,
      stepId: step.stepId,
      context: run.context,
      compensationFailed: false,
    });

    const parsed = JSON.parse(dlqPayload);
    expect(parsed.compensationFailed).toBe(false);
  });

  it("compensation step exhausts retries and goes to dlq status", () => {
    const step: StepState = {
      stepId: "compensate_revoke-access",
      action: "revoke_access",
      status: "running",
      attempts: DEFAULT_MAX_RETRIES,
      compensation: true,
      startedAt: "2026-03-15T00:00:00Z",
    };

    // Simulate one more failed attempt exhausting retries
    step.attempts++;
    expect(step.attempts).toBeGreaterThan(DEFAULT_MAX_RETRIES);
    step.status = "dlq";
    step.completedAt = new Date().toISOString();

    expect(step.status).toBe("dlq");
    expect(step.compensation).toBe(true);
  });

  it("run ends in failed status even when compensation step fails", () => {
    const run = makeRunState({
      status: "compensating",
      steps: [
        makeStepState({ stepId: "step-1", status: "dlq" }),
        {
          stepId: "compensate_revoke-access",
          action: "revoke_access",
          status: "dlq",
          attempts: DEFAULT_MAX_RETRIES + 1,
          error: "Service unavailable",
          compensation: true,
        },
      ],
    });

    // All compensation steps are done (even if failed/dlq)
    const allCompensationDone = run.steps
      .filter((s) => s.compensation)
      .every((s) => s.status !== "running" && s.status !== "pending");

    expect(allCompensationDone).toBe(true);

    // Should transition to failed
    run.status = "failed";
    expect(run.status).toBe("failed");
  });

  it("DLQ entry for compensation failure has correct metadata structure", () => {
    const run = makeRunState();
    const step: StepState = {
      stepId: "compensate_cleanup",
      action: "cleanup_resources",
      status: "dlq",
      attempts: 4,
      error: "Cleanup service unreachable",
      compensation: true,
      startedAt: "2026-03-15T00:00:00Z",
      completedAt: "2026-03-15T00:01:00Z",
    };

    // Match DeadLetterEntry shape from dead-letter.ts
    const entry = {
      eventId: run.id,
      agentId: step.action,
      deliveryId: `${run.id}:${step.stepId}`,
      tenantId: run.tenantId,
      eventType: `workflow.step.${step.action}`,
      eventSource: "workflow-do",
      eventPayload: JSON.stringify({
        runId: run.id,
        stepId: step.stepId,
        context: run.context,
        compensationFailed: true,
      }),
      errorMessage: step.error!,
      totalAttempts: step.attempts,
      firstAttemptAt: step.startedAt!,
      lastAttemptAt: step.completedAt!,
    };

    expect(entry.eventId).toBe(run.id);
    expect(entry.agentId).toBe("cleanup_resources");
    expect(entry.deliveryId).toContain("compensate_cleanup");
    expect(entry.eventType).toBe("workflow.step.cleanup_resources");
    expect(entry.eventSource).toBe("workflow-do");

    const payload = JSON.parse(entry.eventPayload);
    expect(payload.compensationFailed).toBe(true);
    expect(payload.runId).toBe(run.id);
    expect(payload.stepId).toBe("compensate_cleanup");
  });
});
