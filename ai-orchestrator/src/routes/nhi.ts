/**
 * NHI (Non-Human Identity) discovery and sync routes.
 *
 * POST /api/v1/nhi/discover — discover NHIs from connected adapters
 * POST /api/v1/nhi/sync     — discover + upsert into directory_users and nhi_credentials
 * GET  /api/v1/nhi/credentials — list NHI credentials for a tenant
 */

import { Hono } from "hono";
import type { AppEnv } from "../types";
import { syncNhiFromAdapters, listNhiCredentials } from "../lib/nhi-sync";

export const nhiRoutes = new Hono<AppEnv>();

function parseAdapterUrls(val?: string): Record<string, string> {
  if (!val) return {};
  try {
    return JSON.parse(val) as Record<string, string>;
  } catch {
    return {};
  }
}

/** POST /api/v1/nhi/discover — discover NHIs from all connected adapters */
nhiRoutes.post("/discover", async (c) => {
  const tenantId = c.get("tenantId");
  const correlationId = c.get("correlationId");
  const adapterUrls = parseAdapterUrls(c.env.ADAPTER_URLS);

  if (Object.keys(adapterUrls).length === 0) {
    return c.json({ error: "No adapter URLs configured", correlationId }, 501);
  }

  const results = await discoverFromAdapters(adapterUrls, tenantId, correlationId);

  return c.json({
    tenantId,
    correlationId,
    results,
    totalDiscovered: results.reduce((sum, r) => sum + r.identities.length, 0),
    discoveredAt: new Date().toISOString(),
  });
});

/** POST /api/v1/nhi/sync — discover + persist NHIs into D1 */
nhiRoutes.post("/sync", async (c) => {
  const tenantId = c.get("tenantId");
  const correlationId = c.get("correlationId");
  const db = c.env.ATLAS_SHARED_DB;
  const adapterUrls = parseAdapterUrls(c.env.ADAPTER_URLS);

  if (Object.keys(adapterUrls).length === 0) {
    return c.json({ error: "No adapter URLs configured", correlationId }, 501);
  }

  const syncResult = await syncNhiFromAdapters(db, adapterUrls, tenantId, correlationId);

  return c.json({
    tenantId,
    correlationId,
    ...syncResult,
  });
});

/** GET /api/v1/nhi/credentials — list NHI credentials for tenant */
nhiRoutes.get("/credentials", async (c) => {
  const tenantId = c.get("tenantId");
  const correlationId = c.get("correlationId");
  const db = c.env.ATLAS_SHARED_DB;

  const status = c.req.query("status");
  const credentialType = c.req.query("type");
  const provider = c.req.query("provider");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "100"), 500);
  const offset = parseInt(c.req.query("offset") ?? "0");

  const result = await listNhiCredentials(db, tenantId, { status, credentialType, provider, limit, offset });

  return c.json({ ...result, correlationId });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

interface DiscoveryResult {
  provider: string;
  identities: Array<Record<string, unknown>>;
  discoveredAt: string;
  error?: string;
}

const NHI_CAPABLE_ADAPTERS = [
  "github",
  "aws",
  "google_workspace",
  "microsoft_365",
  "okta",
];

async function discoverFromAdapters(
  adapterUrls: Record<string, string>,
  tenantId: string,
  correlationId: string,
): Promise<DiscoveryResult[]> {
  const results: DiscoveryResult[] = [];

  const settled = await Promise.allSettled(
    NHI_CAPABLE_ADAPTERS.filter((slug) => adapterUrls[slug]).map(async (slug) => {
      const url = adapterUrls[slug];
      const res = await fetch(`${url}/api/nhi/discovery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": tenantId,
          "X-Correlation-ID": correlationId,
        },
        body: JSON.stringify({ tenantId }),
      });

      if (!res.ok) {
        return {
          provider: slug,
          identities: [],
          discoveredAt: new Date().toISOString(),
          error: `HTTP ${res.status}`,
        };
      }

      return (await res.json()) as DiscoveryResult;
    }),
  );

  for (const r of settled) {
    if (r.status === "fulfilled") {
      results.push(r.value);
    } else {
      results.push({
        provider: "unknown",
        identities: [],
        discoveredAt: new Date().toISOString(),
        error: r.reason?.message ?? "Discovery failed",
      });
    }
  }

  return results;
}
