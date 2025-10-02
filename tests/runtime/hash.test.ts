import { describe, expect, it } from "vitest";
import { hashStrings } from "../../src/runtime/util/hash";

describe("hashStrings", () => {
  it("produces stable hash regardless of order", () => {
    const left = hashStrings(["a", "b", "c"]);
    const right = hashStrings(["c", "b", "a"]);

    expect(left).toBe(right);
  });

  it("produces different hashes for different values", () => {
    const base = hashStrings(["a", "b", "c"]);
    const variant = hashStrings(["a", "b", "d"]);

    expect(base).not.toBe(variant);
  });

  it("handles empty input", () => {
    expect(hashStrings([])).toBe(hashStrings([]));
  });
});
