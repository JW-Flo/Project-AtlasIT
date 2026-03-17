import { describe, it, expect, beforeEach } from "vitest";
import { AutomationDO } from "../ai-orchestrator/src/automation/automation-do";

// Minimal in-memory DurableObjectState mock
function createMockState(): DurableObjectState {
  const storage = new Map<string, unknown>();
  return {
    storage: {
      get: async (key: string) => storage.get(key),
      put: async (key: string, value: unknown) => {
        storage.set(key, value);
      },
      delete: async (key: string) => storage.delete(key),
      list: async () => storage,
    },
    id: { toString: () => "test-id" },
    waitUntil: () => {},
  } as unknown as DurableObjectState;
}

function createDO(): AutomationDO {
  return new AutomationDO(createMockState());
}

async function check(
  dobj: AutomationDO,
  body: {
    ruleId: string;
    dedupKey?: string;
    cooldownMs?: number;
    maxPerWindow?: number;
  },
) {
  const res = await dobj.fetch(
    new Request("http://automation/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return res.json() as Promise<{
    allowed: boolean;
    reason?: string;
    ruleId: string;
  }>;
}

async function record(
  dobj: AutomationDO,
  body: { ruleId: string; dedupKey?: string },
) {
  const res = await dobj.fetch(
    new Request("http://automation/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return res.json() as Promise<{ recorded: boolean }>;
}

async function stats(dobj: AutomationDO) {
  const res = await dobj.fetch(
    new Request("http://automation/stats", { method: "GET" }),
  );
  return res.json() as Promise<Record<string, unknown>>;
}

async function reset(dobj: AutomationDO) {
  const res = await dobj.fetch(
    new Request("http://automation/reset", { method: "POST" }),
  );
  return res.json() as Promise<{ reset: boolean }>;
}

describe("AutomationDO", () => {
  let dobj: AutomationDO;

  beforeEach(() => {
    dobj = createDO();
  });

  it("allows first execution of a rule", async () => {
    const result = await check(dobj, { ruleId: "rule-1" });
    expect(result.allowed).toBe(true);
    expect(result.ruleId).toBe("rule-1");
  });

  it("blocks duplicate events via dedup key", async () => {
    await record(dobj, { ruleId: "rule-1", dedupKey: "event-abc" });

    const result = await check(dobj, {
      ruleId: "rule-1",
      dedupKey: "event-abc",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("duplicate_event");
  });

  it("allows different dedup keys", async () => {
    await record(dobj, { ruleId: "rule-1", dedupKey: "event-1" });

    const result = await check(dobj, {
      ruleId: "rule-1",
      dedupKey: "event-2",
      cooldownMs: 0,
    });
    expect(result.allowed).toBe(true);
  });

  it("enforces cooldown after execution", async () => {
    await record(dobj, { ruleId: "rule-1" });

    const result = await check(dobj, {
      ruleId: "rule-1",
      cooldownMs: 60000, // 1 minute cooldown
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("cooldown_active");
  });

  it("allows execution when cooldown is 0", async () => {
    await record(dobj, { ruleId: "rule-1" });

    const result = await check(dobj, {
      ruleId: "rule-1",
      cooldownMs: 0,
    });
    expect(result.allowed).toBe(true);
  });

  it("enforces rate limit per window", async () => {
    // Record 3 executions
    await record(dobj, { ruleId: "rule-1" });
    await record(dobj, { ruleId: "rule-1" });
    await record(dobj, { ruleId: "rule-1" });

    // Check with max 3 per window — should be blocked
    const result = await check(dobj, {
      ruleId: "rule-1",
      maxPerWindow: 3,
      cooldownMs: 0, // disable cooldown for this test
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("rate_limit_exceeded");
  });

  it("allows execution below rate limit", async () => {
    await record(dobj, { ruleId: "rule-1" });

    const result = await check(dobj, {
      ruleId: "rule-1",
      maxPerWindow: 10,
      cooldownMs: 0,
    });
    expect(result.allowed).toBe(true);
  });

  it("returns stats", async () => {
    await record(dobj, { ruleId: "rule-1", dedupKey: "key-1" });
    await record(dobj, { ruleId: "rule-2" });

    const s = await stats(dobj);
    expect(s.ruleCounts).toEqual({ "rule-1": 1, "rule-2": 1 });
    expect(s.dedupKeysActive).toBe(1);
  });

  it("resets state", async () => {
    await record(dobj, { ruleId: "rule-1" });
    await reset(dobj);

    const s = await stats(dobj);
    expect(s.ruleCounts).toEqual({});
    expect(s.dedupKeysActive).toBe(0);
  });

  it("returns 404 for unknown paths", async () => {
    const res = await dobj.fetch(
      new Request("http://automation/unknown", { method: "GET" }),
    );
    expect(res.status).toBe(404);
  });

  it("records execution details", async () => {
    const result = await record(dobj, { ruleId: "rule-1" });
    expect(result.recorded).toBe(true);
  });

  it("tracks separate rate limits per rule", async () => {
    await record(dobj, { ruleId: "rule-1" });
    await record(dobj, { ruleId: "rule-1" });

    // rule-1 has 2 executions, rule-2 has 0
    const r1 = await check(dobj, {
      ruleId: "rule-1",
      maxPerWindow: 2,
      cooldownMs: 0,
    });
    expect(r1.allowed).toBe(false);

    const r2 = await check(dobj, {
      ruleId: "rule-2",
      maxPerWindow: 2,
      cooldownMs: 0,
    });
    expect(r2.allowed).toBe(true);
  });
});
