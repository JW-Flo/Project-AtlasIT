import { describe, it, expect } from "vitest";
import { relativeTime, robustRelativeTime } from "../relativeTime";

describe("relativeTime basic", () => {
  it("returns just now for very recent", () => {
    const now = Date.now();
    expect(relativeTime(now)).toBe("just now");
  });
});

describe("robustRelativeTime", () => {
  it("handles future", () => {
    const now = new Date();
    const future = new Date(now.getTime() + 30_000);
    const txt = robustRelativeTime(future, now);
    expect(txt.includes("in") || txt === "soon").toBe(true);
  });
});
