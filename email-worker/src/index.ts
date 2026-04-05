/**
 * AtlasIT Email Worker — transactional email service.
 *
 * Handles: user invites, MFA reminders, incident notifications,
 * policy approvals, and generic notifications.
 *
 * Called by console-app via service binding or direct HTTP.
 */

import { sendViaMailChannels } from "./send";
import type { EmailMessage } from "./send";
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

      const result = await sendViaMailChannels(message, env.FROM_EMAIL, env.FROM_NAME);

      if (!result.ok) {
        return Response.json({ error: result.error }, { status: 502 });
      }

      return Response.json({ ok: true, messageId: result.messageId });
    } catch (err: any) {
      console.error("Email worker error:", err.message);
      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  },
};
