import { describe, expect, beforeEach, it, vi } from "vitest";
import {
  buildSnapshot,
  find,
  getSnapshot,
  initRegistry,
  list,
  register,
} from "../../src/runtime/registry/registry";
import type { RegisteredItem } from "../../src/runtime/registry/types";

describe("runtime registry", () => {
  const sampleScan: RegisteredItem = {
    id: "scan-alpha",
    kind: "scan",
    version: "1.0.0",
  };
  const sampleApi: RegisteredItem = { id: "api-users", kind: "api" };
  const sampleJob: RegisteredItem = {
    id: "nightly",
    kind: "job",
    deps: ["scan-alpha"],
  };

  beforeEach(() => {
    initRegistry();
    vi.restoreAllMocks();
  });

  it("registers items and builds immutable snapshot", () => {
    register(sampleScan);
    register(sampleApi);

    const snapshot = buildSnapshot();

    expect(snapshot.version).toBe(1);
    expect(Object.isFrozen(snapshot.items)).toBe(true);
    expect(Object.isFrozen(snapshot.counts)).toBe(true);
    expect(snapshot.counts.scan).toBe(1);
    expect(snapshot.counts.api).toBe(1);
    expect(snapshot.counts.job).toBe(0);
    expect(list().length).toBe(2);
    expect(list("scan").map((item) => item.id)).toEqual(["scan-alpha"]);
  });

  it("prevents duplicate registrations by id and kind", () => {
    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    register(sampleScan);
    register({ ...sampleScan });

    const snapshot = buildSnapshot();

    expect(snapshot.counts.scan).toBe(1);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("increments version with each snapshot build", () => {
    register(sampleScan);
    const first = buildSnapshot();
    const second = buildSnapshot();

    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
  });

  it("supports initialization with seed data", () => {
    initRegistry([sampleScan, sampleJob]);
    const snapshot = getSnapshot();

    expect(snapshot.counts.scan).toBe(1);
    expect(snapshot.counts.job).toBe(1);
    expect(find("job", "nightly")).toBeDefined();
  });

  it("returns cached snapshot until mutated", () => {
    register(sampleScan);
    const initial = getSnapshot();

    register(sampleApi);
    const afterMutation = getSnapshot();

    expect(afterMutation.version).toBeGreaterThan(initial.version);
    expect(list().length).toBe(2);
  });

  it("ensures list returns copy", () => {
    register(sampleScan);
    const snapshot = getSnapshot();
    const items = list();

    expect(items).not.toBe(snapshot.items);
    expect(() => {
      (snapshot.items as RegisteredItem[]).push(sampleApi);
    }).toThrow();
  });
});
