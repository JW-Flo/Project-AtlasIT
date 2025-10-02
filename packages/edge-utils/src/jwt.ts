// Minimal JWT helper (HS256) for edge/runtime usage without large deps.
// Not for production-grade multi-alg support; extend as needed.

interface CreateClaims {
  sub: string;
  email?: string;
  tenantId?: string;
  roles?: string[];
  iss?: string;
  aud?: string;
  exp?: number; // seconds epoch
}

function base64url(data: Uint8Array | string) {
  let str: string;
  if (typeof data === "string") {
    // Encode string as UTF-8, then to base64
    str = btoa(unescape(encodeURIComponent(data)));
  } else {
    // Uint8Array to string, then to base64
    let binary = "";
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    str = btoa(binary);
  }
  return str.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function hmac(key: string, msg: string) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
  return base64url(new Uint8Array(sig));
}

export async function createJWT(claims: CreateClaims, secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(claims));
  const toSign = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmac(secret, toSign);
  return `${toSign}.${signature}`;
}

export async function verifyJWT(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("malformed token");
  const [h, p, s] = parts;
  const data = `${h}.${p}`;
  const expected = await hmac(secret, data);
  if (expected !== s) throw new Error("signature mismatch");
  const base64 = p.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const decoded = decodeURIComponent(escape(atob(padded)));
  const json = JSON.parse(decoded);
  if (json.exp && Date.now() / 1000 > json.exp) throw new Error("expired");
  return json as CreateClaims;
}
