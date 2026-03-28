/**
 * Directory sync proxy route.
 *
 * POST /api/v1/directory/sync — proxies the sync request to the appropriate
 * adapter worker via ADAPTER_URLS, returning the adapter's response to the
 * caller (console-app).
 */

import { Hono } from "hono";
import { requireRole } from "@atlasit/shared";
import type { AppEnv } from "../types";

export const directoryRoutes = new Hono<AppEnv>();

const PROVIDER_TO_ADAPTER: Record<string, string> = {
  okta: "okta",
  google_workspace: "google_workspace",
  microsoft_365: "microsoft_365",
};

function parseAdapterUrls(val?: string): Record<string, string> {
  if (!val) return {};
  try {
    return JSON.parse(val) as Record<string, string>;
  } catch {
    return {};
  }
}

/** POST /api/v1/directory/sync — proxy sync to adapter */
directoryRoutes.post("/sync", requireRole("member"), async (c) => {
  const tenantId = c.get("tenantId");
  const correlationId = c.get("correlationId");
  const body = await c.req.json<{ provider: string }>().catch(() => ({ provider: "" }));

  const provider = body.provider;
  const adapterKey = PROVIDER_TO_ADAPTER[provider];
  if (!adapterKey) {
    return c.json(
      { error: `Unknown provider: ${provider}`, correlationId },
      400,
    );
  }

  const adapterUrls = parseAdapterUrls(c.env.ADAPTER_URLS);
  const adapterUrl = adapterUrls[adapterKey];
  if (!adapterUrl) {
    return c.json(
      { error: `No adapter URL configured for ${adapterKey}`, correlationId },
      501,
    );
  }

  try {
    const res = await fetch(`${adapterUrl}/api/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
        "X-Correlation-ID": correlationId,
      },
      body: JSON.stringify({ tenantId }),
    });

    const data = await res.json().catch(() => ({ error: "Invalid adapter response" }));

    return c.json(
      { ...data as Record<string, unknown>, correlationId, provider, proxied: true },
      res.ok ? 200 : res.status,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json(
      { error: `Adapter sync failed: ${message}`, correlationId, provider },
      502,
    );
  }
});
