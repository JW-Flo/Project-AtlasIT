import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ platform, cookies }) => {
  const env = platform?.env as any;
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
    maxAge: 0,
  });

  return json({ success: true });
};
