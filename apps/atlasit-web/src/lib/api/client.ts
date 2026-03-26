import type {
  HealthResponse,
  ComplianceSnapshot,
  IncidentsListResponse,
  CreateIncidentInput,
  IncidentRecord,
  ActivityListResponse,
  PolicyTemplatesResponse,
  GeneratePolicyInput,
  GeneratedPolicyResponse,
  EvaluatePolicyInput,
  EvaluatePolicyResponse,
  CoverageSummaryResponse,
  EvidenceSearchResponse,
  EvidenceVerifyResponse,
  CoverageSummary,
  CoverageControl,
  NotificationItem,
  NotificationsListResponse,
  SecurityIncident,
  ActivityEvent,
  HealthPayload,
} from "./types";

const base =
  (import.meta as any).env?.PUBLIC_COMPLIANCE_API_BASE ||
  (globalThis as any).PUBLIC_COMPLIANCE_API_BASE ||
  "";

type Fetcher = typeof fetch;

export interface NormalizedApiError {
  code: string;
  message: string;
  requestId?: string;
  status?: number;
  body?: unknown;
  original?: unknown;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  fetcher?: Fetcher;
  query?: Record<string, unknown>;
}

function ensureTrailingSlash(input: string): string {
  return input.endsWith("/") ? input : `${input}/`;
}

function resolveOrigin(): string {
  if (base) return ensureTrailingSlash(base);
  if (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as any).location?.origin === "string"
  ) {
    return ensureTrailingSlash((globalThis as any).location.origin);
  }
  return "http://localhost/";
}

function buildUrl(path: string, query?: Record<string, unknown>): string {
  const trimmed = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(trimmed, resolveOrigin());
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function safeParseJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isNormalizedError(value: unknown): value is NormalizedApiError {
  return (
    !!value &&
    typeof value === "object" &&
    "code" in value &&
    "message" in value
  );
}

function normalizeError(input: unknown): NormalizedApiError {
  if (isNormalizedError(input)) {
    return {
      code: String(input.code),
      message: input.message,
      requestId: input.requestId,
      status: input.status,
      body: (input as any).body,
      original: (input as any).original ?? input,
    };
  }
  if (input && typeof input === "object") {
    const ctx = input as Record<string, any>;
    const body = ctx.body ?? ctx.responseBody ?? {};
    const status = typeof ctx.status === "number" ? ctx.status : undefined;
    const statusText =
      typeof ctx.statusText === "string" ? ctx.statusText : undefined;
    const requestId =
      ctx.requestId ?? ctx.headers?.get?.("x-request-id") ?? body?.requestId;
    const codeValue =
      ctx.code ??
      body?.code ??
      (status !== undefined ? `HTTP_${status}` : undefined);
    const messageValue =
      ctx.message ??
      body?.error ??
      body?.message ??
      statusText ??
      "Request failed";
    return {
      code:
        typeof codeValue === "number"
          ? `HTTP_${codeValue}`
          : String(codeValue ?? "UNKNOWN"),
      message: String(messageValue || "Request failed"),
      requestId: requestId ? String(requestId) : undefined,
      status,
      body,
      original: ctx,
    };
  }
  if (input instanceof Error) {
    return { code: "NETWORK_ERROR", message: input.message, original: input };
  }
  return { code: "UNKNOWN", message: "Unexpected error", original: input };
}

async function apiFetch<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {}, signal, fetcher, query } = opts;
  const fetchFn = fetcher ?? fetch;
  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };
  const init: RequestInit = { method, headers: finalHeaders, signal };

  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetchFn(buildUrl(path, query), init);
  } catch (err) {
    throw normalizeError(err);
  }

  const text = await response.text();
  const parsed = safeParseJson(text);

  if (!response.ok) {
    throw normalizeError({
      status: response.status,
      statusText: response.statusText,
      body: parsed,
      requestId: response.headers.get("x-request-id"),
    });
  }

  if (parsed === null) {
    return text ? (text as unknown as T) : (undefined as unknown as T);
  }
  return parsed as T;
}

