const __vite_import_meta_env__ = {};
const base =
  __vite_import_meta_env__?.PUBLIC_COMPLIANCE_API_BASE ||
  globalThis.PUBLIC_COMPLIANCE_API_BASE ||
  "";
function ensureTrailingSlash(input) {
  return input.endsWith("/") ? input : `${input}/`;
}
function resolveOrigin() {
  if (base) return ensureTrailingSlash(base);
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.location?.origin === "string"
  ) {
    return ensureTrailingSlash(globalThis.location.origin);
  }
  return "http://localhost/";
}
function buildUrl(path, query) {
  const trimmed = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(trimmed, resolveOrigin());
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === void 0 || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}
function safeParseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
function isNormalizedError(value) {
  return (
    !!value &&
    typeof value === "object" &&
    "code" in value &&
    "message" in value
  );
}
function normalizeError(input) {
  if (isNormalizedError(input)) {
    return {
      code: String(input.code),
      message: input.message,
      requestId: input.requestId,
      status: input.status,
      body: input.body,
      original: input.original ?? input,
    };
  }
  if (input && typeof input === "object") {
    const ctx = input;
    const body = ctx.body ?? ctx.responseBody ?? {};
    const status = typeof ctx.status === "number" ? ctx.status : void 0;
    const statusText =
      typeof ctx.statusText === "string" ? ctx.statusText : void 0;
    const requestId =
      ctx.requestId ?? ctx.headers?.get?.("x-request-id") ?? body?.requestId;
    const codeValue =
      ctx.code ?? body?.code ?? (status !== void 0 ? `HTTP_${status}` : void 0);
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
      requestId: requestId ? String(requestId) : void 0,
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
async function apiFetch(path, opts = {}) {
  const { method = "GET", body, headers = {}, signal, fetcher, query } = opts;
  const fetchFn = fetcher ?? fetch;
  const finalHeaders = { Accept: "application/json", ...headers };
  const init = { method, headers: finalHeaders, signal };
  if (body !== void 0) {
    finalHeaders["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  let response;
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
    return text ? text : void 0;
  }
  return parsed;
}
function coerceString(value, fallback = "") {
  if (value === void 0 || value === null) return fallback;
  return String(value);
}
function coerceNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}
function normalizeCoverage(framework, raw) {
  if (!raw) {
    return { framework, controls: [], totalControls: 0, coveragePercent: 0 };
  }
  const controlsSource = Array.isArray(raw.controls)
    ? raw.controls
    : Array.isArray(raw.items)
      ? raw.items
      : [];
  const controls = controlsSource
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
    typeof raw.coveragePercent === "number" ? raw.coveragePercent : void 0;
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
function pickTimestamp(value) {
  const candidate =
    value?.createdAt ??
    value?.created ??
    value?.timestamp ??
    value?.ts ??
    value?.date;
  if (typeof candidate === "string") return candidate;
  if (typeof candidate === "number") return new Date(candidate).toISOString();
  return /* @__PURE__ */ new Date().toISOString();
}
function mapIncident(raw) {
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
function mapNotification(raw) {
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
function mapActivity(raw) {
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
async function getHealth(fetcher) {
  return apiFetch("/health", { fetcher });
}
async function getCoverage(framework, fetcher) {
  const target = framework;
  try {
    const raw = await apiFetch(
      `/api/v1/policies/coverage/${encodeURIComponent(target)}`,
      { fetcher },
    );
    return normalizeCoverage(target, raw);
  } catch (err) {
    const normalized = normalizeError(err);
    if (normalized.code === "HTTP_404" || normalized.code === "HTTP_405") {
      const fallback = await apiFetch("/api/v1/policies/coverage", {
        fetcher,
        query: { framework: target },
      });
      return normalizeCoverage(target, fallback);
    }
    throw normalized;
  }
}
async function listOpenIncidents(limit, fetcher) {
  const capped = limit;
  const response = await apiFetch("/api/v1/security/incidents", {
    fetcher,
    query: { status: "open", limit: capped },
  });
  const items = Array.isArray(response.items) ? response.items : [];
  return items.map(mapIncident);
}
async function listActivity(limit, fetcher) {
  const capped = limit;
  const response = await apiFetch("/api/v1/activity", {
    fetcher,
    query: { limit: capped },
  });
  const items = Array.isArray(response.items) ? response.items : [];
  return items.map(mapActivity);
}
async function listNotifications(limit = 8, fetcher) {
  const response = await apiFetch("/api/v1/notifications", {
    fetcher,
    query: { limit },
  });
  const rawItems = Array.isArray(response.items) ? response.items : [];
  const items = rawItems.map(mapNotification);
  const unreadCount =
    typeof response.unreadCount === "number"
      ? response.unreadCount
      : items.filter((item) => !item.read).length;
  return { items, unreadCount, nextCursor: response.nextCursor ?? null };
}
const ComplianceAPI = {
  health: (fetcher) => apiFetch("/health", { fetcher }),
  snapshot: (tenantId, fetcher) =>
    apiFetch("/api/compliance/snapshot", { fetcher, query: { tenantId } }),
  listPolicyTemplates: (fetcher) =>
    apiFetch("/api/v1/policies/templates", { fetcher }),
  generatePolicy: (input, fetcher) =>
    apiFetch("/api/v1/policies/generate", {
      method: "POST",
      body: input,
      fetcher,
    }),
  evaluatePolicy: (input, fetcher) =>
    apiFetch("/api/v1/policy/evaluate", {
      method: "POST",
      body: input,
      fetcher,
    }),
  coverage: (framework, fetcher) =>
    framework
      ? apiFetch(`/api/v1/policies/coverage/${encodeURIComponent(framework)}`, {
          fetcher,
        })
      : apiFetch("/api/v1/policies/coverage", { fetcher }),
  listIncidents: (args = {}, fetcher) =>
    apiFetch("/api/v1/security/incidents", { fetcher, query: args }),
  createIncident: (input, fetcher) =>
    apiFetch("/api/v1/security/incidents", {
      method: "POST",
      body: input,
      fetcher,
    }),
  resolveIncident: (id, tenantId, fetcher) =>
    apiFetch(`/api/v1/security/incidents/${id}/resolve`, {
      method: "POST",
      fetcher,
      query: { tenantId },
    }),
  listActivity: (args = {}, fetcher) =>
    apiFetch("/api/v1/activity", { fetcher, query: args }),
  listNotifications: (args = {}, fetcher) =>
    apiFetch("/api/v1/notifications", { fetcher, query: args }),
  searchEvidence: (args = {}, fetcher) =>
    apiFetch("/api/evidence/search", { fetcher, query: args }),
  verifyEvidence: (hash, fetcher) =>
    apiFetch(`/api/evidence/${encodeURIComponent(hash)}`, {
      fetcher,
      query: { verify: 1 },
    }),
};
export {
  ComplianceAPI as C,
  listActivity as a,
  listOpenIncidents as b,
  getHealth as c,
  getCoverage as g,
  listNotifications as l,
};
//# sourceMappingURL=client.js.map
