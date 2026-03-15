import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

const ALLOWED_EVENTS = new Set([
  "invite_link_copied",
  "invite_link_opened",
  "invite_signup_completed",
]);

const INVITE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

function sanitizeString(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const event = sanitizeString(body.event, 64);
  const inviteId = sanitizeString(body.inviteId, 128);

  if (!event || !ALLOWED_EVENTS.has(event)) {
    return json({ ok: false, error: "invalid_event" }, { status: 400 });
  }

  if (!inviteId || !INVITE_ID_PATTERN.test(inviteId)) {
    return json({ ok: false, error: "invalid_invite_id" }, { status: 400 });
  }

  const env = (platform?.env as Record<string, unknown>) || {};
  const db = env.ATLAS_SHARED_DB as
    | {
        prepare: (query: string) => {
          bind: (...args: Array<string | null>) => {
            run: () => Promise<unknown>;
          };
        };
      }
    | undefined;

  if (!db) {
    return json({ ok: true, stored: false });
  }

  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS growth_events (
          id TEXT PRIMARY KEY,
          event_name TEXT NOT NULL,
          invite_id TEXT,
          created_at TEXT NOT NULL
        )`,
      )
      .bind()
      .run();

    await db
      .prepare(
        `INSERT INTO growth_events (id, event_name, invite_id, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(crypto.randomUUID(), event, inviteId, new Date().toISOString())
      .run();

    return json({ ok: true, stored: true });
  } catch {
    return json({ ok: true, stored: false });
  }
};
