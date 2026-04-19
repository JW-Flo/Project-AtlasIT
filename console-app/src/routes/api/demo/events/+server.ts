import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

const ALLOWED_EVENTS = new Set([
  "viewed_demo",
  "clicked_cta",
  "explored_module",
  "requested_trial",
  "booked_demo",
]);

function clean(value: unknown, maxLen = 128): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;
  return v.slice(0, maxLen);
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const event = clean(body.event, 64);
  const module = clean(body.module, 64);

  if (!event || !ALLOWED_EVENTS.has(event)) {
    return json({ ok: false, error: "invalid_event" }, { status: 400 });
  }

  const db = (platform?.env as Record<string, unknown> | undefined)?.ATLAS_SHARED_DB as
    | D1Database
    | undefined;

  if (!db) return json({ ok: true, stored: false });

  try {
    await db
      .prepare(
        `INSERT INTO growth_events (id, event_name, invite_id, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(crypto.randomUUID(), event, module, new Date().toISOString())
      .run();
    return json({ ok: true, stored: true });
  } catch {
    return json({ ok: true, stored: false });
  }
};
