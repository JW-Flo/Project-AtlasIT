import { describe, expect, it, vi } from "vitest";
import { CloudflareQueueBus } from "../packages/shared/src/platform/cloudflare/queue-bus.js";
import { CloudflareWorkflowStateStore } from "../packages/shared/src/platform/cloudflare/workflow-state-store.js";

// ---------------------------------------------------------------------------
// CloudflareQueueBus
// ---------------------------------------------------------------------------

describe("CloudflareQueueBus", () => {
  it("delegates publish to the correct queue producer", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const bus = new CloudflareQueueBus({
      "workflow-tasks": { send },
    });

    await bus.publish("workflow-tasks", { step: "validate" });

    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith(
      { step: "validate" },
      { delaySeconds: undefined },
    );
  });

  it("passes delaySec as delaySeconds to the CF producer", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const bus = new CloudflareQueueBus({
      "delayed-q": { send },
    });

    await bus.publish("delayed-q", { msg: "retry" }, { delaySec: 60 });

    expect(send).toHaveBeenCalledWith({ msg: "retry" }, { delaySeconds: 60 });
  });

  it("throws when publishing to an unbound queue", async () => {
    const bus = new CloudflareQueueBus({});

    await expect(bus.publish("nonexistent", { msg: "test" })).rejects.toThrow(
      "Queue not bound: nonexistent",
    );
  });
});

// ---------------------------------------------------------------------------
// CloudflareWorkflowStateStore
// ---------------------------------------------------------------------------

describe("CloudflareWorkflowStateStore", () => {
  it("stores and retrieves run state via DO storage", async () => {
    const data = new Map<string, unknown>();
    const storage = {
      get: vi.fn(async (key: string) => data.get(key)),
      put: vi.fn(async (key: string, value: unknown) => {
        data.set(key, value);
      }),
    };

    const store = new CloudflareWorkflowStateStore(storage);

    const state = { id: "run-1", status: "running" };
    await store.putRun("run-1", state);
    expect(storage.put).toHaveBeenCalledWith("run:run-1", state);

    const result = await store.getRun("run-1");
    expect(result).toEqual(state);
  });

  it("returns null for missing runs", async () => {
    const storage = {
      get: vi.fn(async () => undefined),
      put: vi.fn(),
    };

    const store = new CloudflareWorkflowStateStore(storage);
    const result = await store.getRun("nonexistent");
    expect(result).toBeNull();
  });
});
