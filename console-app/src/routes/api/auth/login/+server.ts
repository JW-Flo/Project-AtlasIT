import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  const env = platform?.env as any;
  const body: { email: string; password: string } = await request.json();
  const { email, password } = body;

  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    return json({ error: "Auth not configured" }, { status: 500 });
  }

  if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
    console.log(`Auth failure for ${email}`);
    return json({ error: "Invalid credentials" }, { status: 401 });
  }

  const sessionId = crypto.randomUUID();
  const user = {
    userId: "admin",
    email,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  };

  try {
    await env.KV_SESSIONS.put(sessionId, JSON.stringify(user));
  } catch (e) {
    console.error("KV put failed:", e);
    return json({ error: "Session storage failed" }, { status: 500 });
  }

  console.log(`Auth success for ${email}, session ${sessionId}`);

  cookies.set("atlas_session", sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 604800, // 7 days
  });

  return json({ success: true });
};
