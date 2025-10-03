import type { PageLoad } from "./$types";
import { ComplianceAPI } from "$lib/api/client";

export const load: PageLoad = async ({ fetch, url }) => {
  const limit = Number(url.searchParams.get("limit") || 50);
  try {
    const activity = await ComplianceAPI.listActivity({ limit }, fetch);
    return { activity };
  } catch (e: any) {
    return { error: e?.body?.error || "Failed to load activity" };
  }
};
