import type { PageLoad } from "./$types";
import { ComplianceAPI } from "$lib/api/client";

export const load: PageLoad = async ({ fetch, url }) => {
  const limit = Number(url.searchParams.get("limit") || 25);
  try {
    const incidents = await ComplianceAPI.listIncidents({ limit }, fetch);
    return { incidents };
  } catch (e: any) {
    return { error: e?.body?.error || "Failed to load incidents" };
  }
};
