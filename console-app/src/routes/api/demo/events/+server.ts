import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

const ALLOWED_EVENTS = new Set([
  "viewed_demo",
  "clicked_cta",
  "explored_module",
  "requested_trial",
  "booked_demo",
]);
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_EVENTS = 60;

function clean(value: unknown, maxLen = 128): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;
  return v.slice(0, maxLen);
}

function isDemoModeEnabled(env: Record<string, unknown>): boolean {
  return String(env.DEMO_MODE ?? "false").toLowerCase() === "true";
}

function clientIp(headers: Headers): string {
  const cfIp = clean(headers.get("cf-connecting-ip"), 64);
  if (cfIp) return cfIp;
  const forwardedFor = headers.get("x-forwarded-for");
  if (!forwardedFor) return "unknown";
  const first = forwardedFor.split(",")[0]?.trim();
  return clean(first, 64) ?? "unknown";
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = ((platform?.env as Record<string, unknown> | undefined) ?? {}) as Record<
    string,
    unknown
  >;
  if (!isDemoModeEnabled(env)) return json({ ok: true, stored: false });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const event = clean(body.event, 64);
  const moduleName = clean(body.module, 64);

  if (!event || !ALLOWED_EVENTS.has(event)) {
    return json({ ok: false, error: "invalid_event" }, { status: 400 });
  }

  const kv = env.KV_CACHE as KVNamespace | undefined;
  if (kv) {
    const rateKey = `demo:events:ip:${clientIp(request.headers)}`;
    const current = parseInt((await kv.get(rateKey)) ?? "0", 10);
    if (current >= RATE_LIMIT_MAX_EVENTS) {
      return json({ ok: false, error: "rate_limited" }, { status: 429 });
    }
    await kv.put(rateKey, String(current + 1), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS });
  }

  const db = env.ATLAS_SHARED_DB as D1Database | undefined;

  if (!db) return json({ ok: true, stored: false });

  try {
    await db
      .prepare(
        `INSERT INTO growth_events (id, event_name, module, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(crypto.randomUUID(), event, moduleName, new Date().toISOString())
      .run();
    return json({ ok: true, stored: true });
  } catch {
    try {
      await db
        .prepare(
          `INSERT INTO growth_events (id, event_name, invite_id, created_at)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(crypto.randomUUID(), event, null, new Date().toISOString())
        .run();
      return json({ ok: true, stored: true });
    } catch {
      return json({ ok: true, stored: false });
    }
  }
};
