import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import app from "./index.js";

// ---------------------------------------------------------------------------
// Minimal D1 stub factory
// ---------------------------------------------------------------------------
function makeDb(tokenRow: Record<string, string> | null) {
  return {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(tokenRow),
        run: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  };
}

// Minimal env — CRED_ENCRYPTION_KEY is irrelevant when we mock fetch at the
// token-row level (the access_token returned is the literal string we pass
// because decryptValue is mocked via crypto.subtle below).
const BASE_ENV = {
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
  CRED_ENCRYPTION_KEY: "test-key-32-bytes-padding-here!",
  ORCHESTRATOR_URL: "https://orchestrator.example.com",
  CONNECTOR_ID: "google-workspace",
  EVENT_PUBLISH_SECRET: "",
};

// ---------------------------------------------------------------------------
// Helper to invoke POST /api/evidence
// ---------------------------------------------------------------------------
function invoke(
  env: typeof BASE_ENV & { DB: ReturnType<typeof makeDb> },
  body: unknown,
) {
  const req = new Request("http://localhost/api/evidence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // Hono's fetch signature: (request, env, executionContext)
  return app.fetch(req, env as unknown as Parameters<typeof app.fetch>[1], {
    waitUntil: () => {},
    passThroughOnException: () => {},
  });
}

// ---------------------------------------------------------------------------
// Mock crypto.subtle so decryptValue returns the raw access_token string
// stored in the DB row (i.e. treat the envelope as plaintext in tests).
// ---------------------------------------------------------------------------
beforeEach(() => {
  // deriveKey → returns a fake CryptoKey object
  const fakeKey = {} as CryptoKey;

  vi.spyOn(crypto.subtle, "importKey").mockResolvedValue(fakeKey);
  vi.spyOn(crypto.subtle, "deriveKey").mockResolvedValue(fakeKey);

  // decrypt → decode the "enc" field of the JSON envelope as base64 → plaintext
  vi.spyOn(crypto.subtle, "decrypt").mockImplementation(
    async (_algo: AlgorithmIdentifier, _key: CryptoKey, data: BufferSource) => {
      // data is the raw ciphertext bytes; in tests the token row stores the
      // access token directly as a JSON envelope where enc = btoa(token).
      // We just return the bytes as-is — the TextDecoder will recover the string.
      return data as ArrayBuffer;
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Build a fake token envelope that survives the mocked decryptValue:
// decryptValue JSON.parses the envelope, grabs `enc`, base64-decodes it,
// then calls crypto.subtle.decrypt (mocked to return the same bytes), then
// TextDecodes the result.
// So we store enc = btoa(accessToken) and provide a dummy iv.
// ---------------------------------------------------------------------------
function makeTokenEnvelope(accessToken: string): string {
  return JSON.stringify({
    enc: btoa(accessToken),
    iv: btoa("000000000000"), // 12 dummy bytes
    v: 1,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("POST /api/evidence — google-workspace", () => {
  it("returns 3 evidence items with correct controlRefs", async () => {
    const db = makeDb({
      access_token: makeTokenEnvelope("fake-access-token"),
      refresh_token: "",
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          users: [{ isEnrolledIn2Sv: true, isEnforcedIn2Sv: true }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const res = await invoke({ ...BASE_ENV, DB: db }, { tenantId: "t1" });
    expect(res.status).toBe(200);

    const body = (await res.json()) as { items: unknown[] };
    expect(body.items).toHaveLength(3);

    const types = (body.items as Array<{ type: string }>).map((i) => i.type);
    expect(types).toContain("mfa_enforcement");
    expect(types).toContain("dlp_rules");
    expect(types).toContain("sharing_settings");

    const mfa = (
      body.items as Array<{ type: string; controlRefs: string[] }>
    ).find((i) => i.type === "mfa_enforcement")!;
    expect(mfa.controlRefs).toEqual([
      "SOC2-CC6.1",
      "ISO-27001-A.9.4.2",
      "HIPAA-164.312(d)",
    ]);

    const dlp = (
      body.items as Array<{ type: string; controlRefs: string[] }>
    ).find((i) => i.type === "dlp_rules")!;
    expect(dlp.controlRefs).toEqual(["SOC2-CC6.7", "GDPR-Art.5(1)(f)"]);

    const sharing = (
      body.items as Array<{ type: string; controlRefs: string[] }>
    ).find((i) => i.type === "sharing_settings")!;
    expect(sharing.controlRefs).toEqual([
      "SOC2-CC6.6",
      "ISO-27001-A.9.1.2",
    ]);
  });

  it("mfa_enforcement returns pass when all sampled users have isEnforcedIn2Sv: true", async () => {
    const db = makeDb({
      access_token: makeTokenEnvelope("token-a"),
      refresh_token: "",
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          users: [{ isEnrolledIn2Sv: true, isEnforcedIn2Sv: true }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const res = await invoke({ ...BASE_ENV, DB: db }, { tenantId: "t1" });
    const body = (await res.json()) as {
      items: Array<{ type: string; status: string }>;
    };
    const mfa = body.items.find((i) => i.type === "mfa_enforcement")!;
    expect(mfa.status).toBe("pass");
  });

  it("mfa_enforcement returns fail when isEnforcedIn2Sv is false", async () => {
    const db = makeDb({
      access_token: makeTokenEnvelope("token-b"),
      refresh_token: "",
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          users: [{ isEnrolledIn2Sv: false, isEnforcedIn2Sv: false }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const res = await invoke({ ...BASE_ENV, DB: db }, { tenantId: "t1" });
    const body = (await res.json()) as {
      items: Array<{ type: string; status: string }>;
    };
    const mfa = body.items.find((i) => i.type === "mfa_enforcement")!;
    expect(mfa.status).toBe("fail");
  });

  it("dlp_rules returns unknown with explanation about required scope", async () => {
    const db = makeDb({
      access_token: makeTokenEnvelope("token-c"),
      refresh_token: "",
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ users: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await invoke({ ...BASE_ENV, DB: db }, { tenantId: "t1" });
    const body = (await res.json()) as {
      items: Array<{ type: string; status: string; details: Record<string, unknown> }>;
    };
    const dlp = body.items.find((i) => i.type === "dlp_rules")!;
    expect(dlp.status).toBe("unknown");
    expect(typeof dlp.details.reason).toBe("string");
    expect((dlp.details.reason as string).toLowerCase()).toContain("dlp api");
  });

  it("sharing_settings returns unknown with explanation about required scope", async () => {
    const db = makeDb({
      access_token: makeTokenEnvelope("token-d"),
      refresh_token: "",
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ users: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await invoke({ ...BASE_ENV, DB: db }, { tenantId: "t1" });
    const body = (await res.json()) as {
      items: Array<{ type: string; status: string; details: Record<string, unknown> }>;
    };
    const sharing = body.items.find((i) => i.type === "sharing_settings")!;
    expect(sharing.status).toBe("unknown");
    expect(typeof sharing.details.reason).toBe("string");
    expect((sharing.details.reason as string).toLowerCase()).toContain(
      "reports api",
    );
  });

  it("returns empty items when no OAuth token is found for the tenant", async () => {
    const db = makeDb(null);

    const res = await invoke({ ...BASE_ENV, DB: db }, { tenantId: "no-token-tenant" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown[] };
    expect(body.items).toHaveLength(0);
  });

  it("mfa_enforcement returns unknown when Google API responds with an error", async () => {
    const db = makeDb({
      access_token: makeTokenEnvelope("token-e"),
      refresh_token: "",
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await invoke({ ...BASE_ENV, DB: db }, { tenantId: "t1" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ type: string; status: string }>;
    };
    const mfa = body.items.find((i) => i.type === "mfa_enforcement")!;
    expect(mfa.status).toBe("unknown");
  });
});
