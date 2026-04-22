import { json } from '@sveltejs/kit';

const ALLOWED_EVENTS = /* @__PURE__ */ new Set([
  "invite_link_copied",
  "invite_link_opened",
  "invite_signup_completed"
]);
function sanitizeString(value, maxLen) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}
const POST = async ({ request, platform }) => {
  const body = await request.json().catch(() => ({}));
  const event = sanitizeString(body.event, 64);
  const inviteId = sanitizeString(body.inviteId, 128);
  if (!event || !ALLOWED_EVENTS.has(event)) {
    return json({ ok: false, error: "invalid_event" }, { status: 400 });
  }
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) {
    return json({ ok: true, stored: false });
  }
  try {
    await db.prepare(
      `INSERT INTO growth_events (id, event_name, invite_id, created_at)
         VALUES (?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), event, inviteId, (/* @__PURE__ */ new Date()).toISOString()).run();
    return json({ ok: true, stored: true });
  } catch {
    return json({ ok: true, stored: false });
  }
};

export { POST };
//# sourceMappingURL=_server.ts-BEzvE4ir.js.map
