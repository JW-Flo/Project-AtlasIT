/**
 * Client-side API fetch wrapper for SPA mode.
 *
 * In CF Workers mode: pages call /api/... which hits SvelteKit server routes.
 * In SPA mode (S3/CloudFront): there are no server routes, so we need to
 * route API calls to API Gateway directly.
 *
 * This module intercepts fetch calls to /api/ paths and rewrites them
 * to the API Gateway URL when VITE_API_URL is set.
 */

const API_BASE: string = import.meta.env?.VITE_API_URL ?? "";

/** True when running as a static SPA (API Gateway mode). */
export const isSpaMode = !!API_BASE;

/** Get auth token from session storage. */
function getToken(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem("atlasit_token");
}

/** Get tenant ID from session storage. */
function getTenantId(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const user = JSON.parse(sessionStorage.getItem("atlasit_user") ?? "{}");
    return user.tenantId ?? null;
  } catch {
    return null;
  }
}

/**
 * API-aware fetch. In SPA mode, rewrites /api/ paths to API Gateway
 * and injects auth headers. In CF mode, passes through to normal fetch.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  // If not an API path or not in SPA mode, use regular fetch
  if (!path.startsWith("/api/") || !API_BASE) {
    return fetch(path, init);
  }

  // Map console-app API routes to API Gateway paths
  // Console routes like /api/analytics/dashboard → API GW /api/v1/analytics/dashboard
  // Some routes proxy to different Lambda services
  const url = `${API_BASE}${path}`;

  const headers = new Headers(init?.headers ?? {});

  // Inject auth
  const token = getToken();
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  // Inject tenant ID for internal service calls
  const tenantId = getTenantId();
  if (tenantId && !headers.has("x-tenant-id")) {
    headers.set("x-tenant-id", tenantId);
  }

  // Correlation ID
  if (!headers.has("x-correlation-id")) {
    headers.set("x-correlation-id", crypto.randomUUID());
  }

  return fetch(url, { ...init, headers });
}
