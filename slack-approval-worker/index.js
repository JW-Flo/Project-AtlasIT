import { Hono } from 'hono';

const app = new Hono();

// Helper to verify Slack signature
async function verifySlackSignature(req, body, signingSecret) {
  const timestamp = req.headers.get('x-slack-request-timestamp');
  const sig = req.headers.get('x-slack-signature');
  if (!timestamp || !sig) return false;
  const baseString = `v0:${timestamp}:${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(signingSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const hash = await crypto.subtle.sign('HMAC', key, encoder.encode(baseString));
  const mySig = 'v0=' + Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return crypto.timingSafeEqual(
    encoder.encode(mySig),
    encoder.encode(sig)
  );
}

app.post('/slack/approve', async (c) => {
  const body = await c.req.text();
  const signingSecret = c.env.SLACK_SIGNING_SECRET;
  if (!await verifySlackSignature(c.req, body, signingSecret)) {
    return c.text('Invalid signature', 401);
  }
  const payload = JSON.parse(new URLSearchParams(body).get('payload'));
  const action = payload.actions[0];
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