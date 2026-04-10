/**
 * JwtVerifier — validates a JWT against a remote JWKS endpoint.
 *
 * Uses the Web Crypto API (available in Cloudflare Workers, Node 18+,
 * and browsers) so there is no heavyweight third-party JWT library.
 */
import type { AuthContext } from "./types.js";

interface JwtHeader {
  alg: string;
  kid?: string;
}

interface JwtPayload {
  sub?: string;
  email?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  tenant_id?: string;
  tenantId?: string;
  roles?: string[];
  [key: string]: unknown;
}

interface JwksKey {
  kty: string;
  kid?: string;
  use?: string;
  alg?: string;
  n?: string;
  e?: string;
  x?: string;
  y?: string;
  crv?: string;
}

interface Jwks {
  keys: JwksKey[];
}

export class JwtVerifier {
  private jwksCache: Jwks | null = null;
  private jwksCachedAt = 0;
  private readonly jwksTtlMs = 60_000 * 10; // 10 minutes

  constructor(
    private readonly issuerUrl: string,
    private readonly audience: string,
  ) {}

  async verify(token: string): Promise<AuthContext> {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    const [headerB64, payloadB64] = parts;

    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8")) as JwtHeader;

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as JwtPayload;

    // Basic claims validation
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp !== undefined && payload.exp < now) {
      throw new Error("JWT has expired");
    }

    const issuer = this.issuerUrl.replace(/\/$/, "");
    if (payload.iss && payload.iss.replace(/\/$/, "") !== issuer) {
      throw new Error(`JWT issuer mismatch: ${payload.iss}`);
    }

    const audClaim = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (payload.aud !== undefined && !audClaim.includes(this.audience)) {
      throw new Error(`JWT audience mismatch`);
    }

    // Signature verification via JWKS
    await this.verifySignature(token, header);

    const tenantId = (payload.tenant_id ?? payload.tenantId ?? "") as string;
    const userId = (payload.sub ?? "") as string;
    const email = (payload.email ?? "") as string;
    const roles = Array.isArray(payload.roles) ? (payload.roles as string[]) : ["member"];

    return { tenantId, userId, email, roles, tokenType: "jwt" };
  }

  private async getJwks(): Promise<Jwks> {
    const now = Date.now();
    if (this.jwksCache && now - this.jwksCachedAt < this.jwksTtlMs) {
      return this.jwksCache;
    }

    const jwksUri = `${this.issuerUrl.replace(/\/$/, "")}/.well-known/jwks.json`;
    const res = await fetch(jwksUri);
    if (!res.ok) {
      throw new Error(`Failed to fetch JWKS from ${jwksUri}: ${res.status}`);
    }

    const jwks = (await res.json()) as Jwks;
    this.jwksCache = jwks;
    this.jwksCachedAt = now;
    return jwks;
  }

  private async verifySignature(token: string, header: JwtHeader): Promise<void> {
    const jwks = await this.getJwks();

    const key = header.kid ? jwks.keys.find((k) => k.kid === header.kid) : jwks.keys[0];

    if (!key) {
      throw new Error(`No matching JWK found for kid=${header.kid}`);
    }

    const parts = token.split(".");
    const signingInput = `${parts[0]}.${parts[1]}`;
    const signatureBytes = Buffer.from(parts[2], "base64url");

    const alg = header.alg ?? key.alg ?? "RS256";
    const cryptoKey = await this.importJwk(key, alg);

    const valid = await crypto.subtle.verify(
      this.algorithmParams(alg),
      cryptoKey,
      signatureBytes,
      new TextEncoder().encode(signingInput),
    );

    if (!valid) {
      throw new Error("JWT signature verification failed");
    }
  }

  private algorithmParams(alg: string): AlgorithmIdentifier | RsaPssParams | EcdsaParams {
    switch (alg) {
      case "RS256":
        return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
      case "RS384":
        return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-384" };
      case "RS512":
        return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512" };
      case "PS256":
        return { name: "RSA-PSS", saltLength: 32 };
      case "PS384":
        return { name: "RSA-PSS", saltLength: 48 };
      case "PS512":
        return { name: "RSA-PSS", saltLength: 64 };
      case "ES256":
        return { name: "ECDSA", hash: "SHA-256" };
      case "ES384":
        return { name: "ECDSA", hash: "SHA-384" };
      case "ES512":
        return { name: "ECDSA", hash: "SHA-512" };
      default:
        throw new Error(`Unsupported JWT algorithm: ${alg}`);
    }
  }

  private async importJwk(key: JwksKey, alg: string): Promise<CryptoKey> {
    const keyUsages: KeyUsage[] = ["verify"];
    const format = "jwk";

    switch (alg) {
      case "RS256":
      case "RS384":
      case "RS512":
        return crypto.subtle.importKey(
          format,
          key as JsonWebKey,
          { name: "RSASSA-PKCS1-v1_5", hash: alg.replace("RS", "SHA-") },
          false,
          keyUsages,
        );
      case "PS256":
      case "PS384":
      case "PS512":
        return crypto.subtle.importKey(
          format,
          key as JsonWebKey,
          { name: "RSA-PSS", hash: alg.replace("PS", "SHA-") },
          false,
          keyUsages,
        );
      case "ES256":
      case "ES384":
      case "ES512":
        return crypto.subtle.importKey(
          format,
          key as JsonWebKey,
          { name: "ECDSA", namedCurve: key.crv ?? "P-256" },
          false,
          keyUsages,
        );
      default:
        throw new Error(`Unsupported algorithm for key import: ${alg}`);
    }
  }
}
