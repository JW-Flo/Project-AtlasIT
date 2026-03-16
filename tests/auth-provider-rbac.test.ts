/**
 * Tests for CloudflareAccessProvider with D1-backed RBAC.
 * Covers: expired JWT rejection, wrong audience rejection, D1 role lookup,
 * unauthenticated access rejection, and unknown user fallback to ["viewer"].
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CloudflareAccessProvider,
  fetchUserRoles,
  type AuthProviderContext,
  type UserPrincipal,
} from "../console-app/src/lib/auth/provider";

// ---------------------------------------------------------------------------
// Helpers — reuse key generation from cf-access-jwt.test.ts
// ---------------------------------------------------------------------------

function base64url(obj: object): string {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

const NOW = Math.floor(Date.now() / 1000);
const VALID_AUD = "test-aud-1234";
const VALID_ISS = "https://test-team.cloudflareaccess.com";
const CERTS_URL = `${VALID_ISS}/cdn-cgi/access/certs`;

let rsaKeyPair: CryptoKeyPair;
let publicJwk: JsonWebKey;

async function getOrGenKeyPair(): Promise<{
  pair: CryptoKeyPair;
  jwk: JsonWebKey;
}> {
  if (!rsaKeyPair) {
    rsaKeyPair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    );
    publicJwk = await crypto.subtle.exportKey("jwk", rsaKeyPair.publicKey);
  }
  return { pair: rsaKeyPair, jwk: publicJwk };
}

async function signJwt(
  header: object,
  payload: object,
  privateKey: CryptoKey,
): Promise<string> {
  const enc = new TextEncoder();
  const hb64 = base64url(header);
  const pb64 = base64url(payload);
  const signingInput = enc.encode(`${hb64}.${pb64}`);
  const sigBytes = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    signingInput,
  );
  const sig = Buffer.from(sigBytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return `${hb64}.${pb64}.${sig}`;
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    aud: [VALID_AUD],
    iss: VALID_ISS,
    sub: "user@example.com",
    email: "user@example.com",
    iat: NOW - 60,
    exp: NOW + 3600,
    ...overrides,
  };
}

function mockCertsResponse(jwk: JsonWebKey, kid = "test-key-1") {
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        keys: [{ ...jwk, kid, use: "sig", alg: "RS256" }],
      }),
      { status: 200 },
    ),
  );
}

function makeCtx(
  headers: Headers,
  overrides: Partial<AuthProviderContext> = {},
): AuthProviderContext {
  return {
    headers,
    env: {
      CF_ACCESS_AUD: VALID_AUD,
      CF_ACCESS_TEAM_DOMAIN: VALID_ISS,
      ALLOWED_ACCESS_EMAILS: "user@example.com",
    },
    kv: undefined,
    ...overrides,
  };
}

/** Creates a mock D1Database with a stubbed prepare().bind().first() chain */
function mockD1(row: { roles: string; tenant_id: string } | null): D1Database {
  return {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(row),
      }),
    }),
  } as unknown as D1Database;
}

// ---------------------------------------------------------------------------
// fetchUserRoles (unit tests)
// ---------------------------------------------------------------------------
describe("fetchUserRoles", () => {
  it("returns ['viewer'] when db is undefined", async () => {
    const result = await fetchUserRoles(undefined, "anyone@example.com");
    expect(result.roles).toEqual(["viewer"]);
    expect(result.tenantId).toBeUndefined();
  });

  it("returns ['viewer'] when user has no row in console_user_roles", async () => {
    const db = mockD1(null);
    const result = await fetchUserRoles(db, "unknown@example.com");
    expect(result.roles).toEqual(["viewer"]);
  });

  it("returns roles from D1 for a known user", async () => {
    const db = mockD1({
      roles: '["admin", "editor"]',
      tenant_id: "tenant-123",
    });
    const result = await fetchUserRoles(db, "admin@example.com");
    expect(result.roles).toEqual(["admin", "editor"]);
    expect(result.tenantId).toBe("tenant-123");
  });

  it("returns ['viewer'] when D1 query throws", async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockRejectedValue(new Error("D1 unavailable")),
        }),
      }),
    } as unknown as D1Database;
    const result = await fetchUserRoles(db, "user@example.com");
    expect(result.roles).toEqual(["viewer"]);
  });

  it("returns ['viewer'] when roles JSON is an empty array", async () => {
    const db = mockD1({ roles: "[]", tenant_id: "tenant-1" });
    const result = await fetchUserRoles(db, "user@example.com");
    expect(result.roles).toEqual(["viewer"]);
  });
});

