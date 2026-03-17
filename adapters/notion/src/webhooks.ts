import type { Context } from "hono";
import type { Bindings, Variables, NotionWebhookPayload } from "./types.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Notion does not support webhooks.
 * Syncing must be done via polling.
 * This handler is provided for consistency with other adapters but returns "not supported".
 */
export async function handleNotionWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      message: "Notion webhook handler called (polling only)",
    }),
  );

  return c.json(
    {
      status: "not_supported",
      message: "Notion does not support webhooks. Use polling sync instead.",
      correlationId,
    },
    400,
  );
}
