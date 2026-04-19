import type { PageServerLoad } from "./$types";
import { redirect, error } from "@sveltejs/kit";

const RATE_LIMIT_WINDOW_SEC = 60;
const RATE_LIMIT_MAX = 40;

export const load: PageServerLoad = async ({ platform, getClientAddress, url }) => {
  const env = (platform?.env as Record<string, unknown>) || {};
  const demoMode = String(env.DEMO_MODE ?? "false").toLowerCase() === "true";
  if (!demoMode) {
    throw redirect(302, "/");
  }

  const kv = env.KV_CACHE as KVNamespace | undefined;
  if (!kv) return { demoMode: true };

  const key = `demo:rl:${getClientAddress()}`;
  const count = Number((await kv.get(key)) ?? "0") || 0;
  if (count >= RATE_LIMIT_MAX) {
    throw error(429, "Demo rate limit reached. Please try again in a minute.");
  }

  await kv.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW_SEC });

  return { demoMode: true, origin: url.origin };
};
