import { hoursAgo } from "./helpers.js";

export const DEMO_USER = {
  userId: "demo-user-001",
  email: "alex@acmecorp.io",
  tenantId: "demo-tenant-001",
  role: "admin",
  displayName: "Alex Morgan",
};

export function getSessionResponse() {
  return {
    authenticated: true,
    email: DEMO_USER.email,
    roles: [DEMO_USER.role],
    superAdmin: false,
    tenantId: DEMO_USER.tenantId,
    displayName: DEMO_USER.displayName,
    orgName: "Acme Corp",
    branding: {
      logoUrl: null,
      accentColor: "#6366f1",
    },
  };
}

export function getUserProfileResponse() {
  return {
    data: {
      id: DEMO_USER.userId,
      email: DEMO_USER.email,
      displayName: DEMO_USER.displayName,
      role: DEMO_USER.role,
      tenantId: DEMO_USER.tenantId,
      mfaEnabled: true,
      createdAt: hoursAgo(8760), // 1 year ago
    },
  };
}
