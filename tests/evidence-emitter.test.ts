import { beforeEach, describe, expect, it } from "vitest";
import { EvidenceEmitter } from "../packages/shared/src/workflow/evidence-emitter";
import type {
  EvidenceStore,
  EvidenceWriteResult,
  EvidenceReadResult,
} from "../packages/shared/src/platform/interfaces";
import type {
  StepState,
  RunState,
  EvidenceEnvelope,
} from "../packages/shared/src/workflow/types";
import { canonicalize, sha256Hex } from "../src/lib/canonical-json";

// ---------------------------------------------------------------------------
// In-memory EvidenceStore for testing
// ---------------------------------------------------------------------------
class InMemoryEvidenceStore implements EvidenceStore {
  readonly store = new Map<string, string>();
  putCalls = 0;

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async put(
    tenantId: string,
    runId: string,
    stepId: string,
    hash: string,
    body: string,
  ): Promise<EvidenceWriteResult> {
    this.putCalls++;
    const uri = `evidence/${tenantId}/${runId}/${stepId}/${hash}.json`;
    if (this.store.has(hash)) {
      return { key: hash, uri, alreadyExists: true };
    }
    this.store.set(hash, body);
    return { key: hash, uri, alreadyExists: false };
  }

  async get(key: string): Promise<EvidenceReadResult | null> {
    const body = this.store.get(key);
    return body ? { body } : null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeStep(overrides: Partial<StepState> = {}): StepState {
  return {
    stepId: "validate-profile",
    action: "validate",
    status: "completed",
    attempts: 1,
    startedAt: "2026-01-15T10:00:00.000Z",
    completedAt: "2026-01-15T10:00:01.000Z",
    durationMs: 1000,
    ...overrides,
  };
}

function makeRun(overrides: Partial<RunState> = {}): RunState {
  return {
    id: "run-abc-123",
    type: "joiner",
    status: "completed",
    tenantId: "tenant-1",
    actor: "system",
    createdAt: "2026-01-15T10:00:00.000Z",
    completedAt: "2026-01-15T10:00:05.000Z",
    steps: [makeStep()],
    context: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("EvidenceEmitter", () => {
  let store: InMemoryEvidenceStore;
  let emitter: EvidenceEmitter;

  beforeEach(() => {
    store = new InMemoryEvidenceStore();
    emitter = new EvidenceEmitter(store);
  });

  it("every step produces an evidence URI", async () => {
    const run = makeRun();
    const step = run.steps[0];

    const result = await emitter.emit(run, step);

    expect(result.uri).toMatch(
      /^evidence\/tenant-1\/run-abc-123\/validate-profile\/[a-f0-9]{64}\.json$/,
    );
    expect(result.key).toMatch(/^[a-f0-9]{64}$/);
    expect(result.alreadyExists).toBe(false);
  });

  it("evidence is content-addressed (same input = same hash = no duplicate write)", async () => {
    const run = makeRun();
    const step = run.steps[0];

    const first = await emitter.emit(run, step);
    const second = await emitter.emit(run, step);

    expect(first.key).toBe(second.key);
    expect(second.alreadyExists).toBe(true);
    // Only one actual object in the store
    expect(store.store.size).toBe(1);
  });

  it("replays are idempotent", async () => {
    const run = makeRun();
    const step = run.steps[0];

    // Simulate three replays of the same step
    await emitter.emit(run, step);
    await emitter.emit(run, step);
    const third = await emitter.emit(run, step);

    expect(third.alreadyExists).toBe(true);
    expect(store.store.size).toBe(1);
    // put was called 3 times but only 1 write
    expect(store.putCalls).toBe(3);
  });

  it("evidence envelope validates required fields", async () => {
    const run = makeRun();
    const step = run.steps[0];

    await emitter.emit(run, step);

    const [, body] = [...store.store.entries()][0];
    const envelope: EvidenceEnvelope = JSON.parse(body);

    expect(envelope.tenantId).toBe("tenant-1");
    expect(envelope.workflowRunId).toBe("run-abc-123");
    expect(envelope.stepId).toBe("validate-profile");
    expect(envelope.actor).toBe("system");
    expect(envelope.eventType).toBe("step.completed");
    expect(envelope.createdAt).toBeDefined();
    expect(envelope.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("hash equals sha256(canonical_json(envelope_without_hash))", async () => {
    const run = makeRun();
    const step = run.steps[0];

    await emitter.emit(run, step);

    const [hash, body] = [...store.store.entries()][0];
    const envelope: EvidenceEnvelope = JSON.parse(body);

    // Recompute: remove hash, canonicalize, sha256
    const { hash: _removed, ...withoutHash } = envelope;
    const canonical = canonicalize(withoutHash);
    const expected = await sha256Hex(canonical);

    expect(envelope.hash).toBe(expected);
    expect(hash).toBe(expected);
  });

  it("missing tenantId is rejected", async () => {
    const run = makeRun({ tenantId: "" });
    const step = run.steps[0];

    await expect(emitter.emit(run, step)).rejects.toThrow(/tenantId/i);
  });

  it("emits step.failed eventType on failure", async () => {
    const run = makeRun({ status: "failed" });
    const failedStep = makeStep({
      status: "failed",
      error: "Connection refused",
    });

    await emitter.emit(run, failedStep);

    const [, body] = [...store.store.entries()][0];
    const envelope: EvidenceEnvelope = JSON.parse(body);

    expect(envelope.eventType).toBe("step.failed");
    expect(envelope.outcome).toBe("failure");
    expect(envelope.error).toBe("Connection refused");
  });

  it("includes artifacts when provided", async () => {
    const run = makeRun();
    const step = run.steps[0];

    const result = await emitter.emit(run, step, {
      artifacts: [
        {
          kind: "policy-decision",
          uri: "evidence/tenant-1/run-abc-123/validate-profile/decision.json",
          sha256: "a".repeat(64),
        },
      ],
    });

    const stored = store.store.get(result.key)!;
    const envelope: EvidenceEnvelope = JSON.parse(stored);

    expect(envelope.artifacts).toHaveLength(1);
    expect(envelope.artifacts![0].kind).toBe("policy-decision");
  });

  it("includes policy context when provided", async () => {
    const run = makeRun();
    const step = run.steps[0];

    const result = await emitter.emit(run, step, {
      policy: {
        bundleRevision: "v1.2.3",
        decisionId: "dec-001",
        query: "data.jml.allow",
      },
    });

    const stored = store.store.get(result.key)!;
    const envelope: EvidenceEnvelope = JSON.parse(stored);

    expect(envelope.policy?.bundleRevision).toBe("v1.2.3");
    expect(envelope.policy?.decisionId).toBe("dec-001");
    expect(envelope.policy?.query).toBe("data.jml.allow");
  });

  it("different steps produce different hashes", async () => {
    const run = makeRun({
      steps: [
        makeStep({ stepId: "step-a" }),
        makeStep({ stepId: "step-b" }),
      ],
    });

    const resultA = await emitter.emit(run, run.steps[0]);
    const resultB = await emitter.emit(run, run.steps[1]);

    expect(resultA.key).not.toBe(resultB.key);
    expect(store.store.size).toBe(2);
  });

  it("includes durationMs from step state", async () => {
    const run = makeRun();
    const step = makeStep({ durationMs: 2500 });

    await emitter.emit(run, step);

    const [, body] = [...store.store.entries()][0];
    const envelope: EvidenceEnvelope = JSON.parse(body);
    expect(envelope.durationMs).toBe(2500);
  });
});
