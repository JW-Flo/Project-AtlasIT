import { beforeEach, describe, expect, it } from "vitest";
import { JMLEngine } from "../packages/shared/src/workflow/jml-engine.js";
import type { WorkflowStorage } from "../packages/shared/src/workflow/jml-engine.js";
import type {
  RunState,
  DLQEntry,
} from "../packages/shared/src/workflow/types.js";
import {
  WORKFLOW_STATE_SCHEMA_VERSION,
  DEFAULT_MAX_RETRIES,
  canonicalJson,
  sha256Hex,
} from "../packages/shared/src/workflow/types.js";
import { getStepDefinitions } from "../packages/shared/src/workflow/step-registry.js";
import {
  InMemoryQueueBus,
  InMemoryWorkflowStateStore,
} from "../packages/shared/src/platform/testing.js";

// ---------------------------------------------------------------------------
// In-memory storage for DO tests
// ---------------------------------------------------------------------------

function clone<T>(value: T): T {
  return structuredClone(value);
}

class InMemoryStorage implements WorkflowStorage {
  readonly data = new Map<string, unknown>();

  async put(key: string, value: unknown): Promise<void> {
    this.data.set(key, clone(value));
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    const value = this.data.get(key);
    return value ? (clone(value) as T) : undefined;
  }

  async list(opts?: { prefix?: string }): Promise<Map<string, unknown>> {
    const results = new Map<string, unknown>();
    const prefix = opts?.prefix ?? "";
    for (const [key, value] of this.data.entries()) {
      if (!prefix || key.startsWith(prefix)) {
        results.set(key, clone(value));
      }
    }
    return results;
  }
}

// ---------------------------------------------------------------------------
// Test suite: Workflow Durability
// ---------------------------------------------------------------------------

