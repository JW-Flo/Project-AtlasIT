import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { serve } from '@hono/node-server';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['https://mcp.project-ignite.kd8jc7v8cd.workers.dev'],
  allowMethods: ['POST', 'GET'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}));

// Client registry (in production, this would be in KV)
const CLIENTS = new Map([
  ['mcp-mobile', {
    clientId: 'mcp-mobile',
    clientSecret: process.env.MCP_MOBILE_SECRET,
    redirectUris: ['https://mcp.project-ignite.kd8jc7v8cd.workers.dev/callback'],
    grantTypes: ['client_credentials'],
    scopes: ['mcp:read', 'mcp:write']
  }]
]);

// Token endpoint
app.post('/token', async (c) => {
  const { grant_type, client_id, client_secret, scope } = await c.req.json();

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
  const token = await generateToken(client_id, scope);
  
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
  
  try {
    const decoded = await verifyToken(token);
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
async function generateToken(clientId, scope) {
  const payload = {
    client_id: clientId,
    scope: scope || 'mcp:read',
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
}

// Verify JWT token
async function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Health check
app.get('/healthz', (c) => c.text('OK'));

// Development server
if (process.env.NODE_ENV === 'development') {
  serve({
    fetch: app.fetch,
    port: 3000
  }, (info) => {
    console.log(`IdP server running at http://localhost:${info.port}`);
  });
}

export default app; 