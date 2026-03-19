import { describe, it, expect, vi, afterEach } from "vitest";
import app from "./index.js";

// ---------------------------------------------------------------------------
// Env factory
// ---------------------------------------------------------------------------

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    DB: {
      prepare: () => ({
        bind: () => ({
          first: async () => null,
        }),
      }),
    },
    ADAPTER_SECRET: "test-secret",
    ORCHESTRATOR_URL: "https://orchestrator.example.com",
    ADAPTER_NAME: "aws",
    AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE",
    AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    AWS_REGION: "us-east-1",
    CONNECTOR_ID: "aws",
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/evidence — aws", () => {
  it("returns three evidence items covering all registry types", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          `<GetAccountSummaryResponse>
            <GetAccountSummaryResult>
              <SummaryMap>
                <entry><key>AccountMFAEnabled</key><value>1</value></entry>
              </SummaryMap>
            </GetAccountSummaryResult>
          </GetAccountSummaryResponse>`,
      }),
    );

    const req = new Request("http://localhost/api/evidence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ tenantId: "tenant-1" }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(200);

    const body = await res.json() as { items: Array<{ type: string }> };
    const types = body.items.map((i) => i.type);
    expect(types).toContain("mfa_enforcement");
    expect(types).toContain("encryption_at_rest");
    expect(types).toContain("cloudtrail_enabled");
  });

  it("returns pass for mfa_enforcement when AccountMFAEnabled=1", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          `<GetAccountSummaryResponse>
            <GetAccountSummaryResult>
              <SummaryMap>
                <entry><key>AccountMFAEnabled</key><value>1</value></entry>
              </SummaryMap>
            </GetAccountSummaryResult>
          </GetAccountSummaryResponse>`,
      }),
    );

    const req = new Request("http://localhost/api/evidence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ tenantId: "tenant-1" }),
    });

    const res = await app.fetch(req, makeEnv());
    const body = await res.json() as { items: Array<{ type: string; status: string }> };

    const mfa = body.items.find((i) => i.type === "mfa_enforcement");
    expect(mfa?.status).toBe("pass");
  });

  it("returns fail for mfa_enforcement when AccountMFAEnabled=0", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          `<GetAccountSummaryResponse>
            <GetAccountSummaryResult>
              <SummaryMap>
                <entry><key>AccountMFAEnabled</key><value>0</value></entry>
              </SummaryMap>
            </GetAccountSummaryResult>
          </GetAccountSummaryResponse>`,
      }),
    );

    const req = new Request("http://localhost/api/evidence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ tenantId: "tenant-1" }),
    });

    const res = await app.fetch(req, makeEnv());
    const body = await res.json() as { items: Array<{ type: string; status: string }> };

    const mfa = body.items.find((i) => i.type === "mfa_enforcement");
    expect(mfa?.status).toBe("fail");
  });

  it("returns unknown for mfa_enforcement when IAM API call fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const req = new Request("http://localhost/api/evidence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ tenantId: "tenant-1" }),
    });

    const res = await app.fetch(req, makeEnv());
    const body = await res.json() as { items: Array<{ type: string; status: string }> };

    const mfa = body.items.find((i) => i.type === "mfa_enforcement");
    expect(mfa?.status).toBe("unknown");
  });

  it("encryption_at_rest and cloudtrail_enabled always return unknown with reason", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          `<GetAccountSummaryResponse>
            <GetAccountSummaryResult>
              <SummaryMap>
                <entry><key>AccountMFAEnabled</key><value>1</value></entry>
              </SummaryMap>
            </GetAccountSummaryResult>
          </GetAccountSummaryResponse>`,
      }),
    );

    const req = new Request("http://localhost/api/evidence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ tenantId: "tenant-1" }),
    });

    const res = await app.fetch(req, makeEnv());
    const body = await res.json() as {
      items: Array<{ type: string; status: string; details: Record<string, unknown> }>;
    };

    const enc = body.items.find((i) => i.type === "encryption_at_rest");
    expect(enc?.status).toBe("unknown");
    expect(enc?.details["service"]).toBe("s3");

    const ct = body.items.find((i) => i.type === "cloudtrail_enabled");
    expect(ct?.status).toBe("unknown");
    expect(ct?.details["service"]).toBe("cloudtrail");
  });

  it("has correct controlRefs for each evidence type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          `<GetAccountSummaryResponse>
            <GetAccountSummaryResult>
              <SummaryMap>
                <entry><key>AccountMFAEnabled</key><value>1</value></entry>
              </SummaryMap>
            </GetAccountSummaryResult>
          </GetAccountSummaryResponse>`,
      }),
    );

    const req = new Request("http://localhost/api/evidence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ tenantId: "tenant-1" }),
    });

    const res = await app.fetch(req, makeEnv());
    const body = await res.json() as {
      items: Array<{ type: string; controlRefs: string[] }>;
    };

    const mfa = body.items.find((i) => i.type === "mfa_enforcement");
    expect(mfa?.controlRefs).toEqual(
      expect.arrayContaining(["SOC2-CC6.1", "ISO-27001-A.9.4.2"]),
    );

    const enc = body.items.find((i) => i.type === "encryption_at_rest");
    expect(enc?.controlRefs).toEqual(
      expect.arrayContaining(["SOC2-CC6.7", "HIPAA-164.312(a)(2)(ii)", "GDPR-Art.5(1)(f)"]),
    );

    const ct = body.items.find((i) => i.type === "cloudtrail_enabled");
    expect(ct?.controlRefs).toEqual(
      expect.arrayContaining(["SOC2-CC7.1", "HIPAA-164.312(b)", "NIST-CSF-DE.CM-1"]),
    );
  });
});
