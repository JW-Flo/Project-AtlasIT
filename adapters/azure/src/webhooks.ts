import type { Context } from "hono";
import type { Bindings, GraphChangeNotification } from "./types.js";
import { getUser } from "./client.js";
import { publishEvent } from "./event-publisher.js";

type Variables = {
  correlationId: string;
};

// Microsoft Graph change notification resource patterns
const USER_RESOURCE_PATTERN = /^users\/([^/]+)$/;
const GROUP_RESOURCE_PATTERN = /^groups\/([^/]+)$/;
const GROUP_MEMBER_PATTERN = /^groups\/([^/]+)\/members\/([^/]+)$/;

function mapChangeType(
  resource: string,
  changeType: "created" | "updated" | "deleted",
): string | null {
  if (USER_RESOURCE_PATTERN.test(resource)) {
    switch (changeType) {
      case "created":
        return "user.provisioned";
      case "updated":
        return "user.updated";
      case "deleted":
        return "user.deprovisioned";
    }
  }

  if (GROUP_RESOURCE_PATTERN.test(resource)) {
    switch (changeType) {
      case "created":
        return "group.created";
      case "updated":
        return "group.updated";
      case "deleted":
        return "group.deleted";
    }
  }

  if (GROUP_MEMBER_PATTERN.test(resource)) {
    switch (changeType) {
      case "created":
        return "group.member.added";
      case "deleted":
        return "group.member.removed";
      default:
        return null;
    }
  }

  return null;
}

/**
 * Handle Microsoft Graph subscription validation.
 *
 * When creating a subscription, Graph sends a POST with a `validationToken`
 * query parameter. We must respond with the token as plain text within 10s.
 */
export async function handleSubscriptionValidation(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
): Promise<Response | null> {
  const validationToken = c.req.query("validationToken");
  if (!validationToken) return null;

  return new Response(validationToken, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * Process incoming Microsoft Graph change notifications.
 */
export async function handleChangeNotifications(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  accessToken: string,
  tenantId: string,
): Promise<Response> {
  const correlationId = c.req.header("X-Correlation-ID") ?? crypto.randomUUID();

  const body = await c.req.json<GraphChangeNotification>();

  if (!body.value?.length) {
    return c.json({ status: "no_notifications", correlationId });
  }

  const processed: string[] = [];
  const errors: string[] = [];

  for (const notification of body.value) {
    const atlasEventType = mapChangeType(
      notification.resource,
      notification.changeType,
    );

    if (!atlasEventType) continue;

    const notificationId = `${notification.subscriptionId}:${notification.resourceData.id}:${notification.changeType}`;

    try {
      let payload: Record<string, unknown> = {
        externalId: notification.resourceData.id,
        changeType: notification.changeType,
        resource: notification.resource,
        azureTenantId: notification.tenantId,
      };

      // Enrich user notifications with full profile data
      if (
        USER_RESOURCE_PATTERN.test(notification.resource) &&
        notification.changeType !== "deleted"
      ) {
        try {
          const user = await getUser(accessToken, notification.resourceData.id);
          payload = {
            ...payload,
            email: user.mail ?? user.userPrincipalName,
            displayName: user.displayName,
            department: user.department,
            jobTitle: user.jobTitle,
            accountEnabled: user.accountEnabled,
          };
        } catch {
          // Use partial info if user fetch fails (user may have been deleted)
        }
      }

      await publishEvent({
        orchestratorUrl: c.env.ORCHESTRATOR_URL,
        tenantId,
        type: atlasEventType,
        source: "connector:azure",
        payload,
        idempotencyKey: notificationId,
        correlationId,
      });

      processed.push(notificationId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          tenantId,
          message: "Failed to process Graph change notification",
          notificationId,
          error: msg,
        }),
      );
      errors.push(notificationId);
    }
  }

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      tenantId,
      message: "Graph change notifications processed",
      processed: processed.length,
      errors: errors.length,
    }),
  );

  return c.json({
    status: "processed",
    processed: processed.length,
    errors: errors.length,
    correlationId,
  });
}
