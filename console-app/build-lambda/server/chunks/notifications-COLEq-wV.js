import { sendEmail } from './email-BNV8ODsA.js';

const DEFAULT_PREFS = {
  email: {
    incidents: true,
    compliance: true,
    automation: false,
    policy: true,
    directory: false
  },
  in_app: {
    incidents: true,
    compliance: true,
    automation: true,
    policy: true,
    directory: true
  }
};
function prefCategory(type) {
  if (type.startsWith("incident")) return "incidents";
  if (type.startsWith("compliance")) return "compliance";
  if (type.startsWith("policy")) return "policy";
  if (type.startsWith("user") || type.startsWith("app")) return "directory";
  if (type.startsWith("automation")) return "automation";
  return "incidents";
}
async function notify(db, platform, payload) {
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.prepare(
    `INSERT INTO notifications (id, tenant_id, user_id, type, channel, title, body, severity,
         source_type, source_id, source_label, action_url, metadata, created_at)
       VALUES (?, ?, ?, ?, 'in_app', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
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
    now
  ).run();
  const recipients = await resolveEmailRecipients(db, payload);
  if (recipients.length > 0) {
    const emailType = mapToEmailType(payload);
    if (emailType) {
      const baseUrl = "https://www.atlasit.pro";
      const sent = await sendEmail(platform, {
        ...emailType,
        recipients,
        actionUrl: payload.actionUrl ? `${baseUrl}${payload.actionUrl}` : void 0
      });
      await db.prepare("UPDATE notifications SET emailed_at = ?, email_error = ? WHERE id = ?").bind(sent ? now : null, sent ? null : "delivery_failed", id).run();
    }
  }
  return id;
}
async function notifyMany(db, platform, payload, userIds) {
  const ids = [];
  for (const userId of userIds) {
    const nid = await notify(db, platform, { ...payload, userId });
    ids.push(nid);
  }
  return ids;
}
async function resolveEmailRecipients(db, payload) {
  const category = prefCategory(payload.type);
  if (payload.userId) {
    const prefs = await getUserNotificationPrefs(db, payload.userId);
    if (prefs.email[category] === false) return [];
    const user = await db.prepare("SELECT email FROM console_users WHERE id = ?").bind(payload.userId).first();
    return user ? [user.email] : [];
  }
  const routing = await getTenantNotificationRouting(db, payload.tenantId);
  const routingKey = `${category}_emails`;
  if (routing[routingKey] && Array.isArray(routing[routingKey])) {
    return routing[routingKey];
  }
  return routing.default_emails || [];
}
async function getUserNotificationPrefs(db, userId) {
  try {
    const row = await db.prepare("SELECT value FROM user_preferences WHERE user_id = ? AND key = ?").bind(userId, "notification_channels").first();
    if (row) {
      const parsed = JSON.parse(row.value);
      return {
        email: { ...DEFAULT_PREFS.email, ...parsed.email },
        in_app: { ...DEFAULT_PREFS.in_app, ...parsed.in_app }
      };
    }
  } catch {
  }
  return DEFAULT_PREFS;
}
async function getTenantNotificationRouting(db, tenantId) {
  try {
    const row = await db.prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = ?").bind(tenantId, "notification_routing").first();
    return row ? JSON.parse(row.value) : {};
  } catch {
    return {};
  }
}
function mapToEmailType(payload) {
  if (payload.type.startsWith("incident")) {
    return {
      type: "incident_notification",
      title: payload.title,
      severity: payload.severity || "info",
      description: payload.body || "",
      incidentUrl: payload.actionUrl ? `https://www.atlasit.pro${payload.actionUrl}` : "https://www.atlasit.pro/console/incidents",
      orgName: payload.metadata?.orgName || "Your Organization"
    };
  }
  if (payload.type.startsWith("policy")) {
    return {
      type: "policy_approval",
      policyName: payload.sourceLabel || payload.title,
      requesterName: payload.metadata?.requesterName || "A team member",
      approvalUrl: payload.actionUrl ? `https://www.atlasit.pro${payload.actionUrl}` : "https://www.atlasit.pro/console/policies",
      orgName: payload.metadata?.orgName || "Your Organization"
    };
  }
  return {
    type: "notification",
    subject: payload.title,
    heading: payload.title,
    body: payload.body || "",
    ctaText: payload.actionUrl ? "View Details" : void 0,
    ctaUrl: payload.actionUrl ? `https://www.atlasit.pro${payload.actionUrl}` : void 0
  };
}

export { notify, notifyMany };
//# sourceMappingURL=notifications-COLEq-wV.js.map
