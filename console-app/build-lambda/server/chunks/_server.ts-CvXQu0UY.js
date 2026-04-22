import { json } from '@sveltejs/kit';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import { sendEmail } from './email-BNV8ODsA.js';
import './gap-analyzer-CVZTZ0l9.js';
import './pg-BHX2Ay11.js';
import 'events';
import 'util';
import 'crypto';
import 'dns';
import 'fs';
import 'net';
import 'tls';
import 'path';
import 'stream';
import 'string_decoder';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPPORT_INBOX = "support@atlasit.pro";
const POST = async ({ request, platform }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { name, email, category, message } = body;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return json({ error: "Name is required" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || email.trim().length === 0) {
    return json({ error: "Email is required" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email.trim())) {
    return json({ error: "Email address is invalid" }, { status: 400 });
  }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return json({ error: "Message is required" }, { status: 400 });
  }
  const safeName = name.trim();
  const safeEmail = email.trim();
  const safeMessage = message.trim();
  const safeCategory = typeof category === "string" && category.trim() ? category.trim() : "general";
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (db) {
    await writeAudit(db, {
      tenantId: "public",
      actorUserId: "anonymous",
      actorEmail: safeEmail,
      action: "support.request",
      targetType: "support",
      detail: JSON.stringify({
        name: safeName,
        category: safeCategory,
        message: safeMessage
      })
    });
  }
  sendEmail(platform, {
    type: "raw",
    to: SUPPORT_INBOX,
    subject: `[Support · ${safeCategory}] New request from ${safeName}`,
    html: [
      `<h2>New support request</h2>`,
      `<table style="border-collapse:collapse;font-size:14px">`,
      `<tr><td style="padding:4px 12px 4px 0;font-weight:600">Name</td><td>${escapeHtml(safeName)}</td></tr>`,
      `<tr><td style="padding:4px 12px 4px 0;font-weight:600">Email</td><td><a href="mailto:${escapeHtml(safeEmail)}">${escapeHtml(safeEmail)}</a></td></tr>`,
      `<tr><td style="padding:4px 12px 4px 0;font-weight:600">Category</td><td>${escapeHtml(safeCategory)}</td></tr>`,
      `</table>`,
      `<h3 style="margin-top:16px">Message</h3>`,
      `<p style="white-space:pre-wrap">${escapeHtml(safeMessage)}</p>`
    ].join("\n"),
    replyTo: safeEmail
  }).catch((err) => console.error("Support email failed:", err));
  return json({ success: true });
};
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export { POST };
//# sourceMappingURL=_server.ts-CvXQu0UY.js.map
