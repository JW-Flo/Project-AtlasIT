import type { IncidentsListResponse } from "$lib/api/types";
import { listIncidents } from "$lib/api/incidents";

export const ssr = true;
export const csr = true;

export async function load({ url }) {
  const status = url.searchParams.get("status") || undefined;
  const severity = url.searchParams.get("severity") || undefined;
  const cursorParam = url.searchParams.get("cursor");
  const limitParam = url.searchParams.get("limit");
  const cursor = cursorParam ? Number(cursorParam) : undefined;
  const limit = limitParam ? Number(limitParam) : 25;
  try {
    const data: IncidentsListResponse = await listIncidents({
      status,
      severity,
      cursor,
      limit,
    });
    return {
      incidents: data.items,
      nextCursor: data.nextCursor ?? null,
      statusFilter: status || null,
      severityFilter: severity || null,
      fetchedAt: new Date().toISOString(),
    };
  } catch (e: any) {
    return {
      incidents: [],
      nextCursor: null,
      statusFilter: status || null,
      severityFilter: severity || null,
      fetchedAt: new Date().toISOString(),
      error: e?.message || "Failed to load incidents",
    };
  }
}
