const m = {},
  T =
    (m == null ? void 0 : m.PUBLIC_COMPLIANCE_API_BASE) ||
    globalThis.PUBLIC_COMPLIANCE_API_BASE ||
    "";
function C(e) {
  return e.endsWith("/") ? e : `${e}/`;
}
function P() {
  var e;
  return T
    ? C(T)
    : typeof globalThis < "u" &&
        typeof ((e = globalThis.location) == null ? void 0 : e.origin) ==
          "string"
      ? C(globalThis.location.origin)
      : "http://localhost/";
}
function q(e, t) {
  const i = e.startsWith("/") ? e.slice(1) : e,
    n = new URL(i, P());
  if (t)
    for (const [o, d] of Object.entries(t))
      d == null || d === "" || n.searchParams.set(o, String(d));
  return n.toString();
}
function N(e) {
  if (!e) return null;
  try {
    return JSON.parse(e);
  } catch {
    return null;
  }
}
function O(e) {
  return !!e && typeof e == "object" && "code" in e && "message" in e;
}
function h(e) {
  var t, i;
  if (O(e))
    return {
      code: String(e.code),
      message: e.message,
      requestId: e.requestId,
      status: e.status,
      body: e.body,
      original: e.original ?? e,
    };
  if (e && typeof e == "object") {
    const n = e,
      o = n.body ?? n.responseBody ?? {},
      d = typeof n.status == "number" ? n.status : void 0,
      u = typeof n.statusText == "string" ? n.statusText : void 0,
      y =
        n.requestId ??
        ((i = (t = n.headers) == null ? void 0 : t.get) == null
          ? void 0
          : i.call(t, "x-request-id")) ??
        (o == null ? void 0 : o.requestId),
      s =
        n.code ??
        (o == null ? void 0 : o.code) ??
        (d !== void 0 ? `HTTP_${d}` : void 0),
      f =
        n.message ??
        (o == null ? void 0 : o.error) ??
        (o == null ? void 0 : o.message) ??
        u ??
        "Request failed";
    return {
      code: typeof s == "number" ? `HTTP_${s}` : String(s ?? "UNKNOWN"),
      message: String(f || "Request failed"),
      requestId: y ? String(y) : void 0,
      status: d,
      body: o,
      original: n,
    };
  }
  return e instanceof Error
    ? { code: "NETWORK_ERROR", message: e.message, original: e }
    : { code: "UNKNOWN", message: "Unexpected error", original: e };
}
async function c(e, t = {}) {
  const {
      method: i = "GET",
      body: n,
      headers: o = {},
      signal: d,
      fetcher: u,
      query: y,
    } = t,
    s = u ?? fetch,
    f = { Accept: "application/json", ...o },
    A = { method: i, headers: f, signal: d };
  n !== void 0 &&
    ((f["Content-Type"] = "application/json"), (A.body = JSON.stringify(n)));
  let g;
  try {
    g = await s(q(e, y), A);
  } catch (b) {
    throw h(b);
  }
  const p = await g.text(),
    r = N(p);
  if (!g.ok)
    throw h({
      status: g.status,
      statusText: g.statusText,
      body: r,
      requestId: g.headers.get("x-request-id"),
    });
  return r === null ? p || void 0 : r;
}
function l(e, t = "") {
  return e == null ? t : String(e);
}
function v(e, t = 0) {
  const i = Number(e);
  return Number.isFinite(i) ? i : t;
}
function S(e, t) {
  if (!t)
    return { framework: e, controls: [], totalControls: 0, coveragePercent: 0 };
  const n = (
      Array.isArray(t.controls)
        ? t.controls
        : Array.isArray(t.items)
          ? t.items
          : []
    )
      .map((s) => ({
        controlKey: l(
          (s == null ? void 0 : s.controlKey) ??
            (s == null ? void 0 : s.key) ??
            (s == null ? void 0 : s.id) ??
            "",
        ),
        evidenceCount: v(
          (s == null ? void 0 : s.evidenceCount) ??
            (s == null ? void 0 : s.evidence) ??
            (s == null ? void 0 : s.count),
        ),
      }))
      .filter((s) => s.controlKey.length > 0),
    o = v(t.totalControls ?? t.total ?? n.length, n.length),
    d = typeof t.coveragePercent == "number" ? t.coveragePercent : void 0,
    u =
      typeof t.passing == "number"
        ? t.passing
        : n.reduce((s, f) => s + (f.evidenceCount > 0 ? 1 : 0), 0),
    y = d ?? (o ? (u / o) * 100 : 0);
  return {
    framework: l(t.framework ?? e, e),
    controls: n,
    totalControls: o,
    coveragePercent: Number.isFinite(y) ? Math.round(y * 10) / 10 : 0,
  };
}
function I(e) {
  const t =
    (e == null ? void 0 : e.createdAt) ??
    (e == null ? void 0 : e.created) ??
    (e == null ? void 0 : e.timestamp) ??
    (e == null ? void 0 : e.ts) ??
    (e == null ? void 0 : e.date);
  return typeof t == "string"
    ? t
    : typeof t == "number"
      ? new Date(t).toISOString()
      : new Date().toISOString();
}
function x(e) {
  return {
    id: l(
      (e == null ? void 0 : e.id) ??
        (e == null ? void 0 : e.incidentId) ??
        (e == null ? void 0 : e.ref) ??
        (e == null ? void 0 : e.reference) ??
        Date.now(),
    ),
    title:
      (e == null ? void 0 : e.title) ?? (e == null ? void 0 : e.name) ?? null,
    severity:
      (e == null ? void 0 : e.severity) ??
      (e == null ? void 0 : e.level) ??
      null,
    status: (e == null ? void 0 : e.status) ?? null,
    source:
      (e == null ? void 0 : e.source) ??
      (e == null ? void 0 : e.origin) ??
      null,
    tenantId:
      (e == null ? void 0 : e.tenantId) ??
      (e == null ? void 0 : e.tenant) ??
      null,
    createdAt: I(e),
    resolvedAt:
      (e == null ? void 0 : e.resolvedAt) ??
      (e == null ? void 0 : e.resolved) ??
      null,
  };
}
function E(e) {
  const t = l(
      (e == null ? void 0 : e.id) ??
        (e == null ? void 0 : e.notificationId) ??
        (e == null ? void 0 : e.ref) ??
        Date.now(),
    ),
    i = l(
      (e == null ? void 0 : e.message) ??
        (e == null ? void 0 : e.title) ??
        "Notification",
    ),
    n = I(e),
    o =
      (e == null ? void 0 : e.read_at) ??
      (e == null ? void 0 : e.readAt) ??
      null,
    d =
      (e == null ? void 0 : e.read) === !0 ||
      (e == null ? void 0 : e.read) === 1 ||
      (typeof o == "string" && o.length > 0);
  return {
    id: t,
    kind:
      (e == null ? void 0 : e.kind) ?? (e == null ? void 0 : e.type) ?? null,
    severity:
      (e == null ? void 0 : e.severity) ??
      (e == null ? void 0 : e.level) ??
      null,
    message: i,
    createdAt: n,
    ageSeconds:
      typeof (e == null ? void 0 : e.ageSeconds) == "number"
        ? e.ageSeconds
        : null,
    ref:
      (e == null ? void 0 : e.ref) ??
      (e == null ? void 0 : e.resourceId) ??
      null,
    read: !!d,
  };
}
function R(e) {
  return {
    id:
      typeof (e == null ? void 0 : e.id) == "number"
        ? e.id
        : v(
            (e == null ? void 0 : e.id) ??
              (e == null ? void 0 : e.eventId) ??
              Date.now(),
          ),
    tenantId: l(
      (e == null ? void 0 : e.tenantId) ??
        (e == null ? void 0 : e.tenant) ??
        "",
    ),
    type: l(
      (e == null ? void 0 : e.type) ??
        (e == null ? void 0 : e.category) ??
        "unknown",
    ),
    severity:
      (e == null ? void 0 : e.severity) ??
      (e == null ? void 0 : e.level) ??
      null,
    ref:
      (e == null ? void 0 : e.ref) ??
      (e == null ? void 0 : e.resourceId) ??
      null,
    message: l(
      (e == null ? void 0 : e.message) ??
        (e == null ? void 0 : e.description) ??
        "",
    ),
    createdAt: I(e),
  };
}
async function U(e) {
  return c("/health", { fetcher: e });
}
async function k(e, t) {
  const i = e;
  try {
    const n = await c(`/api/v1/policies/coverage/${encodeURIComponent(i)}`, {
      fetcher: t,
    });
    return S(i, n);
  } catch (n) {
    const o = h(n);
    if (o.code === "HTTP_404" || o.code === "HTTP_405") {
      const d = await c("/api/v1/policies/coverage", {
        fetcher: t,
        query: { framework: i },
      });
      return S(i, d);
    }
    throw o;
  }
}
async function $(e, t) {
  const n = await c("/api/v1/security/incidents", {
    fetcher: t,
    query: { status: "open", limit: e },
  });
  return (Array.isArray(n.items) ? n.items : []).map(x);
}
async function B(e, t) {
  const n = await c("/api/v1/activity", { fetcher: t, query: { limit: e } });
  return (Array.isArray(n.items) ? n.items : []).map(R);
}
async function H(e = 8, t) {
  const i = await c("/api/v1/notifications", {
      fetcher: t,
      query: { limit: e },
    }),
    o = (Array.isArray(i.items) ? i.items : []).map(E),
    d =
      typeof i.unreadCount == "number"
        ? i.unreadCount
        : o.filter((u) => !u.read).length;
  return { items: o, unreadCount: d, nextCursor: i.nextCursor ?? null };
}
const K = {
  health: (e) => c("/health", { fetcher: e }),
  snapshot: (e, t) =>
    c("/api/compliance/snapshot", { fetcher: t, query: { tenantId: e } }),
  listPolicyTemplates: (e) => c("/api/v1/policies/templates", { fetcher: e }),
  generatePolicy: (e, t) =>
    c("/api/v1/policies/generate", { method: "POST", body: e, fetcher: t }),
  evaluatePolicy: (e, t) =>
    c("/api/v1/policy/evaluate", { method: "POST", body: e, fetcher: t }),
  coverage: (e, t) =>
    e
      ? c(`/api/v1/policies/coverage/${encodeURIComponent(e)}`, { fetcher: t })
      : c("/api/v1/policies/coverage", { fetcher: t }),
  listIncidents: (e = {}, t) =>
    c("/api/v1/security/incidents", { fetcher: t, query: e }),
  createIncident: (e, t) =>
    c("/api/v1/security/incidents", { method: "POST", body: e, fetcher: t }),
  resolveIncident: (e, t, i) =>
    c(`/api/v1/security/incidents/${e}/resolve`, {
      method: "POST",
      fetcher: i,
      query: { tenantId: t },
    }),
  listActivity: (e = {}, t) => c("/api/v1/activity", { fetcher: t, query: e }),
  listNotifications: (e = {}, t) =>
    c("/api/v1/notifications", { fetcher: t, query: e }),
  searchEvidence: (e = {}, t) =>
    c("/api/evidence/search", { fetcher: t, query: e }),
  verifyEvidence: (e, t) =>
    c(`/api/evidence/${encodeURIComponent(e)}`, {
      fetcher: t,
      query: { verify: 1 },
    }),
};
export { K as C, B as a, $ as b, U as c, k as g, H as l };
//# sourceMappingURL=DXY25tU5.js.map
