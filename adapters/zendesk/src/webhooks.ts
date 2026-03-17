import type { Context } from "hono";

export async function verifyZendeskWebhookSignature(
  c: Context,
  secret: string,
): Promise<boolean> {
  const signature = c.req.header("X-Zendesk-Webhook-Signature");
  if (!signature) return false;

  const rawBody = await c.req.text();

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

  return signature === expectedSig;
}

export function parseZendeskWebhookEvent(rawBody: string): unknown {
  return JSON.parse(rawBody);
}
