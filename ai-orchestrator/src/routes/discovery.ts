/**
 * Shadow AI & SaaS Discovery routes.
 *
 * POST /api/v1/discovery/scan       — trigger OAuth grant scan from adapters
 * GET  /api/v1/discovery/apps       — list discovered apps (filterable)
 * PATCH /api/v1/discovery/apps/:id  — update risk_tier for a discovered app
 * GET  /api/v1/discovery/grants     — list discovered OAuth grants (filterable)
 */

import { Hono } from "hono";
import type { AppEnv } from "../types";
import {
  syncDiscoveredApps,
  listDiscoveredApps,
  updateAppRiskTier,
  listDiscoveredGrants,
} from "../lib/discovery-sync";
import type { RiskTier } from "@atlasit/shared";

export const discoveryRoutes = new Hono<AppEnv>();

function parseAdapterUrls(val?: string): Record<string, string> {
  if (!val) return {};
  try {
    return JSON.parse(val) as Record<string, string>;
  } catch {
    return {};
  }
}

const VALID_RISK_TIERS: RiskTier[] = ["approved", "under_review", "blocked", "unknown"];

/** POST /scan — trigger OAuth grant discovery from Google Workspace and M365 */
discoveryRoutes.post("/scan", async (c) => {
  const tenantId = c.get("tenantId");
  const correlationId = c.get("correlationId");
  const db = c.env.ATLAS_SHARED_DB;
  const adapterUrls = parseAdapterUrls(c.env.ADAPTER_URLS);

  if (Object.keys(adapterUrls).length === 0) {
    return c.json({ error: "No adapter URLs configured", correlationId }, 501);
  }

  const summary = await syncDiscoveredApps(db, adapterUrls, tenantId, correlationId);

  return c.json({
    tenantId,
    correlationId,
    ...summary,
  });
});

/** GET /apps — list discovered apps with optional filters */
discoveryRoutes.get("/apps", async (c) => {
  const tenantId = c.get("tenantId");
  const correlationId = c.get("correlationId");
  const db = c.env.ATLAS_SHARED_DB;

  const riskTier = c.req.query("risk_tier");
  const isAiToolParam = c.req.query("is_ai_tool");
  const status = c.req.query("status");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50"), 500);
  const offset = parseInt(c.req.query("offset") ?? "0");

  let isAiTool: boolean | undefined;
  if (isAiToolParam === "true") isAiTool = true;
  else if (isAiToolParam === "false") isAiTool = false;

  const result = await listDiscoveredApps(db, tenantId, {
    riskTier,
    isAiTool,
    status,
    limit,
    offset,
  });

  return c.json({ ...result, correlationId });
});

/** PATCH /apps/:id — update risk tier for a discovered app */
discoveryRoutes.patch("/apps/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const correlationId = c.get("correlationId");
  const db = c.env.ATLAS_SHARED_DB;
  const appId = c.req.param("id");

  let body: { risk_tier?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body", correlationId }, 400);
  }

  const riskTier = body.risk_tier as RiskTier;
  if (!riskTier || !VALID_RISK_TIERS.includes(riskTier)) {
    return c.json(
      {
        error: `risk_tier must be one of: ${VALID_RISK_TIERS.join(", ")}`,
        correlationId,
      },
      400,
    );
  }

  const result = await updateAppRiskTier(db, tenantId, appId, riskTier);

  if (!result.updated) {
    return c.json({ error: "App not found", correlationId }, 404);
  }

  return c.json({ ...result, correlationId });
});

/** GET /grants — list discovered OAuth grants with optional filters */
discoveryRoutes.get("/grants", async (c) => {
  const tenantId = c.get("tenantId");
  const correlationId = c.get("correlationId");
  const db = c.env.ATLAS_SHARED_DB;

  const appId = c.req.query("app_id");
  const userEmail = c.req.query("user_email");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "100"), 500);
  const offset = parseInt(c.req.query("offset") ?? "0");

  const result = await listDiscoveredGrants(db, tenantId, {
    appId,
    userEmail,
    limit,
    offset,
  });

  return c.json({ ...result, correlationId });
});
