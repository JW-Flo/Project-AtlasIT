import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { queryPg } from "$lib/server/pg";

const ALLOWED_EVENTS = new Set([
  "invite_link_copied",
  "invite_link_opened",
  "invite_signup_completed",
]);

function sanitizeString(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const event = sanitizeString(body.event, 64);
  const inviteId = sanitizeString(body.inviteId, 128);

  if (!event || !ALLOWED_EVENTS.has(event)) {
    return json({ ok: false, error: "invalid_event" }, { status: 400 });
  }

  try {
    await queryPg(
      `INSERT INTO growth_events (id, event_name, invite_id, created_at)
       VALUES ($1, $2, $3, $4)`,
      [crypto.randomUUID(), event, inviteId, new Date().toISOString()],
    );

    return json({ ok: true, stored: true });
  } catch {
    return json({ ok: true, stored: false });
  }
};
