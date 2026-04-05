import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";
import { sendEmail } from "$lib/server/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRIVACY_INBOX = "privacy@atlasit.pro";

const VALID_REQUEST_TYPES = [
  "access",
  "deletion",
  "correction",
  "portability",
  "restriction",
  "objection",
] as const;

type DsarRequestType = (typeof VALID_REQUEST_TYPES)[number];

const REQUEST_TYPE_LABELS: Record<DsarRequestType, string> = {
  access: "Access my personal data",
  deletion: "Delete my personal data",
  correction: "Correct inaccurate data",
  portability: "Export/transfer my data",
  restriction: "Restrict processing",
  objection: "Object to processing",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const POST: RequestHandler = async ({ request, platform }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, requestType, organization, details } = body as Record<string, unknown>;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return json({ error: "Name is required" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return json({ error: "A valid email address is required" }, { status: 400 });
  }
  if (
    !requestType ||
    typeof requestType !== "string" ||
    !VALID_REQUEST_TYPES.includes(requestType as DsarRequestType)
  ) {
    return json({ error: "Invalid request type" }, { status: 400 });
  }

  const safeName = name.trim();
  const safeEmail = email.trim();
  const safeOrg = typeof organization === "string" ? organization.trim() : "";
  const safeDetails = typeof details === "string" ? details.trim() : "";
  const safeType = requestType as DsarRequestType;

  // Generate a reference number for tracking
  const refId = `DSAR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // Persist to audit log
  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (db) {
    await writeAudit(db, {
      tenantId: "public",
      actorUserId: "anonymous",
      actorEmail: safeEmail,
      action: "privacy.dsar_request",
      targetType: "dsar",
      detail: JSON.stringify({
        refId,
        name: safeName,
        requestType: safeType,
        organization: safeOrg,
        details: safeDetails,
      }),
    });
  }

  // Notify privacy team
  sendEmail(platform, {
    type: "raw",
    to: PRIVACY_INBOX,
    subject: `[DSAR ${refId}] ${REQUEST_TYPE_LABELS[safeType]} — ${safeName}`,
    html: [
      `<h2>Data Subject Access Request</h2>`,
      `<p><strong>Reference:</strong> ${refId}</p>`,
      `<table style="border-collapse:collapse;font-size:14px">`,
      `<tr><td style="padding:4px 12px 4px 0;font-weight:600">Name</td><td>${escapeHtml(safeName)}</td></tr>`,
      `<tr><td style="padding:4px 12px 4px 0;font-weight:600">Email</td><td><a href="mailto:${escapeHtml(safeEmail)}">${escapeHtml(safeEmail)}</a></td></tr>`,
      `<tr><td style="padding:4px 12px 4px 0;font-weight:600">Organization</td><td>${safeOrg ? escapeHtml(safeOrg) : "<em>Not provided</em>"}</td></tr>`,
      `<tr><td style="padding:4px 12px 4px 0;font-weight:600">Request type</td><td>${escapeHtml(REQUEST_TYPE_LABELS[safeType])}</td></tr>`,
      `</table>`,
      safeDetails
        ? `<h3 style="margin-top:16px">Additional details</h3><p style="white-space:pre-wrap">${escapeHtml(safeDetails)}</p>`
        : "",
      `<hr style="margin-top:24px">`,
      `<p style="font-size:12px;color:#666">GDPR/CCPA requires response within 30 days. Please acknowledge receipt to the requestor promptly.</p>`,
    ].join("\n"),
    replyTo: safeEmail,
  }).catch((err) => console.error("DSAR email failed:", err));

  return json({ success: true, refId });
};
