import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../types";

const InstallAppSchema = z.object({
  tenant_id: z.string().uuid(),
  app_id: z.string().uuid(),
  config: z.record(z.unknown()).optional(),
  installed_by: z.string().optional(),
});

const UpdateInstallSchema = z.object({
  status: z
    .enum(["installed", "configuring", "active", "error", "uninstalled"])
    .optional(),
  config: z.record(z.unknown()).nullable().optional(),
});

export const installRoutes = new Hono<AppEnv>();

// POST /api/v1/installs — install an app for a tenant
installRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = InstallAppSchema.safeParse(body);

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

  const { tenant_id, app_id, config, installed_by } = parsed.data;

  const app = await c.env.DB.prepare(
    "SELECT id, status FROM marketplace_apps WHERE id = ?",
  )
    .bind(app_id)
    .first();

  if (!app) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "App not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  if (app.status !== "active") {
    return c.json(
      {
        status: "error" as const,
        code: "VALIDATION_FAILED",
        message: "App is not available for installation",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  const id = crypto.randomUUID();

  try {
    await c.env.DB.prepare(
      `INSERT INTO tenant_app_installs (id, tenant_id, app_id, status, config, installed_by)
       VALUES (?, ?, ?, 'installed', ?, ?)`,
    )
      .bind(
        id,
        tenant_id,
        app_id,
        config ? JSON.stringify(config) : null,
        installed_by ?? null,
      )
      .run();
  } catch (e) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return c.json(
        {
          status: "error" as const,
          code: "CONFLICT",
          message: "This app is already installed for this tenant",
          correlationId: c.get("correlationId"),
          timestamp: new Date().toISOString(),
        },
        409,
      );
    }
    throw e;
  }

  const install = await c.env.DB.prepare(
    "SELECT * FROM tenant_app_installs WHERE id = ?",
  )
    .bind(id)
    .first();

  return c.json(
    {
      status: "success" as const,
      data: install,
      correlationId: c.get("correlationId"),
      timestamp: new Date().toISOString(),
    },
    201,
  );
});

// GET /api/v1/installs — list installs (filter by tenantId)
installRoutes.get("/", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10) || 50, 100);
  const offset = parseInt(c.req.query("offset") ?? "0", 10) || 0;
  const tenantId = c.req.query("tenantId");

  const conditions: string[] = ["i.status != 'uninstalled'"];
  const params: unknown[] = [];

  if (tenantId) {
    conditions.push("i.tenant_id = ?");
    params.push(tenantId);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const results = await c.env.DB.prepare(
    `SELECT i.*, a.name as app_name, a.slug as app_slug, a.category as app_category, a.logo_url as app_logo_url, a.provider as app_provider
     FROM tenant_app_installs i
     JOIN marketplace_apps a ON a.id = i.app_id
     ${where}
     ORDER BY i.installed_at DESC
     LIMIT ? OFFSET ?`,
  )
    .bind(...params, limit, offset)
    .all();

  const count = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM tenant_app_installs i ${where}`,
  )
    .bind(...params)
    .first<{ total: number }>();

  return c.json({
    status: "success" as const,
    data: results.results,
    meta: { total: count?.total ?? 0, limit, offset },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/installs/:id — get install by ID
installRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();

  const install = await c.env.DB.prepare(
    `SELECT i.*, a.name as app_name, a.slug as app_slug, a.category as app_category, a.logo_url as app_logo_url, a.provider as app_provider
     FROM tenant_app_installs i
     JOIN marketplace_apps a ON a.id = i.app_id
     WHERE i.id = ?`,
  )
    .bind(id)
    .first();

  if (!install) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "Install not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  return c.json({
    status: "success" as const,
    data: install,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// PATCH /api/v1/installs/:id — update install config/status
installRoutes.patch("/:id", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const parsed = UpdateInstallSchema.safeParse(body);

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

  const existing = await c.env.DB.prepare(
    "SELECT * FROM tenant_app_installs WHERE id = ?",
  )
    .bind(id)
    .first();

  if (!existing) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "Install not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  const updates = parsed.data;
  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (updates.status !== undefined) {
    setClauses.push("status = ?");
    values.push(updates.status);
  }
  if (updates.config !== undefined) {
    setClauses.push("config = ?");
    values.push(updates.config ? JSON.stringify(updates.config) : null);
  }

  if (setClauses.length === 0) {
    return c.json({
      status: "success" as const,
      data: existing,
      correlationId: c.get("correlationId"),
      timestamp: new Date().toISOString(),
    });
  }

  setClauses.push("updated_at = datetime('now')");
  values.push(id);

  await c.env.DB.prepare(
    `UPDATE tenant_app_installs SET ${setClauses.join(", ")} WHERE id = ?`,
  )
    .bind(...values)
    .run();

  const updated = await c.env.DB.prepare(
    "SELECT * FROM tenant_app_installs WHERE id = ?",
  )
    .bind(id)
    .first();

  return c.json({
    status: "success" as const,
    data: updated,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// DELETE /api/v1/installs/:id — soft-delete (uninstall)
installRoutes.delete("/:id", async (c) => {
  const { id } = c.req.param();

  const existing = await c.env.DB.prepare(
    "SELECT id, status FROM tenant_app_installs WHERE id = ?",
  )
    .bind(id)
    .first();

  if (!existing) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "Install not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  await c.env.DB.prepare(
    `UPDATE tenant_app_installs SET status = 'uninstalled', uninstalled_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
  )
    .bind(id)
    .run();

  return c.json({
    status: "success" as const,
    data: { id, uninstalled: true },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// POST /api/v1/installs/:id/activate — activate an install
installRoutes.post("/:id/activate", async (c) => {
  const { id } = c.req.param();

  const existing = await c.env.DB.prepare(
    "SELECT id, status FROM tenant_app_installs WHERE id = ?",
  )
    .bind(id)
    .first();

  if (!existing) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "Install not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  if (existing.status === "uninstalled") {
    return c.json(
      {
        status: "error" as const,
        code: "VALIDATION_FAILED",
        message: "Cannot activate an uninstalled app",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }

  await c.env.DB.prepare(
    `UPDATE tenant_app_installs SET status = 'active', activated_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
  )
    .bind(id)
    .run();

  const updated = await c.env.DB.prepare(
    "SELECT * FROM tenant_app_installs WHERE id = ?",
  )
    .bind(id)
    .first();

  return c.json({
    status: "success" as const,
    data: updated,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});
