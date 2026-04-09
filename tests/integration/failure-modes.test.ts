/**
 * Failure-mode tests for the evidence pipeline and automation engine.
 *
 * Verifies that errors are contained — adapters down, CDT bad IDs,
 * missing config, partial failures — never crash the pipeline.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  collectAdapterEvidence,
  collectAllAdapterEvidence,
} from "../../packages/shared/src/evidence/adapter-collector";
import {
  buildCdtPayloadFromEvidence,
  flattenAdapterResults,
} from "../../packages/shared/src/evidence/cdt-field-mapper";
import { parseAdapterUrls } from "../../ai-orchestrator/src/lib/step-executor";
import { runControlEval } from "../../shared/services/cdt/src/evaluation/engine";
import type { CdtEvent } from "../../shared/services/cdt/src/models";

// ---------------------------------------------------------------------------
// Minimal D1 mock (supports prepare → bind → run/first/all chain)
// ---------------------------------------------------------------------------

function makeMockStatement(
  overrides: {
    run?: () => Promise<{ success: boolean; meta: { changes: number } }>;
    first?: () => Promise<unknown>;
    all?: () => Promise<{ results: unknown[] }>;
  } = {},
) {
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    run: overrides.run ?? vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } }),
    first: overrides.first ?? vi.fn().mockResolvedValue(null),
    all: overrides.all ?? vi.fn().mockResolvedValue({ results: [] }),
  };
  return stmt;
}

function makeMockDb(statementOverrides: Parameters<typeof makeMockStatement>[0] = {}): D1Database {
  const stmt = makeMockStatement(statementOverrides);
  return {
    prepare: vi.fn().mockReturnValue(stmt),
    exec: vi.fn().mockResolvedValue({ success: true }),
    batch: vi.fn().mockResolvedValue([]),
    dump: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
  } as unknown as D1Database;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCdtEvent(payload: Record<string, unknown> = {}): CdtEvent {
  return {
    type: "test.event",
    tenant: "tenant-test",
    occurred_at: new Date().toISOString(),
    payload,
    trace_id: "trace-001",
  };
}

// ---------------------------------------------------------------------------
// 1. Adapter down → evidence collection returns error, not empty
// ---------------------------------------------------------------------------

describe("adapter down → evidence collection returns error", () => {
  it("returns error field with status code when adapter responds 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Internal Server Error", { status: 500 })),
    );

    const result = await collectAdapterEvidence(
      "https://adapter.example.com",
      "github",
      "tenant-1",
    );

    expect(result.error).toBeDefined();
    expect(result.error).toContain("500");
    expect(result.items).toEqual([]);

    vi.unstubAllGlobals();
  });
});

// ---------------------------------------------------------------------------
// 2. Adapter unreachable → network error captured
// ---------------------------------------------------------------------------

describe("adapter unreachable → network error captured", () => {
  it("returns error field when fetch throws a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));

    const result = await collectAdapterEvidence("https://adapter.example.com", "okta", "tenant-1");

    expect(result.error).toBeDefined();
    expect(result.items).toEqual([]);

    vi.unstubAllGlobals();
  });
});

// ---------------------------------------------------------------------------
// 3. CDT rule throws → doesn't crash the pipeline
// ---------------------------------------------------------------------------

describe("CDT rule with unknown control ID → pipeline safe", () => {
  it("returns unknown decision for an unrecognised control ID", () => {
    const ev = makeCdtEvent({ mfa_required: true });

    const result = runControlEval("TOTALLY-UNKNOWN-CONTROL-999", ev);

    expect(result.decision).toBe("unknown");
    expect(Array.isArray(result.rationale)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Empty group_app_mappings → provisioning event still emitted
// ---------------------------------------------------------------------------

describe("empty group_app_mappings → provisioning event still emitted", () => {
  it("emits provisioning.requested even when group mappings are empty", async () => {
    // DB: app credential found (connected), but group_app_mappings is empty
    const credentialStmt = makeMockStatement({
      first: vi.fn().mockResolvedValue({ id: "cred-abc" }),
    });
    const insertStmt = makeMockStatement();
    // Evidence insert uses run() — must succeed too
    const evidenceStmt = makeMockStatement();

    let callIndex = 0;
    const mockDb = {
      prepare: vi.fn().mockImplementation((query: string) => {
        if (query.includes("app_credentials")) return credentialStmt;
        if (query.includes("events")) return insertStmt;
        return evidenceStmt;
      }),
      exec: vi.fn(),
      batch: vi.fn(),
      dump: vi.fn(),
    } as unknown as D1Database;

    // Import executeAction directly (no SvelteKit $lib dynamic import in tests)
    const { executeAction } = await import("../../console-app/src/lib/server/automation-actions");

    const result = await executeAction(
      "provision_app_access",
      { appId: "github" },
      { db: mockDb, tenantId: "tenant-1", payload: { email: "user@example.com" } },
    );

    expect(result.status).toBe("success");
    expect(result.actionType).toBe("provision_app_access");
    // The events INSERT should have been called
    expect(insertStmt.bind).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 5. Missing ADAPTER_URLS → parseAdapterUrls returns empty
// ---------------------------------------------------------------------------

describe("parseAdapterUrls edge cases", () => {
  it("returns empty object for undefined", () => {
    expect(parseAdapterUrls(undefined)).toEqual({});
  });

  it("returns empty object for empty string", () => {
    expect(parseAdapterUrls("")).toEqual({});
  });

  it("returns empty object for invalid JSON", () => {
    expect(parseAdapterUrls("not json")).toEqual({});
  });

  it("returns parsed object for valid JSON", () => {
    expect(parseAdapterUrls('{"github":"https://github-adapter.example.com"}')).toEqual({
      github: "https://github-adapter.example.com",
    });
  });
});

// ---------------------------------------------------------------------------
// 6. Partial adapter failure → healthy adapters still return results
// ---------------------------------------------------------------------------

describe("partial adapter failure → healthy adapters still return results", () => {
  it("includes all 3 adapter results; only the successful one has items", async () => {
    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string) => {
        callCount++;
        if (callCount === 1) {
          // First adapter (github) succeeds
          return Promise.resolve(
            new Response(
              JSON.stringify({
                items: [
                  {
                    type: "mfa_enforcement",
                    controlRefs: ["SOC2-CC6.1"],
                    status: "pass",
                    details: { twoFactorRequired: true },
                  },
                ],
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        }
        if (callCount === 2) {
          // Second adapter (okta) returns HTTP 500
          return Promise.resolve(new Response("error", { status: 500 }));
        }
        // Third adapter (aws) throws network error
        return Promise.reject(new Error("ECONNREFUSED"));
      }),
    );

    const results = await collectAllAdapterEvidence(
      {
        github: "https://github.adapter.example.com",
        okta: "https://okta.adapter.example.com",
        aws: "https://aws.adapter.example.com",
      },
      "tenant-partial",
    );

    expect(results).toHaveLength(3);

    const github = results.find((r) => r.slug === "github");
    const okta = results.find((r) => r.slug === "okta");
    const aws = results.find((r) => r.slug === "aws");

    expect(github).toBeDefined();
    expect(github!.items).toHaveLength(1);
    expect(github!.error).toBeUndefined();

    expect(okta).toBeDefined();
    expect(okta!.items).toEqual([]);
    expect(okta!.error).toBeDefined();
    expect(okta!.error).toContain("500");

    expect(aws).toBeDefined();
    expect(aws!.items).toEqual([]);
    expect(aws!.error).toBeDefined();

    vi.unstubAllGlobals();
  });
});

// ---------------------------------------------------------------------------
// 7. Evidence with no matching extractor → skipped silently
// ---------------------------------------------------------------------------

describe("evidence with unknown adapter:type → skipped silently", () => {
  it("returns empty payload without throwing when no extractor is registered", () => {
    const items = flattenAdapterResults([
      {
        slug: "unknown-adapter",
        items: [
          {
            type: "nonexistent_check",
            controlRefs: ["SOC2-CC9.9"],
            status: "pass",
            details: { value: true },
          },
        ],
      },
    ]);

    const payload = buildCdtPayloadFromEvidence(items);

    expect(payload).toEqual({});
  });

  it("skips unknown:status items and does not include their fields", () => {
    const items = flattenAdapterResults([
      {
        slug: "okta",
        items: [
          {
            type: "mfa_policy",
            controlRefs: ["SOC2-CC6.1"],
            status: "unknown",
            details: { hasRequiredFactor: true },
          },
        ],
      },
    ]);

    const payload = buildCdtPayloadFromEvidence(items);

    expect(payload).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// 8. Orchestrator forwarding failure → doesn't block action
// ---------------------------------------------------------------------------

describe("orchestrator forwarding failure → action still returns success", () => {
  it("returns success even when orchestrator fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Orchestrator unreachable")));

    const credentialStmt = makeMockStatement({
      first: vi.fn().mockResolvedValue({ id: "cred-xyz" }),
    });
    const insertStmt = makeMockStatement();
    const evidenceStmt = makeMockStatement();

    const mockDb = {
      prepare: vi.fn().mockImplementation((query: string) => {
        if (query.includes("app_credentials")) return credentialStmt;
        if (query.includes("events")) return insertStmt;
        return evidenceStmt;
      }),
      exec: vi.fn(),
      batch: vi.fn(),
      dump: vi.fn(),
    } as unknown as D1Database;

    const { executeAction } = await import("../../console-app/src/lib/server/automation-actions");

    const result = await executeAction(
      "provision_app_access",
      { appId: "okta" },
      {
        db: mockDb,
        tenantId: "tenant-2",
        payload: { email: "alice@example.com" },
        orchestratorUrl: "https://orchestrator.example.com",
      },
    );

    // Forwarding is fire-and-forget — action outcome must not be affected
    expect(result.status).toBe("success");
    expect(result.actionType).toBe("provision_app_access");

    vi.unstubAllGlobals();
  });
});

// ---------------------------------------------------------------------------
// 9. D1 evidence write failure → doesn't crash automation
// ---------------------------------------------------------------------------

describe("D1 evidence write failure → action result still returned", () => {
  it("returns action result even when compliance_evidence INSERT throws", async () => {
    // credential lookup succeeds, events INSERT succeeds, but evidence INSERT throws
    const credentialStmt = makeMockStatement({
      first: vi.fn().mockResolvedValue({ id: "cred-evidence-fail" }),
    });
    const eventsInsertStmt = makeMockStatement({
      run: vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } }),
    });
    // evidence insert: run() rejects
    const evidenceInsertStmt = makeMockStatement({
      run: vi.fn().mockRejectedValue(new Error("D1_WRITE_FAILED: disk full")),
    });

    const mockDb = {
      prepare: vi.fn().mockImplementation((query: string) => {
        if (query.includes("app_credentials")) return credentialStmt;
        if (query.includes("INSERT INTO events")) return eventsInsertStmt;
        // compliance_evidence insert
        return evidenceInsertStmt;
      }),
      exec: vi.fn(),
      batch: vi.fn(),
      dump: vi.fn(),
    } as unknown as D1Database;

    const { executeAction } = await import("../../console-app/src/lib/server/automation-actions");

    const result = await executeAction(
      "provision_app_access",
      { appId: "aws" },
      { db: mockDb, tenantId: "tenant-3", payload: {} },
    );

    expect(result.status).toBe("success");
    expect(result.actionType).toBe("provision_app_access");
  });
});
