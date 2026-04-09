import { describe, it, expect } from "vitest";
import { diffPolicies } from "../policy-diff";

describe("diffPolicies", () => {
  it("returns all unchanged for identical texts", () => {
    const text = "Line one\nLine two\nLine three";
    const result = diffPolicies(text, text);

    expect(result).toHaveLength(3);
    expect(result.every((d) => d.type === "unchanged")).toBe(true);
  });

  it("detects added lines", () => {
    const existing = "Line one\nLine two";
    const generated = "Line one\nNew line\nLine two";
    const result = diffPolicies(existing, generated);

    const added = result.filter((d) => d.type === "added");
    expect(added.length).toBeGreaterThanOrEqual(1);
    expect(added.some((d) => d.content === "New line")).toBe(true);
  });

  it("detects removed lines", () => {
    const existing = "Line one\nOld line\nLine three";
    const generated = "Line one\nLine three";
    const result = diffPolicies(existing, generated);

    const removed = result.filter((d) => d.type === "removed");
    expect(removed.length).toBeGreaterThanOrEqual(1);
    expect(removed.some((d) => d.content === "Old line")).toBe(true);
  });

  it("handles empty existing text (all added)", () => {
    const result = diffPolicies("", "New content\nMore content");

    const added = result.filter((d) => d.type === "added");
    expect(added.length).toBeGreaterThanOrEqual(1);
  });

  it("handles empty generated text (all removed)", () => {
    const result = diffPolicies("Old content\nMore old", "");

    const removed = result.filter((d) => d.type === "removed");
    expect(removed.length).toBeGreaterThanOrEqual(1);
  });

  it("assigns sequential line numbers", () => {
    const existing = "A\nB\nC";
    const generated = "A\nX\nC";
    const result = diffPolicies(existing, generated);

    for (let i = 0; i < result.length; i++) {
      expect(result[i].lineNumber).toBe(i + 1);
    }
  });
});
