import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../types";

const CreateAppSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
    .min(3)
    .max(63),
  description: z.string().optional(),
  category: z
    .enum([
      "identity",
      "security",
      "compliance",
      "productivity",
      "communication",
      "utility",
      "custom",
    ])
    .default("utility"),
  provider: z.string().min(1).max(255),
  logo_url: z.string().url().optional(),
  auth_model: z.enum(["oauth2", "api_key", "service_account", "saml", "none"]),
  config_schema: z.record(z.unknown()).optional(),
  capabilities: z.array(z.string()).optional(),
  version: z.string().default("1.0.0"),
  status: z.enum(["active", "deprecated", "coming_soon"]).default("active"),
  documentation_url: z.string().url().optional(),
});

const UpdateAppSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z
    .enum([
      "identity",
      "security",
      "compliance",
      "productivity",
      "communication",
      "utility",
      "custom",
    ])
    .optional(),
  provider: z.string().min(1).max(255).optional(),
  logo_url: z.string().url().nullable().optional(),
  auth_model: z
    .enum(["oauth2", "api_key", "service_account", "saml", "none"])
    .optional(),
  config_schema: z.record(z.unknown()).nullable().optional(),
  capabilities: z.array(z.string()).nullable().optional(),
  version: z.string().optional(),
  status: z.enum(["active", "deprecated", "coming_soon"]).optional(),
  documentation_url: z.string().url().nullable().optional(),
});

export const appRoutes = new Hono<AppEnv>();

// GET /api/v1/apps — list marketplace apps
appRoutes.get("/", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50"), 100);
  const offset = parseInt(c.req.query("offset") ?? "0");
  const category = c.req.query("category");
  const status = c.req.query("status");

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }
  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const results = await c.env.DB.prepare(
    `SELECT * FROM marketplace_apps ${where} ORDER BY name ASC LIMIT ? OFFSET ?`,
  )
    .bind(...params, limit, offset)
    .all();

  const count = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM marketplace_apps ${where}`,
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

// GET /api/v1/apps/:id — get app by ID
appRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();

  const app = await c.env.DB.prepare(
    "SELECT * FROM marketplace_apps WHERE id = ?",
  )
    .bind(id)
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

  return c.json({
    status: "success" as const,
    data: app,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// POST /api/v1/apps — create app
appRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = CreateAppSchema.safeParse(body);

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

  const id = crypto.randomUUID();
  const data = parsed.data;

  try {
    await c.env.DB.prepare(
      `INSERT INTO marketplace_apps (id, name, slug, description, category, provider, logo_url, auth_model, config_schema, capabilities, version, status, documentation_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        data.name,
        data.slug,
        data.description ?? null,
        data.category,
        data.provider,
        data.logo_url ?? null,
        data.auth_model,
        data.config_schema ? JSON.stringify(data.config_schema) : null,
        data.capabilities ? JSON.stringify(data.capabilities) : null,
        data.version,
        data.status,
        data.documentation_url ?? null,
      )
      .run();
  } catch (e) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return c.json(
        {
          status: "error" as const,
          code: "CONFLICT",
          message: "An app with this name or slug already exists",
          correlationId: c.get("correlationId"),
          timestamp: new Date().toISOString(),
        },
        409,
      );
    }
    throw e;
  }

  const app = await c.env.DB.prepare(
    "SELECT * FROM marketplace_apps WHERE id = ?",
  )
    .bind(id)
    .first();

  return c.json(
    {
      status: "success" as const,
      data: app,
      correlationId: c.get("correlationId"),
      timestamp: new Date().toISOString(),
    },
    201,
  );
});

// PATCH /api/v1/apps/:id — update app
appRoutes.patch("/:id", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const parsed = UpdateAppSchema.safeParse(body);

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
    "SELECT * FROM marketplace_apps WHERE id = ?",
  )
    .bind(id)
    .first();

  if (!existing) {
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

  const updates = parsed.data;
  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    setClauses.push("name = ?");
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    setClauses.push("description = ?");
    values.push(updates.description);
  }
  if (updates.category !== undefined) {
    setClauses.push("category = ?");
    values.push(updates.category);
  }
  if (updates.provider !== undefined) {
    setClauses.push("provider = ?");
    values.push(updates.provider);
  }
  if (updates.logo_url !== undefined) {
    setClauses.push("logo_url = ?");
    values.push(updates.logo_url);
  }
  if (updates.auth_model !== undefined) {
    setClauses.push("auth_model = ?");
    values.push(updates.auth_model);
  }
  if (updates.config_schema !== undefined) {
    setClauses.push("config_schema = ?");
    values.push(
      updates.config_schema ? JSON.stringify(updates.config_schema) : null,
    );
  }
  if (updates.capabilities !== undefined) {
    setClauses.push("capabilities = ?");
    values.push(
      updates.capabilities ? JSON.stringify(updates.capabilities) : null,
    );
  }
  if (updates.version !== undefined) {
    setClauses.push("version = ?");
    values.push(updates.version);
  }
  if (updates.status !== undefined) {
    setClauses.push("status = ?");
    values.push(updates.status);
  }
  if (updates.documentation_url !== undefined) {
    setClauses.push("documentation_url = ?");
    values.push(updates.documentation_url);
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
    `UPDATE marketplace_apps SET ${setClauses.join(", ")} WHERE id = ?`,
  )
    .bind(...values)
    .run();

  const updated = await c.env.DB.prepare(
    "SELECT * FROM marketplace_apps WHERE id = ?",
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
