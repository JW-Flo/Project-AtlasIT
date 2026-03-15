import type { ConnectorManifest } from "../../../connector-schema/src/manifest.js";

function generateBindingsType(manifest: ConnectorManifest): string {
  const lines: string[] = [];
  lines.push("type Bindings = {");
  lines.push("  ADAPTER_SECRET: string;");
  lines.push("  ORCHESTRATOR_URL: string;");
  lines.push("  ADAPTER_NAME: string;");
  lines.push("  DB: D1Database;");

  if (manifest.auth.model === "oauth2") {
    lines.push(`  ${manifest.auth.oauth2.clientIdEnvVar}: string;`);
    lines.push(`  ${manifest.auth.oauth2.clientSecretEnvVar}: string;`);
    lines.push("  OAUTH2_REDIRECT_URI: string;");
  } else if (manifest.auth.model === "api_key") {
    lines.push(`  ${manifest.auth.apiKey.envVar}: string;`);
  } else if (manifest.auth.model === "service_account") {
    lines.push("  SERVICE_ACCOUNT_CREDENTIALS: string;");
  }

  for (const field of manifest.configFields) {
    if (field.type === "secret") {
      lines.push(`  ${field.key.toUpperCase()}: string;`);
    }
  }

  lines.push("};");
  return lines.join("\n");
}

