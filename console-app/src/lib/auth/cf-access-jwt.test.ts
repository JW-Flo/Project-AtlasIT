/**
 * Tests for Cloudflare Access JWT validation.
 * Run with: vitest run console-app/src/lib/auth/cf-access-jwt.test.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateCfAccessJwt,
  buildCertsUrl,
  extractJwtClaims,
  type CfAccessJwtPayload,
  type JwtValidationResult,
} from "./cf-access-jwt";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function base64url(obj: object): string {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function makeUnsignedJwt(
  header: object,
  payload: object,
  sig = "fakesig",
): string {
  return `${base64url(header)}.${base64url(payload)}.${sig}`;
}

const NOW = Math.floor(Date.now() / 1000);
const VALID_AUD = "test-aud-1234";
const VALID_ISS = "https://test-team.cloudflareaccess.com";

function validPayload(
  overrides: Partial<CfAccessJwtPayload> = {},
): CfAccessJwtPayload {
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

/** Type-safe helper: asserts result is invalid and returns the reason string. */
function expectInvalid(result: JwtValidationResult): string {
  expect(result.valid).toBe(false);
  if (result.valid) throw new Error("Expected invalid result");
  return result.reason;
}

/** Type-safe helper: asserts result is valid and returns the claims. */
function expectValid(result: JwtValidationResult): CfAccessJwtPayload {
  expect(result.valid).toBe(true);
  if (!result.valid) throw new Error("Expected valid result");
  return result.claims;
}

// ---------------------------------------------------------------------------
// Real RS256 key pair for signature tests
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// buildCertsUrl
// ---------------------------------------------------------------------------
describe("buildCertsUrl", () => {
  it("builds certs URL from issuer", () => {
    const url = buildCertsUrl("https://example.cloudflareaccess.com");
    expect(url).toBe(
      "https://example.cloudflareaccess.com/cdn-cgi/access/certs",
    );
  });

  it("strips trailing slash from issuer", () => {
    const url = buildCertsUrl("https://example.cloudflareaccess.com/");
    expect(url).toBe(
      "https://example.cloudflareaccess.com/cdn-cgi/access/certs",
    );
  });
});

// ---------------------------------------------------------------------------
// extractJwtClaims
// ---------------------------------------------------------------------------
describe("extractJwtClaims", () => {
  it("returns null for a non-JWT string", () => {
    expect(extractJwtClaims("not-a-jwt")).toBeNull();
  });

  it("returns null for a two-part token", () => {
    expect(extractJwtClaims("a.b")).toBeNull();
  });

  it("returns null for malformed base64 payload", () => {
    expect(extractJwtClaims("header.!!!.sig")).toBeNull();
  });

  it("extracts claims from a well-formed JWT", () => {
    const token = makeUnsignedJwt({ alg: "RS256", typ: "JWT" }, validPayload());
    const claims = extractJwtClaims(token);
    expect(claims).not.toBeNull();
    expect(claims?.email).toBe("user@example.com");
    expect(claims?.iss).toBe(VALID_ISS);
    expect(Array.isArray(claims?.aud)).toBe(true);
  });

  it("handles aud as a string (non-array)", () => {
    const token = makeUnsignedJwt(
      { alg: "RS256" },
      validPayload({ aud: "single-aud" as unknown as string[] }),
    );
    const claims = extractJwtClaims(token);
    expect(claims?.aud).toBe("single-aud");
  });
});