// ---------------------------------------------------------------------------
// CloudflareAccessProvider
// ---------------------------------------------------------------------------
describe("CloudflareAccessProvider", () => {
  const provider = new CloudflareAccessProvider();

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects expired JWT", async () => {
    const { pair, jwk } = await getOrGenKeyPair();
    const token = await signJwt(
      { alg: "RS256", typ: "JWT", kid: "test-key-1" },
      validPayload({ exp: NOW - 100 }),
      pair.privateKey,
    );
    const headers = new Headers({ "cf-access-jwt-assertion": token });
    mockCertsResponse(jwk);

    const result = await provider.resolve(makeCtx(headers));
    expect(result).toBeNull();
  });

  it("rejects wrong audience", async () => {
    const { pair, jwk } = await getOrGenKeyPair();
    const token = await signJwt(
      { alg: "RS256", typ: "JWT", kid: "test-key-1" },
      validPayload({ aud: ["wrong-audience"] }),
      pair.privateKey,
    );
    const headers = new Headers({ "cf-access-jwt-assertion": token });
    mockCertsResponse(jwk);

    const result = await provider.resolve(makeCtx(headers));
    expect(result).toBeNull();
  });

  it("fetches roles from D1 instead of hardcoding super-admin", async () => {
    const { pair, jwk } = await getOrGenKeyPair();
    const token = await signJwt(
      { alg: "RS256", typ: "JWT", kid: "test-key-1" },
      validPayload(),
      pair.privateKey,
    );
    const headers = new Headers({ "cf-access-jwt-assertion": token });
    mockCertsResponse(jwk);

    const db = mockD1({
      roles: '["admin", "editor"]',
      tenant_id: "tenant-abc",
    });

    const result = await provider.resolve(makeCtx(headers, { db }));
    expect(result).not.toBeNull();
    expect(result!.roles).toEqual(["admin", "editor"]);
    expect(result!.superAdmin).toBe(false);
    expect(result!.tenantId).toBe("tenant-abc");
  });

  it("rejects unauthenticated access (no JWT header)", async () => {
    const headers = new Headers(); // no cf-access-jwt-assertion
    const result = await provider.resolve(makeCtx(headers));
    expect(result).toBeNull();
  });

  it("assigns ['viewer'] role to unknown users (not super-admin)", async () => {
    const { pair, jwk } = await getOrGenKeyPair();
    const token = await signJwt(
      { alg: "RS256", typ: "JWT", kid: "test-key-1" },
      validPayload(),
      pair.privateKey,
    );
    const headers = new Headers({ "cf-access-jwt-assertion": token });
    mockCertsResponse(jwk);

    // D1 returns null — user not in console_user_roles
    const db = mockD1(null);

    const result = await provider.resolve(makeCtx(headers, { db }));
    expect(result).not.toBeNull();
    expect(result!.roles).toEqual(["viewer"]);
    expect(result!.superAdmin).toBe(false);
  });

  it("assigns super-admin when D1 roles include super-admin", async () => {
    const { pair, jwk } = await getOrGenKeyPair();
    const token = await signJwt(
      { alg: "RS256", typ: "JWT", kid: "test-key-1" },
      validPayload(),
      pair.privateKey,
    );
    const headers = new Headers({ "cf-access-jwt-assertion": token });
    mockCertsResponse(jwk);

    const db = mockD1({
      roles: '["super-admin"]',
      tenant_id: "tenant-admin",
    });

    const result = await provider.resolve(makeCtx(headers, { db }));
    expect(result).not.toBeNull();
    expect(result!.roles).toEqual(["super-admin"]);
    expect(result!.superAdmin).toBe(true);
  });

  it("falls back to ['viewer'] when D1 is unavailable", async () => {
    const { pair, jwk } = await getOrGenKeyPair();
    const token = await signJwt(
      { alg: "RS256", typ: "JWT", kid: "test-key-1" },
      validPayload(),
      pair.privateKey,
    );
    const headers = new Headers({ "cf-access-jwt-assertion": token });
    mockCertsResponse(jwk);

    // No db passed
    const result = await provider.resolve(makeCtx(headers));
    expect(result).not.toBeNull();
    expect(result!.roles).toEqual(["viewer"]);
    expect(result!.superAdmin).toBe(false);
  });

  it("rejects email not in allow-list", async () => {
    const { pair, jwk } = await getOrGenKeyPair();
    const token = await signJwt(
      { alg: "RS256", typ: "JWT", kid: "test-key-1" },
      validPayload({
        email: "unauthorized@example.com",
        sub: "unauthorized@example.com",
      }),
      pair.privateKey,
    );
    const headers = new Headers({ "cf-access-jwt-assertion": token });
    mockCertsResponse(jwk);

    const result = await provider.resolve(makeCtx(headers));
    expect(result).toBeNull();
  });

  it("returns null when CF_ACCESS config is missing", async () => {
    const headers = new Headers({ "cf-access-jwt-assertion": "some-token" });
    const ctx = makeCtx(headers, {
      env: {
        CF_ACCESS_AUD: "",
        CF_ACCESS_TEAM_DOMAIN: "",
      },
    });
    const result = await provider.resolve(ctx);
    expect(result).toBeNull();
  });
});
