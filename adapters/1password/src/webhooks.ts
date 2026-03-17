import type { Context } from "hono";
import type { Bindings, Variables } from "./types.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * 1Password does not support incoming webhooks for user events.
 * This adapter uses polling only (via /api/sync).
 */
export async function handleOnePasswordWebhook(
  c: HonoContext,
): Promise<Response> {
  const correlationId = c.get("correlationId");

  console.log(
    JSON.stringify({
      level: "warn",
      correlationId,
      message: "Webhook received but not supported",
      connector: "1password",
      reason:
        "1Password does not support incoming webhooks for user events; polling only",
    }),
  );

  return c.json({
    status: "not_supported",
    reason:
      "1Password webhook ingestion is not supported; use polling via /api/sync",
    correlationId,
  });
}
