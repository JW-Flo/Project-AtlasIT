import type { AccessRequestList } from "$lib/api/types";
import { listAccessRequests } from "$lib/api/accessRequests";

export const ssr = true;
export const csr = true;

export async function load({ url, fetch }) {
  const status = url.searchParams.get("status") || undefined;
  const cursor = url.searchParams.get("cursor") || undefined;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 25;
  try {
    const data: AccessRequestList = await listAccessRequests({
      status,
      cursor: cursor ? Number(cursor) : undefined,
      limit,
    });
    return {
      requests: data.items,
      nextCursor: data.nextCursor ?? null,
      statusFilter: status || null,
      fetchedAt: new Date().toISOString(),
    };
  } catch (e: any) {
    return {
      requests: [],
      nextCursor: null,
      statusFilter: status || null,
      fetchedAt: new Date().toISOString(),
      error: e?.message || "Failed to load access requests",
    };
  }
}
