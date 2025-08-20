import { describe, it, expect } from "vitest";
// Negative test: unsupported industry should be rejected with 400
// Assumes worker validates industry list (simulate expected future behavior)
describe("Onboarding - Unsupported Industry", () => {
  it("returns 400 for unsupported industry", async () => {
    const request = new Request("https://example.com/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: "t-unsupported",
        name: "Bad Co",
        industry: "UnknownIndustry",
      }),
    });
    const statePut = async () => {};
    const stateGet = async () => null;
    const stateDelete = async () => {};
    const stateList = async () => ({ keys: [], list_complete: true });
    const stateGetWithMetadata = async () => ({ value: null, metadata: null });
    const dbRun = async () => {};
    const dbBind = () => ({ run: dbRun });
    const dbPrepare = () => ({ bind: dbBind });
    const env = {
      STATE: {
        put: statePut,
        get: stateGet,
        delete: stateDelete,
        list: stateList,
        getWithMetadata: stateGetWithMetadata,
      },
      DB: { prepare: dbPrepare },
      AI_API_KEY: "test-key",
    };
    const mod = await import("./index");
    const res = await mod.default.fetch(request, env);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("ONB-002");
    expect(body.error.message).toBe("Unsupported industry");
    expect(Array.isArray(body.error.details)).toBe(true);
  });
});
//# sourceMappingURL=unsupported-industry.test.js.map
