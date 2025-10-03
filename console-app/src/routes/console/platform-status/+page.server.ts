import type { PageServerLoad } from "./$types";
import { fetchPlatformStatus } from "$lib/platformStatus";

export const load: PageServerLoad = async ({ fetch }) => {
  // Server-side load for initial data, client will handle refreshes
  try {
    const data = await fetchPlatformStatus();
    return {
      health: data.health,
      usage: data.usage,
      generated: new Date().toISOString(),
    };
  } catch (e) {
    console.error("Server load failed:", e);
    return { health: null, usage: null, generated: new Date().toISOString() };
  }
};
