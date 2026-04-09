/** Email sending via MailChannels API (free for Cloudflare Workers). */

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
}

export interface SendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via MailChannels transactional API.
 * MailChannels provides free email sending for Cloudflare Workers
 * when DNS is configured with the required SPF/DKIM records.
 *
 * Setup: Add to your domain's DNS:
 *   TXT  _mailchannels  v=mc1 cfid=atlasit-email-worker
 *   TXT  @              v=spf1 include:relay.mailchannels.net -all
 */
export async function sendViaMailChannels(
  message: EmailMessage,
  fromEmail: string = "noreply@atlasit.pro",
  fromName: string = "AtlasIT",
): Promise<SendResult> {
  const recipients = Array.isArray(message.to) ? message.to : [message.to];

  const payload = {
    personalizations: recipients.map((email) => ({
      to: [{ email, name: email.split("@")[0] }],
    })),
    from: {
      email: message.from || fromEmail,
      name: message.fromName || fromName,
    },
    subject: message.subject,
    content: [
      {
        type: "text/html",
        value: message.html,
      },
    ],
    ...(message.replyTo ? { reply_to: { email: message.replyTo } } : {}),
  };

  try {
    const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.status === 202 || res.ok) {
      return { ok: true, messageId: `mc-${Date.now()}` };
    }

    const body = await res.text();
    console.error("MailChannels error:", res.status, body);
    return { ok: false, error: `MailChannels ${res.status}: ${body}` };
  } catch (err: any) {
    console.error("Email send failed:", err.message);
    return { ok: false, error: err.message };
  }
}
