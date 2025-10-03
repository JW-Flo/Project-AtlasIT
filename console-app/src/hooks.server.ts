import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get("atlas_session");
  let user = null;

  if (sessionId) {
    try {
      const kv = event.platform?.env?.KV_SESSIONS;
      if (kv) {
        const sessionData = await kv.get(sessionId);
        if (sessionData) {
          user = JSON.parse(sessionData);
          // Update last seen
          user.lastSeenAt = new Date().toISOString();
          await kv.put(sessionId, JSON.stringify(user));
        }
      }
    } catch (e) {
      console.error("Session lookup failed:", e);
    }
  }

  event.locals.user = user;

  // Protect /console/* except /console/login
  if (
    event.url.pathname.startsWith("/console") &&
    !event.url.pathname.startsWith("/console/login")
  ) {
    if (!user) {
      throw redirect(302, "/console/login");
    }
  }

  return resolve(event);
};
