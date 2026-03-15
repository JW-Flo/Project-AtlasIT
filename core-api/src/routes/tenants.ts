import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../types";

const CreateTenantSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
    .min(3)
    .max(63),
  industry: z.string().optional(),
  tier: z
    .enum(["free", "starter", "professional", "enterprise"])
    .default("free"),
});

const UpdateTenantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  industry: z.string().optional(),
  status: z.enum(["active", "suspended", "onboarding"]).optional(),
  tier: z.enum(["free", "starter", "professional", "enterprise"]).optional(),
  config: z.record(z.unknown()).optional(),
});

export const tenantRoutes = new Hono<AppEnv>();

// GET /api/v1/tenants — list tenants
tenantRoutes.get("/", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50"), 100);
  const offset = parseInt(c.req.query("offset") ?? "0");

  const results = await c.env.DB.prepare(
    "SELECT * FROM tenants ORDER BY created_at DESC LIMIT ? OFFSET ?",
  )
    .bind(limit, offset)
    .all();

  const count = await c.env.DB.prepare(
    "SELECT COUNT(*) as total FROM tenants",
  ).first<{ total: number }>();

  return c.json({
    status: "success" as const,
    data: results.results,
    meta: { total: count?.total ?? 0, limit, offset },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/tenants/:id — get tenant by ID
tenantRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();

  const tenant = await c.env.DB.prepare("SELECT * FROM tenants WHERE id = ?")
    .bind(id)
    .first();

  if (!tenant) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "Tenant not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  return c.json({
    status: "success" as const,
    data: tenant,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// POST /api/v1/tenants — create tenant
tenantRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = CreateTenantSchema.safeParse(body);

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
  const { name, slug, industry, tier } = parsed.data;

  try {
    await c.env.DB.prepare(
      "INSERT INTO tenants (id, name, slug, industry, tier, status) VALUES (?, ?, ?, ?, ?, ?)",
    )
      .bind(id, name, slug, industry ?? null, tier, "onboarding")
      .run();
  } catch (e) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return c.json(
        {
          status: "error" as const,
          code: "CONFLICT",
          message: "A tenant with this slug already exists",
          correlationId: c.get("correlationId"),
          timestamp: new Date().toISOString(),
        },
        409,
      );
    }
    throw e;
  }

  const tenant = await c.env.DB.prepare("SELECT * FROM tenants WHERE id = ?")
    .bind(id)
    .first();

  return c.json(
    {
      status: "success" as const,
      data: tenant,
      correlationId: c.get("correlationId"),
      timestamp: new Date().toISOString(),
    },
    201,
  );
});

// PATCH /api/v1/tenants/:id — update tenant
tenantRoutes.patch("/:id", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const parsed = UpdateTenantSchema.safeParse(body);

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

  const existing = await c.env.DB.prepare("SELECT * FROM tenants WHERE id = ?")
    .bind(id)
    .first();

  if (!existing) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "Tenant not found",
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
  if (updates.industry !== undefined) {
    setClauses.push("industry = ?");
    values.push(updates.industry);
  }
  if (updates.status !== undefined) {
    setClauses.push("status = ?");
    values.push(updates.status);
  }
  if (updates.tier !== undefined) {
    setClauses.push("tier = ?");
    values.push(updates.tier);
  }
  if (updates.config !== undefined) {
    setClauses.push("config = ?");
    values.push(JSON.stringify(updates.config));
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
    `UPDATE tenants SET ${setClauses.join(", ")} WHERE id = ?`,
  )
    .bind(...values)
    .run();

  const updated = await c.env.DB.prepare("SELECT * FROM tenants WHERE id = ?")
    .bind(id)
    .first();

  return c.json({
    status: "success" as const,
    data: updated,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// DELETE /api/v1/tenants/:id — delete tenant
tenantRoutes.delete("/:id", async (c) => {
  const { id } = c.req.param();

  const existing = await c.env.DB.prepare("SELECT id FROM tenants WHERE id = ?")
    .bind(id)
    .first();

  if (!existing) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "Tenant not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  await c.env.DB.prepare("DELETE FROM tenants WHERE id = ?").bind(id).run();

  return c.json({
    status: "success" as const,
    data: { id, deleted: true },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});