function generateWebhookRoutes(manifest: ConnectorManifest): string {
  const endpoints = manifest.webhookEndpoints ?? [];
  if (endpoints.length === 0) return "";

  const routes: string[] = [];
  for (const endpoint of endpoints) {
    const method = endpoint.method.toLowerCase();
    routes.push(`
// ${endpoint.description}
app.${method}("${endpoint.path}", async (c) => {
  const correlationId = c.get("correlationId");
  ${
    endpoint.authRequired
      ? `const signature = c.req.header("X-Signature");
  if (!signature) {
    return c.json({ error: "Missing signature", correlationId }, 401);
  }

  const rawBody = await c.req.text();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(c.env.ADAPTER_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expectedSig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (signature !== expectedSig) {
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  const body = JSON.parse(rawBody);`
      : `const body = await c.req.json();`
  }

  console.log(JSON.stringify({
    level: "info",
    correlationId,
    message: "Webhook received",
    path: "${endpoint.path}",
    tenantId: body.tenantId ?? "unknown",
  }));

  return c.json({ status: "received", correlationId });
});`);
  }

  return routes.join("\n");
}

function generateSyncEndpoint(manifest: ConnectorManifest): string {
  const capabilities = manifest.capabilities;
  const syncChecks: string[] = [];

  if (
    capabilities.includes("user-provisioning") ||
    capabilities.includes("directory-sync")
  ) {
    syncChecks.push(`    "users": "pending"`);
  }
  if (
    capabilities.includes("group-sync") ||
    capabilities.includes("group-management")
  ) {
    syncChecks.push(`    "groups": "pending"`);
  }
  if (capabilities.includes("compliance-scanning")) {
    syncChecks.push(`    "compliance": "pending"`);
  }

  const syncTargets =
    syncChecks.length > 0 ? syncChecks.join(",\n") : `    "default": "pending"`;

  return `
// Trigger a sync operation
app.post("/api/sync", async (c) => {
  const correlationId = c.get("correlationId");
  const body = await c.req.json<{ tenantId: string; scope?: string }>();

  if (!body.tenantId) {
    return c.json({ error: "tenantId is required", correlationId }, 400);
  }

  const syncId = crypto.randomUUID();

  await c.env.DB.prepare(
    "INSERT INTO sync_jobs (id, tenant_id, connector_slug, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5)"
  )
    .bind(syncId, body.tenantId, "${manifest.slug}", "pending", new Date().toISOString())
    .run();

  console.log(JSON.stringify({
    level: "info",
    correlationId,
    syncId,
    message: "Sync triggered",
    tenantId: body.tenantId,
    connector: "${manifest.slug}",
  }));

  return c.json({
    status: "accepted",
    syncId,
    correlationId,
    targets: {
${syncTargets}
    },
  });
});`;
}

function generateOAuthRoutes(manifest: ConnectorManifest): string {
  if (manifest.auth.model !== "oauth2") return "";

  return `

// OAuth2 authorization redirect
app.get("/auth/authorize", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.query("tenantId");

  if (!tenantId) {
    return c.json({ error: "tenantId query parameter is required", correlationId }, 400);
  }

  const state = btoa(JSON.stringify({ tenantId, correlationId }));
  const url = getAuthorizationUrl(c.env as unknown as Record<string, string>, state);

  return c.redirect(url);
});

// OAuth2 callback
app.get("/auth/callback", async (c) => {
  const correlationId = c.get("correlationId");
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");

  if (error) {
    const errorDescription = c.req.query("error_description") ?? "Unknown error";
    console.error(JSON.stringify({
      level: "error",
      correlationId,
      message: "OAuth callback error",
      error,
      errorDescription,
    }));
    return c.json({ error, errorDescription, correlationId }, 400);
  }

  if (!code || !state) {
    return c.json({ error: "Missing code or state parameter", correlationId }, 400);
  }

  let stateData: { tenantId: string; correlationId: string };
  try {
    stateData = JSON.parse(atob(state)) as { tenantId: string; correlationId: string };
  } catch {
    return c.json({ error: "Invalid state parameter", correlationId }, 400);
  }

  try {
    const tokens = await exchangeCodeForToken(c.env as unknown as Record<string, string>, code);

    await c.env.DB.prepare(
      "INSERT INTO connector_tokens (id, tenant_id, connector_slug, access_token, refresh_token, expires_at, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
    )
      .bind(
        crypto.randomUUID(),
        stateData.tenantId,
        "${manifest.slug}",
        tokens.access_token,
        tokens.refresh_token ?? null,
        new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        new Date().toISOString(),
      )
      .run();

    console.log(JSON.stringify({
      level: "info",
      correlationId,
      message: "OAuth tokens stored",
      tenantId: stateData.tenantId,
      connector: "${manifest.slug}",
    }));

    return c.json({ status: "authorized", tenantId: stateData.tenantId, correlationId });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(JSON.stringify({
      level: "error",
      correlationId,
      message: "Token exchange failed",
      error: errorMessage,
    }));
    return c.json({ error: errorMessage, correlationId }, 500);
  }
});`;
}

export function generateWorkerTemplate(manifest: ConnectorManifest): string {
  const bindings = generateBindingsType(manifest);
  const webhookRoutes = generateWebhookRoutes(manifest);
  const syncEndpoint = generateSyncEndpoint(manifest);
  const oauthRoutes = generateOAuthRoutes(manifest);

  const authImports: string[] = [];
  if (manifest.auth.model === "oauth2") {
    authImports.push(
      `import { authMiddleware, getAuthorizationUrl, exchangeCodeForToken } from "./auth.js";`,
    );
  } else if (manifest.auth.model !== "none") {
    authImports.push(`import { authMiddleware } from "./auth.js";`);
  }

  const authMiddlewareUse =
    manifest.auth.model !== "none"
      ? `\n// Apply auth middleware to protected routes\napp.use("/api/*", authMiddleware);`
      : "";

  return `import { Hono } from "hono";
import { validateConfig } from "./config.js";
${authImports.join("\n")}

${bindings}

type Variables = {
  correlationId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Correlation ID middleware
app.use("*", async (c, next) => {
  const correlationId = c.req.header("X-Correlation-ID") ?? crypto.randomUUID();
  c.set("correlationId", correlationId);
  c.header("X-Correlation-ID", correlationId);
  await next();
});
${authMiddlewareUse}

// Health endpoint
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "${manifest.version}",
    service: "${manifest.slug}",
    connector: {
      id: "${manifest.id}",
      name: "${manifest.name}",
      provider: "${manifest.provider}",
      capabilities: ${JSON.stringify(manifest.capabilities)},
    },
  });
});

// Webhook receiver from orchestrator
app.post("/webhook", async (c) => {
  const correlationId = c.get("correlationId");
  const signature = c.req.header("X-Signature");
  const eventId = c.req.header("X-Event-ID") ?? "unknown";

  if (!signature) {
    return c.json({ error: "Missing signature", correlationId }, 401);
  }

  const rawBody = await c.req.text();

  // Verify HMAC signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(c.env.ADAPTER_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expectedSig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (signature !== expectedSig) {
    console.error(JSON.stringify({
      level: "error",
      correlationId,
      eventId,
      message: "Invalid webhook signature",
    }));
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  const body = JSON.parse(rawBody);

  console.log(JSON.stringify({
    level: "info",
    correlationId,
    eventId,
    message: "Event received",
    eventType: body.type,
    tenantId: body.tenantId ?? "unknown",
  }));

  return c.json({ status: "processed", eventId, correlationId });
});
${syncEndpoint}

// Status endpoint
app.get("/api/status", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.query("tenantId");

  if (!tenantId) {
    return c.json({ error: "tenantId query parameter is required", correlationId }, 400);
  }

  const result = await c.env.DB.prepare(
    "SELECT id, status, created_at, completed_at FROM sync_jobs WHERE tenant_id = ?1 AND connector_slug = ?2 ORDER BY created_at DESC LIMIT 10"
  )
    .bind(tenantId, "${manifest.slug}")
    .all();

  return c.json({
    connector: "${manifest.slug}",
    tenantId,
    correlationId,
    recentSyncs: result.results,
  });
});
${oauthRoutes}${webhookRoutes}

export default app;
`;
}
