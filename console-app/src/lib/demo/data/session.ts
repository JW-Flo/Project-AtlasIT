import { DEMO_USER } from "../state";

export function getSessionResponse() {
  return {
    authenticated: true,
    email: DEMO_USER.email,
    roles: ["admin"],
    superAdmin: false,
    tenantId: DEMO_USER.tenantId,
    displayName: DEMO_USER.displayName,
    orgName: "Acme Corp",
    branding: { logoUrl: "", accentColor: "#6366f1" },
    billingTier: "professional",
  };
}

export function getUserProfileResponse() {
  return {
    data: {
      id: DEMO_USER.userId,
      email: DEMO_USER.email,
      displayName: DEMO_USER.displayName,
      role: "admin",
      tenantId: DEMO_USER.tenantId,
      mfaEnabled: true,
      createdAt: "2025-11-15T09:00:00Z",
    },
  };
}
