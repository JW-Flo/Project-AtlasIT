import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

const ALLOWED_KEYS = new Set([
  "theme",
  "notification_email_on_sync",
  "notification_email_on_compliance",
  "notification_in_app_alerts",
  "digest_preferences",
]);

// Table created via migration 0016_user_preferences.sql

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const { results } = (await db
    .prepare("SELECT key, value FROM user_preferences WHERE user_id = ?")
    .bind(user.userId)
    .all()) as { results: { key: string; value: string }[] };

  const prefs: Record<string, string> = {};
  for (const row of results || []) {
    prefs[row.key] = row.value;
  }

  return json(prefs);
};

export const PATCH: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const entries = Object.entries(body as Record<string, unknown>);

  if (entries.length === 0) {
    return json({ error: "No preferences provided" }, { status: 400 });
  }

  for (const [key, value] of entries) {
    if (!ALLOWED_KEYS.has(key)) continue;
    await db
      .prepare("INSERT OR REPLACE INTO user_preferences (user_id, key, value) VALUES (?, ?, ?)")
      .bind(user.userId, key, String(value))
      .run();
  }

  return json({ success: true });
};
