// @ts-nocheck
import type { PageLoad } from "./$types";
import { ComplianceAPI } from "$lib/api/client";

export const load = async ({ fetch, url }: Parameters<PageLoad>[0]) => {
  const limit = Number(url.searchParams.get("limit") || 50);
  try {
    const activity = await ComplianceAPI.listActivity({ limit }, fetch);
    return { activity };
  } catch (e: any) {
    return { error: e?.body?.error || "Failed to load activity" };
  }
};
