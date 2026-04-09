/**
 * AtlasIT Email Worker — transactional email service.
 *
 * Handles: user invites, MFA reminders, incident notifications,
 * policy approvals, and generic notifications.
 *
 * Called by console-app via service binding or direct HTTP.
 */

import { sendViaMailChannels } from "./send";
import type { EmailMessage, SendResult } from "./send";
import { sendViaSmtp } from "./smtp";
import {
  inviteEmail,
  mfaSetupReminderEmail,
  incidentNotificationEmail,
  policyApprovalEmail,
  genericNotificationEmail,
} from "./templates";

interface Env {
  FROM_EMAIL: string;
  FROM_NAME: string;
  WORKER_AUTH_TOKEN: string;
  ENVIRONMENT: string;
  // SMTP fallback
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USERNAME?: string;
  SMTP_PASSWORD?: string;
  // Usage tracking
  EMAIL_USAGE: KVNamespace;
}

const MONTHLY_EMAIL_LIMIT = 9000; // Brevo free tier: 300/day × 30 days
const LOW_BALANCE_THRESHOLD = 20;
const ALERT_EMAIL = "joe.whittle@atlasit.pro";

function currentMonthKey(): string {
  const now = new Date();
  return `usage:${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function getMonthlyUsage(kv: KVNamespace): Promise<number> {
  const val = await kv.get(currentMonthKey());
  return val ? parseInt(val, 10) : 0;
}

async function incrementUsage(kv: KVNamespace): Promise<number> {
  const key = currentMonthKey();
  const current = await getMonthlyUsage(kv);
  const next = current + 1;
  // TTL 35 days so old months auto-expire
  await kv.put(key, String(next), { expirationTtl: 35 * 24 * 60 * 60 });
  return next;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/health") {
      return Response.json({
        status: "healthy",
        service: "email-worker",
        timestamp: new Date().toISOString(),
      });
    }

    // Usage stats (authenticated)
    if (url.pathname === "/usage") {
      if (env.WORKER_AUTH_TOKEN) {
        const auth = request.headers.get("Authorization");
        if (auth !== `Bearer ${env.WORKER_AUTH_TOKEN}`) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
      }
      const used = env.EMAIL_USAGE ? await getMonthlyUsage(env.EMAIL_USAGE) : 0;
      return Response.json({
        month: currentMonthKey().replace("usage:", ""),
        used,
        limit: MONTHLY_EMAIL_LIMIT,
        remaining: MONTHLY_EMAIL_LIMIT - used,
      });
    }

    // Auth check (service-to-service)
    if (env.WORKER_AUTH_TOKEN) {
      const auth = request.headers.get("Authorization");
      if (auth !== `Bearer ${env.WORKER_AUTH_TOKEN}`) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
      const body = (await request.json()) as any;
      const { type, ...params } = body;

      let message: EmailMessage | null = null;

      switch (type) {
        case "invite": {
          const tmpl = inviteEmail(params);
          message = { to: params.email, ...tmpl };
          break;
        }
        case "mfa_setup_reminder": {
          const tmpl = mfaSetupReminderEmail(params);
          message = { to: params.email, ...tmpl };
          break;
        }
        case "incident_notification": {
          const tmpl = incidentNotificationEmail(params);
          message = { to: params.recipients || params.email, ...tmpl };
          break;
        }
        case "policy_approval": {
          const tmpl = policyApprovalEmail(params);
          message = { to: params.reviewerEmail, ...tmpl };
          break;
        }
        case "notification": {
          const tmpl = genericNotificationEmail(params);
          message = { to: params.email || params.recipients, ...tmpl };
          break;
        }
        case "raw": {
          // Send a pre-formatted email
          message = {
            to: params.to,
            subject: params.subject,
            html: params.html,
            replyTo: params.replyTo,
          };
          break;
        }
        default:
          return Response.json({ error: `Unknown email type: ${type}` }, { status: 400 });
      }

      if (!message) {
        return Response.json({ error: "Failed to build email" }, { status: 400 });
      }

      // In dev mode, log instead of sending
      if (env.ENVIRONMENT === "development") {
        console.log("DEV EMAIL:", JSON.stringify({ to: message.to, subject: message.subject }));
        return Response.json({ ok: true, dev: true, messageId: `dev-${Date.now()}` });
      }

      // Check monthly usage limit
      if (env.EMAIL_USAGE) {
        const used = await getMonthlyUsage(env.EMAIL_USAGE);
        if (used >= MONTHLY_EMAIL_LIMIT) {
          console.error(`Monthly email limit reached: ${used}/${MONTHLY_EMAIL_LIMIT}`);
          return Response.json(
            { error: "Monthly email limit reached", used, limit: MONTHLY_EMAIL_LIMIT },
            { status: 429 },
          );
        }
      }

      // Try MailChannels first, fall back to SMTP
      let result: SendResult = await sendViaMailChannels(message, env.FROM_EMAIL, env.FROM_NAME);

      if (!result.ok && env.SMTP_HOST && env.SMTP_USERNAME && env.SMTP_PASSWORD) {
        console.log("MailChannels failed, falling back to SMTP:", result.error);
        result = await sendViaSmtp(message, {
          host: env.SMTP_HOST,
          port: parseInt(env.SMTP_PORT || "587", 10),
          username: env.SMTP_USERNAME,
          password: env.SMTP_PASSWORD,
          fromEmail: env.FROM_EMAIL,
          fromName: env.FROM_NAME,
        });
      }

      if (!result.ok) {
        return Response.json({ error: result.error }, { status: 502 });
      }

      // Track usage and check for low balance
      if (env.EMAIL_USAGE) {
        const newCount = await incrementUsage(env.EMAIL_USAGE);
        const remaining = MONTHLY_EMAIL_LIMIT - newCount;
        if (remaining === LOW_BALANCE_THRESHOLD) {
          // Send low-balance alert (don't await — fire and forget)
          const alertMsg: EmailMessage = {
            to: ALERT_EMAIL,
            subject: `⚠️ AtlasIT Email: ${remaining} sends remaining this month`,
            html: `<p>You have <strong>${remaining}</strong> email sends remaining out of ${MONTHLY_EMAIL_LIMIT} for ${currentMonthKey().replace("usage:", "")}.</p><p>Consider upgrading to AWS SES or increasing your Brevo plan.</p>`,
          };
          sendViaSmtp(alertMsg, {
            host: env.SMTP_HOST!,
            port: parseInt(env.SMTP_PORT || "587", 10),
            username: env.SMTP_USERNAME!,
            password: env.SMTP_PASSWORD!,
            fromEmail: env.FROM_EMAIL,
            fromName: env.FROM_NAME,
          }).catch((e) => console.error("Failed to send low-balance alert:", e));
        }
      }

      return Response.json({
        ok: true,
        messageId: result.messageId,
        provider: result.messageId?.startsWith("mc-") ? "mailchannels" : "smtp",
      });
    } catch (err: any) {
      console.error("Email worker error:", err.message);
      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  },
};
