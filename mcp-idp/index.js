import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['https://atlasit-mcp.kd8jc7v8cd.workers.dev'],
  allowMethods: ['POST', 'GET'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}));

function buildClients(env) {
  return new Map([
    ['mcp-mobile', {
      clientId: 'mcp-mobile',
      clientSecret: env.MCP_MOBILE_SECRET,
      redirectUris: ['https://atlasit-mcp.kd8jc7v8cd.workers.dev/callback'],
      grantTypes: ['client_credentials'],
      scopes: ['mcp:read', 'mcp:write']
    }]
  ])
}

// Token endpoint
app.post('/token', async (c) => {
  const { grant_type, client_id, client_secret, scope } = await c.req.json();
  const CLIENTS = buildClients(c.env);

  // Validate client credentials
  const client = CLIENTS.get(client_id);
  if (!client || client.clientSecret !== client_secret) {
    return c.json({ error: 'invalid_client' }, 401);
  }

  // Validate grant type
  if (grant_type !== 'client_credentials') {
    return c.json({ error: 'unsupported_grant_type' }, 400);
  }

  // Generate access token
  const token = await generateToken(client_id, scope, client.clientSecret);
  
  return c.json({
    access_token: token,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: scope || 'mcp:read'
  });
});

// Token introspection endpoint
app.post('/introspect', async (c) => {
  const { token } = await c.req.json();
  const env = c.env;
  const secret = env.JWT_SECRET;
  
  try {
    const decoded = await verifyToken(token, secret);
    return c.json({
      active: true,
      client_id: decoded.client_id,
      scope: decoded.scope,
      exp: decoded.exp
    });
  } catch (error) {
    return c.json({ active: false });
  }
});

// Generate JWT token
async function generateToken(clientId, scope, secret) {
  const payload = {
    client_id: clientId,
    scope: scope || 'mcp:read',
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  return jwt.sign(payload, secret);
}

// Verify JWT token
async function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

// Health check
app.get('/healthz', (c) => c.text('OK'));

// Wrapping fetch to inject env-based secrets
export default {
  async fetch(request, env, ctx) {
    // expose env to helper functions
    const secret = env.JWT_SECRET;

    // patch helper functions via closure
    globalThis.__idp_secret = secret;

    generateToken = (clientId, scope) => jwt.sign({ client_id: clientId, scope: scope || 'mcp:read', exp: Math.floor(Date.now()/1000)+3600 }, secret);
    verifyToken  = (tok) => jwt.verify(tok, secret);

    // rebuild clients per request with fresh env
    globalThis.buildClients = () => buildClients(env);

    return app.fetch(request, env, ctx);
  }
}; 