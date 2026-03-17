import type { Context } from "hono";
import type { Bindings, Variables } from "./types.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Datadog does not support incoming webhooks for user events.
 * This adapter uses polling only (via /api/sync).
 */
export async function handleDatadogWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");

  console.log(
    JSON.stringify({
      level: "warn",
      correlationId,
      message: "Webhook received but not supported",
      connector: "datadog",
      reason:
        "Datadog does not support incoming webhooks for user events; polling only",
    }),
  );

  return c.json({
    status: "not_supported",
    reason:
      "Datadog webhook ingestion is not supported; use polling via /api/sync",
    correlationId,
  });
}