// ---------------------------------------------------------------------------
// validateCfAccessJwt
// ---------------------------------------------------------------------------
describe("validateCfAccessJwt", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects when Cf-Access-Jwt-Assertion header is absent", async () => {
    const headers = new Headers();
    const result = await validateCfAccessJwt(headers, {
      audience: VALID_AUD,
      certsUrl: `${VALID_ISS}/cdn-cgi/access/certs`,
    });
    const reason = expectInvalid(result);
    expect(reason).toMatch(/missing/i);
  });

  it("rejects a malformed JWT (not 3 parts)", async () => {
    const headers = new Headers({ "cf-access-jwt-assertion": "bad.token" });
    const result = await validateCfAccessJwt(headers, {
      audience: VALID_AUD,
      certsUrl: `${VALID_ISS}/cdn-cgi/access/certs`,
    });
    const reason = expectInvalid(result);
    expect(reason).toMatch(/malformed/i);
  });

  it("rejects an expired token", async () => {
    const { pair, jwk } = await getOrGenKeyPair();
    const token = await signJwt(
      { alg: "RS256", typ: "JWT", kid: "test-key-1" },
      validPayload({ exp: NOW - 100 }),
      pair.privateKey,
    );
    const headers = new Headers({ "cf-access-jwt-assertion": token });

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          keys: [{ ...jwk, kid: "test-key-1", use: "sig", alg: "RS256" }],
        }),
        { status: 200 },
      ),
    );

    const result = await validateCfAccessJwt(headers, {
      audience: VALID_AUD,
      certsUrl: `${VALID_ISS}/cdn-cgi/access/certs`,
    });
    const reason = expectInvalid(result);
    expect(reason).toMatch(/expired/i);
  });

  it("rejects when audience does not match", async () => {
    const { pair, jwk } = await getOrGenKeyPair();
    const token = await signJwt(
      { alg: "RS256", typ: "JWT", kid: "test-key-1" },
      validPayload({ aud: ["wrong-aud"] }),
      pair.privateKey,
    );
    const headers = new Headers({ "cf-access-jwt-assertion": token });

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          keys: [{ ...jwk, kid: "test-key-1", use: "sig", alg: "RS256" }],
        }),
        { status: 200 },
      ),
    );

    const result = await validateCfAccessJwt(headers, {
      audience: VALID_AUD,
      certsUrl: `${VALID_ISS}/cdn-cgi/access/certs`,
    });
    const reason = expectInvalid(result);
    expect(reason).toMatch(/audience/i);
  });

  it("rejects when signature is invalid (wrong key)", async () => {
    const { pair: pair1 } = await getOrGenKeyPair();
    const pair2 = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    );
    const wrongJwk = await crypto.subtle.exportKey("jwk", pair2.publicKey);

    const token = await signJwt(
      { alg: "RS256", typ: "JWT", kid: "test-key-2" },
      validPayload(),
      pair1.privateKey, // signed with key1
    );
    const headers = new Headers({ "cf-access-jwt-assertion": token });

    // Certs returns key2 — wrong key
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          keys: [{ ...wrongJwk, kid: "test-key-2", use: "sig", alg: "RS256" }],
        }),
        { status: 200 },
      ),
    );

    const result = await validateCfAccessJwt(headers, {
      audience: VALID_AUD,
      certsUrl: `${VALID_ISS}/cdn-cgi/access/certs`,
    });
    const reason = expectInvalid(result);
    expect(reason).toMatch(/signature/i);
  });

  it("accepts a valid JWT with correct signature, audience, and expiry", async () => {
    const { pair, jwk } = await getOrGenKeyPair();
    const token = await signJwt(
      { alg: "RS256", typ: "JWT", kid: "test-key-1" },
      validPayload(),
      pair.privateKey,
    );
    const headers = new Headers({ "cf-access-jwt-assertion": token });

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          keys: [{ ...jwk, kid: "test-key-1", use: "sig", alg: "RS256" }],
        }),
        { status: 200 },
      ),
    );

    const result = await validateCfAccessJwt(headers, {
      audience: VALID_AUD,
      certsUrl: `${VALID_ISS}/cdn-cgi/access/certs`,
    });
    const claims = expectValid(result);
    expect(claims.email).toBe("user@example.com");
    expect(claims.sub).toBe("user@example.com");
  });

  it("rejects when certs endpoint returns a non-200 response", async () => {
    const { pair } = await getOrGenKeyPair();
    const token = await signJwt(
      { alg: "RS256", typ: "JWT", kid: "test-key-1" },
      validPayload(),
      pair.privateKey,
    );
    const headers = new Headers({ "cf-access-jwt-assertion": token });

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 }),
    );

    const result = await validateCfAccessJwt(headers, {
      audience: VALID_AUD,
      certsUrl: `${VALID_ISS}/cdn-cgi/access/certs`,
    });
    const reason = expectInvalid(result);
    expect(reason).toMatch(/certs/i);
  });

  it("rejects when no matching key found in certs (kid mismatch)", async () => {
    const { pair, jwk } = await getOrGenKeyPair();
    const token = await signJwt(
      { alg: "RS256", typ: "JWT", kid: "key-A" },
      validPayload(),
      pair.privateKey,
    );
    const headers = new Headers({ "cf-access-jwt-assertion": token });

    // Certs has key-B, not key-A
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          keys: [{ ...jwk, kid: "key-B", use: "sig", alg: "RS256" }],
        }),
        { status: 200 },
      ),
    );

    const result = await validateCfAccessJwt(headers, {
      audience: VALID_AUD,
      certsUrl: `${VALID_ISS}/cdn-cgi/access/certs`,
    });
    const reason = expectInvalid(result);
    expect(reason).toMatch(/key/i);
  });
});

// ---------------------------------------------------------------------------
// Auth guard integration tests
// ---------------------------------------------------------------------------
describe("Auth guard integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects requests without Cf-Access-Jwt-Assertion (401-equivalent)", async () => {
    const headers = new Headers();
    const result = await validateCfAccessJwt(headers, {
      audience: VALID_AUD,
      certsUrl: `${VALID_ISS}/cdn-cgi/access/certs`,
    });
    expect(result.valid).toBe(false);
    // Consumers map valid=false to a 401 response
  });

  it("includes auditable claims in a successful result", async () => {
    const { pair, jwk } = await getOrGenKeyPair();
    const token = await signJwt(
      { alg: "RS256", typ: "JWT", kid: "test-key-1" },
      validPayload(),
      pair.privateKey,
    );
    const headers = new Headers({ "cf-access-jwt-assertion": token });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              keys: [{ ...jwk, kid: "test-key-1", use: "sig", alg: "RS256" }],
            }),
            { status: 200 },
          ),
        ),
    );

    const result = await validateCfAccessJwt(headers, {
      audience: VALID_AUD,
      certsUrl: `${VALID_ISS}/cdn-cgi/access/certs`,
    });
    const claims = expectValid(result);
    expect(typeof claims.sub).toBe("string");
    expect(typeof claims.email).toBe("string");
    expect(typeof claims.iat).toBe("number");
    expect(typeof claims.exp).toBe("number");
  });
});
