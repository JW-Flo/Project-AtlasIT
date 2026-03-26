import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: RequestHandler = async ({ request, platform }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, category, message } = body as Record<string, unknown>;

  // Validate required fields
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

  const safeCategory =
    typeof category === "string" && category.trim()
      ? category.trim()
      : "general";

  // Write to audit log so nothing is lost; future work can wire to email / Zendesk
  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (db) {
    await writeAudit(db, {
      tenantId: "public",
      actorUserId: "anonymous",
      actorEmail: email.trim(),
      action: "support.request",
      targetType: "support",
      detail: JSON.stringify({
        name: name.trim(),
        category: safeCategory,
        message: message.trim(),
      }),
    });
  }

  return json({ success: true });
};
