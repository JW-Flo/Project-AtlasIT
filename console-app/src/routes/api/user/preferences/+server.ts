import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { queryPg } from "$lib/server/pg";

const ALLOWED_KEYS = new Set([
  "theme",
  "notification_email_on_sync",
  "notification_email_on_compliance",
  "notification_in_app_alerts",
  "digest_preferences",
  "showHelpIcons",
]);

// Table created via migration 0016_user_preferences.sql

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const rows = await queryPg<{ key: string; value: string }>(
    "SELECT key, value FROM user_preferences WHERE user_id = $1",
    [user.userId],
  );

  const prefs: Record<string, string> = {};
  for (const row of rows) {
    prefs[row.key] = row.value;
  }

  return json(prefs);
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const entries = Object.entries(body as Record<string, unknown>);

  if (entries.length === 0) {
    return json({ error: "No preferences provided" }, { status: 400 });
  }

  for (const [key, value] of entries) {
    if (!ALLOWED_KEYS.has(key)) continue;
    await queryPg(
      "INSERT INTO user_preferences (user_id, key, value) VALUES ($1, $2, $3) ON CONFLICT (user_id, key) DO UPDATE SET value = $3",
      [user.userId, key, String(value)],
    );
  }

  return json({ success: true });
};
