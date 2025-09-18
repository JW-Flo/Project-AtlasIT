import { describe, expect, it } from "vitest";
import worker from "../index.js";

const url = "https://atlasit.test/api/connectors";

describe("connectors API", () => {
  it("returns an empty list when feature flags are disabled", async () => {
    const response = await worker.fetch(new Request(url), {} as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.adapters).toEqual([]);
  });

  it("returns flagged adapters when enabled", async () => {
    const env = { FEATURE_CONNECTOR_EXAMPLE_HR_SUITE: "1" } as any;
    const response = await worker.fetch(new Request(url), env);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.adapters)).toBe(true);
    expect(body.adapters[0]?.slug).toBe("example-hr-suite");
  });
});
