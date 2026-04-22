import { json } from '@sveltejs/kit';

const POST = async ({ platform, cookies }) => {
  const env = platform?.env;
  const sessionId = cookies.get("atlas_session");
  if (sessionId) {
    try {
      if (env?.KV_SESSIONS) {
        await env.KV_SESSIONS.delete(sessionId);
      }
      console.log(`Logout for session ${sessionId}`);
    } catch (e) {
      console.error("KV delete failed:", e);
    }
  }
  cookies.set("atlas_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
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
//# sourceMappingURL=_server.ts-DXzk5Yhy.js.map
