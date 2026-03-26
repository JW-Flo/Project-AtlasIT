/**
 * Slack request signature verification (v0 HMAC-SHA256).
 * See: https://api.slack.com/authentication/verifying-requests-from-slack
 */

const MAX_TIMESTAMP_DRIFT_S = 300; // 5 minutes

export async function verifySlackSignature(
  body: string,
  timestamp: string | null,
  signature: string | null,
  signingSecret: string,
): Promise<boolean> {
  if (!timestamp || !signature) return false;

  // Reject requests older than 5 minutes (replay protection)
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > MAX_TIMESTAMP_DRIFT_S) {
    return false;
  }

  const baseString = `v0:${timestamp}:${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const hashBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(baseString),
  );
  const computed =
    "v0=" +
    Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  // Timing-safe comparison
  if (computed.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Extract signing secret from platform env and verify, returning the raw body or a 401 Response. */
export async function requireSlackSignature(
  request: Request,
  env: Record<string, unknown>,
): Promise<{ body: string } | Response> {
  const correlationId = crypto.randomUUID();
  const signingSecret = env["SLACK_SIGNING_SECRET"] as string | undefined;
  if (!signingSecret) {
    console.error(
      JSON.stringify({ level: "error", event: "slack.missing_signing_secret" }),
    );
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
    });
  }

  const body = await request.text();
  const timestamp = request.headers.get("x-slack-request-timestamp");
  const signature = request.headers.get("x-slack-signature");

  const valid = await verifySlackSignature(
    body,
    timestamp,
    signature,
    signingSecret,
  );
  if (!valid) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "slack.invalid_signature",
        correlationId,
        hasTimestamp: !!timestamp,
        hasSignature: !!signature,
        bodyLength: body.length,
        secretLength: signingSecret.length,
      }),
    );
    return new Response(JSON.stringify({ error: "invalid_signature", correlationId }), {
      status: 401,
    });
  }

  return { body };
}
