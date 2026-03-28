import { describe, it, expect } from "vitest";
import {
  enforceRetentionPolicy,
  isEvidenceDeletionAllowed,
  type RetentionResult,
} from "../retention";

// ── Mock D1 helpers ──────────────────────────────────────────────────────────

function createMockDb(rows: Record<string, unknown>[] = []) {
  const allResults = { results: rows };
  return {
    prepare: () => ({
      bind: () => ({
        all: async () => allResults,
        first: async () => rows[0] ?? null,
        run: async () => ({ success: true }),
      }),
    }),
    batch: async (stmts: unknown[]) => stmts.map(() => ({ success: true })),
  } as unknown as D1Database;
}

function createMockBucket() {
  return {} as unknown as R2Bucket;
}

const TENANT = "tenant-retention-test";

describe("enforceRetentionPolicy", () => {
  it("does not mark evidence younger than retention threshold", async () => {
    // Empty result set = no evidence older than threshold found
    const db = createMockDb([]);

    const result = await enforceRetentionPolicy(
      db,
      createMockBucket(),
      TENANT,
      90, // 90-day retention
    );

    expect(result.markedForDeletion).toBe(0);
    expect(result.protected).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it("marks evidence older than retention threshold for soft-delete", async () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000); // 120 days ago

    // First call returns old evidence, second call (active control check) returns empty
    let callCount = 0;
    const db = {
      prepare: () => ({
        bind: () => ({
          all: async () => {
            callCount++;
            if (callCount === 1) {
              return {
                results: [
                  {
                    id: "ev-old",
                    tenant_id: TENANT,
                    created_at: oldDate.toISOString(),
                    framework: "SOC2",
                    control_id: "CC6.1",
                  },
                ],
              };
            }
            // No active control references
            return { results: [] };
          },
          first: async () => null,
          run: async () => ({ success: true }),
        }),
      }),
      batch: async (stmts: unknown[]) => stmts.map(() => ({ success: true })),
    } as unknown as D1Database;

    const result = await enforceRetentionPolicy(
      db,
      createMockBucket(),
      TENANT,
      90,
    );

    expect(result.markedForDeletion).toBe(1);
  });

  it("protects evidence referenced by active compliance controls", async () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);

    let callCount = 0;
    const db = {
      prepare: () => ({
        bind: () => ({
          all: async () => {
            callCount++;
            if (callCount === 1) {
              return {
                results: [
                  {
                    id: "ev-protected",
                    tenant_id: TENANT,
                    created_at: oldDate.toISOString(),
                    framework: "SOC2",
                    control_id: "CC6.1",
                  },
                ],
              };
            }
            // Active control reference exists
            return {
              results: [{ control_id: "CC6.1", status: "implemented" }],
            };
          },
          first: async () => ({ cnt: 1 }),
          run: async () => ({ success: true }),
        }),
      }),
      batch: async (stmts: unknown[]) => stmts.map(() => ({ success: true })),
    } as unknown as D1Database;

    const result = await enforceRetentionPolicy(
      db,
      createMockBucket(),
      TENANT,
      90,
    );

    expect(result.protected).toBe(1);
    expect(result.markedForDeletion).toBe(0);
  });
});

describe("isEvidenceDeletionAllowed", () => {
  it("returns false when evidence is referenced by active compliance controls", async () => {
    const db = createMockDb([
      { cnt: 1 },
    ]);

    const allowed = await isEvidenceDeletionAllowed(db, "ev-1", TENANT);
    expect(allowed).toBe(false);
  });

  it("returns false when evidence is referenced by recent access reviews", async () => {
    // First query (active controls) returns empty, second (access reviews) returns a hit
    let callCount = 0;
    const db = {
      prepare: () => ({
        bind: () => ({
          first: async () => {
            callCount++;
            if (callCount === 1) return { cnt: 0 };
            return { cnt: 1 }; // recent access review reference
          },
        }),
      }),
    } as unknown as D1Database;

    const allowed = await isEvidenceDeletionAllowed(db, "ev-2", TENANT);
    expect(allowed).toBe(false);
  });

  it("returns true when evidence has no active references", async () => {
    const db = {
      prepare: () => ({
        bind: () => ({
          first: async () => ({ cnt: 0 }),
        }),
      }),
    } as unknown as D1Database;

    const allowed = await isEvidenceDeletionAllowed(db, "ev-3", TENANT);
    expect(allowed).toBe(true);
  });
});
