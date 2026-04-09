import { describe, it, expect, vi } from "vitest";
import { evaluateControls } from "../cdt-rules";

/**
 * Build a mock D1Database that returns specific results for the 4 parallel queries
 * in evaluateControls(): evidence, verified, adapter, policy evaluation.
 */
function buildMockDb(
  evidenceRows: Array<{ control_id: string; cnt: number; last_at: string | null }>,
  verifiedRows: Array<{ control_id: string; verified_at: string }>,
  adapterRows: Array<{ control_id: string; metadata: string; created_at: string }>,
  policyRows: Array<{ control_id: string; metadata: string; created_at: string }>,
) {
  let callCount = 0;
  const results = [
    { results: evidenceRows },
    { results: verifiedRows },
    { results: adapterRows },
    { results: policyRows },
  ];

  const mockAll = vi.fn().mockImplementation(async () => {
    const idx = callCount;
    callCount++;
    return results[idx] ?? { results: [] };
  });

  return {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        all: mockAll,
      }),
    }),
  } as unknown as D1Database;
}

describe("evaluateControls with policy evaluation evidence", () => {
  const recentDate = new Date(Date.now() - 5 * 86_400_000).toISOString(); // 5 days ago

  it("caps status at in_progress when policy evaluation fails", async () => {
    const db = buildMockDb(
      [{ control_id: "CC6.1", cnt: 3, last_at: recentDate }],
      [],
      [], // no adapter evidence
      [
        {
          control_id: "CC6.1",
          metadata: JSON.stringify({
            status: "fail",
            rationale: ["Least-privilege policy not enforced"],
          }),
          created_at: recentDate,
        },
      ],
    );

    const results = await evaluateControls(db, "tenant-1", "SOC2");
    const cc61 = results.find((r) => r.controlId === "CC6.1");
    expect(cc61).toBeDefined();
    expect(cc61!.status).toBe("in_progress");
  });

  it("allows implemented status when policy evaluation passes", async () => {
    const db = buildMockDb(
      [{ control_id: "CC6.1", cnt: 3, last_at: recentDate }],
      [],
      [],
      [
        {
          control_id: "CC6.1",
          metadata: JSON.stringify({
            status: "pass",
            rationale: ["Least-privilege access policy enforced"],
          }),
          created_at: recentDate,
        },
      ],
    );

    const results = await evaluateControls(db, "tenant-1", "SOC2");
    const cc61 = results.find((r) => r.controlId === "CC6.1");
    expect(cc61).toBeDefined();
    expect(cc61!.status).toBe("implemented");
  });

  it("verification attestation trumps policy evaluation failure", async () => {
    const db = buildMockDb(
      [{ control_id: "CC6.1", cnt: 5, last_at: recentDate }],
      [{ control_id: "CC6.1", verified_at: recentDate }],
      [],
      [
        {
          control_id: "CC6.1",
          metadata: JSON.stringify({ status: "fail" }),
          created_at: recentDate,
        },
      ],
    );

    const results = await evaluateControls(db, "tenant-1", "SOC2");
    const cc61 = results.find((r) => r.controlId === "CC6.1");
    expect(cc61).toBeDefined();
    expect(cc61!.status).toBe("verified");
  });

  it("both adapter and policy fail still caps at in_progress", async () => {
    const db = buildMockDb(
      [{ control_id: "CC6.1", cnt: 3, last_at: recentDate }],
      [],
      [
        {
          control_id: "CC6.1",
          metadata: JSON.stringify({ status: "fail" }),
          created_at: recentDate,
        },
      ],
      [
        {
          control_id: "CC6.1",
          metadata: JSON.stringify({ status: "fail" }),
          created_at: recentDate,
        },
      ],
    );

    const results = await evaluateControls(db, "tenant-1", "SOC2");
    const cc61 = results.find((r) => r.controlId === "CC6.1");
    expect(cc61).toBeDefined();
    expect(cc61!.status).toBe("in_progress");
  });

  it("handles controls with no policy evaluation evidence gracefully", async () => {
    const db = buildMockDb(
      [{ control_id: "CC6.1", cnt: 2, last_at: recentDate }],
      [],
      [],
      [], // no policy eval evidence
    );

    const results = await evaluateControls(db, "tenant-1", "SOC2");
    const cc61 = results.find((r) => r.controlId === "CC6.1");
    expect(cc61).toBeDefined();
    expect(cc61!.status).toBe("implemented");
  });

  it("policy eval unknown status is neutral (no cap)", async () => {
    const db = buildMockDb(
      [{ control_id: "CC6.1", cnt: 2, last_at: recentDate }],
      [],
      [],
      [
        {
          control_id: "CC6.1",
          metadata: JSON.stringify({ status: "unknown" }),
          created_at: recentDate,
        },
      ],
    );

    const results = await evaluateControls(db, "tenant-1", "SOC2");
    const cc61 = results.find((r) => r.controlId === "CC6.1");
    expect(cc61).toBeDefined();
    expect(cc61!.status).toBe("implemented");
  });
});
