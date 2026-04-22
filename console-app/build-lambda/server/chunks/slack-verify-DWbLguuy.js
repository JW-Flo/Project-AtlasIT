const MAX_TIMESTAMP_DRIFT_S = 300;
async function verifySlackSignature(body, timestamp, signature, signingSecret) {
  if (!timestamp || !signature) return false;
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() / 1e3 - ts) > MAX_TIMESTAMP_DRIFT_S) {
    return false;
  }
  const baseString = `v0:${timestamp}:${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const hashBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(baseString)
  );
  const computed = "v0=" + Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (computed.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}
async function requireSlackSignature(request, env) {
  const correlationId = crypto.randomUUID();
  const signingSecret = env["SLACK_SIGNING_SECRET"];
  if (!signingSecret) {
    console.error(
      JSON.stringify({ level: "error", event: "slack.missing_signing_secret" })
    );
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500
    });
  }
  const body = await request.text();
  const timestamp = request.headers.get("x-slack-request-timestamp");
  const signature = request.headers.get("x-slack-signature");
  const valid = await verifySlackSignature(
    body,
    timestamp,
    signature,
    signingSecret
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
        secretLength: signingSecret.length
      })
    );
    return new Response(JSON.stringify({ error: "invalid_signature", correlationId }), {
      status: 401
    });
  }
  return { body };
}

export { requireSlackSignature as r };
//# sourceMappingURL=slack-verify-DWbLguuy.js.map
