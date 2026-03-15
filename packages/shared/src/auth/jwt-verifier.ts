import type { AuthContext, JwtClaims } from "./types.js";

interface JwksKey {
  kid: string;
  kty: string;
  n: string;
  e: string;
  use: string;
}

interface Jwks {
  keys: JwksKey[];
}

export class JwtVerifier {
  private jwksCache: Jwks | null = null;
  private jwksCacheExpiry = 0;

  constructor(
    private readonly issuerUrl: string,
    private readonly audience: string,
    private readonly cacheTtlMs = 3600_000,
  ) {}

  async verify(token: string): Promise<AuthContext> {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT format");

    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1])) as JwtClaims;

    // Validate claims
    if (payload.iss !== this.issuerUrl) throw new Error("Invalid issuer");
    if (payload.token_use === "id" && payload.aud !== this.audience)
      throw new Error("Invalid audience");
    if (payload.exp * 1000 < Date.now()) throw new Error("Token expired");

    // Verify signature
    const jwks = await this.getJwks();
    const jwk = jwks.keys.find((k) => k.kid === header.kid);
    if (!jwk) throw new Error("Unknown signing key");

    const key = await crypto.subtle.importKey(
      "jwk",
      { kty: jwk.kty, n: jwk.n, e: jwk.e },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const signature = base64UrlToBuffer(parts[2]);
    const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      signature,
      data,
    );
    if (!valid) throw new Error("Invalid signature");

    const roles = payload["custom:roles"]
      ? payload["custom:roles"].split(",").map((r) => r.trim())
      : [];

    return {
      tenantId: payload["custom:tenant_id"] ?? "",
      userId: payload.sub,
      email: payload.email ?? "",
      roles,
      tokenType: "jwt",
    };
  }

  private async getJwks(): Promise<Jwks> {
    if (this.jwksCache && Date.now() < this.jwksCacheExpiry) {
      return this.jwksCache;
    }
    const response = await fetch(`${this.issuerUrl}/.well-known/jwks.json`);
    if (!response.ok)
      throw new Error(`Failed to fetch JWKS: ${response.status}`);
    this.jwksCache = (await response.json()) as Jwks;
    this.jwksCacheExpiry = Date.now() + this.cacheTtlMs;
    return this.jwksCache;
  }
}

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return atob(padded + "=".repeat(padLength));
}

function base64UrlToBuffer(str: string): ArrayBuffer {
  const binary = base64UrlDecode(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
