import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ cookies, platform }) => {
  const env = (platform?.env as any) || {};
  const kv = env.KV_SESSIONS as KVNamespace | undefined;
  if (!kv) return json({ error: "Service unavailable" }, { status: 500 });

  const currentSessionId = cookies.get("atlas_session");
  if (!currentSessionId) {
    return json({ error: "No active session" }, { status: 400 });
  }

  const raw = await kv.get(currentSessionId);
  if (!raw) {
    return json({ error: "Session not found" }, { status: 404 });
  }

  const session = JSON.parse(raw);
  if (!session.impersonating) {
    return json({ error: "Not impersonating" }, { status: 400 });
  }

  const originalSessionId = session.originalSessionId;

  await kv.delete(currentSessionId);

  cookies.set("atlas_session", originalSessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });

  return json({ success: true });
};
