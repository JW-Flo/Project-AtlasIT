import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { getSession, deleteSession } from "$lib/server/session-store";

export const POST: RequestHandler = async ({ cookies }) => {
  const currentSessionId = cookies.get("atlas_session");
  if (!currentSessionId) {
    return json({ error: "No active session" }, { status: 400 });
  }

  const session = await getSession(currentSessionId);
  if (!session) {
    return json({ error: "Session not found" }, { status: 404 });
  }

  if (!session.impersonatedBy) {
    return json({ error: "Not impersonating" }, { status: 400 });
  }

  const originalSessionId = session.originalSessionId as string;

  await deleteSession(currentSessionId);

  cookies.set("atlas_session", originalSessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });

  cookies.set("atlas_session_cache", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return json({ success: true });
};
