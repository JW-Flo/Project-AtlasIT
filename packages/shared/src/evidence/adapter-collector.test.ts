import { describe, it, expect, vi, afterEach } from "vitest";
import {
  collectAdapterEvidence,
  collectAllAdapterEvidence,
  ADAPTER_EVIDENCE_REGISTRY,
} from "./adapter-collector";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("collectAdapterEvidence", () => {
  it("calls POST /api/evidence on the adapter URL with tenantId", async () => {
    const fetchStub = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            type: "branch_protection",
            controlRefs: ["SOC2-CC8.1"],
            status: "pass",
            details: { protectedCount: 5 },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchStub);

    const result = await collectAdapterEvidence(
      "https://github-adapter.example.com",
      "github",
      "tenant-123",
    );

    expect(fetchStub).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchStub.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://github-adapter.example.com/api/evidence");
    expect(opts.method).toBe("POST");
    expect(opts.headers).toEqual(
      expect.objectContaining({
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-123",
      }),
    );
    const body = JSON.parse(opts.body as string);
    expect(body.tenantId).toBe("tenant-123");

    expect(result.slug).toBe("github");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("branch_protection");
    expect(result.items[0].status).toBe("pass");
  });

  it("returns empty items when adapter returns non-OK status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    const result = await collectAdapterEvidence(
      "https://broken.example.com",
      "okta",
      "tenant-456",
    );

    expect(result.slug).toBe("okta");
    expect(result.items).toEqual([]);
  });

  it("returns empty items when fetch throws (network error)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const result = await collectAdapterEvidence(
      "https://unreachable.example.com",
      "slack",
      "tenant-789",
    );

    expect(result.slug).toBe("slack");
    expect(result.items).toEqual([]);
    expect(result.collectedAt).toBeDefined();
  });

  it("returns empty items when response has no items field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: "unexpected" }),
      }),
    );

    const result = await collectAdapterEvidence(
      "https://weird.example.com",
      "aws",
      "tenant-abc",
    );

    expect(result.items).toEqual([]);
  });
});

describe("collectAllAdapterEvidence", () => {
  it("calls each adapter that has a URL in the map", async () => {
    const fetchStub = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            type: "mfa_enforcement",
            controlRefs: ["SOC2-CC6.1"],
            status: "pass",
            details: {},
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchStub);

    const adapterUrls: Record<string, string> = {
      github: "https://github.example.com",
      okta: "https://okta.example.com",
    };

    const results = await collectAllAdapterEvidence(adapterUrls, "tenant-all");

    // Should call exactly 2 adapters (github and okta have URLs)
    expect(fetchStub).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.slug).sort()).toEqual(["github", "okta"]);
  });

  it("skips adapters not in the URL map", async () => {
    const fetchStub = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
    vi.stubGlobal("fetch", fetchStub);

    const adapterUrls: Record<string, string> = {
      slack: "https://slack.example.com",
    };

    const results = await collectAllAdapterEvidence(adapterUrls, "tenant-x");

    // Only slack is in the URL map and in the registry
    expect(fetchStub).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe("slack");
  });

  it("still returns results from healthy adapters when some fail", async () => {
    let callCount = 0;
    const fetchStub = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // First adapter succeeds
        return {
          ok: true,
          json: async () => ({
            items: [{ type: "mfa", controlRefs: [], status: "pass", details: {} }],
          }),
        };
      }
      // Second adapter fails
      throw new Error("Connection refused");
    });
    vi.stubGlobal("fetch", fetchStub);

    const adapterUrls: Record<string, string> = {
      github: "https://github.example.com",
      okta: "https://okta.example.com",
    };

    const results = await collectAllAdapterEvidence(adapterUrls, "tenant-mixed");

    // Both should be in results — the failed one has empty items
    expect(results).toHaveLength(2);
    const github = results.find((r) => r.slug === "github")!;
    const okta = results.find((r) => r.slug === "okta")!;
    expect(github.items).toHaveLength(1);
    expect(okta.items).toEqual([]);
  });
});

describe("ADAPTER_EVIDENCE_REGISTRY", () => {
  it("contains 6 adapters", () => {
    expect(ADAPTER_EVIDENCE_REGISTRY).toHaveLength(6);
  });

  it("has github, okta, google_workspace, microsoft_365, aws, slack", () => {
    const slugs = ADAPTER_EVIDENCE_REGISTRY.map((c) => c.slug).sort();
    expect(slugs).toEqual([
      "aws",
      "github",
      "google_workspace",
      "microsoft_365",
      "okta",
      "slack",
    ]);
  });

  it("each evidence type has non-empty controlRefs", () => {
    for (const config of ADAPTER_EVIDENCE_REGISTRY) {
      for (const et of config.evidenceTypes) {
        expect(et.controlRefs.length).toBeGreaterThan(0);
        expect(et.type).toBeTruthy();
        expect(et.description).toBeTruthy();
      }
    }
  });
});
