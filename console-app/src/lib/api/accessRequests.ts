import type { AccessRequest, AccessRequestList } from "./types";

let __mockId = 1000;
const mockStore: AccessRequest[] = [];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(path, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      ...init,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  } catch (err) {
    // Fallback mock (used in local dev / tests when backend routes absent)
    if (path.startsWith("/api/v1/access-requests")) {
      // List
      if (!init || !init.method || init.method === "GET") {
        return { items: [...mockStore], nextCursor: null } as unknown as T;
      }
      // Create / Transition
      if (init.method === "POST") {
        const actionMatch = path.match(
          /\/api\/v1\/access-requests\/(\d+)\/(approve|deny|fulfill)$/,
        );
        if (actionMatch) {
          const id = Number(actionMatch[1]);
          const action = actionMatch[2];
          const idx = mockStore.findIndex((r) => r.id === id);
          if (idx !== -1) {
            const nextStatus =
              action === "approve"
                ? "approved"
                : action === "deny"
                  ? "denied"
                  : "fulfilled";
            mockStore[idx] = { ...mockStore[idx], status: nextStatus };
            return { request: mockStore[idx] } as unknown as T;
          }
        } else {
          // create
          const bodyText = (init as any).body || "{}";
          let parsed: any = {};
          try {
            parsed = JSON.parse(bodyText);
          } catch {}
          const created: AccessRequest = {
            id: ++__mockId,
            subject: parsed.subjectRef || parsed.subject || "user",
            status: "pending",
            reason: parsed.justification,
            createdAt: new Date().toISOString(),
          };
          mockStore.unshift(created);
          return { request: created } as unknown as T;
        }
      }
    }
    throw err;
  }
}

export async function listAccessRequests(
  params: { status?: string; limit?: number; cursor?: number } = {},
): Promise<AccessRequestList> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.cursor) search.set("cursor", String(params.cursor));
  const qs = search.toString();
  const url = qs ? "/api/v1/access-requests?" + qs : "/api/v1/access-requests";
  return api<AccessRequestList>(url);
}

export async function createAccessRequest(input: {
  subjectRef: string;
  resource: string;
  justification?: string;
}): Promise<AccessRequest> {
  const body = JSON.stringify(input);
  const res = await api<{ request: AccessRequest }>(`/api/v1/access-requests`, {
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
    `/api/v1/access-requests/${id}/${action}`,
    { method: "POST" },
  );
  return res.request;
}
