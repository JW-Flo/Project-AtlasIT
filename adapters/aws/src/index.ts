import { Hono } from "hono";
import type { Bindings, AwsConfig, SyncResult } from "./types.js";
import { authMiddleware } from "./auth.js";
import { signAwsRequest } from "./sigv4.js";
import { syncUsers } from "./sync/users.js";
import { syncGroups } from "./sync/groups.js";
import { publishEvent } from "./event-publisher.js";

type Variables = {
  correlationId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// --- Middleware ---

// Correlation ID
app.use("*", async (c, next) => {
  const correlationId = c.req.header("X-Correlation-ID") ?? crypto.randomUUID();
  c.set("correlationId", correlationId);
  c.header("X-Correlation-ID", correlationId);
  await next();
});

// Security headers
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  c.header(
    "Content-Security-Policy",
    "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';",
  );
});

// Auth on /api/* routes
app.use("/api/*", authMiddleware);

// Per-tenant rate limiting on /api/*
const requestCounters = new Map<string, { count: number; resetAt: number }>();
app.use("/api/*", async (c, next) => {
  const tenantId = c.req.header("X-Tenant-ID") ?? "default";
  const endpoint = c.req.method + " " + new URL(c.req.url).pathname;
  const key = tenantId + ":" + endpoint;
  const now = Date.now();
  const limit = 120;
  const windowMs = 60_000;
  const existing = requestCounters.get(key);
  const current =
    !existing || existing.resetAt <= now ? { count: 0, resetAt: now + windowMs } : existing;
  if (current.count >= limit) {
    return c.json({ error: "Rate limit exceeded", correlationId: c.get("correlationId") }, 429);
  }
  current.count += 1;
  requestCounters.set(key, current);
  await next();
});

// --- Helper ---

function buildAwsConfig(env: Bindings): AwsConfig {
  return {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION ?? "us-east-1",
  };
}

// --- Routes ---

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "aws-connector",
    connector: {
      id: c.env.CONNECTOR_ID ?? "aws",
      name: "AWS",
      provider: "Amazon Web Services",
      capabilities: ["user-provisioning", "user-deprovisioning", "group-management"],
      syncMode: "polling",
    },
  });
});

// Webhook receiver from orchestrator (HMAC-verified)
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
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        eventId,
        message: "Invalid webhook signature",
      }),
    );
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  const body = JSON.parse(rawBody);

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      eventId,
      message: "Event received",
      eventType: body.type,
      tenantId: body.tenantId ?? "unknown",
    }),
  );

  return c.json({ status: "processed", eventId, correlationId });
});

// Trigger a full directory sync (users + groups + memberships)
app.post("/api/sync", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header", correlationId }, 400);
  }

  const config = buildAwsConfig(c.env);

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      tenantId,
      message: "Starting AWS IAM directory sync",
      region: config.region,
    }),
  );

  try {
    // Users must sync before groups (memberships reference user rows)
    const userResult = await syncUsers(config, c.env.DB, tenantId);
    const groupResult = await syncGroups(config, c.env.DB, tenantId);

    const result: SyncResult = {
      users: userResult,
      groups: groupResult,
    };

    // Update connection status
    await updateConnectionStatus(c.env.DB, tenantId, userResult.total, groupResult.total);

    // Publish sync-completed event to orchestrator
    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: "directory.sync.completed",
      source: "adapter-aws",
      correlationId,
      payload: result,
    }).catch((err) => {
      // Non-fatal: log but don't fail the sync
      console.error(
        JSON.stringify({
          level: "warn",
          correlationId,
          tenantId,
          message: "Failed to publish sync event",
          error: err instanceof Error ? err.message : "Unknown",
        }),
      );
    });

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        tenantId,
        message: "AWS IAM directory sync completed",
        users: result.users,
        groups: result.groups,
      }),
    );

    return c.json({ status: "synced", correlationId, data: result });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";

    await updateConnectionStatus(c.env.DB, tenantId, 0, 0, errorMsg);

    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "AWS IAM directory sync failed",
        error: errorMsg,
      }),
    );

    return c.json({ error: errorMsg, correlationId }, 500);
  }
});

