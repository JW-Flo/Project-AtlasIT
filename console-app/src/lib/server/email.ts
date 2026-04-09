/** Helper to send emails via the email worker service binding. */

interface EmailRequest {
  type: string;
  [key: string]: unknown;
}

/**
 * Send a transactional email via the email worker.
 * Falls back gracefully if the binding is unavailable.
 */
export async function sendEmail(platform: any, emailReq: EmailRequest): Promise<boolean> {
  const env = platform?.env as any;
  const emailWorker = env?.EMAIL_WORKER;

  if (!emailWorker) {
    console.warn("EMAIL_WORKER binding not available — email not sent:", emailReq.type);
    return false;
  }

  try {
    const res = await emailWorker.fetch(
      new Request("https://email-worker/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(env.EMAIL_WORKER_TOKEN ? { Authorization: `Bearer ${env.EMAIL_WORKER_TOKEN}` } : {}),
        },
        body: JSON.stringify(emailReq),
      }),
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("Email worker error:", res.status, body);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error("Failed to call email worker:", err.message);
    return false;
  }
}

/** Convenience: send a user invite email. */
export async function sendInviteEmail(
  platform: any,
  params: {
    email: string;
    tempPassword: string;
    inviterName: string;
    orgName: string;
    loginUrl: string;
  },
): Promise<boolean> {
  return sendEmail(platform, { type: "invite", ...params });
}

/** Convenience: send an incident notification. */
export async function sendIncidentEmail(
  platform: any,
  params: {
    recipients: string[];
    title: string;
    severity: string;
    description: string;
    incidentUrl: string;
    orgName: string;
  },
): Promise<boolean> {
  return sendEmail(platform, { type: "incident_notification", ...params });
}
