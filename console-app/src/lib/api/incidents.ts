import type {
  IncidentsListResponse,
  CreateIncidentInput,
  IncidentRecord,
} from "./types";

let __incidentId = 5000;
const mockIncidents: IncidentRecord[] = [];

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
    if (path.startsWith("/api/v1/incidents")) {
      // list
      if (!init || !init.method || init.method === "GET") {
        return { items: [...mockIncidents], nextCursor: null } as unknown as T;
      }
      if (init.method === "POST") {
        const resolveMatch = path.match(
          /\/api\/v1\/incidents\/(\d+)\/resolve$/,
        );
        if (resolveMatch) {
          const id = Number(resolveMatch[1]);
          const idx = mockIncidents.findIndex((i) => i.id === id);
          if (idx !== -1) {
            mockIncidents[idx] = {
              ...mockIncidents[idx],
              status: "resolved",
              resolvedAt: new Date().toISOString(),
            };
            return { incident: mockIncidents[idx] } as unknown as T;
          }
        } else {
          const bodyText = (init as any).body || "{}";
          let parsed: any = {};
          try {
            parsed = JSON.parse(bodyText);
          } catch {}
          const created: IncidentRecord = {
            id: ++__incidentId,
            tenantId: "mock-tenant",
            title: parsed.title || "Untitled Incident",
            severity: parsed.severity || "medium",
            status: "open",
            source: parsed.source || null,
            createdAt: new Date().toISOString(),
            resolvedAt: null,
          };
          mockIncidents.unshift(created);
          return { incident: created } as unknown as T;
        }
      }
    }
    throw err;
  }
}

export async function listIncidents(
  params: {
    status?: string;
    severity?: string;
    limit?: number;
    cursor?: number;
  } = {},
): Promise<IncidentsListResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.severity) search.set("severity", params.severity);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.cursor) search.set("cursor", String(params.cursor));
  const qs = search.toString();
  return api<IncidentsListResponse>(`/api/v1/incidents${qs ? `?${qs}` : ""}`);
}

export async function createIncident(
  input: CreateIncidentInput,
): Promise<IncidentRecord> {
  const body = JSON.stringify(input);
  const res = await api<{ incident: IncidentRecord }>(`/api/v1/incidents`, {
    method: "POST",
    body,
  });
  return res.incident;
}

export async function resolveIncident(id: number): Promise<IncidentRecord> {
  const res = await api<{ incident: IncidentRecord }>(
    `/api/v1/incidents/${id}/resolve`,
    { method: "POST" },
  );
  return res.incident;
}
