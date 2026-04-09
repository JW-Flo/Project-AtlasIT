/** Transactional email HTML templates for AtlasIT. */

const baseLayout = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #f4f4f5;">
              <div style="font-size:20px;font-weight:700;color:#18181b;">AtlasIT</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #f4f4f5;font-size:12px;color:#a1a1aa;">
              This email was sent by AtlasIT. If you didn't expect this, you can safely ignore it.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export function inviteEmail(params: {
  inviterName: string;
  orgName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `You've been invited to ${params.orgName} on AtlasIT`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b;">You're invited!</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6;">
        ${params.inviterName} has invited you to join <strong>${params.orgName}</strong> on AtlasIT.
      </p>
      <p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">Your temporary credentials:</p>
      <table style="background:#f4f4f5;border-radius:8px;padding:16px;width:100%;margin:0 0 24px;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:12px 16px;">
            <div style="font-size:12px;color:#71717a;margin-bottom:4px;">Email</div>
            <div style="font-size:14px;color:#18181b;font-family:monospace;">${params.email}</div>
            <div style="font-size:12px;color:#71717a;margin:12px 0 4px;">Temporary Password</div>
            <div style="font-size:14px;color:#18181b;font-family:monospace;">${params.tempPassword}</div>
          </td>
        </tr>
      </table>
      <a href="${params.loginUrl}" style="display:inline-block;background:#18181b;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">
        Sign in to AtlasIT
      </a>
      <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;">
        Please change your password after signing in.
      </p>
    `),
  };
}

export function mfaSetupReminderEmail(params: {
  displayName: string;
  orgName: string;
  settingsUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Action required: Enable two-factor authentication for ${params.orgName}`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b;">MFA Required</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6;">
        Hi ${params.displayName}, your organization <strong>${params.orgName}</strong> requires two-factor authentication.
        Please set up TOTP on your account to continue accessing AtlasIT.
      </p>
      <a href="${params.settingsUrl}" style="display:inline-block;background:#18181b;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">
        Set up MFA
      </a>
    `),
  };
}

export function incidentNotificationEmail(params: {
  title: string;
  severity: string;
  description: string;
  incidentUrl: string;
  orgName: string;
}): { subject: string; html: string } {
  const severityColors: Record<string, string> = {
    critical: "#dc2626",
    high: "#ea580c",
    medium: "#ca8a04",
    low: "#2563eb",
  };
  const color = severityColors[params.severity] || "#71717a";

  return {
    subject: `[${params.severity.toUpperCase()}] ${params.title} - ${params.orgName}`,
    html: baseLayout(`
      <div style="display:inline-block;background:${color};color:#fff;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:12px;">
        ${params.severity}
      </div>
      <h2 style="margin:8px 0 16px;font-size:18px;color:#18181b;">${params.title}</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#3f3f46;line-height:1.6;">
        ${params.description}
      </p>
      <a href="${params.incidentUrl}" style="display:inline-block;background:#18181b;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">
        View Incident
      </a>
    `),
  };
}

export function policyApprovalEmail(params: {
  policyName: string;
  requesterName: string;
  approvalUrl: string;
  orgName: string;
}): { subject: string; html: string } {
  return {
    subject: `Policy review requested: ${params.policyName}`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b;">Policy Review Requested</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6;">
        ${params.requesterName} has requested your review of the policy
        <strong>${params.policyName}</strong> in ${params.orgName}.
      </p>
      <a href="${params.approvalUrl}" style="display:inline-block;background:#18181b;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">
        Review Policy
      </a>
    `),
  };
}

export function genericNotificationEmail(params: {
  subject: string;
  heading: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}): { subject: string; html: string } {
  const ctaBlock =
    params.ctaText && params.ctaUrl
      ? `<a href="${params.ctaUrl}" style="display:inline-block;background:#18181b;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">${params.ctaText}</a>`
      : "";

  return {
    subject: params.subject,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b;">${params.heading}</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#3f3f46;line-height:1.6;">
        ${params.body}
      </p>
      ${ctaBlock}
    `),
  };
}
