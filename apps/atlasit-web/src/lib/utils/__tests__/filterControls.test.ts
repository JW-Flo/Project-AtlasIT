import { describe, it, expect } from "vitest";
import { filterControls } from "../filterControls";

describe("filterControls", () => {
  const items = [
    { key: "AC-1", name: "Access Control Policy" },
    { key: "AC-2", name: "Account Management" },
    { key: "IR-1", name: "Incident Response Policy" },
  ];
  it("returns all with empty query", () => {
    expect(filterControls(items, "")).toHaveLength(3);
  });
  it("filters by key", () => {
    expect(filterControls(items, "AC-1")).toHaveLength(1);
  });
  it("filters by substring in name", () => {
    expect(filterControls(items, "incident")).toHaveLength(1);
  });
});
