/**
 * JwtVerifier — verifies RS256/RS384/RS512 JWTs against a JWKS endpoint.
 *
 * Compatible with Cloudflare Workers (Web Crypto API) and Node.js 18+.
 * The JWKS is fetched once per instance and cached in-memory.
 */

import type { AuthContext } from "./types.js";

interface JwksKey {
  kty: string;
  use?: string;
  kid?: string;
  alg?: string;
  n?: string;
  e?: string;
  x5c?: string[];
}

interface Jwks {
  keys: JwksKey[];
}

interface JwtHeader {
  alg: string;
  kid?: string;
}

interface JwtPayload {
  sub?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  email?: string;
  tenant_id?: string;
  tenantId?: string;
  roles?: string[];
  role?: string;
  [key: string]: unknown;
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function importRsaPublicKey(
  jwk: JwksKey,
  algorithm: RsaHashedImportParams,
): Promise<CryptoKey> {
  const keyData = {
    kty: jwk.kty,
    n: jwk.n,
    e: jwk.e,
    alg: jwk.alg,
    use: jwk.use,
    kid: jwk.kid,
  };
  return crypto.subtle.importKey("jwk", keyData, algorithm, false, ["verify"]);
}

function algToSubtle(alg: string): RsaHashedImportParams {
  if (alg === "RS256") return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
  if (alg === "RS384") return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-384" };
  if (alg === "RS512") return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512" };
  throw new Error(`Unsupported JWT algorithm: ${alg}`);
}

export class JwtVerifier {
  private jwksCache: Jwks | null = null;
  private readonly jwksUrl: string;

  constructor(
    private readonly issuerUrl: string,
    private readonly audience: string,
  ) {
    this.jwksUrl = `${issuerUrl.replace(/\/$/, "")}/.well-known/jwks.json`;
  }

  private async getJwks(): Promise<Jwks> {
    if (this.jwksCache) return this.jwksCache;
    const res = await fetch(this.jwksUrl, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch JWKS from ${this.jwksUrl}: ${res.status}`);
    }
    this.jwksCache = (await res.json()) as Jwks;
    return this.jwksCache;
  }

  async verify(token: string): Promise<AuthContext> {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT format");

    const [headerB64, payloadB64, sigB64] = parts;

    const header = JSON.parse(new TextDecoder().decode(base64urlDecode(headerB64))) as JwtHeader;
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64))) as JwtPayload;

    // Validate expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("JWT has expired");
    }

    // Validate audience
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(this.audience)) {
      throw new Error(`JWT audience mismatch: expected ${this.audience}`);
    }

    // Validate issuer
    if (payload.iss && payload.iss !== this.issuerUrl) {
      throw new Error(`JWT issuer mismatch: expected ${this.issuerUrl}`);
    }

    // Find matching JWKS key
    const jwks = await this.getJwks();
    const matchingKey = header.kid
      ? jwks.keys.find((k) => k.kid === header.kid)
      : jwks.keys.find((k) => k.use === "sig");

    if (!matchingKey) {
      throw new Error(`No matching JWKS key found for kid=${header.kid ?? "(none)"}`);
    }

    const alg = header.alg ?? matchingKey.alg ?? "RS256";
    const cryptoKey = await importRsaPublicKey(matchingKey, algToSubtle(alg));

    const signingInput = `${headerB64}.${payloadB64}`;
    const sigBytes = base64urlDecode(sigB64);
    // Ensure crypto.subtle receives a plain ArrayBuffer (not a SharedArrayBuffer slice).
    const sigBuffer = new ArrayBuffer(sigBytes.byteLength);
    new Uint8Array(sigBuffer).set(sigBytes);
    const valid = await crypto.subtle.verify(
      algToSubtle(alg).name,
      cryptoKey,
      sigBuffer,
      new TextEncoder().encode(signingInput),
    );

    if (!valid) throw new Error("JWT signature verification failed");

    // Map payload claims to AuthContext
    const tenantId =
      (payload.tenant_id as string | undefined) ?? (payload.tenantId as string | undefined) ?? "";
    const roles: string[] = Array.isArray(payload.roles)
      ? payload.roles
      : payload.role
        ? [payload.role as string]
        : [];

    return {
      userId: payload.sub ?? "",
      tenantId,
      email: (payload.email as string | undefined) ?? "",
      roles,
      tokenType: "jwt",
    };
  }
}