// Sync users only
app.post("/api/sync/users", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header", correlationId }, 400);
  }

  const config = buildAwsConfig(c.env);

  try {
    const result = await syncUsers(config, c.env.DB, tenantId);
    return c.json({ status: "synced", correlationId, data: result });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";
    return c.json({ error: errorMsg, correlationId }, 500);
  }
});

// Sync groups only
app.post("/api/sync/groups", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header", correlationId }, 400);
  }

  const config = buildAwsConfig(c.env);

  try {
    const result = await syncGroups(config, c.env.DB, tenantId);
    return c.json({ status: "synced", correlationId, data: result });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";
    return c.json({ error: errorMsg, correlationId }, 500);
  }
});

// Connection status
app.get("/api/status", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header", correlationId }, 400);
  }

  const connection = await c.env.DB.prepare(
    "SELECT status, error_msg, last_sync_at, user_count, group_count FROM directory_connections WHERE tenant_id = ?",
  )
    .bind(tenantId)
    .first<{
      status: string;
      error_msg: string | null;
      last_sync_at: string | null;
      user_count: number;
      group_count: number;
    }>();

  if (!connection) {
    return c.json({
      status: "not_connected",
      lastSyncAt: null,
      userCount: 0,
      groupCount: 0,
      correlationId,
    });
  }

  return c.json({
    status: connection.status,
    error: connection.error_msg,
    lastSyncAt: connection.last_sync_at,
    userCount: connection.user_count,
    groupCount: connection.group_count,
    correlationId,
  });
});

// --- Internal helpers ---

