/**
 * Notification service — creates in-app notifications and dispatches emails.
 * Links every notification to its source entity (incident, policy, app, user, etc.)
 */

import { sendEmail } from "./email";

export type NotificationType =
  | "incident_created"
  | "incident_resolved"
  | "incident_assigned"
  | "incident_escalated"
  | "incident_sla_breach"
  | "compliance_score_changed"
  | "policy_approval_requested"
  | "policy_approved"
  | "policy_rejected"
  | "user_invited"
  | "user_deactivated"
  | "app_connected"
  | "app_disconnected"
  | "app_health_changed"
  | "automation_triggered"
  | "system";

export type SourceType =
  | "incident"
  | "policy"
  | "app"
  | "user"
  | "compliance"
  | "automation_rule"
  | "system";

export interface NotificationPayload {
  tenantId: string;
  /** Target user ID (null = broadcast to tenant notification routing) */
  userId?: string | null;
  type: NotificationType;
  title: string;
  body?: string;
  severity?: "info" | "warning" | "error" | "critical";
  /** Link back to the entity that triggered this notification */
  sourceType?: SourceType;
  sourceId?: string;
  sourceLabel?: string;
  /** URL path for the CTA (e.g., /console/incidents/abc-123) */
  actionUrl?: string;
  /** Extra metadata as JSON */
  metadata?: Record<string, unknown>;
}

interface NotificationPrefs {
  email: Record<string, boolean>;
  in_app: Record<string, boolean>;
}

const DEFAULT_PREFS: NotificationPrefs = {
  email: {
    incidents: true,
    compliance: true,
    automation: false,
    policy: true,
    directory: false,
  },
  in_app: {
    incidents: true,
    compliance: true,
    automation: true,
    policy: true,
    directory: true,
  },
};

/** Determine the preference category for a notification type. */
function prefCategory(type: NotificationType): string {
  if (type.startsWith("incident")) return "incidents";
  if (type.startsWith("compliance")) return "compliance";
  if (type.startsWith("policy")) return "policy";
  if (type.startsWith("user") || type.startsWith("app")) return "directory";
  if (type.startsWith("automation")) return "automation";
  return "incidents";
}

/** Create a notification, store in D1, and optionally dispatch email. */
export async function notify(
  db: any,
  platform: any,
  payload: NotificationPayload,
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Store in-app notification
  await db
    .prepare(
      `INSERT INTO notifications (id, tenant_id, user_id, type, channel, title, body, severity,
         source_type, source_id, source_label, action_url, metadata, created_at)
       VALUES (?, ?, ?, ?, 'in_app', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      payload.tenantId,
      payload.userId || null,
      payload.type,
      payload.title,
      payload.body || null,
      payload.severity || "info",
      payload.sourceType || null,
      payload.sourceId || null,
      payload.sourceLabel || null,
      payload.actionUrl || null,
      payload.metadata ? JSON.stringify(payload.metadata) : null,
      now,
    )
    .run();

  // Determine email recipients
  const recipients = await resolveEmailRecipients(db, payload);

  if (recipients.length > 0) {
    const emailType = mapToEmailType(payload);
    if (emailType) {
      const baseUrl = "https://www.atlasit.pro";
      const sent = await sendEmail(platform, {
        ...emailType,
        recipients,
        actionUrl: payload.actionUrl ? `${baseUrl}${payload.actionUrl}` : undefined,
      });

      // Record email delivery status
      await db
        .prepare("UPDATE notifications SET emailed_at = ?, email_error = ? WHERE id = ?")
        .bind(sent ? now : null, sent ? null : "delivery_failed", id)
        .run();
    }
  }

  return id;
}

/** Broadcast a notification to multiple users. */
export async function notifyMany(
  db: any,
  platform: any,
  payload: Omit<NotificationPayload, "userId">,
  userIds: string[],
): Promise<string[]> {
  const ids: string[] = [];
  for (const userId of userIds) {
    const nid = await notify(db, platform, { ...payload, userId });
    ids.push(nid);
  }
  return ids;
}

/** Resolve who should receive email for this notification. */
async function resolveEmailRecipients(db: any, payload: NotificationPayload): Promise<string[]> {
  const category = prefCategory(payload.type);

  // If targeted at a specific user, check their preferences
  if (payload.userId) {
    const prefs = await getUserNotificationPrefs(db, payload.userId);
    if (prefs.email[category] === false) return [];

    const user = await db
      .prepare("SELECT email FROM console_users WHERE id = ?")
      .bind(payload.userId)
      .first<{ email: string }>();

    return user ? [user.email] : [];
  }

  // Broadcast: check tenant notification routing
  const routing = await getTenantNotificationRouting(db, payload.tenantId);
  const routingKey = `${category}_emails`;
  if (routing[routingKey] && Array.isArray(routing[routingKey])) {
    return routing[routingKey];
  }
  return routing.default_emails || [];
}

async function getUserNotificationPrefs(db: any, userId: string): Promise<NotificationPrefs> {
  try {
    const row = await db
      .prepare("SELECT value FROM user_preferences WHERE user_id = ? AND key = ?")
      .bind(userId, "notification_channels")
      .first<{ value: string }>();
    if (row) {
      const parsed = JSON.parse(row.value);
      return {
        email: { ...DEFAULT_PREFS.email, ...parsed.email },
        in_app: { ...DEFAULT_PREFS.in_app, ...parsed.in_app },
      };
    }
  } catch {}
  return DEFAULT_PREFS;
}

async function getTenantNotificationRouting(
  db: any,
  tenantId: string,
): Promise<Record<string, any>> {
  try {
    const row = await db
      .prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = ?")
      .bind(tenantId, "notification_routing")
      .first<{ value: string }>();
    return row ? JSON.parse(row.value) : {};
  } catch {
    return {};
  }
}

/** Map notification payload to email worker request. */
function mapToEmailType(payload: NotificationPayload): Record<string, any> | null {
  if (payload.type.startsWith("incident")) {
    return {
      type: "incident_notification",
      title: payload.title,
      severity: payload.severity || "info",
      description: payload.body || "",
      incidentUrl: payload.actionUrl
        ? `https://www.atlasit.pro${payload.actionUrl}`
        : "https://www.atlasit.pro/console/incidents",
      orgName: payload.metadata?.orgName || "Your Organization",
    };
  }

  if (payload.type.startsWith("policy")) {
    return {
      type: "policy_approval",
      policyName: payload.sourceLabel || payload.title,
      requesterName: (payload.metadata?.requesterName as string) || "A team member",
      approvalUrl: payload.actionUrl
        ? `https://www.atlasit.pro${payload.actionUrl}`
        : "https://www.atlasit.pro/console/policies",
      orgName: payload.metadata?.orgName || "Your Organization",
    };
  }

  // Generic notification for everything else
  return {
    type: "notification",
    subject: payload.title,
    heading: payload.title,
    body: payload.body || "",
    ctaText: payload.actionUrl ? "View Details" : undefined,
    ctaUrl: payload.actionUrl ? `https://www.atlasit.pro${payload.actionUrl}` : undefined,
  };
}
