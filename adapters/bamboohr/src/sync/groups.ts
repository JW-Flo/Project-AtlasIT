import type { SyncResult } from "../types.js";

export async function syncGroups(
  subdomain: string,
  apiKey: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  // BambooHR does not have a groups API endpoint.
  // Return empty result — groups concept doesn't apply to this platform.
  return { created: 0, updated: 0, total: 0 };
}
