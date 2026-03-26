import type { Context } from "hono";
import type {
  Bindings,
  Variables,
  PubSubPushMessage,
  PubSubDecodedPayload,
} from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

// Pub/Sub Audit Log method names we handle
const HANDLED_METHODS = new Map<string, string>([
  ["google.iam.admin.v1.SetIamPolicy", "iam.policy.updated"],
  ["google.admin.directory.v1.MembersService.Insert", "user.provisioned"],
  ["google.admin.directory.v1.MembersService.Delete", "user.deprovisioned"],
  ["google.cloud.identity.v1.GroupService.CreateGroup", "group.created"],
  ["google.cloud.identity.v1.GroupService.DeleteGroup", "group.deleted"],
  [
    "google.cloud.identity.v1.MembershipService.CreateMembership",
    "group.member_added",
  ],
  [
    "google.cloud.identity.v1.MembershipService.DeleteMembership",
    "group.member_removed",
  ],
]);

function mapMethodToAtlasType(methodName: string): string | null {
  return HANDLED_METHODS.get(methodName) ?? null;
}

function decodeMessage(
  message: PubSubPushMessage["message"],
): PubSubDecodedPayload {
  const decoded = atob(message.data);
  return JSON.parse(decoded) as PubSubDecodedPayload;
}

function buildPayload(
  decoded: PubSubDecodedPayload,
  subscription: string,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    subscription,
    timestamp: decoded.timestamp,
    severity: decoded.severity,
    logName: decoded.logName,
  };

  if (decoded.protoPayload) {
    base.methodName = decoded.protoPayload.methodName;
    base.resourceName = decoded.protoPayload.resourceName;
    base.serviceName = decoded.protoPayload.serviceName;

    if (decoded.protoPayload.authenticationInfo?.principalEmail) {
      base.actor = decoded.protoPayload.authenticationInfo.principalEmail;
    }
  }

  if (decoded.resource) {
    base.resource = {
      type: decoded.resource.type,
      labels: decoded.resource.labels,
    };
  }

  return base;
}

/**
 * Handle GCP Pub/Sub push subscription webhook.
 * Pub/Sub delivers messages as POST requests with:
 *   { message: { data: "<base64>", attributes: {}, messageId, publishTime }, subscription }
 */
export async function handlePubSubWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");

  // Pub/Sub push subscriptions can be configured with an auth token.
  // Verify the bearer token matches our adapter secret.
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      { error: "Missing Authorization header", correlationId },
      401,
    );
  }

  const token = authHeader.slice("Bearer ".length);
  const expected = c.env.ADAPTER_SECRET;
  if (token.length !== expected.length || !timingSafeEqual(token, expected)) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        message: "Invalid Pub/Sub webhook token",
      }),
    );
    return c.json({ error: "Invalid token", correlationId }, 401);
  }

  let pushMessage: PubSubPushMessage;
  try {
    pushMessage = await c.req.json<PubSubPushMessage>();
  } catch {
    return c.json({ error: "Invalid request body", correlationId }, 400);
  }

  if (!pushMessage.message?.data) {
    return c.json({ error: "Missing message data", correlationId }, 400);
  }

  const messageId = pushMessage.message.messageId;

  let decoded: PubSubDecodedPayload;
  try {
    decoded = decodeMessage(pushMessage.message);
  } catch {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        messageId,
        message: "Failed to decode Pub/Sub message data",
      }),
    );
    // Acknowledge to prevent redelivery of malformed messages
    return c.json({ status: "ack", correlationId });
  }

  const methodName = decoded.protoPayload?.methodName;

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      messageId,
      message: "Pub/Sub webhook received",
      methodName: methodName ?? "unknown",
      subscription: pushMessage.subscription,
      resourceType: decoded.resource?.type,
    }),
  );

  if (!methodName) {
    return c.json({ status: "ack", reason: "no_method", correlationId });
  }

  const atlasEventType = mapMethodToAtlasType(methodName);
  if (!atlasEventType) {
    return c.json({
      status: "ack",
      reason: "unhandled_method",
      methodName,
      correlationId,
    });
  }

  // Resolve tenantId from the GCP project in the resource labels
  const projectId = decoded.resource?.labels?.["project_id"];
  const tenantId = projectId
    ? await resolveProjectTenantId(c.env.DB, projectId)
    : null;

  if (!tenantId) {
    console.log(
      JSON.stringify({
        level: "warn",
        correlationId,
        messageId,
        message: "No tenant mapping for GCP project",
        projectId: projectId ?? "unknown",
      }),
    );
    return c.json({
      status: "ack",
      reason: "unmapped_project",
      correlationId,
    });
  }

  const eventPayload = buildPayload(decoded, pushMessage.subscription);

  try {
    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: atlasEventType,
      source: "connector:gcp",
      payload: eventPayload,
      idempotencyKey: messageId,
      correlationId,
    });

    return c.json({
      status: "processed",
      messageId,
      atlasEventType,
      correlationId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        messageId,
        message: "Failed to publish Pub/Sub webhook event",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
}

/**
 * Resolve a GCP project ID to an AtlasIT tenant_id.
 * Uses the connector_configs table where connector_slug='gcp' and
 * the config JSON contains the project ID.
 */
async function resolveProjectTenantId(
  db: D1Database,
  projectId: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'gcp' AND json_extract(config, '$.projectId') = ?
       LIMIT 1`,
    )
    .bind(projectId)
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
