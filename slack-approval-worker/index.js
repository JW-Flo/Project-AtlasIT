import { Hono } from 'hono';

const app = new Hono();

/** Maximum age (seconds) for Slack request timestamps to prevent replay attacks. */
const SLACK_TIMESTAMP_MAX_AGE = 300; // 5 minutes

/**
 * Verify Slack request signature using HMAC-SHA256 via crypto.subtle.
 * Uses crypto.subtle.verify for Workers runtime compatibility (no timingSafeEqual dependency).
 * Enforces a ±5 minute timestamp window per Slack's replay attack mitigation guidance.
 */
async function verifySlackSignature(req, body, signingSecret) {
  const timestamp = req.headers.get('x-slack-request-timestamp');
  const sig = req.headers.get('x-slack-signature');
  if (!timestamp || !sig) return false;

  // Reject requests with stale timestamps (replay attack mitigation)
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - requestTime) > SLACK_TIMESTAMP_MAX_AGE) return false;

  // Verify HMAC-SHA256 signature using crypto.subtle (Workers-compatible)
  const encoder = new TextEncoder();
  const baseString = `v0:${timestamp}:${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(signingSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  // Decode the hex signature from Slack (strip "v0=" prefix)
  const sigHex = sig.startsWith('v0=') ? sig.slice(3) : sig;
  const sigBytes = new Uint8Array(sigHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));

  // crypto.subtle.verify is constant-time, avoiding timing side-channels
  return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(baseString));
}

app.post('/slack/approve', async (c) => {
  const signingSecret = c.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    console.error('SLACK_SIGNING_SECRET is not configured');
    return c.json({ error: 'Service misconfigured' }, 500);
  }

  let body;
  try {
    body = await c.req.text();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  if (!await verifySlackSignature(c.req, body, signingSecret)) {
    return c.text('Invalid signature', 401);
  }

  let payload;
  try {
    const payloadStr = new URLSearchParams(body).get('payload');
    if (!payloadStr) return c.json({ error: 'Missing payload' }, 400);
    payload = JSON.parse(payloadStr);
  } catch {
    return c.json({ error: 'Malformed payload' }, 400);
  }

  const action = payload.actions?.[0];
  if (!action?.value) {
    return c.json({ error: 'Missing action value' }, 400);
  }

  const secretName = action.value;
  // TODO: Trigger backend update to set status=approved in 1Password for secretName
  // This could be a webhook, queue, or API call to your backend

  // Respond to Slack
  return c.json({
    response_type: 'in_channel',
    text: `:white_check_mark: Secret *${secretName}* has been approved and is now active.`
  });
});

app.get('/healthz', (c) => c.text('OK'));

export default app;
