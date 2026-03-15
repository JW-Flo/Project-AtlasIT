import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../types";
import {
  storeCredential,
  getCredential,
  deleteCredential,
  listCredentials,
  rotateCredential,
} from "@atlasit/shared";

const StoreCredentialSchema = z.object({
  tenantId: z.string().min(1),
  appId: z.string().min(1),
  credentials: z.record(z.string()),
});

const RotateCredentialSchema = z.object({
  credentials: z.record(z.string()),
});

export const credentialRoutes = new Hono<AppEnv>();

// POST /api/v1/credentials — store credential
credentialRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = StoreCredentialSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        status: "error" as const,
        code: "VALIDATION_FAILED",
        message: "Invalid request body",
        details: parsed.error.flatten(),
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const masterKey = c.env.CRED_ENCRYPTION_KEY;
  const id = await storeCredential(c.env.DB, masterKey, parsed.data);

  return c.json(
    {
      status: "success" as const,
      data: { id, appId: parsed.data.appId, tenantId: parsed.data.tenantId },
      correlationId: c.get("correlationId"),
      timestamp: new Date().toISOString(),
    },
    201,
  );
});

// GET /api/v1/credentials?tenantId= — list credentials (metadata only)
credentialRoutes.get("/", async (c) => {
  const tenantId = c.req.query("tenantId");

  if (!tenantId) {
    return c.json(
      {
        status: "error" as const,
        code: "VALIDATION_FAILED",
        message: "tenantId query parameter is required",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const credentials = await listCredentials(c.env.DB, tenantId);

  return c.json({
    status: "success" as const,
    data: credentials,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/credentials/:tenantId/:appId — retrieve and decrypt
credentialRoutes.get("/:tenantId/:appId", async (c) => {
  const { tenantId, appId } = c.req.param();
  const masterKey = c.env.CRED_ENCRYPTION_KEY;

  const credential = await getCredential(c.env.DB, masterKey, tenantId, appId);

  if (!credential) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "Credential not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  // Return decrypted credential data — only to authenticated callers
  return c.json({
    status: "success" as const,
    data: { tenantId, appId, credentials: credential },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// PUT /api/v1/credentials/:tenantId/:appId — rotate credential
credentialRoutes.put("/:tenantId/:appId", async (c) => {
  const { tenantId, appId } = c.req.param();
  const body = await c.req.json();
  const parsed = RotateCredentialSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        status: "error" as const,
        code: "VALIDATION_FAILED",
        message: "Invalid request body",
        details: parsed.error.flatten(),
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const masterKey = c.env.CRED_ENCRYPTION_KEY;

  try {
    await rotateCredential(
      c.env.DB,
      masterKey,
      tenantId,
      appId,
      parsed.data.credentials,
    );
  } catch (e) {
    if (e instanceof Error && e.message === "Credential not found") {
      return c.json(
        {
          status: "error" as const,
          code: "NOT_FOUND",
          message: "Credential not found",
          correlationId: c.get("correlationId"),
          timestamp: new Date().toISOString(),
        },
        404,
      );
    }
    throw e;
  }

  return c.json({
    status: "success" as const,
    data: { tenantId, appId, rotated: true },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// DELETE /api/v1/credentials/:tenantId/:appId — delete credential
credentialRoutes.delete("/:tenantId/:appId", async (c) => {
  const { tenantId, appId } = c.req.param();

  await deleteCredential(c.env.DB, tenantId, appId);

  return c.json({
    status: "success" as const,
    data: { tenantId, appId, deleted: true },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// POST /api/v1/credentials/:tenantId/:appId/test — test credential health
credentialRoutes.post("/:tenantId/:appId/test", async (c) => {
  const { tenantId, appId } = c.req.param();

  const exists = await c.env.DB.prepare(
    "SELECT id FROM app_credentials WHERE tenant_id = ? AND app_id = ?",
  )
    .bind(tenantId, appId)
    .first();

  if (!exists) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "Credential not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  // Placeholder: mark as healthy. Real implementation would call the app's API.
  await c.env.DB.prepare(
    `UPDATE app_credentials
       SET healthy = 1, last_test_at = datetime('now')
       WHERE tenant_id = ? AND app_id = ?`,
  )
    .bind(tenantId, appId)
    .run();

  return c.json({
    status: "success" as const,
    data: {
      tenantId,
      appId,
      healthy: true,
      testedAt: new Date().toISOString(),
    },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});
