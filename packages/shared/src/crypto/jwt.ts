/**
 * Minimal JWT (HS256) implementation using Web Crypto API.
 * Compatible with Cloudflare Workers — no Node.js dependencies.
 */

export interface JwtPayload {
  sub: string;
  iss?: string;
  aud?: string;
  exp: number;
  iat: number;
  [key: string]: unknown;
}

function base64urlEncode(data: Uint8Array): string {
  const str = btoa(String.fromCharCode(...data));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (c) => c.charCodeAt(0));
}

function encodeJson(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  return base64urlEncode(bytes);
}

async function hmacSign(key: CryptoKey, data: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64urlEncode(new Uint8Array(sig));
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Sign a JWT with HS256. */
export async function signJwt(payload: JwtPayload, secret: string): Promise<string> {
  const header = encodeJson({ alg: "HS256", typ: "JWT" });
  const body = encodeJson(payload);
  const key = await importKey(secret);
  const signature = await hmacSign(key, `${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

/** Verify and decode a JWT. Returns null if invalid or expired. */
export async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;

  try {
    const key = await importKey(secret);
    const expectedSig = await hmacSign(key, `${header}.${body}`);
    if (expectedSig !== signature) return null;

    const decoded = JSON.parse(new TextDecoder().decode(base64urlDecode(body)));

    // Check expiry
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return decoded as JwtPayload;
  } catch {
    return null;
  }
}
