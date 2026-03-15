import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../types";
import {
  getFlag,
  setFlag,
  deleteFlag,
  listFlags,
  evaluateFlag,
} from "@atlasit/shared";
import type { FeatureFlag } from "@atlasit/shared";

const TierEnum = z.enum(["free", "starter", "professional", "enterprise"]);

const CreateFlagSchema = z.object({
  key: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  rolloutPercentage: z.number().min(0).max(100).default(100),
  tenantOverrides: z.record(z.boolean()).default({}),
  tierMinimum: TierEnum.optional(),
  killSwitch: z.boolean().default(false),
});

const UpdateFlagSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  tenantOverrides: z.record(z.boolean()).optional(),
  tierMinimum: TierEnum.optional(),
  killSwitch: z.boolean().optional(),
});

const EvaluateContextSchema = z.object({
  tenantId: z.string().min(1),
  tenantTier: z.string().optional(),
  userId: z.string().optional(),
});

export const flagRoutes = new Hono<AppEnv>();

// GET / — list all flags
flagRoutes.get("/", async (c) => {
  const flags = await listFlags(c.env.KV_FEATURE_FLAGS);

  return c.json({
    status: "success" as const,
    data: flags,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// GET /:key — get flag by key
flagRoutes.get("/:key", async (c) => {
  const { key } = c.req.param();
  const flag = await getFlag(c.env.KV_FEATURE_FLAGS, key);

  if (!flag) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "Flag not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  return c.json({
    status: "success" as const,
    data: flag,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// POST / — create flag
flagRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = CreateFlagSchema.safeParse(body);

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

  const existing = await getFlag(c.env.KV_FEATURE_FLAGS, parsed.data.key);
  if (existing) {
    return c.json(
      {
        status: "error" as const,
        code: "CONFLICT",
        message: "A flag with this key already exists",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      409,
    );
  }

  const now = new Date().toISOString();
  const flag: FeatureFlag = {
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
  };

  await setFlag(c.env.KV_FEATURE_FLAGS, flag);

  return c.json(
    {
      status: "success" as const,
      data: flag,
      correlationId: c.get("correlationId"),
      timestamp: new Date().toISOString(),
    },
    201,
  );
});

// PATCH /:key — update flag
flagRoutes.patch("/:key", async (c) => {
  const { key } = c.req.param();
  const body = await c.req.json();
  const parsed = UpdateFlagSchema.safeParse(body);

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

  const existing = await getFlag(c.env.KV_FEATURE_FLAGS, key);
  if (!existing) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "Flag not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  const updated: FeatureFlag = {
    ...existing,
    ...parsed.data,
    key,
    updatedAt: new Date().toISOString(),
  };

  await setFlag(c.env.KV_FEATURE_FLAGS, updated);

  return c.json({
    status: "success" as const,
    data: updated,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// DELETE /:key — delete flag
flagRoutes.delete("/:key", async (c) => {
  const { key } = c.req.param();
  const existing = await getFlag(c.env.KV_FEATURE_FLAGS, key);

  if (!existing) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "Flag not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  await deleteFlag(c.env.KV_FEATURE_FLAGS, key);

  return c.json({
    status: "success" as const,
    data: { key, deleted: true },
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// POST /:key/evaluate — evaluate flag for given context
flagRoutes.post("/:key/evaluate", async (c) => {
  const { key } = c.req.param();
  const body = await c.req.json();
  const parsed = EvaluateContextSchema.safeParse(body);

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

  const flag = await getFlag(c.env.KV_FEATURE_FLAGS, key);
  if (!flag) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "Flag not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  const result = evaluateFlag(flag, parsed.data);

  return c.json({
    status: "success" as const,
    data: result,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});

// POST /:key/kill — toggle kill switch
flagRoutes.post("/:key/kill", async (c) => {
  const { key } = c.req.param();
  const flag = await getFlag(c.env.KV_FEATURE_FLAGS, key);

  if (!flag) {
    return c.json(
      {
        status: "error" as const,
        code: "NOT_FOUND",
        message: "Flag not found",
        correlationId: c.get("correlationId"),
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  const updated: FeatureFlag = {
    ...flag,
    killSwitch: !flag.killSwitch,
    updatedAt: new Date().toISOString(),
  };

  await setFlag(c.env.KV_FEATURE_FLAGS, updated);

  return c.json({
    status: "success" as const,
    data: updated,
    correlationId: c.get("correlationId"),
    timestamp: new Date().toISOString(),
  });
});
