import type { Context } from "hono";
import type { Bindings, Variables } from "./types.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Verify Zendesk webhook signature using HMAC-SHA256.
 * Zendesk sends the signature in X-Zendesk-Webhook-Signature as a hex digest.
 * Uses ZENDESK_WEBHOOK_SECRET env var (not CRED_ENCRYPTION_KEY).
 */
async function verifySignature(
  secret: string,
  rawBody: string,
  signatureHeader: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(rawBody),
  );
  const expectedSig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison via length-check + char-by-char XOR
  if (signatureHeader.length !== expectedSig.length) return false;

  let mismatch = 0;
  for (let i = 0; i < signatureHeader.length; i++) {
    mismatch |= signatureHeader.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function handleZendeskWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("X-Zendesk-Webhook-Signature");

  if (!signatureHeader) {
    return c.json(
      { error: "Missing X-Zendesk-Webhook-Signature header", correlationId },
      401,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifySignature(
    c.env.ZENDESK_WEBHOOK_SECRET,
    rawBody,
    signatureHeader,
  );

  if (!valid) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Invalid Zendesk webhook signature",
      }),
    );
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return c.json({ error: "Invalid JSON payload", correlationId }, 400);
  }

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      message: "Zendesk webhook received",
      eventType: (body as Record<string, unknown>).type ?? "unknown",
    }),
  );

  return c.json({ status: "received", correlationId });
}

export function parseZendeskWebhookEvent(rawBody: string): unknown {
  return JSON.parse(rawBody);
}
