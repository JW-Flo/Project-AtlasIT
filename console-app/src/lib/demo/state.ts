import { clearSession } from "$lib/stores/session";
import { clearComplianceCache } from "$lib/stores/compliance";

const DEMO_KEY = "atlasit_demo";
const TOKEN_KEY = "atlasit_token";
const USER_KEY = "atlasit_user";

export const DEMO_USER = {
  userId: "demo-user-001",
  email: "alex@acmecorp.io",
  tenantId: "demo-tenant-001",
  role: "admin",
  displayName: "Alex Morgan",
};

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  const realToken = sessionStorage.getItem(TOKEN_KEY);
  if (realToken && realToken !== "demo-token") {
    sessionStorage.removeItem(DEMO_KEY);
    return false;
  }
  if (new URLSearchParams(window.location.search).get("demo") === "true") return true;
  return sessionStorage.getItem(DEMO_KEY) === "true";
}

export function initDemo(): void {
  sessionStorage.setItem(DEMO_KEY, "true");
  sessionStorage.setItem(TOKEN_KEY, "demo-token");
  sessionStorage.setItem(USER_KEY, JSON.stringify(DEMO_USER));
}

export function exitDemo(): void {
  sessionStorage.removeItem(DEMO_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem("atlasit_demo_tour");
  clearSession();
  clearComplianceCache();
  window.location.href = "/login";
}
