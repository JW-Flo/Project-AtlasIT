import type { AccessRequest, AccessRequestList } from "./types";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function listAccessRequests(
  params: { status?: string; limit?: number; cursor?: number } = {},
): Promise<AccessRequestList> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.cursor) search.set("cursor", String(params.cursor));
  const qs = search.toString();
  const url = qs ? "/api/access-requests?" + qs : "/api/access-requests";
  return api<AccessRequestList>(url);
}

export async function createAccessRequest(input: {
  subjectRef: string;
  resource: string;
  justification?: string;
}): Promise<AccessRequest> {
  const body = JSON.stringify(input);
  const res = await api<{ request: AccessRequest }>(`/api/access-requests`, {
    method: "POST",
    body,
  });
  return res.request;
}

export async function transitionAccessRequest(
  id: number,
  action: "approve" | "deny" | "fulfill",
): Promise<AccessRequest> {
  const res = await api<{ request: AccessRequest }>(
    `/api/access-requests/${id}/${action}`,
    { method: "POST" },
  );
  return res.request;
}
