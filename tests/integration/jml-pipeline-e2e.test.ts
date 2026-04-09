/**
 * JML Pipeline E2E Integration Tests
 *
 * Proves the full JML pipeline chain works end-to-end:
 *   event → parseAdapterUrls → legacyDispatch → adapter call → evidence emit
 *   event → executeAction(provision_app_access) → DB write → orchestrator forward
 *   adapter evidence → flattenAdapterResults → buildCdtPayloadFromEvidence → CDT fields
 *
 * All CF Worker bindings (D1, R2, DurableObjects) are mocked at the function level.
 * No Miniflare or CF runtime types are imported.
 *
 * NOTE: automation-actions.ts is loaded via dynamic import() to avoid the esbuild
 * tsconfig resolution error caused by console-app extending .svelte-kit/tsconfig.json
 * (which only exists after `svelte-kit sync`). This mirrors the pattern used in
 * failure-modes.test.ts which passes in the same environment.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseAdapterUrls, legacyDispatch } from "../../ai-orchestrator/src/lib/step-executor";
import {
  buildCdtPayloadFromEvidence,
  flattenAdapterResults,
} from "../../packages/shared/src/evidence/cdt-field-mapper";

// ── Mock helpers ─────────────────────────────────────────────────────────────

function makeMockDb() {
  const mockRun = vi.fn().mockResolvedValue({});
  const mockFirst = vi.fn().mockResolvedValue({ id: "cred-1" });
  const mockAll = vi.fn().mockResolvedValue({ results: [] });
  const mockBind = vi.fn().mockReturnValue({ run: mockRun, first: mockFirst, all: mockAll });
  const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
  const mockDb = { prepare: mockPrepare } as unknown as D1Database;
  return { mockDb, mockPrepare, mockBind, mockRun, mockFirst, mockAll };
}

// ── 1. parseAdapterUrls ───────────────────────────────────────────────────────

describe("parseAdapterUrls", () => {
  it("parses valid JSON adapter URL map", () => {
    const input = JSON.stringify({
      okta: "https://okta-adapter.internal",
      github: "https://github-adapter.internal",
      slack: "https://slack-adapter.internal",
    });
    const result = parseAdapterUrls(input);
    expect(result).toEqual({
      okta: "https://okta-adapter.internal",
      github: "https://github-adapter.internal",
      slack: "https://slack-adapter.internal",
    });
  });

  it("returns empty object for undefined input", () => {
    expect(parseAdapterUrls(undefined)).toEqual({});
  });

  it("returns empty object for invalid JSON", () => {
    expect(parseAdapterUrls("{not-valid-json}")).toEqual({});
  });

  it("returns empty object for empty string", () => {
    expect(parseAdapterUrls("")).toEqual({});
  });
});

// ── 2. legacyDispatch — adapter routing ───────────────────────────────────────

describe("legacyDispatch — provision route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("POSTs to /api/provision for {appId}.provision handler", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // health check
      .mockResolvedValueOnce({ ok: true, json: async () => ({ userId: "u1" }) }); // provision

    vi.stubGlobal("fetch", fetchMock);

    const adapterUrls = { okta: "https://okta-adapter.example.com" };
    const context = { email: "bob@example.com", userId: "user-42", groups: [] };

    const result = await legacyDispatch("okta.provision", context, "tenant-abc", adapterUrls);

    // First call is health check
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://okta-adapter.example.com/health",
      expect.objectContaining({ signal: expect.anything() }),
    );
    // Second call is the actual provision POST
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://okta-adapter.example.com/api/provision",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Tenant-ID": "tenant-abc",
        }),
      }),
    );

    expect(result).toEqual({ userId: "u1" });
  });

  it("POSTs to /api/deprovision for {appId}.deprovision handler", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // health check
      .mockResolvedValueOnce({ ok: true, json: async () => ({ removed: true }) }); // deprovision

    vi.stubGlobal("fetch", fetchMock);

    const adapterUrls = { github: "https://github-adapter.example.com" };
    const context = { email: "carol@example.com", userId: "user-99", groups: [] };

    const result = await legacyDispatch("github.deprovision", context, "tenant-abc", adapterUrls);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://github-adapter.example.com/api/deprovision",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual({ removed: true });
  });

  it("throws when no adapter URL is configured for appId", async () => {
    const adapterUrls = {}; // no URLs configured

    await expect(legacyDispatch("slack.provision", {}, "tenant-abc", adapterUrls)).rejects.toThrow(
      'No adapter URL configured for "slack"',
    );
  });

  it("throws for unknown operation on known appId", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // health check passes

    vi.stubGlobal("fetch", fetchMock);

    const adapterUrls = { okta: "https://okta-adapter.example.com" };

    await expect(legacyDispatch("okta.sync_users", {}, "tenant-abc", adapterUrls)).rejects.toThrow(
      'Unknown operation "sync_users"',
    );
  });

  it("throws when adapter health check returns non-OK status", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false, status: 503 });
    vi.stubGlobal("fetch", fetchMock);

    const adapterUrls = { jira: "https://jira-adapter.example.com" };

    await expect(legacyDispatch("jira.provision", {}, "tenant-abc", adapterUrls)).rejects.toThrow(
      "unhealthy",
    );
  });
});

describe("legacyDispatch — atlas built-in handlers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("atlas.resolve_access_bundle returns resolved apps and groups from context", async () => {
    const context = {
      appAccess: [{ appId: "jira", role: "member", groupId: "g1" }],
      groups: ["eng-team"],
      email: "dev@example.com",
      userId: "user-dev",
    };

    const result = (await legacyDispatch(
      "atlas.resolve_access_bundle",
      context,
      "tenant-abc",
      {},
    )) as Record<string, unknown>;

    expect(result.resolvedApps).toEqual(context.appAccess);
    expect(result.resolvedGroups).toEqual(context.groups);
    expect(result.email).toBe("dev@example.com");
    expect(result.userId).toBe("user-dev");
  });

  it("atlas.emit_evidence writes to R2 and returns evidenceId when bucket is provided", async () => {
    const mockBucket = {
      put: vi.fn().mockResolvedValue(undefined),
    } as unknown as R2Bucket;

    const context = {
      email: "dev@example.com",
      userId: "user-dev",
      jmlAction: "joiner",
    };

    const result = (await legacyDispatch(
      "atlas.emit_evidence",
      context,
      "tenant-abc",
      {},
      mockBucket,
    )) as Record<string, unknown>;

    expect(mockBucket.put).toHaveBeenCalledOnce();
    const [key, bodyStr] = (mockBucket.put as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(key).toMatch(/^workflow-evidence\/tenant-abc\//);
    const body = JSON.parse(bodyStr as string);
    expect(body.tenantId).toBe("tenant-abc");
    expect(body.context).toEqual(context);
    expect(result.evidenceId).toBeTruthy();
    expect(result.key).toBe(key);
  });

  it("atlas.emit_evidence returns skipped:true when no bucket provided", async () => {
    const result = (await legacyDispatch(
      "atlas.emit_evidence",
      { userId: "u1" },
      "tenant-abc",
      {},
      undefined,
    )) as Record<string, unknown>;

    expect(result.evidenceId).toBeNull();
    expect(result.skipped).toBe(true);
  });

  it("throws for unknown atlas operation", async () => {
    await expect(legacyDispatch("atlas.unknown_op", {}, "tenant-abc", {})).rejects.toThrow(
      'Unknown atlas operation: "unknown_op"',
    );
  });
});

// ── 3. executeAction — provision_app_access ────────────────────────────────────
// Uses dynamic import to avoid esbuild resolving console-app/tsconfig.json
// which extends .svelte-kit/tsconfig.json (only present after svelte-kit sync).

describe("executeAction — provision_app_access", () => {
  it("returns skipped when app credential is not in DB", async () => {
    const { mockDb, mockFirst } = makeMockDb();
    mockFirst.mockResolvedValue(null); // no credential row

    const { executeAction } = await import("../../console-app/src/lib/server/automation-actions");

    const result = await executeAction(
      "provision_app_access",
      { appId: "jira" },
      { db: mockDb, tenantId: "tenant-abc", payload: { email: "alice@example.com" } },
    );

    expect(result.status).toBe("skipped");
    expect(result.message).toContain("jira");
  });

  it("emits provisioning.requested event when credential exists", async () => {
    const { mockDb, mockPrepare, mockFirst } = makeMockDb();
    mockFirst.mockResolvedValue({ id: "cred-okta" }); // credential found

    const { executeAction } = await import("../../console-app/src/lib/server/automation-actions");

    const result = await executeAction(
      "provision_app_access",
      { appId: "okta" },
      { db: mockDb, tenantId: "tenant-abc", payload: { email: "alice@example.com" } },
    );

    expect(result.status).toBe("success");
    expect(result.actionType).toBe("provision_app_access");
    expect(result.details?.appId).toBe("okta");
    expect(result.details?.eventId).toBeTruthy();

    // Verify INSERT INTO events was called
    expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO events"));
  });

  it("forwards to orchestrator when orchestratorUrl is provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const { mockDb, mockFirst } = makeMockDb();
    mockFirst.mockResolvedValue({ id: "cred-1" });

    const { executeAction } = await import("../../console-app/src/lib/server/automation-actions");

    await executeAction(
      "provision_app_access",
      { appId: "slack" },
      {
        db: mockDb,
        tenantId: "tenant-abc",
        payload: { email: "alice@example.com" },
        orchestratorUrl: "https://orchestrator.internal",
      },
    );

    // forwardToOrchestrator is fire-and-forget — wait for the microtask queue
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://orchestrator.internal/api/v1/events",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-Tenant-ID": "tenant-abc" }),
      }),
    );

    vi.restoreAllMocks();
  });

  it("returns failed when appId is missing from config", async () => {
    const { mockDb } = makeMockDb();

    const { executeAction } = await import("../../console-app/src/lib/server/automation-actions");

    const result = await executeAction(
      "provision_app_access",
      {},
      { db: mockDb, tenantId: "tenant-abc", payload: {} },
    );

    expect(result.status).toBe("failed");
    expect(result.message).toContain("appId");
  });
});

// ── 4. executeAction — revoke_app_access ──────────────────────────────────────

describe("executeAction — revoke_app_access", () => {
  it("skips revocation when app is not connected", async () => {
    const { mockDb, mockFirst } = makeMockDb();
    mockFirst.mockResolvedValue(null);

    const { executeAction } = await import("../../console-app/src/lib/server/automation-actions");

    const result = await executeAction(
      "revoke_app_access",
      { appId: "github" },
      { db: mockDb, tenantId: "tenant-abc", payload: { email: "bob@example.com" } },
    );

    expect(result.status).toBe("skipped");
    expect(result.message).toContain("github");
  });

  it("emits provisioning.requested event with action=revoke payload", async () => {
    const { mockDb, mockPrepare, mockFirst } = makeMockDb();
    mockFirst.mockResolvedValue({ id: "cred-github" });

    const { executeAction } = await import("../../console-app/src/lib/server/automation-actions");

    const result = await executeAction(
      "revoke_app_access",
      { appId: "github" },
      { db: mockDb, tenantId: "tenant-abc", payload: { email: "bob@example.com" } },
    );

    expect(result.status).toBe("success");
    expect(result.actionType).toBe("revoke_app_access");
    expect(result.details?.eventId).toBeTruthy();

    // Verify the events INSERT was issued
    const insertCalls = (mockPrepare as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([sql]: [string]) => sql.includes("INSERT INTO events"),
    );
    expect(insertCalls.length).toBeGreaterThan(0);
  });

  it("returns failed when appId is missing", async () => {
    const { mockDb } = makeMockDb();

    const { executeAction } = await import("../../console-app/src/lib/server/automation-actions");

    const result = await executeAction(
      "revoke_app_access",
      {},
      { db: mockDb, tenantId: "tenant-abc", payload: {} },
    );

    expect(result.status).toBe("failed");
  });
});

// ── 5. Evidence recording — compliance_evidence INSERT ────────────────────────

describe("executeAction — compliance evidence recording", () => {
  it("calls compliance_evidence INSERT for provision_app_access", async () => {
    const { mockDb, mockPrepare, mockFirst } = makeMockDb();
    mockFirst.mockResolvedValue({ id: "cred-1" });

    const { executeAction } = await import("../../console-app/src/lib/server/automation-actions");

    await executeAction(
      "provision_app_access",
      { appId: "okta" },
      { db: mockDb, tenantId: "tenant-abc", payload: {} },
    );

    const preparedSqls = (mockPrepare as ReturnType<typeof vi.fn>).mock.calls.map(
      ([sql]: [string]) => sql,
    );
    expect(preparedSqls.some((sql) => sql.includes("compliance_evidence"))).toBe(true);
  });

  it("calls compliance_evidence INSERT for revoke_app_access", async () => {
    const { mockDb, mockPrepare, mockFirst } = makeMockDb();
    mockFirst.mockResolvedValue({ id: "cred-1" });

    const { executeAction } = await import("../../console-app/src/lib/server/automation-actions");

    await executeAction(
      "revoke_app_access",
      { appId: "github" },
      { db: mockDb, tenantId: "tenant-abc", payload: {} },
    );

    const preparedSqls = (mockPrepare as ReturnType<typeof vi.fn>).mock.calls.map(
      ([sql]: [string]) => sql,
    );
    expect(preparedSqls.some((sql) => sql.includes("compliance_evidence"))).toBe(true);
  });

  it("returns unknown action type gracefully without throwing", async () => {
    const { mockDb } = makeMockDb();

    const { executeAction } = await import("../../console-app/src/lib/server/automation-actions");

    const result = await executeAction(
      "not_a_real_action",
      {},
      { db: mockDb, tenantId: "tenant-abc", payload: {} },
    );

    expect(result.status).toBe("failed");
    expect(result.message).toContain("Unknown action type");
  });
});

// ── 6. flattenAdapterResults + buildCdtPayloadFromEvidence pipeline ───────────

describe("flattenAdapterResults → buildCdtPayloadFromEvidence pipeline", () => {
  it("flattens multi-adapter results into a single list of items", () => {
    const results = [
      {
        slug: "okta",
        items: [
          {
            type: "mfa_policy",
            controlRefs: ["SOC2-CC6.1"],
            status: "pass" as const,
            details: { hasRequiredFactor: true },
          },
          {
            type: "session_policy",
            controlRefs: ["SOC2-CC6.1"],
            status: "pass" as const,
            details: { maxSessionIdleMinutes: 30 },
          },
        ],
      },
      {
        slug: "github",
        items: [
          {
            type: "branch_protection",
            controlRefs: ["SOC2-CC8.1"],
            status: "pass" as const,
            details: { allProtected: true },
          },
        ],
      },
    ];

    const flat = flattenAdapterResults(results);

    expect(flat).toHaveLength(3);
    expect(flat[0]).toEqual({ slug: "okta", item: results[0].items[0] });
    expect(flat[1]).toEqual({ slug: "okta", item: results[0].items[1] });
    expect(flat[2]).toEqual({ slug: "github", item: results[1].items[0] });
  });

  it("builds correct CDT payload from Okta MFA pass evidence", () => {
    const flat = [
      {
        slug: "okta",
        item: {
          type: "mfa_policy",
          controlRefs: ["SOC2-CC6.1"],
          status: "pass" as const,
          details: { hasRequiredFactor: true },
        },
      },
    ];

    const payload = buildCdtPayloadFromEvidence(flat);

    expect(payload.mfa_required).toBe(true);
    expect(payload.mfa_required_for_phi).toBe(true);
    expect(payload.mfa_types_allowed).toEqual(["TOTP", "WebAuthn"]);
  });

  it("inverts boolean fields for fail-status evidence", () => {
    const flat = [
      {
        slug: "okta",
        item: {
          type: "mfa_policy",
          controlRefs: ["SOC2-CC6.1"],
          status: "fail" as const,
          details: { hasRequiredFactor: false },
        },
      },
    ];

    const payload = buildCdtPayloadFromEvidence(flat);

    // On fail, booleans are forced to false
    expect(payload.mfa_required).toBe(false);
    expect(payload.mfa_required_for_phi).toBe(false);
    // Arrays are skipped on fail — should not appear
    expect(payload.mfa_types_allowed).toBeUndefined();
  });

  it("skips unknown-status items entirely", () => {
    const flat = [
      {
        slug: "github",
        item: {
          type: "branch_protection",
          controlRefs: ["SOC2-CC8.1"],
          status: "unknown" as const,
          details: { allProtected: true },
        },
      },
    ];

    const payload = buildCdtPayloadFromEvidence(flat);

    expect(Object.keys(payload)).toHaveLength(0);
  });

  it("merges fields from multiple adapters — later entries override earlier", () => {
    const flat = [
      {
        slug: "okta",
        item: {
          type: "mfa_policy",
          controlRefs: ["SOC2-CC6.1"],
          status: "pass" as const,
          details: { hasRequiredFactor: true },
        },
      },
      {
        slug: "google-workspace",
        item: {
          type: "mfa_enforcement",
          controlRefs: ["SOC2-CC6.1"],
          status: "pass" as const,
          details: {},
        },
      },
    ];

    const payload = buildCdtPayloadFromEvidence(flat);

    // google-workspace mfa_enforcement adds idp_connected and automated_identity_lifecycle
    expect(payload.idp_connected).toBe(true);
    expect(payload.automated_identity_lifecycle).toBe(true);
    // mfa_required still true (both set it to true)
    expect(payload.mfa_required).toBe(true);
  });

  it("extracts conditional_access fields from Microsoft 365 evidence", () => {
    const flat = [
      {
        slug: "microsoft-365",
        item: {
          type: "conditional_access",
          controlRefs: ["SOC2-CC6.1"],
          status: "pass" as const,
          details: { enabledPolicies: 5 },
        },
      },
    ];

    const payload = buildCdtPayloadFromEvidence(flat);

    expect(payload.role_based_access_enforced).toBe(true);
    expect(payload.least_privilege_enforced).toBe(true);
    expect(payload.access_control_policy_approved).toBe(true);
  });

  it("maps AWS CloudTrail evidence to full audit/monitoring CDT fields", () => {
    const flat = [
      {
        slug: "aws",
        item: {
          type: "cloudtrail_enabled",
          controlRefs: ["SOC2-CC7.2"],
          status: "pass" as const,
          details: {},
        },
      },
    ];

    const payload = buildCdtPayloadFromEvidence(flat);

    expect(payload.phi_audit_logs_enabled).toBe(true);
    expect(payload.audit_log_retention_days).toBe(365);
    expect(payload.audit_trail_enabled).toBe(true);
    expect(payload.anomaly_detection_enabled).toBe(true);
    expect(payload.siem_connected).toBe(true);
    expect(payload.continuous_monitoring_enabled).toBe(true);
  });

  it("returns empty payload when no items match known extractors", () => {
    const flat = [
      {
        slug: "unknown-app",
        item: {
          type: "some_check",
          controlRefs: [],
          status: "pass" as const,
          details: { someField: true },
        },
      },
    ];

    const payload = buildCdtPayloadFromEvidence(flat);
    expect(Object.keys(payload)).toHaveLength(0);
  });

  it("handles empty results array without throwing", () => {
    const flat = flattenAdapterResults([]);
    expect(flat).toEqual([]);
    const payload = buildCdtPayloadFromEvidence(flat);
    expect(payload).toEqual({});
  });
});
