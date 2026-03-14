import type {
  IncidentsListResponse,
  CreateIncidentInput,
  IncidentRecord,
} from "./types";

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
  return api<IncidentsListResponse>(`/api/incidents${qs ? `?${qs}` : ""}`);
}

export async function createIncident(
  input: CreateIncidentInput,
): Promise<IncidentRecord> {
  const body = JSON.stringify(input);
  const res = await api<{ incident: IncidentRecord }>(`/api/incidents`, {
    method: "POST",
    body,
  });
  return res.incident;
}

export async function resolveIncident(id: number): Promise<IncidentRecord> {
  const res = await api<{ incident: IncidentRecord }>(
    `/api/incidents/${id}/resolve`,
    { method: "POST" },
  );
  return res.incident;
}
