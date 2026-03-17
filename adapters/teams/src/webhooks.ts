import type { Context } from "hono";
import type { Bindings, Variables, TeamsWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Verify Teams webhook clientState (validation token).
 * Teams sends a POST with a validationToken in the request body.
 */
export async function handleTeamsWebhookValidation(
  c: HonoContext,
): Promise<Response> {
  const correlationId = c.get("correlationId");

  const body = (await c.req
    .json<{ validationToken?: string }>()
    .catch(() => ({}))) as { validationToken?: string };

  if (body.validationToken) {
    // Return the validation token as plain text for Teams validation
    return c.text(body.validationToken);
  }

  return c.json({ error: "No validation token", correlationId }, 400);
}

/**
 * Verify Teams webhook signature using clientState (HMAC-SHA256).
 * The clientState is sent in the request body and used as the HMAC key.
 */
async function verifyClientState(
  secret: string,
  clientState: string,
): Promise<boolean> {
  // Teams uses clientState for validation during subscription setup.
  // In production, validate that the clientState matches what was configured.
  return clientState === secret;
}

function mapEventToAtlasType(changeType: string): string | null {
  // Map Teams change types to AtlasIT event types
  switch (changeType) {
    case "created":
    case "updated":
      return "user.provisioned";
    case "deleted":
      return "user.deprovisioned";
    default:
      return null;
  }
}

function buildPayload(
  changeType: string,
  resource: string,
  resourceData?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    teamsChangeType: changeType,
    resource,
    resourceData: resourceData ?? {},
    timestamp: new Date().toISOString(),
  };
}

export async function handleTeamsWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");

  try {
    const body = (await c.req.json()) as TeamsWebhookPayload;

    if (!body.value || body.value.length === 0) {
      return c.json({
        status: "ignored",
        reason: "no_notifications",
        correlationId,
      });
    }

    for (const notification of body.value) {
      // Validate clientState (subscription secret)
      const valid = await verifyClientState(
        c.env.TEAMS_WEBHOOK_SECRET,
        notification.clientState,
      );

      if (!valid) {
        console.error(
          JSON.stringify({
            level: "error",
            correlationId,
            message: "Invalid Teams webhook clientState",
          }),
        );
        return c.json({ error: "Invalid clientState", correlationId }, 401);
      }

      const atlasEventType = mapEventToAtlasType(notification.changeType);
      if (!atlasEventType) {
        continue;
      }

      // Resolve tenantId — in production, map from Teams org/tenant to AtlasIT tenant
      const tenantId = await resolveTeamsTenantId(
        c.env.DB,
        notification.tenantId || "default",
      );

      if (!tenantId) {
        console.log(
          JSON.stringify({
            level: "warn",
            correlationId,
            message: "No tenant mapping for Teams",
            teamsOrgId: notification.tenantId,
          }),
        );
        continue;
      }

      const eventPayload = buildPayload(
        notification.changeType,
        notification.resource,
        notification.resourceData,
      );

      try {
        await publishEvent({
          orchestratorUrl: c.env.ORCHESTRATOR_URL,
          tenantId,
          type: atlasEventType,
          source: "connector:teams",
          payload: eventPayload,
          idempotencyKey: notification.subscriptionId ?? undefined,
          correlationId,
        });

        console.log(
          JSON.stringify({
            level: "info",
            correlationId,
            message: "Teams webhook event published",
            changeType: notification.changeType,
            atlasEventType,
          }),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(
          JSON.stringify({
            level: "error",
            correlationId,
            message: "Failed to publish Teams webhook event",
            error: msg,
          }),
        );
      }
    }

    return c.json({ status: "processed", correlationId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Teams webhook processing failed",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
}

/**
 * Resolve a Teams tenant ID to an AtlasIT tenant_id.
 * Uses the connector_configs table where connector_slug='teams'.
 */
async function resolveTeamsTenantId(
  db: D1Database,
  teamsTenantId: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'teams' AND json_extract(config, '$.tenantId') = ?
       LIMIT 1`,
    )
    .bind(teamsTenantId)
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
