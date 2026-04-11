import { writable } from "svelte/store";

export interface TenantBranding {
  logoUrl?: string;
  accentColor?: string;
}

export interface SessionData {
  authenticated: boolean;
  email?: string;
  roles?: string[];
  superAdmin?: boolean;
  tenantId?: string;
  displayName?: string;
  impersonating?: boolean;
  impersonatedBy?: string;
  orgName?: string;
  branding?: TenantBranding;
}

export const session = writable<SessionData | null>(null);
export const sessionLoading = writable(true);

let fetched = false;

/** Check for token-based session (API Gateway / SPA mode). */
function loadTokenSession(): SessionData | null {
  if (typeof sessionStorage === "undefined") return null;
  const token = sessionStorage.getItem("atlasit_token");
  const userStr = sessionStorage.getItem("atlasit_user");
  if (!token || !userStr) return null;
  try {
    const user = JSON.parse(userStr) as {
      userId?: string;
      email?: string;
      tenantId?: string;
      role?: string;
    };
    return {
      authenticated: true,
      email: user.email,
      roles: user.role ? [user.role] : ["viewer"],
      tenantId: user.tenantId,
    };
  } catch {
    return null;
  }
}

export async function fetchSession(): Promise<SessionData | null> {
  if (fetched) {
    sessionLoading.set(false);
    let current: SessionData | null = null;
    session.subscribe((v) => (current = v))();
    return current;
  }

  // Try token-based session first (SPA / API Gateway mode)
  const tokenSession = loadTokenSession();
  if (tokenSession) {
    session.set(tokenSession);
    fetched = true;
    sessionLoading.set(false);
    return tokenSession;
  }

  // In SPA mode (VITE_API_URL set), there are no server-side routes.
  // If no token exists, the user is unauthenticated — return null.
  const isSpa = typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL;
  if (isSpa) {
    session.set(null);
    sessionLoading.set(false);
    return null;
  }

  // Fall back to server-side session (CF Workers mode)
  try {
    const res = await fetch("/api/auth/session");
    if (!res.ok) {
      session.set(null);
      return null;
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      session.set(null);
      return null;
    }
    const data = await res.json();
    session.set(data);
    fetched = true;
    return data;
  } catch {
    session.set(null);
    return null;
  } finally {
    sessionLoading.set(false);
  }
}

export function clearSession() {
  session.set(null);
  fetched = false;
  sessionLoading.set(true);
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem("atlasit_token");
    sessionStorage.removeItem("atlasit_user");
  }
}

/** Force a fresh fetch from the server, bypassing the in-memory cache. */
export async function refreshSession(): Promise<SessionData | null> {
  fetched = false;
  return fetchSession();
}
