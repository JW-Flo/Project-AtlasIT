import { describe, it, expect, vi, beforeEach } from "vitest";
import { evaluateControls } from "../cdt-rules";

/**
 * Mock D1Database that returns configurable evidence rows.
 * Tests that adapter evidence pass/fail status correctly affects control scoring.
 */
function createMockDb(options: {
  evidenceRows?: Array<{ control_id: string; cnt: number; last_at: string | null }>;
  verifiedRows?: Array<{ control_id: string; verified_at: string }>;
  adapterRows?: Array<{ control_id: string; metadata: string; created_at: string }>;
}) {
  const { evidenceRows = [], verifiedRows = [], adapterRows = [] } = options;

  return {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        all: vi.fn().mockImplementation(async () => {
          // The function is called 3 times in sequence via Promise.all:
          // 1. Evidence counts
          // 2. Verified attestations
          // 3. Adapter evidence (new)
          return { results: [] };
        }),
      }),
    }),
    batch: vi.fn(),
  };
}

// Helper to build a mock DB that returns specific results for the 3 parallel queries
function buildMockDb(
  evidenceRows: Array<{ control_id: string; cnt: number; last_at: string | null }>,
  verifiedRows: Array<{ control_id: string; verified_at: string }>,
  adapterRows: Array<{ control_id: string; metadata: string; created_at: string }>,
) {
  let callCount = 0;
  const results = [{ results: evidenceRows }, { results: verifiedRows }, { results: adapterRows }];

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

describe("evaluateControls with adapter evidence", () => {
  const recentDate = new Date(Date.now() - 5 * 86_400_000).toISOString(); // 5 days ago
  const oldDate = new Date(Date.now() - 60 * 86_400_000).toISOString(); // 60 days ago

  it("caps status at in_progress when latest adapter evidence fails", async () => {
    const db = buildMockDb(
      // Evidence rows: recent evidence exists for CC6.1
      [{ control_id: "CC6.1", cnt: 3, last_at: recentDate }],
      // No verification attestations
      [],
      // Adapter evidence: latest says fail
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
    // Should be capped at in_progress because adapter says fail
    expect(cc61!.status).toBe("in_progress");
  });

  it("allows implemented status when adapter evidence passes", async () => {
    const db = buildMockDb(
      [{ control_id: "CC6.1", cnt: 3, last_at: recentDate }],
      [],
      [
        {
          control_id: "CC6.1",
          metadata: JSON.stringify({ status: "pass" }),
          created_at: recentDate,
        },
      ],
    );

    const results = await evaluateControls(db, "tenant-1", "SOC2");
    const cc61 = results.find((r) => r.controlId === "CC6.1");
    expect(cc61).toBeDefined();
    expect(cc61!.status).toBe("implemented");
  });

  it("keeps verified status even when adapter evidence fails (verification trumps)", async () => {
    const db = buildMockDb(
      [{ control_id: "CC6.1", cnt: 5, last_at: recentDate }],
      [{ control_id: "CC6.1", verified_at: recentDate }],
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
    // Verification attestation should still trump adapter failure
    expect(cc61!.status).toBe("verified");
  });

  it("treats unknown adapter status as neutral (no cap)", async () => {
    const db = buildMockDb(
      [{ control_id: "CC6.1", cnt: 2, last_at: recentDate }],
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

  it("handles controls with no adapter evidence gracefully", async () => {
    const db = buildMockDb(
      [{ control_id: "CC6.1", cnt: 2, last_at: recentDate }],
      [],
      [], // No adapter evidence at all
    );

    const results = await evaluateControls(db, "tenant-1", "SOC2");
    const cc61 = results.find((r) => r.controlId === "CC6.1");
    expect(cc61).toBeDefined();
    expect(cc61!.status).toBe("implemented");
  });
});
