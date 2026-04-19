// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — @aws-sdk/client-ses is external (Lambda runtime provides it)
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_REGION ?? "us-east-1" });
const FROM = `AtlasIT <${process.env.EMAIL_FROM ?? "noreply@atlasit.pro"}>`;
const CONSOLE_URL = process.env.CONSOLE_BASE_URL ?? "https://www.atlasit.pro";

async function send(to: string, subject: string, html: string, text: string): Promise<void> {
  try {
    await ses.send(
      new SendEmailCommand({
        Source: FROM,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: html, Charset: "UTF-8" },
            Text: { Data: text, Charset: "UTF-8" },
          },
        },
      }),
    );
  } catch (e) {
    console.error("[email] send.error", { to, subject, error: (e as Error).message });
  }
}

function baseHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { margin: 0; padding: 0; background: #f8f9fb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
  .header { background: hsl(252,87%,58%); padding: 24px 32px; }
  .header-logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
  .logo-box { width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #fff; }
  .brand { font-size: 18px; font-weight: 700; color: #fff; }
  .body { padding: 32px; }
  h1 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
  p { font-size: 14px; color: #475569; line-height: 1.65; margin: 0 0 16px; }
  .btn { display: inline-block; background: hsl(252,87%,58%); color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; margin: 8px 0 20px; }
  .code-box { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; font-family: "SF Mono","Fira Code",monospace; font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: 0.05em; margin: 8px 0 20px; }
  .note { font-size: 12px; color: #94a3b8; }
  .footer { padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; }
  .footer p { font-size: 12px; color: #94a3b8; margin: 0; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="header-logo">
      <div class="logo-box">A</div>
      <span class="brand">AtlasIT</span>
    </div>
  </div>
  <div class="body">${body}</div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} AtlasIT · <a href="${CONSOLE_URL}" style="color:#94a3b8">${CONSOLE_URL.replace("https://", "")}</a></p>
    <p style="margin-top:4px">You received this email because an action was taken on your account.</p>
  </div>
</div>
</body>
</html>`;
}

export async function sendInviteEmail(opts: {
  to: string;
  inviteUrl: string;
  tenantName: string;
  role: string;
}): Promise<void> {
  const html = baseHtml(`
    <h1>You've been invited to AtlasIT</h1>
    <p>You've been invited to join <strong>${opts.tenantName}</strong> on AtlasIT as a <strong>${opts.role}</strong>.</p>
    <p>Click the button below to accept your invitation and set your password. This link expires in 7 days.</p>
    <a href="${opts.inviteUrl}" class="btn">Accept invitation →</a>
    <p class="note">If you weren't expecting this invitation, you can safely ignore this email.</p>
  `);
  const text = `You've been invited to join ${opts.tenantName} on AtlasIT as a ${opts.role}.\n\nAccept your invitation: ${opts.inviteUrl}\n\nThis link expires in 7 days.`;
  await send(opts.to, `You've been invited to AtlasIT — ${opts.tenantName}`, html, text);
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  tempPassword: string;
}): Promise<void> {
  const loginUrl = `${CONSOLE_URL}/login`;
  const html = baseHtml(`
    <h1>Your password has been reset</h1>
    <p>An administrator has reset your AtlasIT password. Use the temporary password below to log in, then change it immediately from your account settings.</p>
    <div class="code-box">${opts.tempPassword}</div>
    <a href="${loginUrl}" class="btn">Log in to AtlasIT →</a>
    <p class="note">If you did not request a password reset, contact your administrator immediately at support@atlasit.pro.</p>
  `);
  const text = `Your AtlasIT password has been reset.\n\nTemporary password: ${opts.tempPassword}\n\nLog in at: ${loginUrl}\n\nChange your password immediately after logging in.`;
  await send(opts.to, "Your AtlasIT password has been reset", html, text);
}

export async function sendWelcomeEmail(opts: { to: string; tenantName: string }): Promise<void> {
  const loginUrl = `${CONSOLE_URL}/login`;
  const html = baseHtml(`
    <h1>Welcome to AtlasIT</h1>
    <p>Your organisation <strong>${opts.tenantName}</strong> is now set up on AtlasIT. You can log in and start connecting your identity providers, enabling compliance frameworks, and building automation rules.</p>
    <a href="${loginUrl}" class="btn">Go to AtlasIT →</a>
    <p>Need help getting started? Visit our <a href="https://docs.atlasit.pro">documentation</a> or email <a href="mailto:support@atlasit.pro">support@atlasit.pro</a>.</p>
  `);
  const text = `Welcome to AtlasIT!\n\nYour organisation ${opts.tenantName} is now set up. Log in at: ${loginUrl}\n\nNeed help? Visit https://docs.atlasit.pro or email support@atlasit.pro`;
  await send(opts.to, `Welcome to AtlasIT — ${opts.tenantName} is ready`, html, text);
}
