import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../types";

const TokenRequestSchema = z.object({
  email: z.string().email(),
  tenantId: z.string().uuid(),
});

export const authRoutes = new Hono<AppEnv>();

// POST /api/v1/auth/token — placeholder for token issuance
// In production, this would validate credentials and issue a JWT
authRoutes.post("/token", async (c) => {
  const body = await c.req.json();
  const parsed = TokenRequestSchema.safeParse(body);

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

  // Verify user exists
  const user = await c.env.DB.prepare(
    "SELECT id, email, role, status FROM users WHERE email = ? AND tenant_id = ?",
  )
    .bind(parsed.data.email, parsed.data.tenantId)
    .first();

  if (!user) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "User not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  if (user.status !== "active") {
    return c.json(
      {
        status: "error" as const,
        code: "FORBIDDEN",
        message: "User account is not active",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      403,
    );
  }

  // TODO: Issue real JWT in production
  return c.json({
    status: "success" as const,
    data: {
      message: "Token endpoint placeholder — JWT issuance not yet implemented",
      user: { id: user.id, email: user.email, role: user.role },
    },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});
