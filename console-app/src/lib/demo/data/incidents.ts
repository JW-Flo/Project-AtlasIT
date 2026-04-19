import { DEMO_USER } from "./session.js";
import { hoursAgo, daysAgo, uuid } from "./helpers.js";

export function getIncidentsResponse() {
  return {
    data: {
      items: [
        {
          id: uuid(),
          tenantId: DEMO_USER.tenantId,
          title: "Critical CVE detected in production dependency",
          severity: "high",
          status: "open",
          source: "github-security-advisories",
          createdAt: hoursAgo(4),
          resolvedAt: null,
        },
        {
          id: uuid(),
          tenantId: DEMO_USER.tenantId,
          title: "Multiple failed login attempts from unusual location",
          severity: "medium",
          status: "investigating",
          source: "okta-security-events",
          createdAt: daysAgo(2),
          resolvedAt: null,
        },
        {
          id: uuid(),
          tenantId: DEMO_USER.tenantId,
          title: "S3 bucket with overly permissive public access policy",
          severity: "critical",
          status: "resolved",
          source: "aws-config",
          createdAt: daysAgo(8),
          resolvedAt: daysAgo(7),
        },
      ],
    },
  };
}
