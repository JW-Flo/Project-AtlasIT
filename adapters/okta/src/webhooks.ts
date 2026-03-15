import type { Context } from "hono";
import type { Bindings, OktaEvent, OktaEventHookPayload } from "./types.js";
import { getUser } from "./client.js";
import { publishEvent } from "./event-publisher.js";

const HANDLED_EVENT_TYPES = new Set([
  "user.lifecycle.create",
  "user.lifecycle.activate",
  "user.lifecycle.deactivate",
  "user.lifecycle.delete.initiated",
]);

function mapEventType(oktaEventType: string): string | null {
  switch (oktaEventType) {
    case "user.lifecycle.create":
      return "user.provisioned";
    case "user.lifecycle.activate":
      return "user.provisioned";
    case "user.lifecycle.deactivate":
      return "user.suspended";
    case "user.lifecycle.delete.initiated":
      return "user.deprovisioned";
    default:
      return null;
  }
}

async function processEvent(
  event: OktaEvent,
  env: Bindings,
  tenantId: string,
): Promise<void> {
  const atlasEventType = mapEventType(event.eventType);
  if (!atlasEventType) return;

  const targetUser = event.target?.find((t) => t.type === "User");
  if (!targetUser) return;

  let userPayload: Record<string, unknown> = {
    externalId: targetUser.id,
    displayName: targetUser.displayName,
    alternateId: targetUser.alternateId,
  };

  try {
    const fullUser = await getUser(
      env.OKTA_ORG_URL,
      env.OKTA_API_TOKEN,
      targetUser.id,
    );
    userPayload = {
      externalId: fullUser.id,
      email: fullUser.profile.email,
      displayName:
        fullUser.profile.displayName ??
        `${fullUser.profile.firstName} ${fullUser.profile.lastName}`.trim(),
      department: fullUser.profile.department,
      title: fullUser.profile.title,
      status: fullUser.status,
    };
  } catch {
    // Use partial info from event target if user fetch fails
  }

  await publishEvent({
    orchestratorUrl: env.ORCHESTRATOR_URL,
    tenantId,
    type: atlasEventType,
    source: "connector:okta",
    payload: {
      oktaEventId: event.uuid,
      oktaEventType: event.eventType,
      actor: event.actor,
      user: userPayload,
    },
    idempotencyKey: event.uuid,
  });
}

export async function handleVerification(
  c: Context<{ Bindings: Bindings }>,
): Promise<Response> {
  const challenge = c.req.header("X-Okta-Verification-Challenge");
  if (!challenge) {
    return c.json({ error: "Missing verification challenge header" }, 400);
  }
  return c.json({ verification: challenge });
}

export async function handleEventHook(
  c: Context<{ Bindings: Bindings }>,
): Promise<Response> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || authHeader !== c.env.OKTA_WEBHOOK_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header" }, 400);
  }

  const body = await c.req.json<OktaEventHookPayload>();
  if (!body.events?.length) {
    return c.json({ status: "no_events" });
  }

  const processed: string[] = [];
  const errors: string[] = [];

  for (const event of body.events) {
    if (!HANDLED_EVENT_TYPES.has(event.eventType)) continue;

    try {
      await processEvent(event, c.env, tenantId);
      processed.push(event.uuid);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(
        JSON.stringify({
          level: "error",
          message: "Failed to process Okta event",
          eventId: event.uuid,
          eventType: event.eventType,
          error: msg,
        }),
      );
      errors.push(event.uuid);
    }
  }

  return c.json({
    status: "processed",
    processed: processed.length,
    errors: errors.length,
  });
}