function coerceString(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function coerceNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeCoverage(framework: string, raw: any): CoverageSummary {
  if (!raw) {
    return { framework, controls: [], totalControls: 0, coveragePercent: 0 };
  }

  const controlsSource: any[] = Array.isArray(raw.controls)
    ? raw.controls
    : Array.isArray(raw.items)
      ? raw.items
      : [];

  const controls: CoverageControl[] = controlsSource
    .map((item) => ({
      controlKey: coerceString(item?.controlKey ?? item?.key ?? item?.id ?? ""),
      evidenceCount: coerceNumber(
        item?.evidenceCount ?? item?.evidence ?? item?.count,
      ),
    }))
    .filter((entry) => entry.controlKey.length > 0);

  const totalControls = coerceNumber(
    raw.totalControls ?? raw.total ?? controls.length,
    controls.length,
  );
  const explicitCoverage =
    typeof raw.coveragePercent === "number" ? raw.coveragePercent : undefined;
  const passing =
    typeof raw.passing === "number"
      ? raw.passing
      : controls.reduce(
          (acc, control) => acc + (control.evidenceCount > 0 ? 1 : 0),
          0,
        );
  const coveragePercent =
    explicitCoverage ?? (totalControls ? (passing / totalControls) * 100 : 0);

  return {
    framework: coerceString(raw.framework ?? framework, framework),
    controls,
    totalControls,
    coveragePercent: Number.isFinite(coveragePercent)
      ? Math.round(coveragePercent * 10) / 10
      : 0,
  };
}

function pickTimestamp(value: any): string {
  const candidate =
    value?.createdAt ??
    value?.created ??
    value?.timestamp ??
    value?.ts ??
    value?.date;
  if (typeof candidate === "string") return candidate;
  if (typeof candidate === "number") return new Date(candidate).toISOString();
  return new Date().toISOString();
}

function mapIncident(raw: any): SecurityIncident {
  const id = coerceString(
    raw?.id ?? raw?.incidentId ?? raw?.ref ?? raw?.reference ?? Date.now(),
  );
  return {
    id,
    title: raw?.title ?? raw?.name ?? null,
    severity: raw?.severity ?? raw?.level ?? null,
    status: raw?.status ?? null,
    source: raw?.source ?? raw?.origin ?? null,
    tenantId: raw?.tenantId ?? raw?.tenant ?? null,
    createdAt: pickTimestamp(raw),
    resolvedAt: raw?.resolvedAt ?? raw?.resolved ?? null,
  };
}

function mapNotification(raw: any): NotificationItem {
  const id = coerceString(
    raw?.id ?? raw?.notificationId ?? raw?.ref ?? Date.now(),
  );
  const message = coerceString(raw?.message ?? raw?.title ?? "Notification");
  const createdAt = pickTimestamp(raw);
  const readAt = raw?.read_at ?? raw?.readAt ?? null;
  const readFlag =
    raw?.read === true ||
    raw?.read === 1 ||
    (typeof readAt === "string" && readAt.length > 0);
  return {
    id,
    kind: raw?.kind ?? raw?.type ?? null,
    severity: raw?.severity ?? raw?.level ?? null,
    message,
    createdAt,
    ageSeconds: typeof raw?.ageSeconds === "number" ? raw.ageSeconds : null,
    ref: raw?.ref ?? raw?.resourceId ?? null,
    read: Boolean(readFlag),
  };
}

function mapActivity(raw: any): ActivityEvent {
  const id =
    typeof raw?.id === "number"
      ? raw.id
      : coerceNumber(raw?.id ?? raw?.eventId ?? Date.now());
  return {
    id,
    tenantId: coerceString(raw?.tenantId ?? raw?.tenant ?? ""),
    type: coerceString(raw?.type ?? raw?.category ?? "unknown"),
    severity: raw?.severity ?? raw?.level ?? null,
    ref: raw?.ref ?? raw?.resourceId ?? null,
    message: coerceString(raw?.message ?? raw?.description ?? ""),
    createdAt: pickTimestamp(raw),
  };
}

export async function getHealth(fetcher?: Fetcher): Promise<HealthPayload> {
  return apiFetch<HealthPayload>("/health", { fetcher });
}

export async function getCoverage(
  framework: string,
  fetcher?: Fetcher,
): Promise<CoverageSummary> {
  const target = framework || "SOC2";
  try {
    const raw = await apiFetch<any>(
      `/api/v1/policies/coverage/${encodeURIComponent(target)}`,
      { fetcher },
    );
    return normalizeCoverage(target, raw);
  } catch (err) {
    const normalized = normalizeError(err);
    if (normalized.code === "HTTP_404" || normalized.code === "HTTP_405") {
      const fallback = await apiFetch<any>("/api/v1/policies/coverage", {
        fetcher,
        query: { framework: target },
      });
      return normalizeCoverage(target, fallback);
    }
    throw normalized;
  }
}

export async function listOpenIncidents(
  limit: number,
  fetcher?: Fetcher,
): Promise<SecurityIncident[]> {
  const capped = limit > 0 ? limit : 5;
  const response = await apiFetch<{ items?: any[] }>(
    "/api/v1/security/incidents",
    {
      fetcher,
      query: { status: "open", limit: capped },
    },
  );
  const items = Array.isArray(response.items) ? response.items : [];
  return items.map(mapIncident);
}

export async function listActivity(
  limit: number,
  fetcher?: Fetcher,
): Promise<ActivityEvent[]> {
  const capped = limit > 0 ? limit : 8;
  const response = await apiFetch<ActivityListResponse>("/api/v1/activity", {
    fetcher,
    query: { limit: capped },
  });
  const items = Array.isArray(response.items) ? response.items : [];
  return items.map(mapActivity);
}

export async function listNotifications(
  limit = 8,
  fetcher?: Fetcher,
): Promise<NotificationsListResponse> {
  const response = await apiFetch<NotificationsListResponse>(
    "/api/v1/notifications",
    {
      fetcher,
      query: { limit },
    },
  );
  const rawItems = Array.isArray(response.items) ? response.items : [];
  const items = rawItems.map(mapNotification);
  const unreadCount =
    typeof response.unreadCount === "number"
      ? response.unreadCount
      : items.filter((item) => !item.read).length;
  return { items, unreadCount, nextCursor: response.nextCursor ?? null };
}

export const ComplianceAPI = {
  health: (fetcher?: Fetcher) =>
    apiFetch<HealthResponse>("/health", { fetcher }),
  snapshot: (tenantId?: string, fetcher?: Fetcher) =>
    apiFetch<ComplianceSnapshot>("/api/compliance/snapshot", {
      fetcher,
      query: { tenantId },
    }),

  listPolicyTemplates: (fetcher?: Fetcher) =>
    apiFetch<PolicyTemplatesResponse>("/api/v1/policies/templates", {
      fetcher,
    }),
  generatePolicy: (input: GeneratePolicyInput, fetcher?: Fetcher) =>
    apiFetch<GeneratedPolicyResponse>("/api/v1/policies/generate", {
      method: "POST",
      body: input,
      fetcher,
    }),
  evaluatePolicy: (input: EvaluatePolicyInput, fetcher?: Fetcher) =>
    apiFetch<EvaluatePolicyResponse>("/api/v1/policy/evaluate", {
      method: "POST",
      body: input,
      fetcher,
    }),
  coverage: (framework?: string, fetcher?: Fetcher) =>
    framework
      ? apiFetch<CoverageSummaryResponse>(
          `/api/v1/policies/coverage/${encodeURIComponent(framework)}`,
          { fetcher },
        )
      : apiFetch<CoverageSummaryResponse>("/api/v1/policies/coverage", {
          fetcher,
        }),

  listIncidents: (
    args: {
      status?: string;
      severity?: string;
      limit?: number;
      cursor?: number;
    } = {},
    fetcher?: Fetcher,
  ) =>
    apiFetch<IncidentsListResponse>("/api/v1/security/incidents", {
      fetcher,
      query: args,
    }),
  createIncident: (
    input: CreateIncidentInput & { tenantId?: string },
    fetcher?: Fetcher,
  ) =>
    apiFetch<IncidentRecord>("/api/v1/security/incidents", {
      method: "POST",
      body: input,
      fetcher,
    }),
  resolveIncident: (id: number, tenantId?: string, fetcher?: Fetcher) =>
    apiFetch<IncidentRecord>(`/api/v1/security/incidents/${id}/resolve`, {
      method: "POST",
      fetcher,
      query: { tenantId },
    }),

  listActivity: (
    args: { type?: string; limit?: number; cursor?: number } = {},
    fetcher?: Fetcher,
  ) =>
    apiFetch<ActivityListResponse>("/api/v1/activity", {
      fetcher,
      query: args,
    }),
  listNotifications: (args: { limit?: number } = {}, fetcher?: Fetcher) =>
    apiFetch<NotificationsListResponse>("/api/v1/notifications", {
      fetcher,
      query: args,
    }),

  searchEvidence: (
    args: {
      tenantId?: string;
      pack?: string;
      subject?: string;
      limit?: number;
      cursor?: string;
    } = {},
    fetcher?: Fetcher,
  ) =>
    apiFetch<EvidenceSearchResponse>("/api/evidence/search", {
      fetcher,
      query: args,
    }),
  verifyEvidence: (hash: string, fetcher?: Fetcher) =>
    apiFetch<EvidenceVerifyResponse>(
      `/api/evidence/${encodeURIComponent(hash)}`,
      { fetcher, query: { verify: 1 } },
    ),
};

export type { HealthResponse } from "./types";
