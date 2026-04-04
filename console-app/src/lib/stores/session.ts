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

export async function fetchSession(): Promise<SessionData | null> {
  if (fetched) {
    let current: SessionData | null = null;
    session.subscribe((v) => (current = v))();
    return current;
  }
  try {
    const res = await fetch("/api/auth/session");
    if (!res.ok) {
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
}

/** Force a fresh fetch from the server, bypassing the in-memory cache. */
export async function refreshSession(): Promise<SessionData | null> {
  fetched = false;
  return fetchSession();
}