async function updateConnectionStatus(
  db: D1Database,
  tenantId: string,
  userCount: number,
  groupCount: number,
  error?: string,
): Promise<void> {
  const existing = await db
    .prepare("SELECT id FROM directory_connections WHERE tenant_id = ?")
    .bind(tenantId)
    .first();

  if (existing) {
    await db
      .prepare(
        `UPDATE directory_connections
         SET status = ?, error_msg = ?, last_sync_at = datetime('now'),
             user_count = ?, group_count = ?, updated_at = datetime('now')
         WHERE tenant_id = ?`,
      )
      .bind(error ? "error" : "active", error ?? null, userCount, groupCount, tenantId)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO directory_connections
         (tenant_id, provider, status, error_msg, last_sync_at, user_count, group_count)
         VALUES (?, ?, ?, ?, datetime('now'), ?, ?)`,
      )
      .bind(tenantId, "aws", error ? "error" : "active", error ?? null, userCount, groupCount)
      .run();
  }
}

// ---------------------------------------------------------------------------
// IAM provisioning helpers
// ---------------------------------------------------------------------------

function deriveIamUsername(email: string): string {
  const local = email.split("@")[0];
  // IAM usernames: max 64 chars, allowed chars [a-zA-Z0-9+=,.@_-]
  return local.replace(/[^a-zA-Z0-9+=,.@_-]/g, "_").slice(0, 64);
}

async function iamPost(
  params: Record<string, string>,
  config: AwsConfig,
): Promise<{ ok: boolean; status: number; xml: string }> {
  const body = new URLSearchParams({ ...params, Version: "2010-05-08" }).toString();
  const url = "https://iam.amazonaws.com/";
  const signedHeaders = await signAwsRequest(
    "POST",
    url,
    "iam",
    config.region,
    config.accessKeyId,
    config.secretAccessKey,
    body,
  );
  const res = await fetch(url, {
    method: "POST",
    headers: { ...signedHeaders, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const xml = await res.text();
  return { ok: res.ok, status: res.status, xml };
}

function xmlErrorCode(xml: string): string | null {
  const m = xml.match(/<Code>([^<]+)<\/Code>/);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------------------
// Provision — create IAM user
// ---------------------------------------------------------------------------
app.post("/api/provision", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header", correlationId }, 400);
  }

  type ProvisionBody = {
    tenantId?: string;
    userProfile?: { email?: string; displayName?: string; firstName?: string; lastName?: string };
    config?: Record<string, unknown>;
  };

  const body = await c.req.json<ProvisionBody>().catch((): ProvisionBody => ({}));
  const email = body.userProfile?.email;

  if (!email) {
    return c.json({ error: "Missing userProfile.email in request body", correlationId }, 400);
  }

  const username = deriveIamUsername(email);
  const config = buildAwsConfig(c.env);

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      tenantId,
      message: "Provisioning IAM user",
      username,
    }),
  );

  // Step 1: CreateUser
  const createRes = await iamPost(
    { Action: "CreateUser", UserName: username, Path: "/atlasit/" },
    config,
  );

  if (!createRes.ok) {
    const code = xmlErrorCode(createRes.xml);
    if (code !== "EntityAlreadyExists") {
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          tenantId,
          message: "CreateUser failed",
          username,
          awsErrorCode: code,
        }),
      );
      return c.json({ error: `AWS CreateUser failed: ${code ?? "Unknown"}`, correlationId }, 502);
    }
    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        tenantId,
        message: "IAM user already exists, continuing with tag update",
        username,
      }),
    );
  }

  // Step 2: TagUser
  const tagRes = await iamPost(
    {
      Action: "TagUser",
      UserName: username,
      "Tags.member.1.Key": "email",
      "Tags.member.1.Value": email,
      "Tags.member.2.Key": "tenant_id",
      "Tags.member.2.Value": tenantId,
    },
    config,
  );

  if (!tagRes.ok) {
    const code = xmlErrorCode(tagRes.xml);
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "TagUser failed",
        username,
        awsErrorCode: code,
      }),
    );
    return c.json({ error: `AWS TagUser failed: ${code ?? "Unknown"}`, correlationId }, 502);
  }

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      tenantId,
      message: "IAM user provisioned",
      username,
    }),
  );

  return c.json({
    status: "provisioned",
    correlationId,
    username,
    iamPath: "/atlasit/",
    email,
    tenantId,
  });
});

// ---------------------------------------------------------------------------
// Deprovision — delete IAM user and clean up dependencies
// ---------------------------------------------------------------------------
app.post("/api/deprovision", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header", correlationId }, 400);
  }

  type DeprovisionBody = {
    tenantId?: string;
    userProfile?: { email?: string; displayName?: string; firstName?: string; lastName?: string };
    config?: Record<string, unknown>;
  };

  const body = await c.req.json<DeprovisionBody>().catch((): DeprovisionBody => ({}));
  const email = body.userProfile?.email;

  if (!email) {
    return c.json({ error: "Missing userProfile.email in request body", correlationId }, 400);
  }

  const username = deriveIamUsername(email);
  const config = buildAwsConfig(c.env);

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      tenantId,
      message: "Deprovisioning IAM user",
      username,
    }),
  );

  // Step 1: Delete access keys
  const listKeysRes = await iamPost({ Action: "ListAccessKeys", UserName: username }, config);
  if (listKeysRes.ok) {
    const keyIds = [...listKeysRes.xml.matchAll(/<AccessKeyId>([^<]+)<\/AccessKeyId>/g)].map(
      (m) => m[1],
    );
    for (const keyId of keyIds) {
      await iamPost({ Action: "DeleteAccessKey", UserName: username, AccessKeyId: keyId }, config);
    }
  }

  // Step 2: Detach managed policies
  const listPoliciesRes = await iamPost(
    { Action: "ListAttachedUserPolicies", UserName: username },
    config,
  );
  if (listPoliciesRes.ok) {
    const policyArns = [...listPoliciesRes.xml.matchAll(/<PolicyArn>([^<]+)<\/PolicyArn>/g)].map(
      (m) => m[1],
    );
    for (const arn of policyArns) {
      await iamPost({ Action: "DetachUserPolicy", UserName: username, PolicyArn: arn }, config);
    }
  }

  // Step 3: Remove from groups
  const listGroupsRes = await iamPost({ Action: "ListGroupsForUser", UserName: username }, config);
  if (listGroupsRes.ok) {
    const groupNames = [...listGroupsRes.xml.matchAll(/<GroupName>([^<]+)<\/GroupName>/g)].map(
      (m) => m[1],
    );
    for (const group of groupNames) {
      await iamPost(
        { Action: "RemoveUserFromGroup", UserName: username, GroupName: group },
        config,
      );
    }
  }

  // Step 4: Delete login profile (ignore NoSuchEntity / 404)
  const deleteProfileRes = await iamPost(
    { Action: "DeleteLoginProfile", UserName: username },
    config,
  );
  if (!deleteProfileRes.ok && xmlErrorCode(deleteProfileRes.xml) !== "NoSuchEntity") {
    console.error(
      JSON.stringify({
        level: "warn",
        correlationId,
        tenantId,
        message: "DeleteLoginProfile returned unexpected error",
        username,
        awsErrorCode: xmlErrorCode(deleteProfileRes.xml),
      }),
    );
  }

  // Step 5: Delete user
  const deleteRes = await iamPost({ Action: "DeleteUser", UserName: username }, config);
  if (!deleteRes.ok) {
    const code = xmlErrorCode(deleteRes.xml);
    if (code === "NoSuchEntity") {
      console.log(
        JSON.stringify({
          level: "info",
          correlationId,
          tenantId,
          message: "IAM user not found, treating as already deprovisioned",
          username,
        }),
      );
      return c.json({ status: "deprovisioned", correlationId, username, tenantId });
    }
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "DeleteUser failed",
        username,
        awsErrorCode: code,
      }),
    );
    return c.json({ error: `AWS DeleteUser failed: ${code ?? "Unknown"}`, correlationId }, 502);
  }

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      tenantId,
      message: "IAM user deprovisioned",
      username,
    }),
  );

  return c.json({ status: "deprovisioned", correlationId, username, tenantId });
});

// ---------------------------------------------------------------------------
// Evidence collection
// ---------------------------------------------------------------------------
app.post("/api/evidence", async (c) => {
  const correlationId = c.get("correlationId");
  const body = await c.req.json<{ tenantId?: string }>().catch((): { tenantId?: string } => ({}));
  const tenantId = body.tenantId ?? c.req.header("X-Tenant-ID") ?? "";

  type EvidenceItem = {
    type: string;
    controlRefs: string[];
    status: "pass" | "fail" | "unknown";
    details: Record<string, unknown>;
  };

  const config = buildAwsConfig(c.env);

  // mfa_enforcement — IAM GetAccountSummary via SigV4
  let mfaItem: EvidenceItem;
  try {
    const iamUrl = "https://iam.amazonaws.com/?Action=GetAccountSummary&Version=2010-05-08";
    const signedHeaders = await signAwsRequest(
      "GET",
      iamUrl,
      "iam",
      config.region,
      config.accessKeyId,
      config.secretAccessKey,
    );

    const iamRes = await fetch(iamUrl, { headers: signedHeaders });
    const xml = await iamRes.text();

    const match = xml.match(/<key>AccountMFAEnabled<\/key>\s*<value>(\d+)<\/value>/);
    const mfaEnabled = match ? match[1] === "1" : false;

    mfaItem = {
      type: "mfa_enforcement",
      controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2"],
      status: mfaEnabled ? "pass" : "fail",
      details: { accountMFAEnabled: mfaEnabled, service: "iam" },
    };
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "Failed to fetch IAM GetAccountSummary",
        error: err instanceof Error ? err.message : "Unknown error",
      }),
    );
    mfaItem = {
      type: "mfa_enforcement",
      controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2"],
      status: "unknown",
      details: { reason: "IAM API call failed", service: "iam" },
    };
  }

  const items: EvidenceItem[] = [
    mfaItem,
    {
      type: "encryption_at_rest",
      controlRefs: ["SOC2-CC6.7", "HIPAA-164.312(a)(2)(ii)", "GDPR-Art.5(1)(f)"],
      status: "unknown",
      details: {
        reason: "S3 encryption check requires listing all buckets — implementation planned",
        service: "s3",
      },
    },
    {
      type: "cloudtrail_enabled",
      controlRefs: ["SOC2-CC7.1", "HIPAA-164.312(b)", "NIST-CSF-DE.CM-1"],
      status: "unknown",
      details: {
        reason:
          "CloudTrail DescribeTrails requires additional SigV4 signing endpoint — implementation planned",
        service: "cloudtrail",
      },
    },
  ];

  return c.json({ items });
});

export default app;
