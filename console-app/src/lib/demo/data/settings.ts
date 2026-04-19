import { DEMO_USER } from "./session.js";
import { daysAgo } from "./helpers.js";

export function getSettingsResponse() {
  const currentPeriodEnd = new Date();
  currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 15);

  return {
    data: {
      tenant: {
        id: DEMO_USER.tenantId,
        name: "Acme Corp",
        slug: "acme-corp",
        tier: "pro",
        status: "active",
        industry: "Technology",
        size: "51-200",
      },
      preferences: {
        theme: "dark",
        language: "en",
        timezone: "America/Los_Angeles",
      },
    },
  };
}

export function getBillingResponse() {
  const currentPeriodEnd = new Date();
  currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 15);

  return {
    data: {
      plan: "pro",
      status: "active",
      seats: {
        used: 12,
        limit: 50,
      },
      currentPeriodEnd: currentPeriodEnd.toISOString(),
    },
  };
}
