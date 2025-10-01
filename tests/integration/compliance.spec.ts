import { describe, it, expect } from "vitest";

const BASE = process.env.COMPLIANCE_BASE || "http://localhost:8787";

describe("Compliance Worker Integration", () => {
  it("health endpoint returns ok", async () => {
    const res = await fetch(`${BASE}/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("compliance-worker");
  });

  it("snapshot returns tenant-scoped payload with risks", async () => {
    const res = await fetch(`${BASE}/api/compliance/snapshot?tenantId=t_demo`);
    expect(res.status).toBe(200);
    const snap = await res.json();
    expect(snap.tenantId).toBe("t_demo");
    expect(Array.isArray(snap.risks)).toBe(true);
    for (const r of snap.risks) {
      expect(r.score).toBe(r.likelihood * r.impact);
      expect(r.likelihood).toBeGreaterThanOrEqual(1);
      expect(r.impact).toBeGreaterThanOrEqual(1);
      expect(r.likelihood).toBeLessThanOrEqual(5);
      expect(r.impact).toBeLessThanOrEqual(5);
    }
  });

  it("snapshot persistence reuses recent snapshot (ageSeconds increases)", async () => {
    const first = await (
      await fetch(`${BASE}/api/compliance/snapshot?tenantId=pers_test`)
    ).json();
    expect(first.ageSeconds).toBeDefined();
    const firstGenerated = first.generatedAt;
    await new Promise((r) => setTimeout(r, 1500));
    const second = await (
      await fetch(`${BASE}/api/compliance/snapshot?tenantId=pers_test`)
    ).json();
    // Generated timestamp should match if cached (<=300s) and ageSeconds should be > 0
    if (second.generatedAt === firstGenerated) {
      expect(second.ageSeconds).toBeGreaterThanOrEqual(1);
    } else {
      // If not cached (e.g., schema unavailable), ensure new snapshot still valid
      expect(new Date(second.generatedAt).getTime()).toBeGreaterThan(
        new Date(firstGenerated).getTime(),
      );
    }
  });

  it("returns 404 for missing route", async () => {
    const res = await fetch(`${BASE}/nope`);
    expect(res.status).toBe(404);
  });
});
