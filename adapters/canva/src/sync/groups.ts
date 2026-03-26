import type { SyncResult } from "../types.js";

/**
 * Canva has limited group/team API functionality.
 * Teams exist but don't support the full group management that other platforms do.
 * Return a minimal sync result with no groups.
 */
export async function syncGroups(
  accessToken: string,
  teamId: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  // Canva API does not expose team/group listing or membership management
  // Return empty result
  return { created: 0, updated: 0, total: 0 };
}
