import type { Env } from "../env";

export interface HmacAuthResult {
  valid: true;
  rawBody: string;
  parsedBody: unknown;
}

export interface HmacAuthError {
  valid: false;
  status: number;
  message: string;
}

/**
 * Verify HMAC signature from X-Signature header against request body.
 * Returns parsed body on success, or an error descriptor on failure.
 */
export async function verifyHmacAuth(
  request: Request,
  env: Env,
  secretEnvKey: string = "WEBHOOK_SECRET",
): Promise<HmacAuthResult | HmacAuthError> {
  const signature = request.headers.get("X-Signature");
  if (!signature) {
    return { valid: false, status: 401, message: "Missing X-Signature header" };
  }

  const rawBody = await request.text();
  const secret = (env as Record<string, unknown>)[secretEnvKey] as
    | string
    | undefined;
  if (!secret) {
    console.error("HMAC secret not configured");
    return {
      valid: false,
      status: 500,
      message: "Authentication not configured",
    };
  }

  const isValid = await verifyHmac(rawBody, signature, secret);
  if (!isValid) {
    return { valid: false, status: 401, message: "Invalid signature" };
  }

  return { valid: true, rawBody, parsedBody: JSON.parse(rawBody) };
}

async function verifyHmac(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expected.length !== signature.length) return false;

  // Constant-time comparison
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}