describe("Workflow Durability", () => {
  let storage: InMemoryStorage;
  let engine: JMLEngine;

  beforeEach(() => {
    storage = new InMemoryStorage();
    engine = new JMLEngine({ storage }, {});
  });

  // -----------------------------------------------------------------------
  // Schema versioning
  // -----------------------------------------------------------------------

  describe("schema versioning", () => {
    it("persists run state with the current schema version", async () => {
      const response = await engine.handleEnqueue({
        type: "joiner",
        tenantId: "tenant-1",
        user: { id: "user-1", email: "test@example.com" },
        entitlements: ["okta"],
        notifications: { channels: ["email"], recipients: ["it@example.com"] },
      });
      const { runId } = await response.json();
      const run = await storage.get<RunState>(`run:${runId}`);

      expect(run?.schemaVersion).toBe(WORKFLOW_STATE_SCHEMA_VERSION);
    });

    it("includes all required fields in persisted state", async () => {
      const response = await engine.handleEnqueue({
        type: "joiner",
        tenantId: "tenant-1",
        user: { id: "user-1" },
        entitlements: ["okta"],
        notifications: { channels: [], recipients: [] },
      });
      const { runId } = await response.json();
      const run = await storage.get<RunState>(`run:${runId}`);

      expect(run).toBeDefined();
      expect(run!.id).toBe(runId);
      expect(run!.type).toBe("joiner");
      expect(run!.status).toBe("completed");
      expect(run!.tenantId).toBe("tenant-1");
      expect(run!.userId).toBe("user-1");
      expect(run!.createdAt).toBeDefined();
      expect(run!.steps).toBeDefined();
      expect(run!.history).toBeDefined();
      expect(run!.context).toBeDefined();
      expect(typeof run!.alarmCount).toBe("number");
    });
  });

  // -----------------------------------------------------------------------
  // DO alarm-driven resumption
  // -----------------------------------------------------------------------

  describe("alarm-driven resumption", () => {
    it("alarm() increments alarmCount on the run", async () => {
      // Create a run that would be in a resumable state
      const response = await engine.handleEnqueue({
        type: "joiner",
        tenantId: "tenant-1",
        user: { id: "user-1" },
        entitlements: ["okta"],
        notifications: { channels: [], recipients: [] },
      });
      const { runId } = await response.json();

      // The run already completed, so alarm won't find a resumable run.
      // Manually set run to 'running' to simulate a crash-recovery scenario.
      const run = await storage.get<RunState>(`run:${runId}`);
      expect(run).toBeDefined();
      run!.status = "running";
      run!.alarmCount = 0;
      // Reset a step to pending so the alarm has work to do
      run!.steps[run!.steps.length - 1].status = "pending";
      run!.history = run!.history.filter(
        (h) => h.stepId !== run!.steps[run!.steps.length - 1].stepId,
      );
      await storage.put(`run:${runId}`, run);

      await engine.alarm();

      const resumed = await storage.get<RunState>(`run:${runId}`);
      expect(resumed?.alarmCount).toBeGreaterThanOrEqual(1);
      expect(resumed?.status).toBe("completed");
    });

    it("alarm() is a no-op when no resumable runs exist", async () => {
      // Complete a run first
      await engine.handleEnqueue({
        type: "joiner",
        tenantId: "tenant-1",
        user: { id: "user-1" },
        entitlements: ["okta"],
        notifications: { channels: [], recipients: [] },
      });

      // Alarm should do nothing for completed runs
      await engine.alarm();
      // No error thrown = success
    });
  });

  // -----------------------------------------------------------------------
  // Queue-based step execution
  // -----------------------------------------------------------------------

  describe("step execution", () => {
    it("executes all steps in order for a joiner workflow", async () => {
      const response = await engine.handleEnqueue({
        type: "joiner",
        tenantId: "tenant-1",
        user: { id: "user-1", email: "jane@example.com" },
        entitlements: ["okta", "github"],
        notifications: { channels: ["email"], recipients: ["it@example.com"] },
      });
      const { runId } = await response.json();
      const run = await storage.get<RunState>(`run:${runId}`);

      expect(run?.steps.every((s) => s.status === "completed")).toBe(true);
      expect(run?.history.map((h) => h.stepId)).toStrictEqual([
        "validate-profile",
        "provision-primary-account",
        "synchronize-access",
        "notify-stakeholders",
      ]);
    });

    it("records step output in history entries", async () => {
      const response = await engine.handleEnqueue({
        type: "joiner",
        tenantId: "tenant-1",
        user: { id: "user-42" },
        entitlements: ["okta"],
        notifications: { channels: [], recipients: [] },
      });
      const { runId } = await response.json();
      const run = await storage.get<RunState>(`run:${runId}`);

      const validateEntry = run?.history.find(
        (h) => h.stepId === "validate-profile",
      );
      expect(validateEntry?.output).toBeDefined();
      expect((validateEntry?.output as any)?.validated).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // DLQ behavior
  // -----------------------------------------------------------------------

  describe("DLQ after max_retries", () => {
    it("routes a failing step to DLQ after retries are exhausted", async () => {
      const response = await engine.handleEnqueue({
        type: "leaver",
        tenantId: "tenant-1",
        user: { id: "user-leave" },
        exit: { lastDay: "2025-08-31", equipment: [] },
        entitlements: ["okta"],
        notifications: { channels: [], recipients: [] },
        control: { failStep: "collect-artifacts" },
      });
      const { runId } = await response.json();
      const run = await storage.get<RunState>(`run:${runId}`);

      expect(run?.status).toBe("failed");

      const dlqEntries = await storage.list({ prefix: "dlq:" });
      expect(dlqEntries.size).toBe(1);

      const [dlqKey, dlqValue] = Array.from(dlqEntries.entries())[0];
      const dlq = dlqValue as DLQEntry;
      expect(dlq.runId).toBe(runId);
      expect(dlq.stepId).toBe("collect-artifacts");
      expect(dlq.attempts).toBe(DEFAULT_MAX_RETRIES);
      expect(dlq.lastError).toContain("injected_failure");
      expect(dlq.createdAt).toBeDefined();
    });

    it("stops execution at the failing step", async () => {
      const response = await engine.handleEnqueue({
        type: "leaver",
        tenantId: "tenant-1",
        user: { id: "user-leave" },
        exit: { lastDay: "2025-08-31", equipment: [] },
        entitlements: ["okta"],
        notifications: { channels: [], recipients: [] },
        control: { failStep: "collect-artifacts" },
      });
      const { runId } = await response.json();
      const run = await storage.get<RunState>(`run:${runId}`);

      // validate-profile succeeded, collect-artifacts failed, revoke-access and notify never ran
      const validateStep = run?.steps.find(
        (s) => s.stepId === "validate-profile",
      );
      expect(validateStep?.status).toBe("completed");

      const collectStep = run?.steps.find(
        (s) => s.stepId === "collect-artifacts",
      );
      expect(collectStep?.status).toBe("dlq");

      const revokeStep = run?.steps.find((s) => s.stepId === "revoke-access");
      expect(revokeStep?.status).toBe("pending");

      const notifyStep = run?.steps.find(
        (s) => s.stepId === "notify-stakeholders",
      );
      expect(notifyStep?.status).toBe("pending");
    });

    it("records all retry attempts in history before DLQ", async () => {
      const response = await engine.handleEnqueue({
        type: "leaver",
        tenantId: "tenant-1",
        user: { id: "user-leave" },
        exit: { lastDay: "2025-08-31", equipment: [] },
        entitlements: ["okta"],
        notifications: { channels: [], recipients: [] },
        control: { failStep: "collect-artifacts" },
      });
      const { runId } = await response.json();
      const run = await storage.get<RunState>(`run:${runId}`);

      const failedEntries = run?.history.filter(
        (h) => h.stepId === "collect-artifacts" && h.status === "failed",
      );
      // Should have DEFAULT_MAX_RETRIES failed attempts
      expect(failedEntries?.length).toBe(DEFAULT_MAX_RETRIES);

      // Plus one DLQ entry
      const dlqEntries = run?.history.filter(
        (h) => h.stepId === "collect-artifacts" && h.status === "dlq",
      );
      expect(dlqEntries?.length).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  describe("input validation", () => {
    it("rejects unknown workflow types", async () => {
      const response = await engine.handleEnqueue({
        type: "unknown",
        tenantId: "tenant-1",
      });
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("invalid_workflow_type");
    });

    it("rejects requests with no type", async () => {
      const response = await engine.handleEnqueue({ tenantId: "tenant-1" });
      expect(response.status).toBe(400);
    });
  });

  // -----------------------------------------------------------------------
  // Deterministic hashing
  // -----------------------------------------------------------------------

  describe("canonical JSON and hashing", () => {
    it("produces sorted-key JSON for deterministic hashing", () => {
      const a = canonicalJson({ z: 1, a: 2, m: 3 });
      const b = canonicalJson({ a: 2, m: 3, z: 1 });
      expect(a).toBe(b);
      expect(a).toBe('{"a":2,"m":3,"z":1}');
    });

    it("handles nested objects", () => {
      const result = canonicalJson({ b: { d: 1, c: 2 }, a: 3 });
      expect(result).toBe('{"a":3,"b":{"c":2,"d":1}}');
    });

    it("sha256Hex produces consistent hex digest", async () => {
      const hash1 = await sha256Hex("hello");
      const hash2 = await sha256Hex("hello");
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    });
  });
});

// ---------------------------------------------------------------------------
// Test suite: Platform Interfaces (testing adapters)
// ---------------------------------------------------------------------------

describe("Platform interface adapters", () => {
  describe("InMemoryQueueBus", () => {
    it("publishes and retrieves messages by queue name", async () => {
      const bus = new InMemoryQueueBus();
      await bus.publish("workflow-tasks", { step: "validate" });
      await bus.publish("dlq", { error: "timeout" });
      await bus.publish("workflow-tasks", { step: "provision" });

      expect(bus.getMessages("workflow-tasks").length).toBe(2);
      expect(bus.getMessages("dlq").length).toBe(1);
    });

    it("preserves delay options", async () => {
      const bus = new InMemoryQueueBus();
      await bus.publish("delayed-q", { msg: "retry" }, { delaySec: 30 });

      const msgs = bus.getMessages("delayed-q");
      expect(msgs[0].opts?.delaySec).toBe(30);
    });
  });

  describe("InMemoryWorkflowStateStore", () => {
    it("stores and retrieves run state", async () => {
      const store = new InMemoryWorkflowStateStore();
      const state = { id: "run-1", status: "running" };
      await store.putRun("run-1", state);

      const retrieved = await store.getRun("run-1");
      expect(retrieved).toEqual(state);
    });

    it("returns null for missing runs", async () => {
      const store = new InMemoryWorkflowStateStore();
      const result = await store.getRun("nonexistent");
      expect(result).toBeNull();
    });

    it("deep-clones stored state to prevent mutations", async () => {
      const store = new InMemoryWorkflowStateStore();
      const state = { id: "run-1", nested: { value: 1 } };
      await store.putRun("run-1", state);

      // Mutate the original
      state.nested.value = 999;

      const retrieved = (await store.getRun("run-1")) as typeof state;
      expect(retrieved.nested.value).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Test suite: Step Registry
// ---------------------------------------------------------------------------

describe("Step registry", () => {
  it("returns correct steps for joiner workflow", () => {
    const steps = getStepDefinitions("joiner");
    expect(steps.map((s) => s.id)).toStrictEqual([
      "validate-profile",
      "provision-primary-account",
      "synchronize-access",
      "notify-stakeholders",
    ]);
  });

  it("returns correct steps for mover workflow", () => {
    const steps = getStepDefinitions("mover");
    expect(steps.map((s) => s.id)).toStrictEqual([
      "validate-profile",
      "apply-role-change",
      "reconcile-entitlements",
      "notify-stakeholders",
    ]);
  });

  it("returns correct steps for leaver workflow", () => {
    const steps = getStepDefinitions("leaver");
    expect(steps.map((s) => s.id)).toStrictEqual([
      "validate-profile",
      "collect-artifacts",
      "revoke-access",
      "notify-stakeholders",
    ]);
  });

  it("throws for unknown workflow types", () => {
    expect(() => getStepDefinitions("unknown" as any)).toThrow(
      "Unknown workflow type",
    );
  });
});
