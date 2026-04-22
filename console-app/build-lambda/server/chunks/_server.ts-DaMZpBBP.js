import { json } from '@sveltejs/kit';

const POST = async ({ cookies, platform }) => {
  const env = platform?.env || {};
  const kv = env.KV_SESSIONS;
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
    maxAge: 604800
  });
  cookies.set("atlas_session_cache", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return json({ success: true });
};

export { POST };
//# sourceMappingURL=_server.ts-DaMZpBBP.js.map
